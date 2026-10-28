<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\TeacherResource;
use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use App\Services\AttendanceResult;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends ApiController
{
    public function __construct(private readonly AttendanceService $attendanceService) {}

    /**
     * Admin: attendance recap with filters (token required, sensitive data).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
        ]);

        $attendances = Attendance::with(['guru.grade', 'session.location', 'session.transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('tanggal', 'desc')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        return $this->paginatedResponse(AttendanceResource::collection($attendances));
    }

    /**
     * Guru: my attendance history (token required, own data).
     */
    public function mine(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bulan' => 'nullable|date_format:Y-m',
        ]);

        $guru = $request->user()->guru;

        if (! $guru) {
            return $this->successResponse([
                'attendances' => [],
                'summary' => [
                    'total_hadir' => 0,
                    'total_jam' => 0,
                ],
                'guru' => null,
            ]);
        }

        $attendances = Attendance::with('session.location', 'session.transport')
            ->where('guru_id', $guru->id)
            ->when($validated['bulan'] ?? null, fn ($q, $b) => $q->whereMonth('tanggal', substr($b, 5, 2))->whereYear('tanggal', substr($b, 0, 4)))
            ->orderBy('tanggal', 'desc')
            ->get();

        return $this->successResponse([
            'attendances' => AttendanceResource::collection($attendances)->resolve(),
            'summary' => [
                'total_hadir' => $attendances->where('status', 'valid')->count(),
                'total_jam' => (int) $attendances->where('status', 'valid')->sum('durasi'),
            ],
            'guru' => new TeacherResource($guru->load('grade')),
        ]);
    }

    /**
     * Guru: GPS check-in for a teaching session (token required).
     */
    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'required|numeric|min:0|max:300',
        ]);

        $result = $this->attendanceService->checkIn($request->user(), $validated);

        if (! $result->ok) {
            return $this->errorResponse($this->messageFor($result), 422, [
                'check_in' => [$this->messageFor($result)],
            ]);
        }

        return $this->successResponse([
            'attendance' => new AttendanceResource($result->context['attendance']->load('session.location')),
            'distance' => $result->context['distance'],
            'accuracy' => $result->context['accuracy'],
            'accurate_gps' => $result->context['accuracy'] <= 50,
        ], 'Check-in successful.');
    }

    /**
     * Guru: GPS check-out for a teaching session (token required).
     */
    public function checkOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'required|numeric|min:0|max:300',
        ]);

        $result = $this->attendanceService->checkOut($request->user(), $validated);

        if (! $result->ok) {
            return $this->errorResponse($this->messageFor($result), 422, [
                'check_out' => [$this->messageFor($result)],
            ]);
        }

        return $this->successResponse([
            'attendance' => new AttendanceResource($result->context['attendance']->load('session.location')),
            'distance' => $result->context['distance'],
            'accuracy' => $result->context['accuracy'],
            'accurate_gps' => $result->context['accuracy'] <= 50,
            'duration_minutes' => $result->context['duration'],
        ], 'Check-out successful. Salary has been recalculated.');
    }

    /**
     * External Sync: Check-in / Check-out / Delete attendance from SI ADIK-KK.
     */
    public function syncFromAdik(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'nullable|string|in:checkin,checkout,delete',
            'guru_id' => 'nullable|integer',
            'teacher_name' => 'nullable|string',
            'teacher_email' => 'nullable|string',
            'nip' => 'nullable|string',
            'session_id' => 'nullable|integer',
            'siguru_session_id' => 'nullable|integer',
            'session_date' => 'required|date',
            'session_number' => 'nullable|integer',
            'role_type' => 'nullable|string|in:guru,asisten_guru',
            'subject' => 'nullable|string',
            'level' => 'nullable|string',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        // 1. Resolve Guru
        $guru = null;
        if (! empty($validated['guru_id'])) {
            $guru = Guru::with('grade')->find($validated['guru_id']);
        }
        if (! $guru && ! empty($validated['teacher_email'])) {
            $user = User::where('email', $validated['teacher_email'])->first();
            $guru = $user?->guru ?? Guru::with('grade')->where('email', $validated['teacher_email'])->first();
        }
        if (! $guru && ! empty($validated['nip'])) {
            $parsedId = (int) preg_replace('/\D/', '', $validated['nip']);
            if ($parsedId > 0) {
                $guru = Guru::with('grade')->find($parsedId);
            }
        }
        if (! $guru && ! empty($validated['teacher_name'])) {
            $guru = Guru::with('grade')->where('nama', $validated['teacher_name'])->first()
                ?? Guru::with('grade')->where('nama', 'like', '%'.$validated['teacher_name'].'%')->first();
        }

        if (! $guru) {
            return $this->errorResponse('Data guru tidak ditemukan di SiGuru.', 404);
        }

        $sessionDate = Carbon::parse($validated['session_date'])->toDateString();
        $sessionId = $validated['session_id'] ?? $validated['siguru_session_id'] ?? null;

        // 2. Resolve TeachingSession
        $session = null;
        if ($sessionId) {
            $session = TeachingSession::with(['location', 'transport'])->find($sessionId);
        }
        if (! $session) {
            $session = TeachingSession::with(['location', 'transport'])
                ->where('guru_id', $guru->id)
                ->whereDate('tanggal', $sessionDate)
                ->first();
        }

        // If no session exists for this date, create a fallback session
        if (! $session) {
            $locationId = Location::first()?->id ?? 1;
            $transportId = Transport::first()?->id ?? 1;
            $mapel = (! empty($validated['subject']) && str_contains(strtoupper($validated['subject']), 'IPA')) ? 'IPA' : 'MTK';
            $jamMulai = $validated['check_in_time'] ?: '08:00';
            $jamSelesai = $validated['check_out_time'] ?: '10:00';

            $session = TeachingSession::create([
                'guru_id' => $guru->id,
                'location_id' => $locationId,
                'transport_id' => $transportId,
                'mapel' => $mapel,
                'tanggal' => $sessionDate,
                'jam_mulai' => $jamMulai,
                'jam_selesai' => $jamSelesai,
                'jumlah_sesi' => 1,
            ]);
            $session->load(['location', 'transport']);
        }

        // 3. Handle Delete Action
        if (($validated['action'] ?? '') === 'delete') {
            $attendance = Attendance::where('guru_id', $guru->id)
                ->where('session_id', $session->id)
                ->whereDate('tanggal', $sessionDate)
                ->first();

            if ($attendance) {
                $attendance->delete();
                Penggajian::calculateForGuru($guru, Carbon::parse($sessionDate)->format('Y-m'));
            }

            return $this->successResponse(null, 'Catatan kehadiran berhasil dihapus dari SiGuru.');
        }

        // 4. Find or create Attendance
        $attendance = Attendance::where('guru_id', $guru->id)
            ->where('session_id', $session->id)
            ->whereDate('tanggal', $sessionDate)
            ->first();

        if (! $attendance) {
            $attendance = new Attendance([
                'guru_id' => $guru->id,
                'session_id' => $session->id,
                'tanggal' => $sessionDate,
            ]);
        }

        $locLat = $session->location?->latitude ?? -6.5868733;
        $locLng = $session->location?->longitude ?? 106.7590024;

        // Check-in handling
        if (! empty($validated['check_in_time'])) {
            $inTime = $validated['check_in_time'];
            $checkinDateTime = str_contains($inTime, 'T') || str_contains($inTime, '-')
                ? Carbon::parse($inTime)
                : Carbon::parse("{$sessionDate} {$inTime}");

            $attendance->checkin_time = $checkinDateTime;
            $attendance->checkin_lat = $validated['latitude'] ?? ($attendance->checkin_lat ?: $locLat);
            $attendance->checkin_lng = $validated['longitude'] ?? ($attendance->checkin_lng ?: $locLng);
            $attendance->checkin_accuracy = $validated['accuracy'] ?? ($attendance->checkin_accuracy ?: 25.0);
            $attendance->status = 'belum_checkout';
        }

        // Check-out handling
        if (! empty($validated['check_out_time'])) {
            $outTime = $validated['check_out_time'];
            $checkoutDateTime = str_contains($outTime, 'T') || str_contains($outTime, '-')
                ? Carbon::parse($outTime)
                : Carbon::parse("{$sessionDate} {$outTime}");

            $attendance->checkout_time = $checkoutDateTime;
            $attendance->checkout_lat = $validated['latitude'] ?? ($attendance->checkout_lat ?: $locLat);
            $attendance->checkout_lng = $validated['longitude'] ?? ($attendance->checkout_lng ?: $locLng);
            $attendance->checkout_accuracy = $validated['accuracy'] ?? ($attendance->checkout_accuracy ?: 25.0);

            $duration = 0;
            if ($attendance->checkin_time) {
                $duration = (int) $attendance->checkin_time->diffInMinutes($checkoutDateTime);
            }
            $attendance->durasi = max(15, $duration);
            $attendance->status = 'valid';
        }

        $attendance->save();

        // If valid, recalculate salary for that month
        if ($attendance->status === 'valid') {
            Penggajian::calculateForGuru($guru, Carbon::parse($sessionDate)->format('Y-m'));
        }

        return $this->successResponse([
            'attendance' => new AttendanceResource($attendance->load(['guru.grade', 'session.location', 'session.transport'])),
            'guru' => [
                'id' => $guru->id,
                'nama' => $guru->nama,
            ],
            'session' => [
                'id' => $session->id,
                'tanggal' => $session->tanggal->toDateString(),
                'mapel' => $session->mapel,
            ],
        ], 'Presensi kehadiran berhasil disinkronkan ke SiGuru.');
    }

    /**
     * Guru: filter form options (token required).
     */
    public function options(Request $request): JsonResponse
    {
        return $this->successResponse([
            'gurus' => Guru::with('grade')->orderBy('nama')->get()->map(fn (Guru $guru) => [
                'id' => $guru->id,
                'nama' => $guru->nama,
            ]),
        ]);
    }

    private function messageFor(AttendanceResult $result): string
    {
        $context = $result->context;

        return match ($result->code) {
            AttendanceService::NO_TEACHER_LINK => 'This account is not linked to a teacher profile.',
            AttendanceService::NOT_SESSION_OWNER => 'This session does not belong to you.',
            AttendanceService::WRONG_DATE => 'Check-in can only be performed on the session date ('.parse($context['session_date'])->format('d/m/Y').').',
            AttendanceService::OUTSIDE_TIME_WINDOW => 'Check-in is only allowed from 30 minutes before the session start time until the session ends ('.$context['window_start'].' - '.$context['window_end'].').',
            AttendanceService::ALREADY_CHECKED_IN => 'You have already checked in for this session today.',
            AttendanceService::NOT_CHECKED_IN => 'You have not checked in for this session yet.',
            AttendanceService::ALREADY_CHECKED_OUT => 'You have already checked out for this session.',
            AttendanceService::MIN_DURATION_NOT_MET => 'The minimum teaching duration is 15 minutes. Please check out at least 15 minutes after check-in.',
            AttendanceService::OUTSIDE_RADIUS => 'You are outside the allowed location radius. Distance: '.$context['distance'].'m, allowed radius: '.$context['radius'].'m.'
                .($context['accuracy'] > 50 ? ' (GPS accuracy: ±'.number_format($context['accuracy'], 0).'m — an open area is recommended for better accuracy).' : ''),
            default => 'Attendance recorded successfully.',
        };
    }
}
