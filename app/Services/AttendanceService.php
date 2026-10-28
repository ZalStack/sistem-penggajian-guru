<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\TeachingSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Shared GPS check-in / check-out business logic used by both the Inertia
 * (web) controllers and the JSON API controllers.
 */
class AttendanceService
{
    public const CHECKED_IN = 'checked_in';

    public const CHECKED_OUT = 'checked_out';

    public const NO_TEACHER_LINK = 'no_teacher_link';

    public const NOT_SESSION_OWNER = 'not_session_owner';

    public const WRONG_DATE = 'wrong_date';

    public const OUTSIDE_TIME_WINDOW = 'outside_time_window';

    public const ALREADY_CHECKED_IN = 'already_checked_in';

    public const NOT_CHECKED_IN = 'not_checked_in';

    public const ALREADY_CHECKED_OUT = 'already_checked_out';

    public const MIN_DURATION_NOT_MET = 'min_duration_not_met';

    public const OUTSIDE_RADIUS = 'outside_radius';

    public const APPROVED_LEAVE = 'approved_leave';

    /**
     * @param  array{session_id: int, latitude: float, longitude: float, accuracy: float}  $data
     */
    public function checkIn(User $user, array $data): AttendanceResult
    {
        $guru = $user->guru;

        if (! $guru) {
            return AttendanceResult::failure(self::NO_TEACHER_LINK);
        }

        return DB::transaction(function () use ($guru, $data) {
            $session = TeachingSession::with('location')->lockForUpdate()->findOrFail($data['session_id']);

            if ($session->guru_id !== $guru->id) {
                return AttendanceResult::failure(self::NOT_SESSION_OWNER, [
                    'session_id' => $session->id,
                ]);
            }

            $sessionDate = $session->tanggal->toDateString();

            if ($sessionDate !== now()->toDateString()) {
                return AttendanceResult::failure(self::WRONG_DATE, [
                    'session_date' => $sessionDate,
                ]);
            }

            // Perizinan yang sudah disetujui menutup sesi pada tanggal tersebut:
            // presensi tidak boleh dicatat agar status kehadiran tetap jujur
            // dan rekap admin menampilkan "Izin" alih-alih "Belum Check-in".
            $izin = Perizinan::where('guru_id', $guru->id)
                ->where('status', Perizinan::STATUS_DISETUJUI)
                ->whereDate('tanggal_mulai', '<=', $sessionDate)
                ->whereDate('tanggal_selesai', '>=', $sessionDate)
                ->first();

            if ($izin) {
                return AttendanceResult::failure(self::APPROVED_LEAVE, [
                    'session_date' => $sessionDate,
                    'izin' => $izin,
                ]);
            }

            $now = now();
            $windowStart = $session->jam_mulai->copy()->subMinutes(30);

            if ($now < $windowStart || $now > $session->jam_selesai) {
                return AttendanceResult::failure(self::OUTSIDE_TIME_WINDOW, [
                    'window_start' => $windowStart->format('H:i'),
                    'window_end' => $session->jam_selesai->format('H:i'),
                ]);
            }

            $existing = Attendance::where('guru_id', $guru->id)
                ->where('session_id', $session->id)
                ->whereDate('tanggal', $sessionDate)
                ->lockForUpdate()
                ->first();

            if ($existing && $existing->checkin_time) {
                return AttendanceResult::failure(self::ALREADY_CHECKED_IN);
            }

            $gpsAccuracy = (float) $data['accuracy'];

            $distance = Attendance::calculateDistance(
                (float) $data['latitude'], (float) $data['longitude'],
                (float) $session->location->latitude, (float) $session->location->longitude
            );

            $radius = $session->location->radius;

            if (max(0, $distance - $gpsAccuracy) > $radius) {
                return AttendanceResult::failure(self::OUTSIDE_RADIUS, [
                    'distance' => round($distance),
                    'radius' => $radius,
                    'accuracy' => $gpsAccuracy,
                ]);
            }

            $attributes = [
                'checkin_time' => now(),
                'checkin_lat' => $data['latitude'],
                'checkin_lng' => $data['longitude'],
                'checkin_accuracy' => $gpsAccuracy,
                'status' => 'belum_checkout',
            ];

            if ($existing) {
                $existing->update($attributes);
                $attendance = $existing;
            } else {
                $attendance = Attendance::create([
                    'guru_id' => $guru->id,
                    'session_id' => $session->id,
                    'tanggal' => $sessionDate,
                    ...$attributes,
                ]);
            }

            return AttendanceResult::success(self::CHECKED_IN, [
                'attendance' => $attendance,
                'distance' => round($distance),
                'accuracy' => $gpsAccuracy,
            ]);
        });
    }

    /**
     * @param  array{session_id: int, latitude: float, longitude: float, accuracy: float}  $data
     */
    public function checkOut(User $user, array $data): AttendanceResult
    {
        $guru = $user->guru;

        if (! $guru) {
            return AttendanceResult::failure(self::NO_TEACHER_LINK);
        }

        return DB::transaction(function () use ($guru, $data) {
            $attendance = Attendance::where('guru_id', $guru->id)
                ->where('session_id', $data['session_id'])
                ->whereDate('tanggal', now()->toDateString())
                ->lockForUpdate()
                ->latest('checkin_time')
                ->first();

            if (! $attendance || ! $attendance->checkin_time) {
                return AttendanceResult::failure(self::NOT_CHECKED_IN);
            }

            if ($attendance->checkout_time) {
                return AttendanceResult::failure(self::ALREADY_CHECKED_OUT);
            }

            $durasi = Attendance::calculateDuration($attendance->checkin_time, now());

            if ($durasi < 15) {
                return AttendanceResult::failure(self::MIN_DURATION_NOT_MET, [
                    'duration' => $durasi,
                    'minimum' => 15,
                ]);
            }

            $gpsAccuracy = (float) $data['accuracy'];

            $session = TeachingSession::with('location')->findOrFail($data['session_id']);

            $distance = Attendance::calculateDistance(
                (float) $data['latitude'], (float) $data['longitude'],
                (float) $session->location->latitude, (float) $session->location->longitude
            );

            $radius = $session->location->radius;

            if (max(0, $distance - $gpsAccuracy) > $radius) {
                return AttendanceResult::failure(self::OUTSIDE_RADIUS, [
                    'distance' => round($distance),
                    'radius' => $radius,
                    'accuracy' => $gpsAccuracy,
                ]);
            }

            $attendance->update([
                'checkout_time' => now(),
                'checkout_lat' => $data['latitude'],
                'checkout_lng' => $data['longitude'],
                'checkout_accuracy' => $gpsAccuracy,
                'durasi' => $durasi,
                'status' => 'valid',
            ]);

            if ($session->status === TeachingSession::STATUS_DIJADWALKAN) {
                $session->update(['status' => TeachingSession::STATUS_SELESAI]);
            }

            Penggajian::calculateForGuru($guru, $attendance->tanggal->format('Y-m'));

            return AttendanceResult::success(self::CHECKED_OUT, [
                'attendance' => $attendance->refresh(),
                'distance' => round($distance),
                'accuracy' => $gpsAccuracy,
                'duration' => $durasi,
            ]);
        });
    }
}
