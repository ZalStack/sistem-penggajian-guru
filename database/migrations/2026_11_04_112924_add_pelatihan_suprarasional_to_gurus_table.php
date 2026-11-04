<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->boolean('pelatihan_suprarasional')->nullable()->after('tanggal_bergabung')->comment('pernah ikut pelatihan Suprarasional (1=IYA, 0=TIDAK, NULL=belum diisi)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->dropColumn('pelatihan_suprarasional');
        });
    }
};
