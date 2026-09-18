<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_variants')) {
            Schema::create('product_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products', 'product_id')->cascadeOnDelete();
                $table->unsignedInteger('weight_grams');
                $table->integer('price');
                $table->integer('stock');
                $table->timestamps();

                $table->unique(['product_id', 'weight_grams']);
            });
        }

        DB::table('products')->orderBy('product_id')->each(function (object $product): void {
            if ((int) $product->weight_grams <= 0 || (int) $product->price < 1 || (int) $product->stock < 0) {
                return;
            }

            DB::table('product_variants')->insertOrIgnore([
                'product_id' => $product->product_id,
                'weight_grams' => $product->weight_grams,
                'price' => $product->price,
                'stock' => $product->stock,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $cartColumns = Schema::getColumnListing('cart_items');
        $cartIndexes = collect(Schema::getIndexes('cart_items'));

        if (! in_array('product_variant_id', $cartColumns, true)) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
            });
        }

        if (! $cartIndexes->contains(fn (array $index) => $index['name'] === 'cart_item_variant_brew_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->unique(['cart_id', 'product_id', 'product_variant_id', 'brew_method'], 'cart_item_variant_brew_unique');
            });
        }

        // Add the replacement index before removing the previous one: the old
        // composite index may be the only index supporting cart_id's foreign key.
        if ($cartIndexes->contains(fn (array $index) => $index['name'] === 'cart_items_cart_id_product_id_brew_method_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropUnique('cart_items_cart_id_product_id_brew_method_unique');
            });
        }

        $orderItemColumns = Schema::getColumnListing('order_items');

        Schema::table('order_items', function (Blueprint $table) use ($orderItemColumns) {
            if (! in_array('product_variant_id', $orderItemColumns, true)) {
                $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
            }

            if (! in_array('weight_grams', $orderItemColumns, true)) {
                $table->unsignedInteger('weight_grams')->nullable()->after('product_category');
            }
        });

        DB::table('cart_items')->whereNull('product_variant_id')->orderBy('id')->each(function (object $item): void {
            $variants = DB::table('product_variants')->where('product_id', $item->product_id)->get(['id']);

            if ($variants->count() === 1) {
                DB::table('cart_items')->where('id', $item->id)->update(['product_variant_id' => $variants->first()->id]);
            }
        });

        DB::table('order_items')->whereNull('product_variant_id')->orderBy('order_item_id')->each(function (object $item): void {
            if (! $item->product_id) {
                return;
            }

            $variants = DB::table('product_variants')->where('product_id', $item->product_id)->get(['id', 'weight_grams']);

            if ($variants->count() === 1) {
                $variant = $variants->first();
                DB::table('order_items')->where('order_item_id', $item->order_item_id)->update([
                    'product_variant_id' => $variant->id,
                    'weight_grams' => $variant->weight_grams,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_variant_id');
            $table->dropColumn('weight_grams');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique('cart_item_variant_brew_unique');
            $table->dropConstrainedForeignId('product_variant_id');
            $table->unique(['cart_id', 'product_id', 'brew_method']);
        });

        Schema::dropIfExists('product_variants');
    }
};
