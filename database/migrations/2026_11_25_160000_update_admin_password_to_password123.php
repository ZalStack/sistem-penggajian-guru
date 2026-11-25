<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $hashed = Hash::make('password123');

        // Update existing admin or administrator users
        DB::table('users')
            ->where('role', 'admin')
            ->orWhere('email', 'like', '%admin%')
            ->update([
                'password' => $hashed,
                'updated_at' => now(),
            ]);

        // Pastikan akun admin standar juga ada dan password-nya password123
        $standardAdmins = [
            'admin@satugurukpm.id' => 'Admin Satu Guru',
            'administrator@siguru.com' => 'Administrator',
            'admin@test.com' => 'Admin',
        ];

        foreach ($standardAdmins as $email => $name) {
            $user = DB::table('users')->where('email', $email)->first();
            if ($user) {
                DB::table('users')->where('id', $user->id)->update([
                    'password' => $hashed,
                    'role' => 'admin',
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('users')->insert([
                    'name' => $name,
                    'email' => $email,
                    'password' => $hashed,
                    'role' => 'admin',
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // No-op
    }
};
