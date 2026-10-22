<?php

namespace App\OpenApi;

/**
 * All component schemas for the OpenAPI document.
 *
 * Field shapes mirror the JSON produced by the API Resources in
 * app/Http/Resources.
 */
class Schemas
{
    /**
     * @return array<string, array>
     */
    public static function all(): array
    {
        return array_merge([
            'Error' => self::error(),
            'PaginationMeta' => self::paginationMeta(),
            'User' => self::user(),
            'Grade' => self::grade(),
            'Transport' => self::transport(),
            'Location' => self::location(),
            'Teacher' => self::teacher(),
            'TeachingSession' => self::teachingSession(),
            'Attendance' => self::attendance(),
            'Salary' => self::salary(),
            'LeaveRequest' => self::leaveRequest(),
            'Notification' => self::notification(),
            'TeachingMaterial' => self::teachingMaterial(),
        ], self::composite());
    }

    private static function error(): array
    {
        return [
            'type' => 'object',
            'required' => ['success', 'message'],
            'properties' => [
                'success' => ['type' => 'boolean', 'example' => false],
                'message' => ['type' => 'string', 'example' => 'The given data was invalid.'],
                'errors' => [
                    'type' => 'object',
                    'nullable' => true,
                    'description' => 'Per-field validation messages (only present for 422 responses).',
                    'additionalProperties' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                ],
            ],
        ];
    }

    private static function paginationMeta(): array
    {
        return [
            'type' => 'object',
            'required' => ['current_page', 'per_page', 'total', 'last_page'],
            'properties' => [
                'current_page' => ['type' => 'integer', 'example' => 1],
                'per_page' => ['type' => 'integer', 'example' => 15],
                'total' => ['type' => 'integer', 'example' => 42],
                'last_page' => ['type' => 'integer', 'example' => 3],
            ],
        ];
    }

