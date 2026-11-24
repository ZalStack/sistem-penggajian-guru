<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gurus') && ! Schema::hasColumn('gurus', 'active_week_override')) {
            Schema::table('gurus', function (Blueprint $table) {
                $table->string('active_week_override', 50)->nullable()->after('is_active_this_week');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('gurus') && Schema::hasColumn('gurus', 'active_week_override')) {
            Schema::table('gurus', function (Blueprint $table) {
                $table->dropColumn('active_week_override');
            });
        }
    }
};
