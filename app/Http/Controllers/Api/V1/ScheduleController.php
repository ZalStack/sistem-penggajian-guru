<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\TeachingSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends ApiController
{
    /**
     * Monthly schedule, grouped by day.
     *
     * Admins see every teacher's schedule (with extra filters); teachers
     * only see their own. Token required because the response is role-aware.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $validated = $request->validate([
            'bulan' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_mapel' => 'nullable|in:IPA,MTK',
            'filter_program' => 'nullable|string',
        ]);

        $bulan = $validated['bulan'] ?? now()->format('Y-m');
        $guru = $user->guru;

        $query = TeachingSession::with(['guru.grade', 'location', 'transport', 'program'])
            ->whereMonth('tanggal', (int) substr($bulan, 5, 2))
            ->whereYear('tanggal', (int) substr($bulan, 0, 4));

        if (! $isAdmin) {
            $query->where('guru_id', $guru?->id ?? 0);
        } else {
            $query
                ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
                ->when($validated['filter_mapel'] ?? null, fn ($q, $m) => $q->where('mapel', $m));
        }

        if (! empty($validated['filter_program'])) {
            $prog = $validated['filter_program'];
            $query->where(function ($q) use ($prog) {
                $q->whereHas('program', fn ($pq) => $pq->where('slug', $prog)->orWhere('nama', 'like', "%{$prog}%"))
                    ->orWhere('kelas', 'like', "%{$prog}%");
            });
        }

        $sessions = $query->orderBy('tanggal')->orderBy('jam_mulai')->get();

        $groups = $sessions
            ->groupBy(fn ($s) => $s->tanggal->format('Y-m-d'))
            ->map(function ($daySessions, $dateKey) {
                return [
                    'tanggal' => $dateKey,
                    'hari_label' => Carbon::parse($dateKey)->translatedFormat('l'),
                    'tanggal_label' => Carbon::parse($dateKey)->translatedFormat('d F Y'),
                    'total_sesi' => $daySessions->sum('jumlah_sesi'),
                    'sessions' => $daySessions->values()->map(fn ($s) => [
                        'id' => $s->id,
                        'jam_mulai' => $s->jam_mulai->format('H:i'),
                        'jam_selesai' => $s->jam_selesai->format('H:i'),
                        'session_time' => $s->session_time ?: ($s->jam_mulai->format('H:i').' - '.$s->jam_selesai->format('H:i')),
                        'mapel' => $s->mapel,
                        'jumlah_sesi' => $s->jumlah_sesi,
                        'program' => $s->program?->nama ?? 'Kelas Khusus',
                        'program_slug' => $s->program?->slug ?? 'kelas-khusus',
                        'kelas' => $s->kelas,
                        'level' => $s->level,
                        'pekan' => (int) $s->pekan,
                        'bahan_ajar' => $s->bahan_ajar,
                        'status' => $s->effective_status,
                        'lokasi' => $s->location->nama_lokasi ?? '-',
                        'location' => $s->location ? [
                            'nama_lokasi' => $s->location->nama_lokasi,
                            'latitude' => (float) $s->location->latitude,
                            'longitude' => (float) $s->location->longitude,
                            'radius' => (int) $s->location->radius,
                        ] : null,
                        'transport' => $s->transport->jenis ?? '-',
                        'guru' => [
                            'id' => $s->guru?->id,
                            'nama' => $s->guru->nama ?? '-',
                            'kode_grade' => $s->guru->grade?->kode_grade ?? '-',
                            'jenjang' => $s->guru->jenjang ?? '-',
                        ],
                    ]),
                ];
            })
            ->values();

        $availableMonths = TeachingSession::query()
            ->pluck('tanggal')
            ->map(fn ($t) => Carbon::parse($t)->format('Y-m'))
            ->unique()
            ->sort()
            ->values();

        return $this->successResponse([
            'role' => $isAdmin ? 'admin' : 'guru',
            'bulan' => $bulan,
            'total_sesi_bulan' => (int) $sessions->sum('jumlah_sesi'),
            'available_months' => $availableMonths,
            'groups' => $groups,
        ]);
    }
}
