<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bahan_ajar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->comment('admin pengunggah');
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->enum('mapel', ['IPA', 'MTK', 'umum'])->default('umum');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_mime', 100)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamps();

            $table->index('mapel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bahan_ajar');
    }
};
