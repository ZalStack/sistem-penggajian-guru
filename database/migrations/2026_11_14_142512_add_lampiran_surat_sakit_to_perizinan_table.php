<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perizinan', function (Blueprint $table) {
            $table->string('lampiran_surat_sakit')->nullable()->after('alasan')->comment('file surat keterangan sakit (wajib saat jenis=sakit)');
        });
    }

    public function down(): void
    {
        Schema::table('perizinan', function (Blueprint $table) {
            $table->dropColumn('lampiran_surat_sakit');
        });
    }
};
