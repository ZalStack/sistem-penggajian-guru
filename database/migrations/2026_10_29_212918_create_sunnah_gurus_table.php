<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sunnah_gurus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('gurus')->cascadeOnDelete();
            $table->date('tanggal');

            // Sholat wajib & berjamaah
            $table->boolean('sholat_subuh')->default(false);
            $table->boolean('sholat_subuh_berjamaah')->default(false);
            $table->boolean('sholat_zuhur')->default(false);
            $table->boolean('sholat_zuhur_berjamaah')->default(false);
            $table->boolean('sholat_asar')->default(false);
            $table->boolean('sholat_asar_berjamaah')->default(false);
            $table->boolean('sholat_maghrib')->default(false);
            $table->boolean('sholat_maghrib_berjamaah')->default(false);
            $table->boolean('sholat_isya')->default(false);
            $table->boolean('sholat_isya_berjamaah')->default(false);

            // Amalan sunnah lainnya
            $table->boolean('sholat_tahajud')->default(false);
            $table->boolean('infaq_sedekah')->default(false);
            $table->boolean('dzikir_sholawat')->default(false);
            $table->boolean('tilawah_quran')->default(false);
            $table->boolean('sholat_dhuha')->default(false);
            $table->boolean('menjaga_wudhu')->default(false);
            $table->boolean('puasa_sunnah')->default(false);

            // Poin & approval
            $table->integer('total_poin')->default(0);
            $table->enum('status_approval', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('catatan')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            $table->unique(['guru_id', 'tanggal']);
            $table->index(['status_approval', 'tanggal'], 'idx_sunnah_guru_status_tanggal');
            $table->index('tanggal', 'idx_sunnah_guru_tanggal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sunnah_gurus');
    }
};
