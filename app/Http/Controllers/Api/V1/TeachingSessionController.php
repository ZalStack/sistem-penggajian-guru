<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\TeacherResource;
use App\Http\Resources\TeachingSessionResource;
use App\Models\Guru;
use App\Models\Location;
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
            ->orderBy('jam_mulai')
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
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'jumlah_sesi' => 'required|integer|min:1|max:10',
        ]);

        if ($this->hasOverlap($validated)) {
            return $this->errorResponse('The teacher already has a session overlapping this schedule.', 422, [
                'jam_mulai' => ['The teacher already has a session overlapping this schedule.'],
            ]);
        }

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

        $session->delete();

        return $this->deletedResponse('Teaching session deleted successfully.');
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
