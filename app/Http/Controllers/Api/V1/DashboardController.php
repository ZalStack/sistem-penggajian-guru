<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\SalaryResource;
use App\Http\Resources\TeacherResource;
use App\Http\Resources\TeachingSessionResource;
use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return $user->isAdmin()
            ? $this->adminDashboard()
            : $this->guruDashboard($user);
    }

    private function adminDashboard(): JsonResponse
    {
        $now = now();
        $periode = $now->format('Y-m');

        return $this->successResponse([
            'role' => 'admin',
            'stats' => [
                'total_guru' => Guru::count(),
                'total_sesi_bulan' => TeachingSession::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->sum('jumlah_sesi'),
                'total_pengeluaran' => (float) Penggajian::where('periode', $periode)->sum('total'),
                'total_guru_hadir' => Attendance::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->where('status', 'valid')->distinct('guru_id')->count('guru_id'),
            ],
            'recent_sessions' => TeachingSessionResource::collection(
                TeachingSession::with(['guru.grade', 'location'])->latest('tanggal')->limit(5)->get()
            )->resolve(),
            'recent_payroll' => SalaryResource::collection(
                Penggajian::with(['guru.grade', 'transport'])->where('periode', $periode)->latest()->limit(5)->get()
            )->resolve(),
        ]);
    }

    private function guruDashboard(User $user): JsonResponse
    {
        $guru = $user->guru;
        $now = now();
        $periode = $now->format('Y-m');

        if (! $guru) {
            return $this->successResponse([
                'role' => 'guru',
                'stats' => [
                    'total_sesi_bulan' => 0,
                    'total_hadir' => 0,
                    'gaji_bulan' => 0,
                    'potensi_gaji' => 0,
                    'status_bayar' => 'belum_dibayar',
                ],
                'upcoming_sessions' => [],
                'today_attendances' => [],
                'guru' => null,
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

        $honorPerSesi = (float) ($guru->grade?->honor_per_sesi ?? 0);
        $potensiGaji = $totalSesiBulan * $honorPerSesi;

        $penggajian = Penggajian::where('guru_id', $guru->id)->where('periode', $periode)->first();

        $upcomingSessions = TeachingSession::with('location', 'transport')
            ->where('guru_id', $guru->id)
            ->whereDate('tanggal', '>=', $now->toDateString())
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->limit(6)
            ->get();

        $todayAttendances = Attendance::where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->get()
            ->keyBy('session_id')
            ->map(fn (Attendance $attendance) => (new AttendanceResource($attendance))->resolve());

        return $this->successResponse([
            'role' => 'guru',
            'stats' => [
                'total_sesi_bulan' => (int) $totalSesiBulan,
                'total_hadir' => $totalHadir,
                'gaji_bulan' => (float) ($penggajian?->total ?? 0),
                'potensi_gaji' => $potensiGaji,
                'status_bayar' => $penggajian?->status_bayar ?? 'belum_dibayar',
            ],
            'upcoming_sessions' => TeachingSessionResource::collection($upcomingSessions)->resolve(),
            'today_attendances' => $todayAttendances,
            'guru' => (new TeacherResource($guru->load('grade')))->resolve(),
        ]);
    }
}
