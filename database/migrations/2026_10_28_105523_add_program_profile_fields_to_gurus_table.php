<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->string('pendidikan_terakhir')->nullable()->after('riwayat_pendidikan')->comment('contoh: S.Pd, M.Pd');
            $table->unsignedSmallInteger('lama_mengajar')->nullable()->after('tanggal_bergabung')->comment('total pengalaman mengajar dalam tahun');
            $table->text('riwayat_mengajar')->nullable()->after('lama_mengajar')->comment('satu riwayat per baris: tahun - instansi - kelas/mapel');
        });
    }

    public function down(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->dropColumn(['pendidikan_terakhir', 'lama_mengajar', 'riwayat_mengajar']);
        });
    }
};
