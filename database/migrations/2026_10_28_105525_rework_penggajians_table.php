<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penggajians', function (Blueprint $table) {
            /*
             * Rekap honor disatukan menjadi SATU baris per guru per periode.
             * Rincian per jenis transport / program disimpan di kolom `detail`
             * sehingga tidak ada penghitungan ganda saat satu guru mengajar
             * beberapa jenis kelas.
             */
            $table->decimal('tunjangan_khusus', 12, 2)->default(0)->after('total_transport');
            $table->json('detail')->nullable()->after('tunjangan_khusus')->comment('rincian per program/transport: jumlah_sesi, jumlah_hadir, honor, transport');
            $table->foreignId('transport_id')->nullable()->change();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE penggajians DROP FOREIGN KEY penggajians_guru_id_foreign');
            DB::statement('ALTER TABLE penggajians DROP INDEX penggajians_guru_id_periode_transport_id_unique');
            DB::statement('ALTER TABLE penggajians ADD UNIQUE INDEX penggajians_guru_id_periode_unique (guru_id, periode)');
            DB::statement('ALTER TABLE penggajians ADD CONSTRAINT penggajians_guru_id_foreign FOREIGN KEY (guru_id) REFERENCES gurus (id) ON DELETE CASCADE');
        } else {
            Schema::table('penggajians', function (Blueprint $table) {
                $table->dropUnique('penggajians_guru_id_periode_transport_id_unique');
                $table->unique(['guru_id', 'periode'], 'penggajians_guru_id_periode_unique');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE penggajians DROP FOREIGN KEY penggajians_guru_id_foreign');
            DB::statement('ALTER TABLE penggajians DROP INDEX penggajians_guru_id_periode_unique');
            DB::statement('ALTER TABLE penggajians ADD UNIQUE INDEX penggajians_guru_id_periode_transport_id_unique (guru_id, periode, transport_id)');
            DB::statement('ALTER TABLE penggajians ADD CONSTRAINT penggajians_guru_id_foreign FOREIGN KEY (guru_id) REFERENCES gurus (id) ON DELETE CASCADE');
        } else {
            Schema::table('penggajians', function (Blueprint $table) {
                $table->dropUnique('penggajians_guru_id_periode_unique');
                $table->unique(['guru_id', 'periode', 'transport_id'], 'penggajians_guru_id_periode_transport_id_unique');
            });
        }

        Schema::table('penggajians', function (Blueprint $table) {
            $table->foreignId('transport_id')->nullable(false)->change();
            $table->dropColumn(['tunjangan_khusus', 'detail']);
        });
    }
};
