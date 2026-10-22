<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\TeachingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalBulananController extends Controller
{
    /**
     * Jadwal bulanan — admin: seluruh guru; guru: jadwalnya sendiri.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $validated = $request->validate([
            'bulan' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_mapel' => 'nullable|in:IPA,MTK',
        ]);

        $bulan = $validated['bulan'] ?? now()->format('Y-m');
        $guru = $user->guru;

        $query = TeachingSession::with(['guru.grade', 'location', 'transport'])
            ->whereMonth('tanggal', (int) substr($bulan, 5, 2))
            ->whereYear('tanggal', (int) substr($bulan, 0, 4));

        if (! $isAdmin) {
            $query->where('guru_id', $guru?->id ?? 0);
        } else {
            $query
                ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
                ->when($validated['filter_mapel'] ?? null, fn ($q, $m) => $q->where('mapel', $m));
        }

        $sessions = $query->orderBy('tanggal')->orderBy('jam_mulai')->get();

        $groups = $sessions
            ->groupBy(fn ($s) => $s->tanggal->format('Y-m-d'))
            ->map(function ($daySessions, $dateKey) {
                return [
                    'tanggal' => $dateKey,
                    'hari_label' => \Carbon\Carbon::parse($dateKey)->translatedFormat('l'),
                    'tanggal_label' => \Carbon\Carbon::parse($dateKey)->translatedFormat('d F Y'),
                    'total_sesi' => $daySessions->sum('jumlah_sesi'),
                    'sessions' => $daySessions->values()->map(fn ($s) => [
                        'id' => $s->id,
                        'jam_mulai' => $s->jam_mulai->format('H:i'),
                        'jam_selesai' => $s->jam_selesai->format('H:i'),
                        'mapel' => $s->mapel,
                        'jumlah_sesi' => $s->jumlah_sesi,
                        'lokasi' => $s->location->nama_lokasi ?? '-',
                        'transport' => $s->transport->jenis ?? '-',
                        'guru' => [
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
            ->map(fn ($t) => \Carbon\Carbon::parse($t)->format('Y-m'))
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('JadwalBulanan', [
            'groups' => $groups,
            'bulan' => $bulan,
            'totalSesiBulan' => $sessions->sum('jumlah_sesi'),
            'availableMonths' => $availableMonths,
            'gurus' => $isAdmin ? Guru::with('grade')->orderBy('nama')->get() : null,
            'filters' => $request->only(['filter_guru', 'filter_mapel']),
            'role' => $isAdmin ? 'admin' : 'guru',
        ]);
    }
}
