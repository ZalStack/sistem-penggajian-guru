<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Program;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder dasar: master data (grade, transport, lokasi, program), akun admin,
 * dan data guru beserta akun loginnya.
 *
 * Idempotent — aman dijalankan pada database yang sudah berisi data
 * (`php artisan db:seed`) karena semua record dibuat dengan firstOrCreate.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Akun admin hanya dibuat bila database belum memiliki admin sama sekali
        // sehingga akun yang sudah ada di lingkungan pengembangan tidak ganda.
        if (! User::where('role', 'admin')->exists()) {
            User::create([
                'name' => 'Admin Satu Guru',
                'email' => 'admin@satugurukpm.id',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);
        }

        $grades = [
            ['kode_grade' => 'A1', 'honor_per_sesi' => 100000],
            ['kode_grade' => 'A2', 'honor_per_sesi' => 90000],
            ['kode_grade' => 'B1', 'honor_per_sesi' => 80000],
            ['kode_grade' => 'B2', 'honor_per_sesi' => 70000],
            ['kode_grade' => 'C1', 'honor_per_sesi' => 50000],
            ['kode_grade' => 'C2', 'honor_per_sesi' => 40000],
        ];

        foreach ($grades as $grade) {
            Grade::firstOrCreate(['kode_grade' => $grade['kode_grade']], $grade);
        }

        $transports = [
            ['jenis' => 'Online', 'biaya' => 25000],
            ['jenis' => 'Dalam Kota', 'biaya' => 35000],
            ['jenis' => 'Luar Kota', 'biaya' => 55000],
        ];

        foreach ($transports as $transport) {
            Transport::firstOrCreate(['jenis' => $transport['jenis']], $transport);
        }

        $locations = [
            ['nama_lokasi' => 'KPM Pusat - Gedung Utama', 'alamat' => 'Jl. Raya Bogor No. 1, Kota Bogor', 'latitude' => -6.200000, 'longitude' => 106.845100, 'radius' => 100],
            ['nama_lokasi' => 'KPM Pusat - Gedung B', 'alamat' => 'Jl. Ahmad Yani No. 15, Kota Bogor', 'latitude' => -6.200500, 'longitude' => 106.845500, 'radius' => 150],
        ];

        foreach ($locations as $location) {
            Location::firstOrCreate(['nama_lokasi' => $location['nama_lokasi']], $location);
        }

        $programs = [
            ['nama' => 'Kelas Khusus', 'slug' => 'kelas-khusus', 'deskripsi' => 'Kelas pendamping khusus dengan jumlah siswa terbatas', 'urutan' => 1],
            ['nama' => 'Reguler Bogor', 'slug' => 'reguler-bogor', 'deskripsi' => 'Kelas reguler wilayah Kota & Kabupaten Bogor', 'urutan' => 2],
            ['nama' => 'Reguler Lainnya', 'slug' => 'reguler-lainnya', 'deskripsi' => 'Kelas reguler di luar wilayah Bogor', 'urutan' => 3],
            ['nama' => 'Kelas Online', 'slug' => 'kelas-online', 'deskripsi' => 'Kelas daring via video conference', 'urutan' => 4],
        ];

        $programModels = [];
        foreach ($programs as $program) {
            $programModels[$program['slug']] = Program::firstOrCreate(['slug' => $program['slug']], $program);
        }

        $guruData = [
            [
                'nama' => 'Ahmad Fauzi', 'grade' => 'A1', 'mapel' => 'IPA', 'jenjang' => 'SMP',
                'domisili' => 'Kota Bogor', 'pendidikan_terakhir' => 'S.Pd', 'lama_mengajar' => 8,
                'tanggal_bergabung' => '2018-07-01', 'riwayat_mengajar' => 'SMP Negeri 1 Bogor (2018-2020), MTs Al-Hikmah (2020-sekarang)',
                'programs' => ['kelas-khusus', 'reguler-bogor'],
            ],
            [
                'nama' => 'Siti Nurhaliza', 'grade' => 'A2', 'mapel' => 'MTK', 'jenjang' => 'SMA',
                'domisili' => 'Kabupaten Bogor', 'pendidikan_terakhir' => 'M.Pd', 'lama_mengajar' => 6,
                'tanggal_bergabung' => '2019-01-15', 'riwayat_mengajar' => 'SMA Negeri 3 Bogor (2019-2021), SMA KPM (2021-sekarang)',
                'programs' => ['reguler-bogor', 'kelas-online'],
            ],
            [
                'nama' => 'Budi Santoso', 'grade' => 'B1', 'mapel' => 'IPA', 'jenjang' => 'SMP',
                'domisili' => 'Kota Bekasi', 'pendidikan_terakhir' => 'S.Si', 'lama_mengajar' => 4,
                'tanggal_bergabung' => '2021-08-01', 'riwayat_mengajar' => 'SMP Tunas Harapan Bekasi (2021-2023), KPM Reguler Lainnya (2023-sekarang)',
                'programs' => ['reguler-lainnya'],
            ],
            [
                'nama' => 'Dewi Lestari', 'grade' => 'B2', 'mapel' => 'MTK', 'jenjang' => 'SD',
                'domisili' => 'Kota Bogor', 'pendidikan_terakhir' => 'S.Pd', 'lama_mengajar' => 10,
                'tanggal_bergabung' => '2016-02-01', 'riwayat_mengajar' => 'SD Cendekia Bogor (2016-2019), SD KPM (2019-sekarang)',
                'programs' => ['kelas-khusus', 'kelas-online'],
            ],
        ];

        foreach ($guruData as $index => $data) {
            $programSlugs = $data['programs'];
            $grade = Grade::where('kode_grade', $data['grade'])->first();
            unset($data['grade'], $data['programs']);

            $guru = Guru::firstOrCreate(
                ['nama' => $data['nama']],
                $data + ['grade_id' => $grade?->id]
            );

            // Lengkapi profil guru yang sudah ada tanpa menimpa data user.
            $guru->fill(array_intersect_key($data, array_flip([
                'domisili', 'pendidikan_terakhir', 'lama_mengajar', 'tanggal_bergabung', 'riwayat_mengajar',
            ])));
            $guru->grade_id = $guru->grade_id ?: $grade?->id;
            $guru->save();

            $guru->programs()->sync(
                array_map(fn (string $slug) => $programModels[$slug]->id, $programSlugs)
            );

            // Pakai akun guru yang sudah ada bila tersedia; hanya buat akun baru
            // ketika guru belum memiliki login.
            $email = 'guru'.($index + 1).'@satugurukpm.id';
            $userGuru = $guru->user ?? User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $guru->nama,
                    'password' => Hash::make('password'),
                    'role' => 'guru',
                    'email_verified_at' => now(),
                ]
            );

            $userGuru->forceFill([
                'role' => 'guru',
                'guru_id' => $guru->id,
                'email_verified_at' => $userGuru->email_verified_at ?? now(),
            ])->save();

            if (! $guru->user_id) {
                $guru->update(['user_id' => $userGuru->id]);
            }
        }

        // Pastikan seluruh akun guru terverifikasi agar tidak terblokir middleware 'verified'.
        User::where('role', 'guru')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
        User::where('role', 'admin')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }
}
