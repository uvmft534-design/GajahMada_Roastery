<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id'); // Primary Key sesuai class diagram
            $table->string('product_name');
            $table->string('category')->nullable();
            $table->integer('price');
            $table->integer('stock');
            $table->text('description')->nullable();
            $table->string('image')->nullable(); // Menampung path file gambar
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
