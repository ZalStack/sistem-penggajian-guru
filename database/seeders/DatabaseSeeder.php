<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin SIGURU',
            'email' => 'admin@siguru.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $grades = [
            ['kode_grade' => 'A1', 'honor_per_sesi' => 100000],
            ['kode_grade' => 'A2', 'honor_per_sesi' => 90000],
            ['kode_grade' => 'B1', 'honor_per_sesi' => 80000],
            ['kode_grade' => 'B2', 'honor_per_sesi' => 70000],
            ['kode_grade' => 'C1', 'honor_per_sesi' => 50000],
            ['kode_grade' => 'C2', 'honor_per_sesi' => 40000],
        ];

        foreach ($grades as $grade) {
            Grade::create($grade);
        }

        $transports = [
            ['jenis' => 'Online', 'biaya' => 25000],
            ['jenis' => 'Dalam Kota', 'biaya' => 35000],
            ['jenis' => 'Luar Kota', 'biaya' => 55000],
        ];

        foreach ($transports as $transport) {
            Transport::create($transport);
        }

        $locations = [
            ['nama_lokasi' => 'KPM Pusat - Gedung Utama', 'latitude' => -6.200000, 'longitude' => 106.845100, 'radius' => 100],
            ['nama_lokasi' => 'KPM Pusat - Gedung B', 'latitude' => -6.200500, 'longitude' => 106.845500, 'radius' => 150],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }

        $guruData = [
            ['nama' => 'Ahmad Fauzi', 'grade_id' => 1, 'mapel' => 'IPA', 'jenjang' => 'SMP'],
            ['nama' => 'Siti Nurhaliza', 'grade_id' => 2, 'mapel' => 'MTK', 'jenjang' => 'SMA'],
            ['nama' => 'Budi Santoso', 'grade_id' => 3, 'mapel' => 'IPA', 'jenjang' => 'SMP'],
            ['nama' => 'Dewi Lestari', 'grade_id' => 4, 'mapel' => 'MTK', 'jenjang' => 'SD'],
        ];

        foreach ($guruData as $i => $data) {
            $guru = Guru::create($data);

            $userGuru = User::create([
                'name' => $data['nama'],
                'email' => 'guru'.($i + 1).'@siguru.com',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'guru_id' => $guru->id,
            ]);

            $guru->update(['user_id' => $userGuru->id]);
        }
    }
}
