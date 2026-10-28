<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('nama')->unique();
            $table->string('slug')->unique();
            $table->text('deskripsi')->nullable();
            $table->unsignedTinyInteger('urutan')->default(0)->comment('urutan tampil di UI');
            $table->timestamps();
        });

        Schema::create('guru_program', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['guru_id', 'program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guru_program');
        Schema::dropIfExists('programs');
    }
};
