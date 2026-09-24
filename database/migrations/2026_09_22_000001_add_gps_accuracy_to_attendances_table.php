<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->decimal('checkin_accuracy', 8, 2)->nullable()->after('checkin_lng')->comment('akurasi GPS check-in dalam meter');
            $table->decimal('checkout_accuracy', 8, 2)->nullable()->after('checkout_lng')->comment('akurasi GPS check-out dalam meter');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['checkin_accuracy', 'checkout_accuracy']);
        });
    }
};
