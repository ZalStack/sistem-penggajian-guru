<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function checkin(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return back()->withErrors(['error' => 'Akun ini tidak terhubung dengan data guru.']);
        }

        $session = TeachingSession::with('location')->findOrFail($validated['session_id']);

        if ($session->guru_id !== $guru->id) {
            return back()->withErrors(['error' => 'Sesi ini bukan milik Anda.']);
        }

        $today = now()->toDateString();
        $existing = Attendance::where('guru_id', $guru->id)
            ->where('session_id', $session->id)
            ->where('tanggal', $today)
            ->first();

        if ($existing && $existing->checkin_time) {
            return back()->withErrors(['error' => 'Anda sudah melakukan check-in untuk sesi ini hari ini.']);
        }

        $now = now();
        $jamMulai = \Carbon\Carbon::parse($session->tanggal->format('Y-m-d').' '.$session->jam_mulai->format('H:i'));
        $jamSelesai = \Carbon\Carbon::parse($session->tanggal->format('Y-m-d').' '.$session->jam_selesai->format('H:i'));
        $checkinWindowStart = $jamMulai->copy()->subMinutes(30);

        if ($now->lt($checkinWindowStart)) {
            return back()->withErrors(['error' => 'Check-in belum bisa dilakukan. Jam mengajar mulai pukul '.$jamMulai->format('H:i').' (check-in dibuka 30 menit sebelumnya).']);
        }

        if ($now->gt($jamSelesai)) {
            return back()->withErrors(['error' => 'Check-in gagal! Sesi mengajar sudah berakhir pada pukul '.$jamSelesai->format('H:i').'.']);
        }

        $distance = Attendance::calculateDistance(
            $validated['latitude'], $validated['longitude'],
            (float) $session->location->latitude, (float) $session->location->longitude
        );

        $isValid = $distance <= $session->location->radius;

        if (! $isValid) {
            return back()->withErrors(['error' => 'Check-in gagal! Anda berada di luar radius lokasi ('.number_format($distance, 0).'m dari lokasi tujuan, maksimal '.$session->location->radius.'m). Silakan mendekat ke lokasi mengajar.']);
        }

        $attendance = Attendance::updateOrCreate(
            ['guru_id' => $guru->id, 'session_id' => $session->id, 'tanggal' => $today],
            [
                'checkin_time' => now(),
                'checkin_lat' => $validated['latitude'],
                'checkin_lng' => $validated['longitude'],
                'status' => 'belum_checkout',
            ]
        );

        return back()->with('success', 'Check-in berhasil! Lokasi valid ('.number_format($distance, 0).'m dari lokasi tujuan).');
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return back()->withErrors(['error' => 'Akun ini tidak terhubung dengan data guru.']);
        }

        $today = now()->toDateString();
        $attendance = Attendance::where('guru_id', $guru->id)
            ->where('session_id', $validated['session_id'])
            ->where('tanggal', $today)
            ->first();

        if (! $attendance || ! $attendance->checkin_time) {
            return back()->withErrors(['error' => 'Anda belum melakukan check-in untuk sesi ini.']);
        }

        if ($attendance->checkout_time) {
            return back()->withErrors(['error' => 'Anda sudah melakukan check-out untuk sesi ini.']);
        }

        $session = TeachingSession::with('location')->findOrFail($validated['session_id']);

        $now = now();
        $jamMulai = \Carbon\Carbon::parse($session->tanggal->format('Y-m-d').' '.$session->jam_mulai->format('H:i'));
        $jamSelesai = \Carbon\Carbon::parse($session->tanggal->format('Y-m-d').' '.$session->jam_selesai->format('H:i'));
        $checkoutWindowEnd = $jamSelesai->copy()->addMinutes(30);

        if ($now->lt($jamMulai)) {
            return back()->withErrors(['error' => 'Check-out belum bisa dilakukan. Sesi mengajar mulai pukul '.$jamMulai->format('H:i').'.']);
        }

        if ($now->gt($checkoutWindowEnd)) {
            return back()->withErrors(['error' => 'Check-out gagal! Batas waktu check-out sudah lewat (pukul '.$checkoutWindowEnd->format('H:i').').']);
        }

        $distance = Attendance::calculateDistance(
            $validated['latitude'], $validated['longitude'],
            (float) $session->location->latitude, (float) $session->location->longitude
        );

        $isWithinRadius = $distance <= $session->location->radius;

        if (! $isWithinRadius) {
            return back()->withErrors(['error' => 'Check-out gagal! Anda berada di luar radius lokasi ('.number_format($distance, 0).'m dari lokasi tujuan, maksimal '.$session->location->radius.'m).']);
        }

        $durasi = Attendance::calculateDuration($attendance->checkin_time, now());
        $durasi = max($durasi, 1);

        $attendance->update([
            'checkout_time' => now(),
            'checkout_lat' => $validated['latitude'],
            'checkout_lng' => $validated['longitude'],
            'durasi' => $durasi,
            'status' => 'valid',
        ]);

        $periodo = now()->format('Y-m');
        Penggajian::calculateForGuru($guru, $periodo);

        return back()->with('success', 'Check-out berhasil! Lokasi valid ('.number_format($distance, 0).'m). Durasi mengajar: '.$durasi.' menit. Gaji sudah dihitung otomatis.');
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
        $query = Attendance::with(['guru.grade', 'session.location', 'session.transport'])
            ->when($request->periode, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($request->filter_guru, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('tanggal', 'desc');

        $attendances = $query->get();

        return Inertia::render('Admin/Attendance/Index', [
            'attendances' => $attendances,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru']),
        ]);
    }
}
