<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perizinan', function (Blueprint $table) {
            $table->foreignId('session_id')->nullable()->after('guru_id')->constrained('teaching_sessions')->nullOnDelete()->comment('opsional: sesi mengajar yang terdampak izin');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->string('alamat')->nullable()->after('nama_lokasi')->comment('alamat lengkap lokasi mengajar');
        });
    }

    public function down(): void
    {
        Schema::table('perizinan', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
            $table->dropColumn('session_id');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn('alamat');
        });
    }
};
