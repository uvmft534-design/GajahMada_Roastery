<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('processing_at')->nullable()->after('stock_released_at');
            $table->timestamp('packed_at')->nullable()->after('processing_at');
            $table->timestamp('pickup_requested_at')->nullable()->after('packed_at');
            $table->timestamp('completed_at')->nullable()->after('delivered_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['processing_at', 'packed_at', 'pickup_requested_at', 'completed_at']);
        });
    }
};
