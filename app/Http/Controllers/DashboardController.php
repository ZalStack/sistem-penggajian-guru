<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
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

        if ($user->isGuru()) {
            return $this->guruDashboard($user);
        }

        return $this->adminDashboard();
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
                    'total_sesi' => 0,
                    'total_hadir' => 0,
                    'total_jam' => 0,
                    'gaji_bulan' => 0,
                    'status_bayar' => 'belum_dibayar',
                ],
                'todaySessions' => [],
                'todayAttendances' => (object) [],
                'guru' => (object) ['nama' => $user->name],
                'role' => 'guru',
            ]);
        }

        $totalHadir = Attendance::where('guru_id', $guru->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->where('status', 'valid')
            ->count();

        $totalSesi = TeachingSession::where('guru_id', $guru->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->sum('jumlah_sesi');

        $totalJam = Attendance::where('guru_id', $guru->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->where('status', 'valid')
            ->sum('durasi');

        $penggajian = Penggajian::where('guru_id', $guru->id)->where('periode', $periode)->first();

        $todaySessions = TeachingSession::with('location', 'transport')
            ->where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->get();

        $todayAttendances = Attendance::where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->get()
            ->keyBy('session_id');

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_sesi' => $totalSesi,
                'total_hadir' => $totalHadir,
                'total_jam' => round($totalJam / 60, 1),
                'gaji_bulan' => $penggajian?->total ?? 0,
                'status_bayar' => $penggajian?->status_bayar ?? 'belum_dibayar',
            ],
            'todaySessions' => $todaySessions,
            'todayAttendances' => $todayAttendances,
            'guru' => $guru,
            'role' => 'guru',
        ]);
    }
}
