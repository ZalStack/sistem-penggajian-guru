<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\TeacherResource;
use App\Http\Resources\TeachingSessionResource;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeachingSessionController extends ApiController
{
    /**
     * List teaching sessions (public, filterable).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
        ]);

        $sessions = TeachingSession::with(['guru.grade', 'location', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return $this->paginatedResponse(TeachingSessionResource::collection($sessions));
    }

    /**
     * Show a single teaching session (public).
     */
    public function show(TeachingSession $session): JsonResponse
    {
        $session->load(['guru.grade', 'location', 'transport']);

        return $this->successResponse(new TeachingSessionResource($session));
    }

    /**
     * Options for session forms: gurus, locations, transports (public).
     */
    public function options(): JsonResponse
    {
        return $this->successResponse([
            'gurus' => TeacherResource::collection(
                Guru::with('grade')->orderBy('nama')->get()
            )->resolve(),
            'locations' => Location::orderBy('nama_lokasi')->get(['id', 'nama_lokasi']),
            'transports' => Transport::orderBy('jenis')->get(['id', 'jenis']),
        ]);
    }

    /**
     * Create a teaching session (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guru_id' => 'required|exists:gurus,id',
            'location_id' => 'required|exists:locations,id',
            'transport_id' => 'required|exists:transports,id',
            'mapel' => 'required|in:IPA,MTK',
            'tanggal' => 'required|date',
            'pekan' => 'nullable|integer|min:1|max:53',
            'bahan_ajar' => 'nullable|string|max:1000',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'jumlah_sesi' => 'required|integer|min:1|max:10',
        ]);

        if ($this->hasOverlap($validated)) {
            return $this->errorResponse('The teacher already has a session overlapping this schedule.', 422, [
                'jam_mulai' => ['The teacher already has a session overlapping this schedule.'],
            ]);
        }

        $validated['pekan'] = $validated['pekan'] ?? 1;

        $session = TeachingSession::create($validated);

        return $this->createdResponse(
            new TeachingSessionResource($session->load(['guru.grade', 'location', 'transport'])),
            'Teaching session created successfully.'
        );
    }

    /**
     * Update a teaching session (admin).
     */
    public function update(Request $request, TeachingSession $session): JsonResponse
    {
        $validated = $request->validate([
            'guru_id' => 'required|exists:gurus,id',
            'location_id' => 'required|exists:locations,id',
            'transport_id' => 'required|exists:transports,id',
            'mapel' => 'required|in:IPA,MTK',
            'tanggal' => 'required|date',
            'pekan' => 'nullable|integer|min:1|max:53',
            'bahan_ajar' => 'nullable|string|max:1000',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'jumlah_sesi' => 'required|integer|min:1|max:10',
        ]);

        if ($this->hasOverlap($validated, $session->id)) {
            return $this->errorResponse('The teacher already has a session overlapping this schedule.', 422, [
                'jam_mulai' => ['The teacher already has a session overlapping this schedule.'],
            ]);
        }

        $session->update($validated);

        return $this->successResponse(
            new TeachingSessionResource($session->refresh()->load(['guru.grade', 'location', 'transport'])),
            'Teaching session updated successfully.'
        );
    }

    /**
     * Delete a teaching session (admin). Blocked while attendance exists.
     */
    public function destroy(TeachingSession $session): JsonResponse
    {
        $attendanceCount = $session->attendances()->count();

        if ($attendanceCount > 0) {
            return $this->errorResponse("Teaching session cannot be deleted because it still has {$attendanceCount} attendance record(s).", 409);
        }

        $guruId = $session->guru_id;
        AdikSyncService::pushScheduleToAdik($session, 'delete');
        $session->delete();

        // Segarkan status keaktifan guru jika tidak ada sesi lain pekan ini
        $guru = Guru::find($guruId);
        $currentPekan = min(4, (int) ceil(now()->day / 7));
        $currentMonth = (int) now()->month;
        $currentYear = (int) now()->year;

        if ($guru) {
            $hasOtherActive = $guru->sessions()
                ->where('pekan', $currentPekan)
                ->where('is_active', true)
                ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                ->exists();

            if (! $hasOtherActive) {
                $guru->update([
                    'active_week_override' => null,
                    'is_active_this_week' => false,
                ]);
            }
        }

        \App\Http\Controllers\TeachingSessionController::refreshGuruWeeklyActiveStatus((int) $guruId);

        return $this->deletedResponse('Teaching session deleted successfully.');
    }

    /**
     * External Sync: Sync teaching session from SI ADIK-KK (Kelas Khusus).
     */
    public function syncFromAdik(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guru_id' => 'nullable|integer',
            'guru_email' => 'nullable|string',
            'guru_nama' => 'nullable|string',
            'mapel' => 'required|string',
            'tanggal' => 'required|date',
            'pekan' => 'nullable|integer',
            'session_time' => 'nullable|string',
            'jam_mulai' => 'nullable|string',
            'jam_selesai' => 'nullable|string',
            'kelas' => 'nullable|string',
            'level' => 'nullable|string',
            'bahan_ajar' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'action' => 'nullable|string|in:upsert,delete',
            'external_id' => 'nullable|integer',
            'siguru_session_id' => 'nullable|integer',
        ]);

        $guru = null;
        if (! empty($validated['guru_id'])) {
            $guru = Guru::find($validated['guru_id']);
        }
        if (! $guru && ! empty($validated['guru_email'])) {
            $guru = Guru::whereHas('user', fn ($uq) => $uq->where('email', $validated['guru_email']))->first();
        }
        if (! $guru && ! empty($validated['guru_nama'])) {
            $guru = Guru::where('nama', 'like', "%{$validated['guru_nama']}%")->first();
        }

        if (! $guru) {
            return $this->errorResponse('Guru tidak ditemukan di sistem SiGuru.', 404);
        }

        $program = Program::where('slug', 'kelas-khusus')->orWhere('nama', 'like', '%khusus%')->first();
        $programId = $program?->id ?? Program::first()?->id ?? 1;

        $locationId = Location::first()?->id ?? 1;
        $transportId = Transport::first()?->id ?? 1;

        $jamMulai = '08:00';
        $jamSelesai = '09:30';
        if (! empty($validated['session_time']) && str_contains($validated['session_time'], '-')) {
            [$s, $e] = explode('-', $validated['session_time'], 2);
            $jamMulai = trim($s);
            $jamSelesai = trim($e);
        } elseif (! empty($validated['jam_mulai']) && ! empty($validated['jam_selesai'])) {
            $jamMulai = $validated['jam_mulai'];
            $jamSelesai = $validated['jam_selesai'];
        }

        if (($validated['action'] ?? 'upsert') === 'delete') {
            $deleted = false;
            $siguruSessionId = $request->input('siguru_session_id', $validated['external_id'] ?? null);
            if (! empty($siguruSessionId)) {
                $deleted = TeachingSession::where('id', (int) $siguruSessionId)->delete() > 0;
            }
            if (! $deleted) {
                $delQuery = TeachingSession::where('guru_id', $guru->id);
                if (! empty($validated['tanggal'])) {
                    $delQuery->whereDate('tanggal', $validated['tanggal']);
                }
                if (! empty($validated['kelas'])) {
                    $delQuery->where('kelas', $validated['kelas']);
                }
                if (! empty($validated['pekan'])) {
                    $delQuery->where('pekan', (int) $validated['pekan']);
                }
                $delQuery->delete();
            }

            $currentPekan = min(4, (int) ceil(now()->day / 7));
            $currentMonth = (int) now()->month;
            $currentYear = (int) now()->year;

            $hasOtherActive = $guru->sessions()
                ->where('pekan', $currentPekan)
                ->where('is_active', true)
                ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                ->exists();

            if (! $hasOtherActive) {
                $guru->update([
                    'active_week_override' => null,
                    'is_active_this_week' => false,
                ]);
            }

            \App\Http\Controllers\TeachingSessionController::refreshGuruWeeklyActiveStatus((int) $guru->id);

            return $this->successResponse(['deleted' => true], 'Sesi mengajar berhasil dihapus.');
        }

        $session = TeachingSession::updateOrCreate(
            [
                'guru_id' => $guru->id,
                'tanggal' => $validated['tanggal'],
                'kelas' => $validated['kelas'],
            ],
            [
                'program_id' => $programId,
                'location_id' => $locationId,
                'transport_id' => $transportId,
                'mapel' => in_array(strtoupper($validated['mapel']), ['MTK', 'IPA']) ? strtoupper($validated['mapel']) : 'MTK',
                'pekan' => $validated['pekan'] ?? 1,
                'level' => $validated['level'] ?? null,
                'jam_mulai' => $jamMulai,
                'jam_selesai' => $jamSelesai,
                'session_time' => "{$jamMulai} - {$jamSelesai}",
                'jumlah_sesi' => 1,
                'bahan_ajar' => $validated['bahan_ajar'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'status' => 'dijadwalkan',
            ]
        );

        return $this->successResponse(new TeachingSessionResource($session), 'Sesi mengajar kelas khusus berhasil disinkronkan.');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function hasOverlap(array $validated, ?int $ignoreId = null): bool
    {
        return TeachingSession::where('guru_id', $validated['guru_id'])
            ->whereDate('tanggal', $validated['tanggal'])
            ->when($ignoreId, fn ($q, $id) => $q->where('id', '!=', $id))
            ->where('jam_mulai', '<', $validated['jam_selesai'])
            ->where('jam_selesai', '>', $validated['jam_mulai'])
            ->exists();
    }
}
