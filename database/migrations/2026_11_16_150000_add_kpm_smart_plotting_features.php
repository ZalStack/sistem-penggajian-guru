<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel materials untuk bahan ajar PDF
        if (! Schema::hasTable('materials')) {
            Schema::create('materials', function (Blueprint $table) {
                $table->id();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('file_path');
                $table->string('file_name');
                $table->string('file_type')->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('subject', 100)->nullable();
                $table->string('pekan', 50)->nullable();
                $table->string('kelas', 50)->nullable();
                $table->string('level', 100)->nullable();
                $table->string('status', 50)->default('approved');
                $table->timestamps();
            });
        }

        // 2. Modifikasi teaching_sessions untuk sinkronisasi fitur ploting KPM Student Smart
        Schema::table('teaching_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('teaching_sessions', 'kelas')) {
                $table->string('kelas', 50)->nullable()->after('program_id');
            }
            if (! Schema::hasColumn('teaching_sessions', 'level')) {
                $table->string('level', 100)->nullable()->after('kelas');
            }
            if (! Schema::hasColumn('teaching_sessions', 'session_time')) {
                $table->string('session_time', 50)->nullable()->after('jam_selesai');
            }
            if (! Schema::hasColumn('teaching_sessions', 'material_id')) {
                $table->foreignId('material_id')->nullable()->after('bahan_ajar')->constrained('materials')->nullOnDelete();
            }
            if (! Schema::hasColumn('teaching_sessions', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('status');
            }
        });

        // 3. Tambah status is_active_this_week pada tabel gurus
        Schema::table('gurus', function (Blueprint $table) {
            if (! Schema::hasColumn('gurus', 'is_active_this_week')) {
                $table->boolean('is_active_this_week')->default(true)->after('pelatihan_suprarasional');
            }
        });
    }

    public function down(): void
    {
        Schema::table('gurus', function (Blueprint $table) {
            if (Schema::hasColumn('gurus', 'is_active_this_week')) {
                $table->dropColumn('is_active_this_week');
            }
        });

        Schema::table('teaching_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('teaching_sessions', 'material_id')) {
                $table->dropForeign(['material_id']);
                $table->dropColumn('material_id');
            }
            $cols = [];
            foreach (['kelas', 'level', 'session_time', 'is_active'] as $col) {
                if (Schema::hasColumn('teaching_sessions', $col)) {
                    $cols[] = $col;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });

        Schema::dropIfExists('materials');
    }
};
