<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penggajians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained()->cascadeOnDelete();
            $table->string('periode', 7);
            $table->integer('jumlah_sesi')->default(0);
            $table->foreignId('transport_id')->constrained()->cascadeOnDelete();
            $table->decimal('honor', 12, 2)->default(0);
            $table->decimal('total_transport', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['guru_id', 'periode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penggajians');
    }
};
