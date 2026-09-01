<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('courier_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->unique('tracking_number');
            $table->timestamp('picked_up_at')->nullable()->after('stock_released_at');
            $table->timestamp('shipped_at')->nullable()->after('picked_up_at');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['courier_id']);
            $table->dropUnique(['tracking_number']);
            $table->dropColumn(['courier_id', 'picked_up_at', 'shipped_at', 'delivered_at']);
        });
    }
};
