<?php

namespace App\OpenApi\Specs;

use App\OpenApi\SpecModule;

class OperationsSpec extends SpecModule
{
    public function paths(): array
    {
        return $this->operations();
    }

    private function operations(): array
    {
        $gpsBody = [
            'type' => 'object',
            'required' => ['session_id', 'latitude', 'longitude', 'accuracy'],
            'properties' => [
                'session_id' => ['type' => 'integer', 'description' => 'The teaching session to check in/out for.', 'example' => 1],
                'latitude' => ['type' => 'number', 'minimum' => -90, 'maximum' => 90, 'example' => -6.2088],
                'longitude' => ['type' => 'number', 'minimum' => -180, 'maximum' => 180, 'example' => 106.8456],
                'accuracy' => [
                    'type' => 'number',
                    'minimum' => 0,
                    'maximum' => 300,
                    'description' => 'Reported GPS accuracy in meters (from the device). The effective distance to the location is reduced by this value before the radius check.',
                    'example' => 12,
                ],
            ],
        ];

        $businessRules = '**Business rules** (all enforced server-side, HTTP 422 on violation):

- The session must belong to the authenticated teacher.
- Check-in only on the session date, from 30 minutes before `jam_mulai` until `jam_selesai`.
- One check-in per teacher/session/day.
- The device position (minus accuracy) must be inside the location radius.
- Check-out requires a prior check-in and a minimum of 15 minutes of teaching.
- A successful check-out automatically recalculates the teacher\'s salary for the period.';

        return [
            '/attendances' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Attendance'],
                    'summary' => 'Attendance recap (admin)',
                    'description' => 'Paginated attendance recap across all teachers. Sensitive — requires an admin token.',
                    'parameters' => [
                        $this->stringParam('periode', 'Filter by month (`YYYY-MM`).', '2026-10'),
                        $this->integerParam('filter_guru', 'Filter by teacher ID.', 1),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated attendance recap.', $this->ref('Attendance')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/attendances/options' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Attendance'],
                    'summary' => 'Teacher lookup for attendance filters (admin)',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Lookup data.', $this->ref('AttendanceOptions')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/attendances/mine' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Attendance'],
                    'summary' => 'My attendance history (teacher)',
                    'description' => 'Returns the authenticated teacher\'s attendance records with a summary of valid days and total minutes.',
                    'parameters' => [
                        $this->stringParam('bulan', 'Filter by month (`YYYY-MM`).', '2026-10'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Attendance history and summary.', $this->ref('MyAttendances')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/attendances/check-in' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Attendance'],
                    'summary' => 'GPS check-in (teacher)',
                    'description' => "Records a GPS check-in for a teaching session. Rate limited to 10 requests per minute.\n\n".$businessRules,
                    'requestBody' => $this->jsonBody($gpsBody),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Check-in recorded. Includes the measured distance and GPS accuracy.', $this->ref('CheckInResponse'), 'Check-in successful.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                        '429' => 'TooManyRequests',
                    ]),
                ]),
            ],
            '/attendances/check-out' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Attendance'],
                    'summary' => 'GPS check-out (teacher)',
                    'description' => "Records a GPS check-out and recalculates the teacher's salary for the period. Rate limited to 10 requests per minute.\n\n".$businessRules,
                    'requestBody' => $this->jsonBody($gpsBody),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Check-out recorded with the teaching duration in minutes.', $this->ref('CheckOutResponse'), 'Check-out successful. Salary has been recalculated.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                        '429' => 'TooManyRequests',
                    ]),
                ]),
            ],
            '/leave-requests' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Leave Requests'],
                    'summary' => 'List leave requests (admin)',
                    'description' => 'Paginated list of all teacher leave requests (izin / sakit / cuti). Requires an admin token.',
                    'parameters' => [
                        $this->enumParam('status', 'Filter by approval status.', ['pending', 'disetujui', 'ditolak']),
                        $this->integerParam('filter_guru', 'Filter by teacher ID.', 1),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of leave requests.', $this->ref('LeaveRequest')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Leave Requests'],
                    'summary' => 'Submit a leave request (teacher)',
                    'description' => 'Creates a new leave request for the authenticated teacher. The start date must be today or later and the status starts as `pending`.',
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['jenis', 'tanggal_mulai', 'tanggal_selesai', 'alasan'],
                        'properties' => [
                            'jenis' => ['type' => 'string', 'enum' => ['izin', 'sakit', 'cuti']],
                            'tanggal_mulai' => ['type' => 'string', 'format' => 'date', 'example' => '2026-10-25'],
                            'tanggal_selesai' => ['type' => 'string', 'format' => 'date', 'description' => 'Must be on or after `tanggal_mulai`.', 'example' => '2026-10-26'],
                            'alasan' => ['type' => 'string', 'maxLength' => 500, 'example' => 'Fever and rest advised by doctor'],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Leave request submitted.', $this->ref('LeaveRequest'), 'Leave request submitted successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/leave-requests/mine' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Leave Requests'],
                    'summary' => 'My leave requests (teacher)',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The authenticated teacher\'s leave requests.', $this->ref('MyLeaveRequests')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/leave-requests/{perizinan}' => [
                'put' => array_merge($this->secured(), [
                    'tags' => ['Leave Requests'],
                    'summary' => 'Approve or reject a leave request (admin)',
                    'parameters' => [$this->idParam('perizinan', 'The leave request ID.')],
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['status', 'catatan_admin'],
                        'properties' => [
                            'status' => ['type' => 'string', 'enum' => ['disetujui', 'ditolak']],
                            'catatan_admin' => ['type' => 'string', 'maxLength' => 500, 'description' => 'Mandatory note explaining the decision.', 'example' => 'Approved, get well soon.'],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Leave request updated.', $this->ref('LeaveRequest'), 'Leave request status updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/schedules' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Schedules'],
                    'summary' => 'Monthly schedule grouped by day',
                    'description' => 'Role-aware monthly schedule. Teachers see only their own sessions; admins see every teacher\'s sessions and can filter further. Requires a token because the payload depends on the caller\'s role.',
                    'parameters' => [
                        $this->stringParam('bulan', 'Month to display (`YYYY-MM`). Defaults to the current month.', '2026-10'),
                        $this->integerParam('filter_guru', 'Admin only: filter by teacher ID.', 1),
                        $this->enumParam('filter_mapel', 'Admin only: filter by subject.', ['IPA', 'MTK']),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The grouped schedule.', $this->ref('ScheduleIndex')),
                    ], [
                        '401' => 'Unauthorized',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
        ];
    }
}
