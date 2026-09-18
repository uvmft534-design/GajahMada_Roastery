<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrderDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_every_order_item_using_its_historical_snapshot(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer', 'name' => 'Rani']);
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'customer_name' => 'Rani',
            'customer_phone' => '081234567890',
            'customer_address' => 'Jl. Gajah Mada No. 8, Medan',
            'shipping_method' => 'Instant',
            'tracking_number' => 'ROAST-TRACK-01',
            'payment_status' => 'paid',
            'customer_note' => 'Hubungi sebelum pengiriman',
            'delivery_note' => 'Titipkan kepada satpam bila tidak ada orang',
            'total_amount' => 190000,
        ]);
        $firstProduct = Product::factory()->create(['price' => 999999, 'image' => 'products/flores.jpg']);
        $secondProduct = Product::factory()->create(['price' => 888888]);

        $firstItem = OrderItem::create([
            'order_id' => $order->order_id,
            'product_id' => $firstProduct->product_id,
            'product_name' => 'Flores Arabica',
            'product_category' => 'Single Origin',
            'qty' => 2,
            'unit_price' => 65000,
            'subtotal' => 130000,
            'brew_method' => 'espresso',
            'item_note' => 'Giling sedikit lebih halus',
        ]);
        $secondItem = OrderItem::create([
            'order_id' => $order->order_id,
            'product_id' => $secondProduct->product_id,
            'product_name' => 'Toraja Arabica',
            'product_category' => 'House Blend',
            'qty' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'brew_method' => 'filter',
            'item_note' => null,
        ]);

        $this->actingAs($admin)->get(route('admin.orders.show', $order))
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Show')
                ->where('order.order_id', $order->order_id)
                ->where('order.customer_note', 'Hubungi sebelum pengiriman')
                ->where('order.delivery_note', 'Titipkan kepada satpam bila tidak ada orang')
                ->has('order.items', 2)
                ->where('order.items.0.order_item_id', $firstItem->order_item_id)
                ->where('order.items.0.product_name', 'Flores Arabica')
                ->where('order.items.0.product.image', 'products/flores.jpg')
                ->where('order.items.0.product_category', 'Single Origin')
                ->where('order.items.0.qty', 2)
                ->where('order.items.0.unit_price', 65000)
                ->where('order.items.0.subtotal', 130000)
                ->where('order.items.0.brew_method', 'espresso')
                ->where('order.items.0.item_note', 'Giling sedikit lebih halus')
                ->missing('order.items.0.customer_note')
                ->where('order.items.1.order_item_id', $secondItem->order_item_id)
                ->where('order.items.1.product_name', 'Toraja Arabica')
                ->where('order.items.1.unit_price', 60000)
                ->where('order.items.1.subtotal', 60000)
                ->where('order.items.1.brew_method', 'filter')
                ->where('order.items.1.item_note', null));
    }

    public function test_customer_cannot_access_admin_order_detail(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $customer->id]);

        $this->actingAs($customer)->get(route('admin.orders.show', $order))->assertForbidden();
    }
}
