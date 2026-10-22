<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Guru;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendanceService) {}

    public function checkin(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'required|numeric|min:0|max:300',
        ]);

        $result = $this->attendanceService->checkIn($request->user(), $validated);

        $message = match ($result->code) {
            AttendanceService::NO_TEACHER_LINK => 'Akun ini tidak terhubung dengan data guru.',
            AttendanceService::NOT_SESSION_OWNER => 'Sesi ini bukan milik Anda.',
            AttendanceService::WRONG_DATE => 'Check-in hanya dapat dilakukan pada tanggal jadwal sesi ('.parse($result->context['session_date'])->format('d/m/Y').').',
            AttendanceService::OUTSIDE_TIME_WINDOW => 'Check-in hanya dapat dilakukan dalam rentang waktu 30 menit sebelum jam mulai hingga jam selesai sesi ('.$result->context['window_start'].' - '.$result->context['window_end'].').',
            AttendanceService::ALREADY_CHECKED_IN => 'Anda sudah melakukan check-in untuk sesi ini hari ini.',
            AttendanceService::OUTSIDE_RADIUS => $this->radiusErrorMessage('Check-in', $result->context),
            default => 'Check-in berhasil! Jarak: '.number_format($result->context['distance'], 0).'m dari lokasi'.$this->accuracyLabel($result->context['accuracy']).'.',
        };

        return $result->ok
            ? back()->with('success', $message)
            : back()->with('error', $message);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'required|numeric|min:0|max:300',
        ]);

        $result = $this->attendanceService->checkOut($request->user(), $validated);

        $message = match ($result->code) {
            AttendanceService::NO_TEACHER_LINK => 'Akun ini tidak terhubung dengan data guru.',
            AttendanceService::NOT_CHECKED_IN => 'Anda belum melakukan check-in untuk sesi ini.',
            AttendanceService::ALREADY_CHECKED_OUT => 'Anda sudah melakukan check-out untuk sesi ini.',
            AttendanceService::MIN_DURATION_NOT_MET => 'Durasi mengajar minimal 15 menit. Silakan check-out setelah minimal 15 menit check-in.',
            AttendanceService::OUTSIDE_RADIUS => $this->radiusErrorMessage('Check-out', $result->context),
            default => 'Check-out berhasil! Jarak: '.number_format($result->context['distance'], 0).'m'.$this->accuracyLabel($result->context['accuracy']).'. Durasi mengajar: '.$result->context['duration'].' menit. Gaji sudah dihitung otomatis.',
        };

        return $result->ok
            ? back()->with('success', $message)
            : back()->with('error', $message);
    }

    public function guruAttendance(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return Inertia::render('Guru/Attendance/Index', [
                'attendances' => [],
                'totalHadir' => 0,
                'totalJam' => 0,
                'guru' => (object) ['nama' => $user->name],
                'filters' => $request->only(['bulan']),
            ]);
        }

        $attendances = Attendance::with('session.location', 'session.transport')
            ->where('guru_id', $guru->id)
            ->when($request->bulan, fn ($q, $b) => $q->whereMonth('tanggal', substr($b, 5, 2))->whereYear('tanggal', substr($b, 0, 4)))
            ->orderBy('tanggal', 'desc')
            ->get();

        $totalHadir = $attendances->where('status', 'valid')->count();
        $totalJam = $attendances->where('status', 'valid')->sum('durasi');

        return Inertia::render('Guru/Attendance/Index', [
            'attendances' => $attendances,
            'totalHadir' => $totalHadir,
            'totalJam' => $totalJam,
            'guru' => $guru,
            'filters' => $request->only(['bulan']),
        ]);
    }

    public function adminRecap(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
        ]);

        $query = Attendance::with(['guru.grade', 'session.location', 'session.transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('tanggal', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Attendance/Index', [
            'attendances' => $query,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru']),
        ]);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function radiusErrorMessage(string $verb, array $context): string
    {
        $msg = $verb.' gagal! Anda berada di luar radius lokasi.';
        $msg .= ' Jarak: '.number_format($context['distance'], 0).'m.';
        $msg .= ' Radius yang diizinkan: '.$context['radius'].'m.';

        if ($context['accuracy'] > 50) {
            $msg .= ' (Akurasi lokasi: ±'.number_format($context['accuracy'], 0).'m — disarankan di area terbuka untuk hasil lebih akurat).';
        }

        return $msg;
    }

    private function accuracyLabel(float $accuracy): string
    {
        return $accuracy <= 50 ? ' (GPS akurat)' : ' (WiFi/Jaringan)';
    }
}
