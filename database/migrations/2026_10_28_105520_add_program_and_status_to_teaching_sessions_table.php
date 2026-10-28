<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teaching_sessions', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->after('transport_id')->constrained('programs')->nullOnDelete();
            $table->enum('status', ['dijadwalkan', 'selesai', 'dibatalkan'])->default('dijadwalkan')->after('jumlah_sesi');
            $table->text('catatan')->nullable()->after('status')->comment('alasan pembatalan / catatan admin');
        });
    }

    public function down(): void
    {
        Schema::table('teaching_sessions', function (Blueprint $table) {
            $table->dropForeign(['program_id']);
            $table->dropColumn(['program_id', 'status', 'catatan']);
        });
    }
};
