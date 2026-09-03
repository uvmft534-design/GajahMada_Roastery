<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products', 'product_id')->cascadeOnDelete();
            $table->unsignedInteger('qty')->default(1);
            $table->string('brew_method')->default('filter');
            $table->timestamps();

            $table->unique(['cart_id', 'product_id', 'brew_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
