<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->text('aktivitas_luar_kpm')->nullable()->after('keterangan_mengajar')->comment('kegiatan / aktivitas di luar KPM, satu aktivitas per baris');
            $table->enum('bidang_2', ['IPA', 'MTK'])->nullable()->after('mapel')->comment('bidang / mata pelajaran kedua guru');
        });
    }

    public function down(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->dropColumn(['aktivitas_luar_kpm', 'bidang_2']);
        });
    }
};
