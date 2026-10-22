<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\TeacherResource;
use App\Models\Attendance;
use App\Models\Guru;
use App\Services\AttendanceResult;
use App\Services\AttendanceService;
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
