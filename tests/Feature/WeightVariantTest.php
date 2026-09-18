<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeightVariantTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_independent_weight_variants(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        ProductCategory::create(['name' => 'Arabica']);

        $this->actingAs($admin)->post(route('admin.products.store'), [
            'product_name' => 'Flores', 'category' => 'Arabica',
            'variants' => [['weight_grams' => 200, 'price' => 45000, 'stock' => 4]],
        ])->assertRedirect();
        $flores = Product::where('product_name', 'Flores')->sole();
        $this->assertDatabaseHas('product_variants', ['product_id' => $flores->product_id, 'weight_grams' => 200, 'price' => 45000, 'stock' => 4]);

        $this->actingAs($admin)->post(route('admin.products.store'), [
            'product_name' => 'Gayo', 'category' => 'Arabica',
            'variants' => [['weight_grams' => 1000, 'price' => 180000, 'stock' => 8]],
        ])->assertRedirect();
        $gayo = Product::where('product_name', 'Gayo')->sole();
        $this->assertDatabaseHas('product_variants', ['product_id' => $gayo->product_id, 'weight_grams' => 1000, 'price' => 180000, 'stock' => 8]);

        $this->actingAs($admin)->post(route('admin.products.store'), [
            'product_name' => 'Toraja', 'category' => 'Arabica',
            'variants' => [['weight_grams' => 200, 'price' => 50000, 'stock' => 3], ['weight_grams' => 1000, 'price' => 190000, 'stock' => 7]],
        ])->assertRedirect();
        $this->assertSame(2, Product::where('product_name', 'Toraja')->sole()->variants()->count());

        $this->actingAs($admin)->post(route('admin.products.update', $flores), [
            'product_name' => 'Flores', 'category' => 'Arabica',
            'variants' => [
                ['weight_grams' => 200, 'price' => 50000, 'stock' => 6],
                ['weight_grams' => 1000, 'price' => 180000, 'stock' => 12],
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('product_variants', ['product_id' => $flores->product_id, 'weight_grams' => 200, 'price' => 50000, 'stock' => 6]);
        $this->assertDatabaseHas('product_variants', ['product_id' => $flores->product_id, 'weight_grams' => 1000, 'price' => 180000, 'stock' => 12]);
        $this->actingAs($admin)->post(route('admin.products.store'), ['product_name' => 'Duplicate', 'category' => 'Arabica', 'variants' => [['weight_grams' => 200, 'price' => 1, 'stock' => 1], ['weight_grams' => 200, 'price' => 2, 'stock' => 1]]])->assertSessionHasErrors('variants.1.weight_grams');
    }

    public function test_product_detail_exposes_variant_summary_and_cart_requires_matching_variant(): void
    {
        $product = $this->productWithVariants([200 => [45000, 0], 1000 => [180000, 12]]);
        $other = $this->productWithVariants([200 => [50000, 2]]);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->get(route('products.show', $product))->assertInertia(fn ($page) => $page
            ->component('Show')
            ->where('product.variant_stock_total', 12)
            ->where('product.variant_price_from', 180000)
            ->has('product.variants', 2)
            ->where('product.variants.0.stock', 0)
            ->where('product.variants.1.stock', 12));

        $this->actingAs($customer)->post(route('cart.store', $product), ['qty' => 1, 'product_variant_id' => $other->variants()->sole()->id])->assertStatus(422);
        $this->actingAs($customer)->post(route('cart.store', $product), ['qty' => 13, 'product_variant_id' => $product->variants()->where('weight_grams', 1000)->sole()->id])->assertRedirect();
        $this->assertDatabaseHas('cart_items', ['product_id' => $product->product_id, 'qty' => 12]);
    }

    public function test_cart_keeps_variants_and_brew_methods_distinct_and_merges_a_weight_change(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = $this->productWithVariants([200 => [45000, 5], 1000 => [180000, 5]]);
        $small = $product->variants()->where('weight_grams', 200)->sole();
        $large = $product->variants()->where('weight_grams', 1000)->sole();

        $this->actingAs($customer)->post(route('cart.store', $product), ['qty' => 2, 'product_variant_id' => $small->id, 'brew_method' => 'espresso']);
        $this->actingAs($customer)->post(route('cart.store', $product), ['qty' => 1, 'product_variant_id' => $large->id, 'brew_method' => 'espresso']);
        $this->actingAs($customer)->post(route('cart.store', $product), ['qty' => 1, 'product_variant_id' => $large->id, 'brew_method' => 'filter']);
        $this->assertSame(3, CartItem::count());

        $smallLine = CartItem::where('product_variant_id', $small->id)->sole();
        $this->actingAs($customer)->patch(route('cart.items.update', $smallLine), ['qty' => 2, 'product_variant_id' => $large->id, 'brew_method' => 'espresso'])->assertRedirect();
        $this->assertSame(2, CartItem::count());
        $this->assertDatabaseHas('cart_items', ['product_variant_id' => $large->id, 'brew_method' => 'espresso', 'qty' => 3]);
        $this->actingAs($customer)->patch(route('cart.items.update', CartItem::where('brew_method', 'filter')->sole()), ['qty' => 6, 'product_variant_id' => $large->id, 'brew_method' => 'filter'])->assertStatus(422);
    }

    public function test_checkout_aggregates_same_variant_across_brew_rows_and_snapshots_weight_and_price(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'phone' => '08123456789']);
        $product = $this->productWithVariants([200 => [45000, 10], 1000 => [180000, 5]]);
        $large = $product->variants()->where('weight_grams', 1000)->sole();
        $cart = Cart::create(['user_id' => $customer->id]);
        $espresso = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'product_variant_id' => $large->id, 'qty' => 3, 'brew_method' => 'espresso']);
        $filter = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'product_variant_id' => $large->id, 'qty' => 3, 'brew_method' => 'filter']);

        $this->checkout($customer, [$espresso, $filter])->assertSessionHasErrors('cart_item_ids');
        $filter->update(['qty' => 2]);
        $this->checkout($customer, [$espresso, $filter])->assertRedirect();
        $order = Order::sole();
        $this->assertSame(0, $large->fresh()->stock);
        $this->assertSame(10, $product->variants()->where('weight_grams', 200)->sole()->stock);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->order_id, 'product_variant_id' => $large->id, 'weight_grams' => 1000, 'unit_price' => 180000, 'brew_method' => 'espresso']);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->order_id, 'product_variant_id' => $large->id, 'weight_grams' => 1000, 'unit_price' => 180000, 'brew_method' => 'filter']);
    }

    public function test_cancellation_restores_only_the_selected_variant_and_historical_order_price_is_stable(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'phone' => '08123456789']);
        $product = $this->productWithVariants([200 => [45000, 10], 1000 => [180000, 12]]);
        $large = $product->variants()->where('weight_grams', 1000)->sole();
        $cart = Cart::create(['user_id' => $customer->id]);
        $item = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'product_variant_id' => $large->id, 'qty' => 2, 'brew_method' => 'espresso']);
        $this->checkout($customer, [$item])->assertRedirect();
        $order = Order::sole();
        $this->assertSame(10, $large->fresh()->stock);
        $large->update(['price' => 190000]);
        $this->assertSame(180000, $order->items()->sole()->unit_price);
        $this->actingAs($customer)->post(route('orders.cancel', $order))->assertRedirect();
        $this->assertSame(12, $large->fresh()->stock);
        $this->actingAs($customer)->post(route('orders.cancel', $order))->assertStatus(422);
        $this->assertSame(12, $large->fresh()->stock);
    }

    private function productWithVariants(array $variants): Product
    {
        $first = reset($variants);
        $product = Product::create(['product_name' => 'Flores '.uniqid(), 'category' => 'Arabica', 'price' => $first[0], 'stock' => $first[1]]);
        foreach ($variants as $weight => [$price, $stock]) {
            $product->variants()->create(['weight_grams' => $weight, 'price' => $price, 'stock' => $stock]);
        }

        return $product;
    }

    private function checkout(User $customer, array $items)
    {
        PaymentSetting::firstOrCreate(['bank_name' => 'BCA', 'account_number' => '111'], ['account_name' => 'Kopi Gajahmada', 'is_active' => true, 'created_by' => $customer->id]);
        $shipping = ShippingMethod::firstOrCreate(['name' => 'Reguler'], ['type' => 'regular', 'delivery_fee' => 0]);

        return $this->actingAs($customer)->post(route('orders.store'), [
            'cart_item_ids' => collect($items)->pluck('id')->all(),
            'shipping_method_id' => $shipping->id,
            'payment_method' => 'virtual_account',
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'customer_address' => 'Jl. Contoh No. 1, Medan',
        ]);
    }
}
