<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_brew_method_is_required(): void
    {
        $this->checkout(['brew_method' => null])->assertSessionHasErrors('brew_method');
    }

    public function test_brew_method_must_be_espresso_or_filter(): void
    {
        $this->checkout(['brew_method' => 'cold_brew'])->assertSessionHasErrors('brew_method');
    }

    public function test_customer_note_is_saved_with_the_order(): void
    {
        $this->checkout(['customer_note' => 'Packing double'])->assertRedirect();

        $this->assertDatabaseHas('orders', ['customer_note' => 'Packing double']);
    }

    public function test_customer_note_cannot_exceed_five_hundred_characters(): void
    {
        $this->checkout(['customer_note' => str_repeat('a', 501)])->assertSessionHasErrors('customer_note');
    }

    public function test_receiver_information_is_required(): void
    {
        foreach (['customer_name', 'customer_phone', 'customer_address'] as $field) {
            $this->checkout([$field => null])->assertSessionHasErrors($field);
        }
    }

    public function test_regular_shipping_uses_the_server_calculated_fee(): void
    {
        $this->checkout(['shipping_method' => 'regular'])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'subtotal' => 100000,
            'delivery_fee' => 25000,
            'total_amount' => 125000,
        ]);
    }

    public function test_instant_shipping_uses_the_server_calculated_fee(): void
    {
        $this->checkout(['shipping_method' => 'instant'])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'subtotal' => 100000,
            'delivery_fee' => 30000,
            'total_amount' => 130000,
        ]);
    }

    public function test_client_supplied_price_and_total_are_ignored(): void
    {
        $this->checkout(['price' => 1, 'subtotal' => 1, 'total_amount' => 1])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'subtotal' => 100000,
            'delivery_fee' => 25000,
            'total_amount' => 125000,
        ]);
    }

    public function test_filter_brew_method_is_saved_on_the_order_item(): void
    {
        $this->checkout(['brew_method' => 'filter'])->assertRedirect();

        $this->assertDatabaseHas('order_items', ['brew_method' => 'filter']);
    }

    public function test_espresso_brew_method_is_saved_on_the_order_item(): void
    {
        $this->checkout(['brew_method' => 'espresso'])->assertRedirect();

        $this->assertDatabaseHas('order_items', ['brew_method' => 'espresso']);
    }

    private function checkout(array $overrides = [])
    {
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::create([
            'product_name' => 'Gayo',
            'category' => 'Arabica',
            'price' => 50000,
            'stock' => 10,
        ]);

        return $this->actingAs($user)->post(route('orders.store'), array_merge([
            'product_id' => $product->product_id,
            'qty' => 2,
            'brew_method' => 'filter',
            'shipping_method' => 'regular',
            'payment_method' => 'virtual_account',
            'customer_name' => 'Andi',
            'customer_phone' => '08123456789',
            'customer_address' => 'Jl. Contoh No. 1',
            'customer_note' => null,
        ], $overrides));
    }
}
