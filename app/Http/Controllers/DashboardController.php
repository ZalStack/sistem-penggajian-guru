<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\SunnahGuru;
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

    /**
     * Dashboard Admin — seluruh angka diambil dari data aktual sistem,
     * bukan angka hiasan. Setiap statistik punya padanan halaman detail.
     */
    private function adminDashboard()
    {
        $now = now();
        $periode = $now->format('Y-m');
        $today = $now->toDateString();

        $stats = [
            'total_guru' => Guru::count(),
            'total_guru_aktif' => Guru::whereNotNull('user_id')->count(),
            'total_kelas_khusus' => Guru::whereHas('programs', fn ($q) => $q->where('nama', 'like', '%Khusus%'))->count(),
            'total_sesi_bulan' => (int) TeachingSession::aktif()
                ->whereYear('tanggal', $now->year)
                ->whereMonth('tanggal', $now->month)
                ->sum('jumlah_sesi'),
            'total_sesi_hari_ini' => (int) TeachingSession::aktif()->whereDate('tanggal', $today)->count(),
            'guru_hadir_hari_ini' => Attendance::whereDate('tanggal', $today)
                ->whereIn('status', ['valid', 'belum_checkout'])
                ->distinct('guru_id')
                ->count('guru_id'),
            'total_pengeluaran' => (float) Penggajian::where('periode', $periode)->sum('total'),
            'total_sudah_dibayar' => (float) Penggajian::where('periode', $periode)->paid()->sum('total'),
            'izin_pending' => Perizinan::where('status', 'pending')->count(),
            'sunnah_pending' => SunnahGuru::where('status_approval', SunnahGuru::STATUS_PENDING)->count(),
            'sunnah_hari_ini' => SunnahGuru::whereDate('tanggal', $today)->count(),
            'periode' => $periode,
        ];

        $stats['pengeluaran_belum_dibayar'] = $stats['total_pengeluaran'] - $stats['total_sudah_dibayar'];
        $stats['total_guru_bergaji'] = Penggajian::where('periode', $periode)->count();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'todaySessions' => $this->todaySessions($today),
            'recentSessions' => TeachingSession::with(['guru.grade', 'guru.programs', 'location', 'program'])
                ->aktif()
                ->orderByDesc('tanggal')
                ->orderByDesc('jam_mulai')
                ->limit(6)
                ->get()
                ->map(fn ($s) => $this->presentSession($s)),
            'recentPenggajian' => Penggajian::with(['guru.grade', 'guru.programs'])
                ->where('periode', $periode)
                ->orderByDesc('updated_at')
                ->limit(6)
                ->get(),
            'pendingPerizinan' => Perizinan::with('guru.grade')
                ->where('status', 'pending')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(),
            'role' => 'admin',
        ]);
    }

    /**
     * Rekap sesi hari ini untuk kebutuhan operasional Admin.
     */
    private function todaySessions(string $today)
    {
        $guruIzinHariIni = Perizinan::where('status', Perizinan::STATUS_DISETUJUI)
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->pluck('guru_id');

        return TeachingSession::with(['guru.grade', 'location', 'program', 'attendances'])
            ->aktif()
            ->whereDate('tanggal', $today)
            ->orderBy('jam_mulai')
            ->get()
            ->map(function (TeachingSession $session) use ($guruIzinHariIni) {
                $attendance = $session->attendances->first();
                $sudahCheckin = $attendance?->checkin_time !== null;
                $izinHariIni = ! $sudahCheckin && $guruIzinHariIni->contains($session->guru_id);

                return [
                    'id' => $session->id,
                    'jam_mulai' => $session->jam_mulai->format('H:i'),
                    'jam_selesai' => $session->jam_selesai->format('H:i'),
                    'jumlah_sesi' => $session->jumlah_sesi,
                    'mapel' => $session->mapel,
                    'status' => $session->effective_status,
                    'program' => $session->program?->nama,
                    'lokasi' => $session->location?->nama_lokasi,
                    'guru' => [
                        'nama' => $session->guru?->nama ?? '-',
                        'kode_grade' => $session->guru?->grade?->kode_grade ?? '-',
                    ],
                    'presensi' => $izinHariIni ? 'izin' : ($attendance?->status ?? 'belum_checkin'),
                ];
            })
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSession(TeachingSession $session): array
    {
        return [
            'id' => $session->id,
            'tanggal' => $session->tanggal->format('Y-m-d'),
            'jam_mulai' => $session->jam_mulai->format('H:i'),
            'jam_selesai' => $session->jam_selesai->format('H:i'),
            'jumlah_sesi' => $session->jumlah_sesi,
            'mapel' => $session->mapel,
            'status' => $session->effective_status,
            'lokasi' => $session->location?->nama_lokasi ?? '-',
            'program' => $session->program?->nama,
            'guru' => [
                'nama' => $session->guru?->nama ?? '-',
                'kode_grade' => $session->guru?->grade?->kode_grade ?? '-',
            ],
        ];
    }

    private function guruDashboard($user)
    {
        $guru = $user->guru;
        $now = now();
        $periode = $now->format('Y-m');

        $emptyStats = [
            'total_sesi_bulan' => 0,
            'total_hadir' => 0,
            'total_jam' => 0,
            'gaji_bulan' => 0,
            'potensi_gaji' => 0,
            'status_bayar' => 'belum_dibayar',
        ];

        if (! $guru) {
            return Inertia::render('Dashboard', [
                'stats' => $emptyStats,
                'upcomingSessions' => [],
                'todayAttendances' => (object) [],
                'izinHariIni' => null,
                'guru' => (object) ['nama' => $user->name, 'grade' => null, 'programs' => []],
                'sunnahHariIni' => null,
                'role' => 'guru',
            ]);
        }

        $guru->load(['grade', 'programs']);

        $totalHadir = Attendance::where('guru_id', $guru->id)
            ->whereYear('tanggal', $now->year)
            ->whereMonth('tanggal', $now->month)
            ->where('status', 'valid')
            ->count();

        $totalJam = round(
            Attendance::where('guru_id', $guru->id)
                ->whereYear('tanggal', $now->year)
                ->whereMonth('tanggal', $now->month)
                ->where('status', 'valid')
                ->sum('durasi') / 60,
            2
        );

        $totalSesiBulan = (int) TeachingSession::aktif()
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', $now->year)
            ->whereMonth('tanggal', $now->month)
            ->sum('jumlah_sesi');

        $honorPerSesi = (float) ($guru->grade?->honor_per_sesi ?? 0);
        $potensiGaji = ($totalHadir * $honorPerSesi)
            + (float) $guru->tunjangan_khusus;

        $penggajian = Penggajian::where('guru_id', $guru->id)->where('periode', $periode)->first();

        $upcomingSessions = TeachingSession::with(['location', 'transport', 'program'])
            ->aktif()
            ->where('guru_id', $guru->id)
            ->whereDate('tanggal', '>=', $now->toDateString())
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->limit(6)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'tanggal' => $s->tanggal->format('Y-m-d'),
                'is_today' => $s->tanggal->isSameDay($now),
                'jam_mulai' => $s->jam_mulai->format('H:i'),
                'jam_selesai' => $s->jam_selesai->format('H:i'),
                'mapel' => $s->mapel,
                'jumlah_sesi' => $s->jumlah_sesi,
                'program' => $s->program?->nama,
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

        // Perizinan disetujui yang berlaku hari ini: check-in tidak diperlukan
        // dan sesi hari ini tercatat sebagai izin di rekap presensi.
        $izinHariIni = Perizinan::where('guru_id', $guru->id)
            ->where('status', Perizinan::STATUS_DISETUJUI)
            ->whereDate('tanggal_mulai', '<=', $now->toDateString())
            ->whereDate('tanggal_selesai', '>=', $now->toDateString())
            ->orderByDesc('tanggal_mulai')
            ->first();

        $sunnahHariIni = SunnahGuru::where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->first();

        $sunnahBulanIni = SunnahGuru::where('guru_id', $guru->id)
            ->whereYear('tanggal', $now->year)
            ->whereMonth('tanggal', $now->month)
            ->orderBy('tanggal')
            ->get(['tanggal', 'total_poin', 'status_approval']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_sesi_bulan' => $totalSesiBulan,
                'total_hadir' => $totalHadir,
                'total_jam' => $totalJam,
                'gaji_bulan' => (float) ($penggajian?->total ?? 0),
                'potensi_gaji' => $potensiGaji,
                'status_bayar' => $penggajian?->status_bayar ?? 'belum_dibayar',
            ],
            'upcomingSessions' => $upcomingSessions,
            'todayAttendances' => $todayAttendances,
            'izinHariIni' => $izinHariIni ? [
                'jenis' => $izinHariIni->labelJenis(),
                'rentang' => $izinHariIni->rentangTanggal(),
                'alasan' => $izinHariIni->alasan,
            ] : null,
            'guru' => $guru,
            'sunnahHariIni' => $sunnahHariIni ? [
                'id' => $sunnahHariIni->id,
                'total_poin' => $sunnahHariIni->total_poin,
                'status_approval' => $sunnahHariIni->status_approval,
                'status_label' => $sunnahHariIni->status_label,
                'catatan' => $sunnahHariIni->catatan,
            ] : null,
            'sunnahBulanIni' => [
                'total_poin' => (int) $sunnahBulanIni->sum('total_poin'),
                'total_hari' => $sunnahBulanIni->count(),
                'riwayat' => $sunnahBulanIni->map(fn (SunnahGuru $item) => [
                    'tanggal' => $item->tanggal->toDateString(),
                    'poin' => (int) $item->total_poin,
                    'status_approval' => $item->status_approval,
                ])->values()->all(),
            ],
            'role' => 'guru',
        ]);
    }
}
