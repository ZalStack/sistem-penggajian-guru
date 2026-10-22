<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->text('alamat')->nullable()->after('domisili')->comment('alamat lengkap');
            $table->text('riwayat_pendidikan')->nullable()->after('alamat')->comment('satu pendidikan per baris');
            $table->date('tanggal_bergabung')->nullable()->after('riwayat_pendidikan')->comment('waktu bergabung di KPM');
        });
    }

    public function down(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->dropColumn(['alamat', 'riwayat_pendidikan', 'tanggal_bergabung']);
        });
    }
};
