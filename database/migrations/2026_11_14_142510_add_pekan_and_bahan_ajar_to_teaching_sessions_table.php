<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teaching_sessions', function (Blueprint $table) {
            $table->unsignedTinyInteger('pekan')->default(1)->after('tanggal')->comment('nomor pekan 2-mingguan (siklus 14 hari)');
            $table->text('bahan_ajar')->nullable()->after('pekan')->comment('materi / bahan ajar sesi ini');
        });
    }

    public function down(): void
    {
        Schema::table('teaching_sessions', function (Blueprint $table) {
            $table->dropColumn(['pekan', 'bahan_ajar']);
        });
    }
};
