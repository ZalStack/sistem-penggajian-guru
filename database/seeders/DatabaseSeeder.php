<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin SIGURU',
            'email' => 'admin@siguru.com',
            'password' => Hash::make('password'),
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
    }
}
