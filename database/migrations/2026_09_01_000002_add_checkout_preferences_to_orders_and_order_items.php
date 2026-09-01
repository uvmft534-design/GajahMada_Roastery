<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->text('customer_note')->nullable()->after('customer_address');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('brew_method')->nullable()->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('brew_method');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('customer_note');
        });
    }
};
