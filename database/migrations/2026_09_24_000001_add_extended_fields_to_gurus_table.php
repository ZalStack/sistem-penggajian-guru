<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->string('domisili')->nullable()->after('jenjang');
            $table->string('nomor_telepon', 20)->nullable()->after('domisili');
            // email tetap di users.email, tapi tambahkan cache di gurus untuk kemudahan jika dibutuhkan
            $table->decimal('tunjangan_khusus', 12, 2)->default(0)->after('nomor_telepon');
            $table->string('bank', 50)->nullable()->after('tunjangan_khusus');
            $table->string('nomor_rekening', 50)->nullable()->after('bank');
            $table->text('keterangan_mengajar')->nullable()->after('nomor_rekening');
        });
    }

    public function down(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            $table->dropColumn(['domisili', 'nomor_telepon', 'tunjangan_khusus', 'bank', 'nomor_rekening', 'keterangan_mengajar']);
        });
    }
};
