<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourierFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_request_pickup_only_for_paid_packed_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $courier = User::factory()->create(['role' => 'courier']);
        $order = Order::factory()->create(['status' => 'packed', 'payment_status' => 'paid']);

        $this->actingAs($admin)->post(route('admin.orders.request-pickup', $order), ['courier_id' => $courier->id])->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'courier_id' => $courier->id, 'status' => 'pickup_requested']);
        $this->assertNotNull($order->fresh()->pickup_requested_at);
    }

    public function test_admin_cannot_assign_non_courier_or_request_from_invalid_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $courier = User::factory()->create(['role' => 'courier']);
        $packed = Order::factory()->create(['status' => 'packed', 'payment_status' => 'paid']);
        $processing = Order::factory()->create(['status' => 'processing', 'payment_status' => 'paid']);

        $this->actingAs($admin)->post(route('admin.orders.request-pickup', $packed), ['courier_id' => $customer->id])->assertStatus(422);
        $this->actingAs($admin)->post(route('admin.orders.request-pickup', $processing), ['courier_id' => $courier->id])->assertStatus(422);
    }

    public function test_courier_only_sees_and_operates_assigned_orders(): void
    {
        $courierA = User::factory()->create(['role' => 'courier']);
        $courierB = User::factory()->create(['role' => 'courier']);
        $assigned = Order::factory()->create(['courier_id' => $courierA->id, 'status' => 'pickup_requested']);
        $other = Order::factory()->create(['courier_id' => $courierB->id, 'status' => 'pickup_requested']);

        $this->actingAs($courierA)->get(route('courier.dashboard'))->assertOk()->assertSee($assigned->order_number)->assertDontSee($other->order_number);
        $this->actingAs($courierB)->post(route('courier.orders.confirm-pickup', $assigned))->assertForbidden();
        $this->actingAs($courierA)->post(route('courier.orders.confirm-pickup', $assigned))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $assigned->order_id, 'status' => 'picked_up']);
        $this->assertNotNull($assigned->fresh()->picked_up_at);
    }

    public function test_courier_tracking_and_delivery_transitions_are_enforced(): void
    {
        $courier = User::factory()->create(['role' => 'courier']);
        $order = Order::factory()->create(['courier_id' => $courier->id, 'status' => 'picked_up']);

        $this->actingAs($courier)->post(route('courier.orders.start-shipping', $order))->assertStatus(422);
        $this->actingAs($courier)->post(route('courier.orders.generate-tracking', $order))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id]);
        $this->assertNotNull($order->fresh()->tracking_number);
        $this->actingAs($courier)->post(route('courier.orders.start-shipping', $order))->assertRedirect();
        $this->actingAs($courier)->post(route('courier.orders.delivered', $order))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'status' => 'delivered']);
        $this->assertNotNull($order->fresh()->shipped_at);
        $this->assertNotNull($order->fresh()->delivered_at);
    }

    public function test_invalid_courier_jumps_are_rejected(): void
    {
        $courier = User::factory()->create(['role' => 'courier']);
        $packed = Order::factory()->create(['courier_id' => $courier->id, 'status' => 'packed', 'payment_status' => 'paid']);
        $pickupRequested = Order::factory()->create(['courier_id' => $courier->id, 'status' => 'pickup_requested']);

        $this->actingAs($courier)->post(route('courier.orders.start-shipping', $packed))->assertStatus(422);
        $this->actingAs($courier)->post(route('courier.orders.delivered', $pickupRequested))->assertStatus(422);
    }

    public function test_manual_tracking_must_be_unique(): void
    {
        $courier = User::factory()->create(['role' => 'courier']);
        Order::factory()->create(['tracking_number' => 'TRK-MANUAL-1']);
        $order = Order::factory()->create(['courier_id' => $courier->id, 'status' => 'picked_up']);

        $this->actingAs($courier)->post(route('courier.orders.save-tracking', $order), ['tracking_number' => 'TRK-MANUAL-1'])->assertSessionHasErrors('tracking_number');
        $this->actingAs($courier)->post(route('courier.orders.save-tracking', $order), ['tracking_number' => 'TRK-MANUAL-2'])->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'tracking_number' => 'TRK-MANUAL-2']);
    }

    public function test_only_owner_can_complete_delivered_order_and_courier_cannot_access_payment_proof(): void
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $other = User::factory()->create(['role' => 'customer']);
        $courier = User::factory()->create(['role' => 'courier']);
        $delivered = Order::factory()->create(['user_id' => $owner->id, 'courier_id' => $courier->id, 'status' => 'delivered']);
        $shipped = Order::factory()->create(['user_id' => $owner->id, 'status' => 'shipped']);

        $this->actingAs($other)->post(route('orders.complete', $delivered))->assertForbidden();
        $this->actingAs($owner)->post(route('orders.complete', $shipped))->assertStatus(422);
        $this->actingAs($owner)->post(route('orders.complete', $delivered))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $delivered->order_id, 'status' => 'completed']);
        $this->assertNotNull($delivered->fresh()->completed_at);
        $this->actingAs($courier)->get(route('orders.proof.view', $delivered))->assertForbidden();
    }
}
