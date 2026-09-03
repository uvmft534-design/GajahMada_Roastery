<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('weight_grams')->nullable()->after('stock');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->text('delivery_note')->nullable()->after('customer_note');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('delivery_note'));
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('weight_grams'));
        Schema::dropIfExists('product_categories');
    }
};
