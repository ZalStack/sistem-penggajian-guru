<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\TeachingSession;
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

        $transports = Transport::all();
        $gurus = Guru::all();
        $locations = Location::all();

        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');

        $sessions = [
            ['guru_id' => 1, 'location_id' => 1, 'transport_id' => 2, 'mapel' => 'IPA', 'tanggal' => $yesterday, 'jam_mulai' => '08:00', 'jam_selesai' => '10:00', 'jumlah_sesi' => 2],
            ['guru_id' => 1, 'location_id' => 1, 'transport_id' => 2, 'mapel' => 'IPA', 'tanggal' => $today, 'jam_mulai' => '08:00', 'jam_selesai' => '10:00', 'jumlah_sesi' => 2],
            ['guru_id' => 1, 'location_id' => 2, 'transport_id' => 1, 'mapel' => 'IPA', 'tanggal' => $today, 'jam_mulai' => '13:00', 'jam_selesai' => '15:00', 'jumlah_sesi' => 2],
            ['guru_id' => 2, 'location_id' => 2, 'transport_id' => 1, 'mapel' => 'MTK', 'tanggal' => $yesterday, 'jam_mulai' => '10:00', 'jam_selesai' => '12:00', 'jumlah_sesi' => 2],
            ['guru_id' => 2, 'location_id' => 2, 'transport_id' => 1, 'mapel' => 'MTK', 'tanggal' => $today, 'jam_mulai' => '10:00', 'jam_selesai' => '12:00', 'jumlah_sesi' => 2],
            ['guru_id' => 2, 'location_id' => 1, 'transport_id' => 2, 'mapel' => 'MTK', 'tanggal' => $today, 'jam_mulai' => '13:00', 'jam_selesai' => '15:00', 'jumlah_sesi' => 2],
            ['guru_id' => 3, 'location_id' => 1, 'transport_id' => 3, 'mapel' => 'IPA', 'tanggal' => $yesterday, 'jam_mulai' => '09:00', 'jam_selesai' => '11:00', 'jumlah_sesi' => 2],
            ['guru_id' => 3, 'location_id' => 1, 'transport_id' => 3, 'mapel' => 'IPA', 'tanggal' => $today, 'jam_mulai' => '09:00', 'jam_selesai' => '11:00', 'jumlah_sesi' => 2],
            ['guru_id' => 4, 'location_id' => 2, 'transport_id' => 1, 'mapel' => 'MTK', 'tanggal' => $yesterday, 'jam_mulai' => '08:00', 'jam_selesai' => '10:00', 'jumlah_sesi' => 2],
            ['guru_id' => 4, 'location_id' => 2, 'transport_id' => 1, 'mapel' => 'MTK', 'tanggal' => $today, 'jam_mulai' => '08:00', 'jam_selesai' => '10:00', 'jumlah_sesi' => 2],
        ];

        foreach ($sessions as $session) {
            TeachingSession::create($session);
        }
    }
}
