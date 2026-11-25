<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $hashed = Hash::make('password123');

        // Pastikan akun utama id = 1 atau email = admin@siguru.com diset sebagai Administrator tunggal
        $primaryAdmin = DB::table('users')->where('email', 'admin@siguru.com')->first();

        if ($primaryAdmin) {
            DB::table('users')->where('id', $primaryAdmin->id)->update([
                'name' => 'Administrator',
                'email' => 'admin@siguru.com',
                'password' => $hashed,
                'role' => 'admin',
                'updated_at' => now(),
            ]);
            $keepId = $primaryAdmin->id;
        } else {
            $firstAdmin = DB::table('users')->where('role', 'admin')->orderBy('id')->first();
            if ($firstAdmin) {
                DB::table('users')->where('id', $firstAdmin->id)->update([
                    'name' => 'Administrator',
                    'email' => 'admin@siguru.com',
                    'password' => $hashed,
                    'role' => 'admin',
                    'updated_at' => now(),
                ]);
                $keepId = $firstAdmin->id;
            } else {
                $keepId = DB::table('users')->insertGetId([
                    'name' => 'Administrator',
                    'email' => 'admin@siguru.com',
                    'password' => $hashed,
                    'role' => 'admin',
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Hapus akun admin duplikat / cadangan lainnya agar hanya tersisa 1 akun Administrator
        DB::table('users')
            ->where('role', 'admin')
            ->where('id', '!=', $keepId)
            ->delete();

        // Hapus juga akun dengan email admin lain jika masih ada
        DB::table('users')
            ->whereIn('email', ['admin@test.com', 'administrator@siguru.com', 'admin@satugurukpm.id'])
            ->where('id', '!=', $keepId)
            ->delete();
    }

    public function down(): void
    {
        // No-op
    }
};
