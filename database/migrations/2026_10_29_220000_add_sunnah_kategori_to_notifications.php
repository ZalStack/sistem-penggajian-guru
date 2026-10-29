<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kategori "sunnah" untuk notifikasi 7SPS.
     *
     * Kolom enum sebelumnya hanya mengizinkan lima kategori dan membuat CHECK
     * constraint di SQLite. Mengubahnya menjadi string membuat daftar kategori
     * lebih mudah diperluas tanpa migrasi tabel ulang di masa depan.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('kategori', 20)->default('sistem')->change();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('kategori', ['sistem', 'absensi', 'perizinan', 'gaji', 'sesi'])
                ->default('sistem')
                ->change();
        });
    }
};
