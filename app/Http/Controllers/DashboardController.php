<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $this->adminDashboard();
        }

        return $this->guruDashboard($user);
    }

    private function adminDashboard()
    {
        $now = now();
        $periode = $now->format('Y-m');

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_guru' => Guru::count(),
                'total_sesi_bulan' => TeachingSession::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->sum('jumlah_sesi'),
                'total_pengeluaran' => (float) Penggajian::where('periode', $periode)->sum('total'),
                'total_guru_hadir' => Attendance::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->where('status', 'valid')->distinct('guru_id')->count('guru_id'),
            ],
            'recentSessions' => TeachingSession::with(['guru.grade', 'location'])
                ->latest('tanggal')
                ->limit(5)
                ->get(),
            'recentPenggajian' => Penggajian::with(['guru.grade', 'transport'])
                ->where('periode', $periode)
                ->latest()
                ->limit(5)
                ->get(),
            'role' => 'admin',
        ]);
    }

    private function guruDashboard($user)
    {
        $guru = $user->guru;
        $now = now();
        $periode = $now->format('Y-m');

        if (! $guru) {
            return Inertia::render('Dashboard', [
                'stats' => [
                    'total_sesi_bulan' => 0,
                    'total_hadir' => 0,
                    'total_sesi_semua' => 0,
                    'gaji_bulan' => 0,
                    'potensi_gaji' => 0,
                    'status_bayar' => 'belum_dibayar',
                ],
                'todaySessions' => [],
                'todayAttendances' => (object) [],
                'allSessions' => [],
                'guru' => (object) ['nama' => $user->name, 'grade' => null],
                'grades' => [],
                'role' => 'guru',
            ]);
        }

        $totalHadir = Attendance::where('guru_id', $guru->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->where('status', 'valid')
            ->count();

        $totalSesiBulan = TeachingSession::where('guru_id', $guru->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->sum('jumlah_sesi');

        $totalSesiSemua = TeachingSession::where('guru_id', $guru->id)
            ->sum('jumlah_sesi');

        $honorPerSesi = (float) ($guru->grade?->honor_per_sesi ?? 0);
        $potensiGaji = $totalSesiBulan * $honorPerSesi;

        $penggajian = Penggajian::where('guru_id', $guru->id)->where('periode', $periode)->first();

        $todaySessions = TeachingSession::with('location', 'transport')
            ->where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'tanggal' => $s->tanggal->format('Y-m-d'),
                'jam_mulai' => $s->jam_mulai->format('H:i'),
                'jam_selesai' => $s->jam_selesai->format('H:i'),
                'mapel' => $s->mapel,
                'jumlah_sesi' => $s->jumlah_sesi,
                'location' => [
                    'nama_lokasi' => $s->location->nama_lokasi,
                    'latitude' => $s->location->latitude,
                    'longitude' => $s->location->longitude,
                    'radius' => $s->location->radius,
                ],
                'transport' => $s->transport ? [
                    'jenis' => $s->transport->jenis,
                ] : null,
            ]);

        $todayAttendances = Attendance::where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->get()
            ->keyBy('session_id');

        $allSessions = TeachingSession::with('location', 'transport', 'guru.grade')
            ->where('guru_id', $guru->id)
            ->orderBy('tanggal', 'desc')
            ->get()
            ->groupBy(fn ($s) => $s->tanggal->format('Y-m'))
            ->map(function ($sessions, $monthKey) {
                $totalSesi = $sessions->sum('jumlah_sesi');
                return [
                    'month_key' => $monthKey,
                    'month_label' => \Carbon\Carbon::parse($monthKey.'-01')->translatedFormat('F Y'),
                    'total_sesi' => $totalSesi,
                    'sessions' => $sessions->values()->map(fn ($s) => [
                        'id' => $s->id,
                        'tanggal' => $s->tanggal->format('Y-m-d'),
                        'jam_mulai' => $s->jam_mulai->format('H:i'),
                        'jam_selesai' => $s->jam_selesai->format('H:i'),
                        'mapel' => $s->mapel,
                        'jumlah_sesi' => $s->jumlah_sesi,
                        'lokasi' => $s->location->nama_lokasi ?? '-',
                        'transport' => $s->transport->jenis ?? '-',
                        'kode_grade' => $s->guru->grade?->kode_grade ?? '-',
                        'jenjang' => $s->guru->jenjang ?? '-',
                    ]),
                ];
            })
            ->values();

        $grades = Grade::orderBy('kode_grade')->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_sesi_bulan' => $totalSesiBulan,
                'total_hadir' => $totalHadir,
                'total_sesi_semua' => $totalSesiSemua,
                'gaji_bulan' => $penggajian?->total ?? 0,
                'potensi_gaji' => $potensiGaji,
                'status_bayar' => $penggajian?->status_bayar ?? 'belum_dibayar',
            ],
            'todaySessions' => $todaySessions,
            'todayAttendances' => $todayAttendances,
            'allSessions' => $allSessions,
            'guruData' => [
                'nama' => $guru->nama,
                'grade' => $guru->grade?->toArray() ?? null,
                'mapel' => $guru->mapel,
                'jenjang' => $guru->jenjang,
            ],
            'guru' => $guru->load('grade'),
            'grades' => $grades,
            'role' => 'guru',
        ]);
    }
}
