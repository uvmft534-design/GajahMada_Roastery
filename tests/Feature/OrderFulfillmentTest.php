<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_paid_awaiting_payment_order_can_be_processed_and_packed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::factory()->create(['status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        $this->actingAs($admin)->post(route('admin.orders.process', $order))->assertStatus(422);
        $order->update(['payment_status' => 'paid']);
        $this->actingAs($admin)->post(route('admin.orders.process', $order))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'status' => 'processing']);
        $this->assertNotNull($order->fresh()->processing_at);
        $this->actingAs($admin)->post(route('admin.orders.packed', $order))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'status' => 'packed']);
        $this->assertNotNull($order->fresh()->packed_at);
    }

    public function test_customer_cancel_releases_reserved_stock_once(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::create(['product_name' => 'Gayo', 'price' => 50000, 'stock' => 8]);
        $order = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        OrderItem::create(['order_id' => $order->order_id, 'product_id' => $product->product_id, 'product_name' => 'Gayo', 'qty' => 2, 'unit_price' => 50000, 'subtotal' => 100000]);
        $this->actingAs($customer)->post(route('orders.cancel', $order))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'status' => 'cancelled']);
        $this->assertSame(10, $product->fresh()->stock);
        $this->actingAs($customer)->post(route('orders.cancel', $order))->assertStatus(422);
        $this->assertSame(10, $product->fresh()->stock);
    }
}
