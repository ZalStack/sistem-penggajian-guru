<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penggajians', function (Blueprint $table) {
            $table->integer('jumlah_hadir')->default(0)->after('jumlah_sesi');
            $table->decimal('total_jam', 8, 2)->default(0)->after('jumlah_hadir');
            $table->decimal('total_transport', 12, 2)->default(0)->change();
            $table->decimal('total', 12, 2)->default(0)->change();
            $table->enum('status_bayar', ['belum_dibayar', 'sudah_dibayar'])->default('belum_dibayar')->after('total');
        });

        DB::statement('ALTER TABLE penggajians DROP FOREIGN KEY penggajians_guru_id_foreign');
        DB::statement('ALTER TABLE penggajians DROP INDEX penggajians_guru_id_periode_unique');
        DB::statement('ALTER TABLE penggajians ADD UNIQUE INDEX penggajians_guru_id_periode_transport_id_unique (guru_id, periode, transport_id)');
        DB::statement('ALTER TABLE penggajians ADD CONSTRAINT penggajians_guru_id_foreign FOREIGN KEY (guru_id) REFERENCES gurus (id) ON DELETE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE penggajians DROP FOREIGN KEY penggajians_guru_id_foreign');
        DB::statement('ALTER TABLE penggajians DROP INDEX penggajians_guru_id_periode_transport_id_unique');
        DB::statement('ALTER TABLE penggajians ADD UNIQUE INDEX penggajians_guru_id_periode_unique (guru_id, periode)');
        DB::statement('ALTER TABLE penggajians ADD CONSTRAINT penggajians_guru_id_foreign FOREIGN KEY (guru_id) REFERENCES gurus (id) ON DELETE CASCADE');

        Schema::table('penggajians', function (Blueprint $table) {
            $table->dropColumn(['jumlah_hadir', 'total_jam', 'status_bayar']);
        });
    }
};