    private static function user(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'name', 'email', 'role'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'name' => ['type' => 'string', 'example' => 'Admin Siguru'],
                'email' => ['type' => 'string', 'format' => 'email', 'example' => 'admin@siguru.com'],
                'role' => ['type' => 'string', 'enum' => ['admin', 'guru'], 'example' => 'admin'],
                'guru_id' => ['type' => 'integer', 'nullable' => true, 'example' => null],
                'email_verified_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function grade(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'kode_grade', 'honor_per_sesi'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'kode_grade' => ['type' => 'string', 'maxLength' => 10, 'example' => 'A'],
                'honor_per_sesi' => ['type' => 'number', 'format' => 'double', 'example' => 60000],
                'jumlah_guru' => ['type' => 'integer', 'nullable' => true, 'description' => 'Present when the endpoint includes a teacher count.'],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function transport(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'jenis', 'biaya'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'jenis' => ['type' => 'string', 'example' => 'Dalam Kota'],
                'biaya' => ['type' => 'number', 'format' => 'double', 'example' => 25000],
                'jumlah_penggajian' => ['type' => 'integer', 'nullable' => true, 'description' => 'Present when the endpoint includes a payroll usage count.'],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function location(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'nama_lokasi', 'latitude', 'longitude', 'radius'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'nama_lokasi' => ['type' => 'string', 'example' => 'SMPN 1 Jakarta'],
                'latitude' => ['type' => 'number', 'format' => 'double', 'example' => -6.2088],
                'longitude' => ['type' => 'number', 'format' => 'double', 'example' => 106.8456],
                'radius' => ['type' => 'integer', 'description' => 'Allowed GPS radius in meters.', 'example' => 100],
                'jumlah_sesi' => ['type' => 'integer', 'nullable' => true, 'description' => 'Present when the endpoint includes a session count.'],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function teacher(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'nama', 'mapel'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'nama' => ['type' => 'string', 'example' => 'Budi Santoso, S.Pd'],
                'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK'], 'example' => 'IPA'],
                'jenjang' => ['type' => 'string', 'nullable' => true, 'example' => 'SMP'],
                'domisili' => ['type' => 'string', 'nullable' => true, 'example' => 'Jakarta Selatan'],
                'tanggal_bergabung' => ['type' => 'string', 'format' => 'date', 'nullable' => true, 'example' => '2026-01-15'],
                'keterangan_mengajar' => ['type' => 'string', 'nullable' => true],
                'grade' => [
                    'description' => 'Related salary grade (present when loaded).',
                    'allOf' => [['$ref' => '#/components/schemas/Grade']],
                    'nullable' => true,
                ],
                'user_id' => ['type' => 'integer', 'description' => 'Admin only.', 'example' => 2],
                'email' => ['type' => 'string', 'format' => 'email', 'nullable' => true, 'description' => 'Admin only.'],
                'nomor_telepon' => ['type' => 'string', 'nullable' => true, 'description' => 'Admin only.', 'example' => '081234567890'],
                'alamat' => ['type' => 'string', 'nullable' => true, 'description' => 'Admin only.'],
                'riwayat_pendidikan' => ['type' => 'string', 'nullable' => true, 'description' => 'Admin only.'],
                'tunjangan_khusus' => ['type' => 'number', 'format' => 'double', 'description' => 'Admin only.', 'example' => 0],
                'bank' => ['type' => 'string', 'nullable' => true, 'description' => 'Admin only.', 'example' => 'BCA'],
                'nomor_rekening' => ['type' => 'string', 'nullable' => true, 'description' => 'Admin only.', 'example' => '1234567890'],
                'user' => [
                    'description' => 'Linked login account (admin only).',
                    'allOf' => [['$ref' => '#/components/schemas/User']],
                    'nullable' => true,
                ],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function teachingSession(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'mapel', 'tanggal', 'jam_mulai', 'jam_selesai', 'jumlah_sesi'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK'], 'example' => 'IPA'],
                'tanggal' => ['type' => 'string', 'format' => 'date', 'example' => '2026-10-22'],
                'jam_mulai' => ['type' => 'string', 'example' => '08:00'],
                'jam_selesai' => ['type' => 'string', 'example' => '10:00'],
                'jumlah_sesi' => ['type' => 'integer', 'example' => 2],
                'guru' => [
                    'description' => 'Related teacher (present when loaded).',
                    'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                    'nullable' => true,
                ],
                'location' => [
                    'description' => 'Teaching location (present when loaded).',
                    'allOf' => [['$ref' => '#/components/schemas/Location']],
                    'nullable' => true,
                ],
                'transport' => [
                    'description' => 'Transport type (present when loaded).',
                    'allOf' => [['$ref' => '#/components/schemas/Transport']],
                    'nullable' => true,
                ],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function attendance(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'tanggal', 'status'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'tanggal' => ['type' => 'string', 'format' => 'date', 'example' => '2026-10-22'],
                'status' => [
                    'type' => 'string',
                    'enum' => ['valid', 'tidak_valid', 'belum_checkin', 'belum_checkout'],
                    'example' => 'valid',
                ],
                'checkin_time' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'checkin_lat' => ['type' => 'number', 'format' => 'double', 'nullable' => true],
                'checkin_lng' => ['type' => 'number', 'format' => 'double', 'nullable' => true],
                'checkin_accuracy' => ['type' => 'number', 'format' => 'double', 'nullable' => true, 'description' => 'GPS accuracy in meters.'],
                'checkout_time' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'checkout_lat' => ['type' => 'number', 'format' => 'double', 'nullable' => true],
                'checkout_lng' => ['type' => 'number', 'format' => 'double', 'nullable' => true],
                'checkout_accuracy' => ['type' => 'number', 'format' => 'double', 'nullable' => true],
                'durasi' => ['type' => 'integer', 'description' => 'Teaching duration in minutes.', 'example' => 120],
                'guru' => [
                    'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                    'nullable' => true,
                ],
                'session' => [
                    'allOf' => [['$ref' => '#/components/schemas/TeachingSession']],
                    'nullable' => true,
                ],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function salary(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'periode', 'jumlah_sesi', 'honor', 'total', 'status_bayar'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'periode' => ['type' => 'string', 'description' => 'Salary period in `YYYY-MM` format.', 'example' => '2026-10'],
                'jumlah_sesi' => ['type' => 'integer', 'example' => 8],
                'jumlah_hadir' => ['type' => 'integer', 'example' => 6],
                'total_jam' => ['type' => 'number', 'format' => 'double', 'example' => 12],
                'honor' => ['type' => 'number', 'format' => 'double', 'example' => 360000],
                'total_transport' => ['type' => 'number', 'format' => 'double', 'example' => 150000],
                'total' => ['type' => 'number', 'format' => 'double', 'example' => 510000],
                'status_bayar' => ['type' => 'string', 'enum' => ['belum_dibayar', 'sudah_dibayar'], 'example' => 'belum_dibayar'],
                'guru' => [
                    'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                    'nullable' => true,
                ],
                'transport' => [
                    'allOf' => [['$ref' => '#/components/schemas/Transport']],
                    'nullable' => true,
                ],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function leaveRequest(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'jenis', 'tanggal_mulai', 'tanggal_selesai', 'alasan', 'status'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'jenis' => ['type' => 'string', 'enum' => ['izin', 'sakit', 'cuti'], 'example' => 'sakit'],
                'tanggal_mulai' => ['type' => 'string', 'format' => 'date', 'example' => '2026-10-25'],
                'tanggal_selesai' => ['type' => 'string', 'format' => 'date', 'example' => '2026-10-26'],
                'alasan' => ['type' => 'string', 'example' => 'Fever and rest advised by doctor'],
                'status' => ['type' => 'string', 'enum' => ['pending', 'disetujui', 'ditolak'], 'example' => 'pending'],
                'catatan_admin' => ['type' => 'string', 'nullable' => true],
                'guru' => [
                    'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                    'nullable' => true,
                ],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function notification(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'judul', 'pesan', 'tipe', 'kategori', 'dibaca'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'judul' => ['type' => 'string', 'example' => 'New Teaching Material: Algebra Basics'],
                'pesan' => ['type' => 'string', 'example' => 'An admin uploaded new teaching material.'],
                'tipe' => ['type' => 'string', 'enum' => ['info', 'success', 'warning', 'error'], 'example' => 'info'],
                'kategori' => ['type' => 'string', 'enum' => ['sistem', 'absensi', 'perizinan', 'gaji', 'sesi'], 'example' => 'sistem'],
                'dibaca' => ['type' => 'boolean', 'example' => false],
                'dibaca_pada' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    private static function teachingMaterial(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'judul', 'mapel', 'file_name'],
            'properties' => [
                'id' => ['type' => 'integer', 'example' => 1],
                'judul' => ['type' => 'string', 'example' => 'Algebra Basics'],
                'deskripsi' => ['type' => 'string', 'nullable' => true],
                'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK', 'umum'], 'example' => 'MTK'],
                'file_name' => ['type' => 'string', 'example' => 'algebra-basics.pdf'],
                'file_mime' => ['type' => 'string', 'nullable' => true, 'example' => 'application/pdf'],
                'file_size' => ['type' => 'integer', 'description' => 'File size in bytes.', 'example' => 1048576],
                'file_size_human' => ['type' => 'string', 'example' => '1 MB'],
                'download_url' => [
                    'type' => 'string',
                    'nullable' => true,
                    'description' => 'Absolute download URL. Only present for authenticated requests.',
                    'example' => 'http://localhost:8000/api/v1/teaching-materials/1/download',
                ],
                'uploader' => [
                    'allOf' => [['$ref' => '#/components/schemas/User']],
                    'nullable' => true,
                ],
                'created_at' => ['type' => 'string', 'format' => 'date-time'],
                'updated_at' => ['type' => 'string', 'format' => 'date-time'],
            ],
        ];
    }

    /**
     * Composite (response-body) schemas used by specific endpoints.
     *
     * @return array<string, array>
     */
    private static function composite(): array
    {
        return [
            'LoginResponse' => [
                'type' => 'object',
                'required' => ['token', 'token_type', 'user'],
                'properties' => [
                    'token' => ['type' => 'string', 'example' => '1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz'],
                    'token_type' => ['type' => 'string', 'example' => 'Bearer'],
                    'user' => ['$ref' => '#/components/schemas/User'],
                ],
            ],
            'MeResponse' => [
                'type' => 'object',
                'required' => ['user', 'guru'],
                'properties' => [
                    'user' => ['$ref' => '#/components/schemas/User'],
                    'guru' => [
                        'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                        'nullable' => true,
                        'description' => 'Linked teacher profile (null for admin accounts).',
                    ],
                ],
            ],
            'TeacherCreateResponse' => [
                'type' => 'object',
                'required' => ['guru', 'credentials'],
                'properties' => [
                    'guru' => ['$ref' => '#/components/schemas/Teacher'],
                    'credentials' => [
                        'type' => 'object',
                        'description' => 'Login credentials for the newly created teacher account. Store them securely — the password is shown only once.',
                        'required' => ['email', 'password', 'password_generated'],
                        'properties' => [
                            'email' => ['type' => 'string', 'format' => 'email'],
                            'password' => ['type' => 'string', 'example' => 'aXb2Cd3Ef4Gh5Ij'],
                            'password_generated' => ['type' => 'boolean', 'description' => 'True when the API generated the password.', 'example' => true],
                        ],
                    ],
                ],
            ],
            'ResetPasswordResponse' => [
                'type' => 'object',
                'required' => ['email', 'password'],
                'properties' => [
                    'email' => ['type' => 'string', 'format' => 'email'],
                    'password' => ['type' => 'string', 'description' => 'The new random password. Store it securely.', 'example' => 'aXb2Cd3Ef4Gh5Ij'],
                ],
            ],
            'DashboardAdmin' => [
                'type' => 'object',
                'required' => ['role', 'stats'],
                'properties' => [
                    'role' => ['type' => 'string', 'example' => 'admin'],
                    'stats' => [
                        'type' => 'object',
                        'properties' => [
                            'total_guru' => ['type' => 'integer', 'example' => 12],
                            'total_sesi_bulan' => ['type' => 'integer', 'example' => 48],
                            'total_pengeluaran' => ['type' => 'number', 'format' => 'double', 'example' => 24500000],
                            'total_guru_hadir' => ['type' => 'integer', 'example' => 9],
                        ],
                    ],
                    'recent_sessions' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/TeachingSession'],
                    ],
                    'recent_payroll' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Salary'],
                    ],
                ],
            ],
            'DashboardGuru' => [
                'type' => 'object',
                'required' => ['role', 'stats'],
                'properties' => [
                    'role' => ['type' => 'string', 'example' => 'guru'],
                    'stats' => [
                        'type' => 'object',
                        'properties' => [
                            'total_sesi_bulan' => ['type' => 'integer', 'example' => 8],
                            'total_hadir' => ['type' => 'integer', 'example' => 6],
                            'gaji_bulan' => ['type' => 'number', 'format' => 'double', 'example' => 510000],
                            'potensi_gaji' => ['type' => 'number', 'format' => 'double', 'example' => 480000],
                            'status_bayar' => ['type' => 'string', 'enum' => ['belum_dibayar', 'sudah_dibayar'], 'example' => 'belum_dibayar'],
                        ],
                    ],
                    'upcoming_sessions' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/TeachingSession'],
                    ],
                    'today_attendances' => [
                        'type' => 'object',
                        'description' => 'Attendance records for today, keyed by teaching session ID.',
                        'additionalProperties' => ['$ref' => '#/components/schemas/Attendance'],
                    ],
                    'guru' => [
                        'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                        'nullable' => true,
                    ],
                ],
            ],
            'CheckInResponse' => [
                'type' => 'object',
                'required' => ['attendance', 'distance', 'accuracy'],
                'properties' => [
                    'attendance' => ['$ref' => '#/components/schemas/Attendance'],
                    'distance' => ['type' => 'integer', 'description' => 'Distance from the session location in meters.', 'example' => 24],
                    'accuracy' => ['type' => 'number', 'format' => 'double', 'description' => 'Reported GPS accuracy in meters.', 'example' => 12],
                    'accurate_gps' => ['type' => 'boolean', 'description' => 'True when accuracy ≤ 50 m (real GPS).', 'example' => true],
                ],
            ],
            'CheckOutResponse' => [
                'type' => 'object',
                'required' => ['attendance', 'distance', 'accuracy', 'duration_minutes'],
                'properties' => [
                    'attendance' => ['$ref' => '#/components/schemas/Attendance'],
                    'distance' => ['type' => 'integer', 'example' => 24],
                    'accuracy' => ['type' => 'number', 'format' => 'double', 'example' => 12],
                    'accurate_gps' => ['type' => 'boolean', 'example' => true],
                    'duration_minutes' => ['type' => 'integer', 'description' => 'Teaching duration recorded in minutes.', 'example' => 120],
                ],
            ],
            'MyAttendances' => [
                'type' => 'object',
                'required' => ['attendances', 'summary', 'guru'],
                'properties' => [
                    'attendances' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Attendance'],
                    ],
                    'summary' => [
                        'type' => 'object',
                        'properties' => [
                            'total_hadir' => ['type' => 'integer', 'example' => 6],
                            'total_jam' => ['type' => 'integer', 'description' => 'Total valid teaching minutes.', 'example' => 720],
                        ],
                    ],
                    'guru' => [
                        'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                        'nullable' => true,
                    ],
                ],
            ],
            'MySalaries' => [
                'type' => 'object',
                'required' => ['penggajians', 'summary', 'guru'],
                'properties' => [
                    'penggajians' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Salary'],
                    ],
                    'summary' => [
                        'type' => 'object',
                        'properties' => [
                            'total_gaji' => ['type' => 'number', 'format' => 'double', 'example' => 3060000],
                            'total_bayar' => ['type' => 'number', 'format' => 'double', 'example' => 2550000],
                            'gaji_bulan_ini' => [
                                'allOf' => [['$ref' => '#/components/schemas/Salary']],
                                'nullable' => true,
                            ],
                        ],
                    ],
                    'guru' => [
                        'allOf' => [['$ref' => '#/components/schemas/Teacher']],
                        'nullable' => true,
                    ],
                ],
            ],
            'MyLeaveRequests' => [
                'type' => 'object',
                'required' => ['perizinan'],
                'properties' => [
                    'perizinan' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/LeaveRequest'],
                    ],
                ],
            ],
            'CalculateResponse' => [
                'type' => 'object',
                'required' => ['periode', 'jumlah_guru_dihitung', 'jumlah_rekaman_gaji'],
                'properties' => [
                    'periode' => ['type' => 'string', 'example' => '2026-10'],
                    'jumlah_guru_dihitung' => ['type' => 'integer', 'example' => 12],
                    'jumlah_rekaman_gaji' => ['type' => 'integer', 'example' => 14],
                ],
            ],
            'MarkAllReadResponse' => [
                'type' => 'object',
                'required' => ['updated'],
                'properties' => [
                    'updated' => ['type' => 'integer', 'description' => 'Number of notifications marked as read.', 'example' => 5],
                ],
            ],
            'UnreadCountResponse' => [
                'type' => 'object',
                'required' => ['count'],
                'properties' => [
                    'count' => ['type' => 'integer', 'example' => 3],
                ],
            ],
            'ReportIndex' => [
                'type' => 'object',
                'required' => ['penggajians', 'summary'],
                'properties' => [
                    'penggajians' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Salary'],
                    ],
                    'summary' => [
                        'type' => 'object',
                        'properties' => [
                            'grand_total' => ['type' => 'number', 'format' => 'double', 'example' => 24500000],
                            'total_sesi' => ['type' => 'integer', 'example' => 320],
                            'jumlah_rekaman' => ['type' => 'integer', 'example' => 42],
                        ],
                    ],
                    'filters' => [
                        'type' => 'object',
                        'description' => 'The filters that were applied to the report.',
                        'additionalProperties' => true,
                    ],
                    'options' => [
                        'type' => 'object',
                        'description' => 'Lookup data for filter dropdowns (grades, transports).',
                        'additionalProperties' => true,
                    ],
                ],
            ],
            'ScheduleIndex' => [
                'type' => 'object',
                'required' => ['role', 'bulan', 'groups'],
                'properties' => [
                    'role' => ['type' => 'string', 'enum' => ['admin', 'guru'], 'example' => 'guru'],
                    'bulan' => ['type' => 'string', 'example' => '2026-10'],
                    'total_sesi_bulan' => ['type' => 'integer', 'example' => 8],
                    'available_months' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                        'description' => 'Months that contain teaching sessions.',
                        'example' => ['2026-09', '2026-10'],
                    ],
                    'groups' => [
                        'type' => 'array',
                        'description' => 'Sessions grouped by day.',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'tanggal' => ['type' => 'string', 'example' => '2026-10-22'],
                                'hari_label' => ['type' => 'string', 'example' => 'Thursday'],
                                'tanggal_label' => ['type' => 'string', 'example' => '22 October 2026'],
                                'total_sesi' => ['type' => 'integer', 'example' => 4],
                                'sessions' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'id' => ['type' => 'integer'],
                                            'jam_mulai' => ['type' => 'string', 'example' => '08:00'],
                                            'jam_selesai' => ['type' => 'string', 'example' => '10:00'],
                                            'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK']],
                                            'jumlah_sesi' => ['type' => 'integer'],
                                            'lokasi' => ['type' => 'string'],
                                            'transport' => ['type' => 'string'],
                                            'guru' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'id' => ['type' => 'integer', 'nullable' => true],
                                                    'nama' => ['type' => 'string'],
                                                    'kode_grade' => ['type' => 'string'],
                                                    'jenjang' => ['type' => 'string'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'SessionOptions' => [
                'type' => 'object',
                'required' => ['gurus', 'locations', 'transports'],
                'properties' => [
                    'gurus' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Teacher'],
                    ],
                    'locations' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'nama_lokasi' => ['type' => 'string'],
                            ],
                        ],
                    ],
                    'transports' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'jenis' => ['type' => 'string'],
                            ],
                        ],
                    ],
                ],
            ],
            'TeacherOptions' => [
                'type' => 'object',
                'required' => ['grades'],
                'properties' => [
                    'grades' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Grade'],
                    ],
                ],
            ],
            'PayrollOptions' => [
                'type' => 'object',
                'required' => ['gurus', 'transports'],
                'properties' => [
                    'gurus' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'nama' => ['type' => 'string'],
                                'honor_per_sesi' => ['type' => 'number', 'format' => 'double'],
                            ],
                        ],
                    ],
                    'transports' => [
                        'type' => 'array',
                        'items' => ['$ref' => '#/components/schemas/Transport'],
                    ],
                ],
            ],
            'AttendanceOptions' => [
                'type' => 'object',
                'required' => ['gurus'],
                'properties' => [
                    'gurus' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'nama' => ['type' => 'string'],
                            ],
                        ],
                    ],
                ],
            ],
            'MaterialUploadResponse' => [
                'type' => 'object',
                'required' => ['id', 'judul', 'notified_teachers'],
                'properties' => [
                    'id' => ['type' => 'integer', 'example' => 1],
                    'judul' => ['type' => 'string', 'example' => 'Algebra Basics'],
                    'deskripsi' => ['type' => 'string', 'nullable' => true],
                    'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK', 'umum']],
                    'file_name' => ['type' => 'string'],
                    'file_mime' => ['type' => 'string', 'nullable' => true],
                    'file_size' => ['type' => 'integer'],
                    'file_size_human' => ['type' => 'string'],
                    'download_url' => ['type' => 'string', 'nullable' => true],
                    'uploader' => [
                        'allOf' => [['$ref' => '#/components/schemas/User']],
                        'nullable' => true,
                    ],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                    'notified_teachers' => ['type' => 'integer', 'description' => 'Number of teacher accounts notified about this upload.', 'example' => 12],
                ],
            ],
        ];
    }
}
