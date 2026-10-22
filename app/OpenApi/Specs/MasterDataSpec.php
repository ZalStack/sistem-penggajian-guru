<?php

namespace App\OpenApi\Specs;

use App\OpenApi\SpecModule;

class MasterDataSpec extends SpecModule
{
    public function paths(): array
    {
        return array_merge(
            $this->referenceData(),
            $this->peopleAndSessions(),
        );
    }

    /**
     * Grades, transports, and locations.
     */
    private function referenceData(): array
    {
        $bodySchema = [
            'type' => 'object',
            'required' => ['kode_grade', 'honor_per_sesi'],
            'properties' => [
                'kode_grade' => ['type' => 'string', 'maxLength' => 10, 'example' => 'A'],
                'honor_per_sesi' => ['type' => 'number', 'minimum' => 1, 'description' => 'Honor (fee) per teaching session.', 'example' => 60000],
            ],
        ];

        return [
            '/grades' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Grades'],
                    'summary' => 'List all grades',
                    'description' => 'Returns every salary grade with the number of teachers assigned to it. Public — no token required.',
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A list of grades.', $this->ref('Grade')),
                    ], []),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Grades'],
                    'summary' => 'Create a grade (admin)',
                    'requestBody' => $this->jsonBody($bodySchema),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Grade created.', $this->ref('Grade'), 'Grade created successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/grades/{grade}' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Grades'],
                    'summary' => 'Get a grade',
                    'parameters' => [$this->idParam('grade', 'The grade ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested grade.', $this->ref('Grade')),
                    ], [
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Grades'],
                    'summary' => 'Update a grade (admin)',
                    'parameters' => [$this->idParam('grade', 'The grade ID.')],
                    'requestBody' => $this->jsonBody($bodySchema),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Grade updated.', $this->ref('Grade'), 'Grade updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Grades'],
                    'summary' => 'Delete a grade (admin)',
                    'description' => 'Returns 409 when teachers are still assigned to the grade.',
                    'parameters' => [$this->idParam('grade', 'The grade ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Grade deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Grade deleted successfully.'),
                        '409' => 'Conflict',
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/transports' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Transports'],
                    'summary' => 'List all transport types',
                    'description' => 'Returns every transport type with the number of payroll records using it. Public — no token required.',
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A list of transport types.', $this->ref('Transport')),
                    ], []),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Transports'],
                    'summary' => 'Create a transport type (admin)',
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['jenis', 'biaya'],
                        'properties' => [
                            'jenis' => ['type' => 'string', 'maxLength' => 50, 'example' => 'Dalam Kota'],
                            'biaya' => ['type' => 'number', 'minimum' => 1, 'description' => 'Transport fee per session.', 'example' => 25000],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Transport created.', $this->ref('Transport'), 'Transport created successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/transports/{transport}' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Transports'],
                    'summary' => 'Get a transport type',
                    'parameters' => [$this->idParam('transport', 'The transport ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested transport type.', $this->ref('Transport')),
                    ], [
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Transports'],
                    'summary' => 'Update a transport type (admin)',
                    'parameters' => [$this->idParam('transport', 'The transport ID.')],
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['jenis', 'biaya'],
                        'properties' => [
                            'jenis' => ['type' => 'string', 'maxLength' => 50, 'example' => 'Dalam Kota'],
                            'biaya' => ['type' => 'number', 'minimum' => 1, 'example' => 30000],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Transport updated.', $this->ref('Transport'), 'Transport updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Transports'],
                    'summary' => 'Delete a transport type (admin)',
                    'description' => 'Returns 409 when payroll records still reference it.',
                    'parameters' => [$this->idParam('transport', 'The transport ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Transport deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Transport deleted successfully.'),
                        '409' => 'Conflict',
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/locations' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Locations'],
                    'summary' => 'List all teaching locations',
                    'description' => 'Returns every GPS check-in location with its allowed radius (in meters) and the number of sessions assigned to it. Public — no token required.',
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A list of locations.', $this->ref('Location')),
                    ], []),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Locations'],
                    'summary' => 'Create a location (admin)',
                    'requestBody' => $this->jsonBody($this->locationBody()),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Location created.', $this->ref('Location'), 'Location created successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/locations/{location}' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Locations'],
                    'summary' => 'Get a location',
                    'parameters' => [$this->idParam('location', 'The location ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested location.', $this->ref('Location')),
                    ], [
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Locations'],
                    'summary' => 'Update a location (admin)',
                    'parameters' => [$this->idParam('location', 'The location ID.')],
                    'requestBody' => $this->jsonBody($this->locationBody()),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Location updated.', $this->ref('Location'), 'Location updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Locations'],
                    'summary' => 'Delete a location (admin)',
                    'description' => 'Returns 409 when teaching sessions still reference it.',
                    'parameters' => [$this->idParam('location', 'The location ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Location deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Location deleted successfully.'),
                        '409' => 'Conflict',
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
        ];
    }

    /**
     * Teachers and teaching sessions.
     */
    private function peopleAndSessions(): array
    {
        return [
            '/teachers' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teachers'],
                    'summary' => 'List teachers',
                    'description' => 'Searchable, filterable list of teachers. Public — no token required. **Sensitive fields** (email, phone, address, bank account, allowances) are only included when the request carries an **admin** token.',
                    'parameters' => [
                        $this->stringParam('search', 'Search by name, city, address, or phone number.'),
                        $this->integerParam('filter_grade', 'Filter by grade ID.', 1),
                        $this->enumParam('filter_mapel', 'Filter by subject.', ['IPA', 'MTK']),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of teachers.', $this->ref('Teacher')),
                    ], []),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Teachers'],
                    'summary' => 'Create a teacher account (admin)',
                    'description' => 'Creates the teacher record and a linked login account (`role = guru`) in one transaction. If `password` is omitted a strong random password is generated and returned in `credentials` — store it securely, it is shown only once.',
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['nama', 'grade_id', 'mapel', 'email'],
                        'properties' => [
                            'nama' => ['type' => 'string', 'example' => 'Budi Santoso, S.Pd'],
                            'grade_id' => ['type' => 'integer', 'example' => 1],
                            'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK']],
                            'jenjang' => ['type' => 'string', 'nullable' => true, 'example' => 'SMP'],
                            'domisili' => ['type' => 'string', 'nullable' => true, 'example' => 'Jakarta Selatan'],
                            'alamat' => ['type' => 'string', 'nullable' => true],
                            'riwayat_pendidikan' => ['type' => 'string', 'nullable' => true],
                            'tanggal_bergabung' => ['type' => 'string', 'format' => 'date', 'nullable' => true, 'example' => '2026-01-15'],
                            'nomor_telepon' => ['type' => 'string', 'nullable' => true, 'example' => '081234567890'],
                            'tunjangan_khusus' => ['type' => 'number', 'minimum' => 0, 'nullable' => true, 'default' => 0],
                            'bank' => ['type' => 'string', 'nullable' => true, 'example' => 'BCA'],
                            'nomor_rekening' => ['type' => 'string', 'nullable' => true, 'example' => '1234567890'],
                            'keterangan_mengajar' => ['type' => 'string', 'nullable' => true],
                            'email' => ['type' => 'string', 'format' => 'email', 'example' => 'budi@guru.local'],
                            'password' => ['type' => 'string', 'format' => 'password', 'minLength' => 8, 'nullable' => true, 'description' => 'Optional. Generated automatically when omitted.'],
                            'password_confirmation' => ['type' => 'string', 'format' => 'password', 'nullable' => true],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Teacher created.', $this->ref('TeacherCreateResponse'), 'Teacher created successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/teachers/options' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Teachers'],
                    'summary' => 'Grades lookup for teacher forms (admin)',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Lookup data.', $this->ref('TeacherOptions')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/teachers/credentials/export' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Teachers'],
                    'summary' => 'Export teacher credentials as PDF (admin)',
                    'description' => 'Downloads an A4 landscape PDF containing the login credentials of all teachers (respecting the filters).',
                    'parameters' => [
                        $this->stringParam('search', 'Filter teachers whose name contains this text.'),
                        $this->integerParam('filter_grade', 'Filter by grade ID.', 1),
                    ],
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'The PDF document.',
                            'content' => ['application/pdf' => ['schema' => ['type' => 'string', 'format' => 'binary']]],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/teachers/{teacher}' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teachers'],
                    'summary' => 'Get a teacher',
                    'description' => 'Public teacher profile. Sensitive fields are only included for admin tokens.',
                    'parameters' => [$this->idParam('teacher', 'The teacher (guru) ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested teacher.', $this->ref('Teacher')),
                    ], [
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Teachers'],
                    'summary' => 'Update a teacher (admin)',
                    'description' => 'Updates the teacher record and keeps the linked login account (name + email) in sync.',
                    'parameters' => [$this->idParam('teacher', 'The teacher (guru) ID.')],
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['nama', 'grade_id', 'mapel', 'email'],
                        'properties' => [
                            'nama' => ['type' => 'string'],
                            'grade_id' => ['type' => 'integer'],
                            'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK']],
                            'jenjang' => ['type' => 'string', 'nullable' => true],
                            'domisili' => ['type' => 'string', 'nullable' => true],
                            'alamat' => ['type' => 'string', 'nullable' => true],
                            'riwayat_pendidikan' => ['type' => 'string', 'nullable' => true],
                            'tanggal_bergabung' => ['type' => 'string', 'format' => 'date', 'nullable' => true],
                            'nomor_telepon' => ['type' => 'string', 'nullable' => true],
                            'tunjangan_khusus' => ['type' => 'number', 'minimum' => 0, 'nullable' => true],
                            'bank' => ['type' => 'string', 'nullable' => true],
                            'nomor_rekening' => ['type' => 'string', 'nullable' => true],
                            'keterangan_mengajar' => ['type' => 'string', 'nullable' => true],
                            'email' => ['type' => 'string', 'format' => 'email'],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Teacher updated.', $this->ref('Teacher'), 'Teacher updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Teachers'],
                    'summary' => 'Delete a teacher (admin)',
                    'description' => 'Deletes the teacher, the linked login account, and revokes all of its tokens.',
                    'parameters' => [$this->idParam('teacher', 'The teacher (guru) ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Teacher deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Teacher deleted successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/teachers/{teacher}/reset-password' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Teachers'],
                    'summary' => "Reset a teacher's password (admin)",
                    'description' => 'Generates a new random password for the teacher login account and returns it. Store it securely — it is shown only once.',
                    'parameters' => [$this->idParam('teacher', 'The teacher (guru) ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Password reset.', $this->ref('ResetPasswordResponse'), 'Password reset successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/teaching-sessions' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teaching Sessions'],
                    'summary' => 'List teaching sessions',
                    'description' => 'Teaching schedule with teacher, location, and transport details. Public — no token required.',
                    'parameters' => [
                        $this->stringParam('periode', 'Filter by month (`YYYY-MM`).', '2026-10'),
                        $this->integerParam('filter_guru', 'Filter by teacher ID.', 1),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of teaching sessions.', $this->ref('TeachingSession')),
                    ], [
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Teaching Sessions'],
                    'summary' => 'Create a teaching session (admin)',
                    'description' => 'Returns 422 when the teacher already has an overlapping session on the same day.',
                    'requestBody' => $this->jsonBody($this->sessionBody()),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Session created.', $this->ref('TeachingSession'), 'Teaching session created successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/teaching-sessions/options' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teaching Sessions'],
                    'summary' => 'Lookup data for session forms',
                    'description' => 'Teachers, locations, and transports used by the session create/edit forms. Public — no token required.',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Lookup data.', $this->ref('SessionOptions')),
                    ], []),
                ]),
            ],
            '/teaching-sessions/{session}' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teaching Sessions'],
                    'summary' => 'Get a teaching session',
                    'parameters' => [$this->idParam('session', 'The teaching session ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested session.', $this->ref('TeachingSession')),
                    ], [
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Teaching Sessions'],
                    'summary' => 'Update a teaching session (admin)',
                    'parameters' => [$this->idParam('session', 'The teaching session ID.')],
                    'requestBody' => $this->jsonBody($this->sessionBody()),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Session updated.', $this->ref('TeachingSession'), 'Teaching session updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Teaching Sessions'],
                    'summary' => 'Delete a teaching session (admin)',
                    'description' => 'Returns 409 when the session already has attendance records.',
                    'parameters' => [$this->idParam('session', 'The teaching session ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Session deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Teaching session deleted successfully.'),
                        '409' => 'Conflict',
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
        ];
    }

    private function locationBody(): array
    {
        return [
            'type' => 'object',
            'required' => ['nama_lokasi', 'latitude', 'longitude', 'radius'],
            'properties' => [
                'nama_lokasi' => ['type' => 'string', 'example' => 'SMPN 1 Jakarta'],
                'latitude' => ['type' => 'number', 'minimum' => -90, 'maximum' => 90, 'example' => -6.2088],
                'longitude' => ['type' => 'number', 'minimum' => -180, 'maximum' => 180, 'example' => 106.8456],
                'radius' => ['type' => 'integer', 'minimum' => 10, 'maximum' => 1000, 'description' => 'Allowed GPS radius in meters.', 'example' => 100],
            ],
        ];
    }

    private function sessionBody(): array
    {
        return [
            'type' => 'object',
            'required' => ['guru_id', 'location_id', 'transport_id', 'mapel', 'tanggal', 'jam_mulai', 'jam_selesai', 'jumlah_sesi'],
            'properties' => [
                'guru_id' => ['type' => 'integer', 'example' => 1],
                'location_id' => ['type' => 'integer', 'example' => 1],
                'transport_id' => ['type' => 'integer', 'example' => 1],
                'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK']],
                'tanggal' => ['type' => 'string', 'format' => 'date', 'example' => '2026-10-22'],
                'jam_mulai' => ['type' => 'string', 'example' => '08:00'],
                'jam_selesai' => ['type' => 'string', 'description' => 'Must be after `jam_mulai`.', 'example' => '10:00'],
                'jumlah_sesi' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 10, 'example' => 2],
            ],
        ];
    }
}
