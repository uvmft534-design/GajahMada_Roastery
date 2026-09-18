<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_adding_a_product_redirects_customer_to_their_persistent_cart(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($customer)->post(route('cart.store', $product->product_id), ['qty' => 2, 'product_variant_id' => $product->variants()->sole()->id])
            ->assertRedirect(route('cart.index'));

        $this->assertDatabaseHas('cart_items', ['product_id' => $product->product_id, 'qty' => 2, 'brew_method' => 'filter']);
    }

    public function test_adding_the_same_product_and_brew_method_combines_the_quantity(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10]);

        $variantId = $product->variants()->sole()->id;
        $this->actingAs($customer)->post(route('cart.store', $product->product_id), ['qty' => 1, 'product_variant_id' => $variantId]);
        $this->actingAs($customer)->post(route('cart.store', $product->product_id), ['qty' => 2, 'product_variant_id' => $variantId]);

        $this->assertSame(1, CartItem::count());
        $this->assertDatabaseHas('cart_items', ['product_id' => $product->product_id, 'qty' => 3]);
    }

    public function test_landing_page_shares_the_number_of_distinct_cart_products(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();
        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'qty' => 3, 'brew_method' => 'filter']);

        $this->actingAs($customer)->get(route('home'))
            ->assertInertia(fn ($page) => $page->where('cartItemCount', 1));
    }

    public function test_cart_badge_counts_the_total_quantity_of_multiple_products(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $firstProduct = Product::factory()->create();
        $secondProduct = Product::factory()->create();
        $cart = Cart::create(['user_id' => $customer->id]);

        CartItem::create(['cart_id' => $cart->id, 'product_id' => $firstProduct->product_id, 'qty' => 1, 'brew_method' => 'filter']);
        CartItem::create(['cart_id' => $cart->id, 'product_id' => $secondProduct->product_id, 'qty' => 1, 'brew_method' => 'filter']);

        $this->actingAs($customer)->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page->where('cartItemCount', 2));
    }

    public function test_cart_page_includes_the_product_category_from_the_database(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['category' => 'House Blend']);
        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'qty' => 1, 'brew_method' => 'espresso']);

        $this->actingAs($customer)->get(route('cart.index'))
            ->assertInertia(fn ($page) => $page
                ->component('Cart/Index')
                ->where('items.0.product.category', 'House Blend')
                ->where('items.0.brew_method', 'espresso'));
    }

    public function test_customer_can_only_open_checkout_with_their_own_selected_cart_items(): void
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $other = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['category' => 'Single Origin']);
        $cart = Cart::create(['user_id' => $owner->id]);
        $item = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'qty' => 1, 'brew_method' => 'filter']);

        $this->actingAs($owner)->get(route('checkout', ['items' => [$item->id]]))
            ->assertInertia(fn ($page) => $page
                ->component('Checkout')
                ->where('items.0.id', $item->id)
                ->where('items.0.product.category', 'Single Origin'));
        $this->actingAs($other)->get(route('checkout', ['items' => [$item->id]]))->assertForbidden();
    }

    public function test_customer_cannot_update_or_delete_another_customers_cart_item(): void
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $other = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10]);
        $cart = Cart::create(['user_id' => $owner->id]);
        $item = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'qty' => 1, 'brew_method' => 'filter']);

        $this->actingAs($other)->patch(route('cart.items.update', $item->id), ['qty' => 2, 'brew_method' => 'filter', 'product_variant_id' => $product->variants()->sole()->id])->assertNotFound();
        $this->actingAs($other)->delete(route('cart.items.destroy', $item->id))->assertNotFound();
    }
}
