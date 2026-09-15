<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplaintTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_submit_complaint_only_within_one_day_of_delivery(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'email_verified_at' => now()]);
        $order = Order::factory()->create(['user_id' => $customer->id, 'status' => 'delivered', 'delivered_at' => now()->subHours(23)]);
        $item = OrderItem::create(['order_id' => $order->order_id, 'product_name' => 'Gayo', 'qty' => 2]);

        $this->actingAs($customer)->post(route('orders.complaints.store', $order), ['category' => 'product', 'order_item_id' => $item->order_item_id, 'description' => 'Kemasan rusak'])->assertRedirect();
        $this->assertDatabaseHas('complaints', ['order_id' => $order->order_id, 'customer_id' => $customer->id, 'status' => 'submitted']);

        $order->update(['delivered_at' => now()->subDay()->subSecond()]);
        $this->actingAs($customer)->post(route('orders.complaints.store', $order), ['category' => 'delivery', 'description' => 'Terlambat'])->assertStatus(422);
    }

    public function test_customer_and_admin_can_exchange_messages_and_admin_can_close_complaint(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'email_verified_at' => now()]);
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $order = Order::factory()->create(['user_id' => $customer->id]);
        $complaint = Complaint::create(['order_id' => $order->order_id, 'customer_id' => $customer->id, 'category' => 'delivery', 'description' => 'Paket basah', 'submitted_at' => now()]);

        $this->actingAs($customer)->post(route('complaints.replies.store', $complaint), ['message' => 'Mohon dibantu.'])->assertRedirect();
        $this->actingAs($admin)->post(route('complaints.replies.store', $complaint), ['message' => 'Sedang kami tinjau.'])->assertRedirect();
        $this->actingAs($admin)->patch(route('admin.complaints.update', $complaint), ['status' => 'resolved', 'admin_note' => 'Penggantian disetujui.'])->assertRedirect();

        $this->assertDatabaseCount('complaint_messages', 2);
        $this->assertDatabaseHas('complaints', ['id' => $complaint->id, 'status' => 'resolved', 'handled_by' => $admin->id]);
    }
}
