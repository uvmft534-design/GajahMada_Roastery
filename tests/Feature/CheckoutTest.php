<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_checkout_succeeds_when_all_receiver_information_is_provided(): void
    {
        $this->checkout([
            'customer_name' => 'Andi',
            'customer_phone' => '08123456789',
            'customer_address' => 'Jl. Contoh No. 1',
        ])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'customer_name' => 'Andi',
            'customer_phone' => '08123456789',
            'customer_address' => 'Jl. Contoh No. 1',
        ]);
    }

    public function test_successful_checkout_creates_one_order_and_redirects_to_its_payment_page(): void
    {
        $response = $this->checkout();
        $order = Order::sole();

        $response->assertRedirect(route('orders.payment', $order->order_id));
        $response->assertSessionHas('success', 'Pesanan berhasil dibuat.');
        $this->assertSame('awaiting_payment', $order->status);
        $this->assertSame('unpaid', $order->payment_status);
        $this->assertSame(1, Order::count());
    }

    public function test_payment_page_receives_the_checkout_success_flash_message(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);

        $this->withSession(['success' => 'Pesanan berhasil dibuat.'])
            ->actingAs($customer)->get(route('orders.payment', $order->order_id))
            ->assertInertia(fn ($page) => $page
                ->component('Payment')
                ->where('order.order_id', $order->order_id)
                ->where('flash.success', 'Pesanan berhasil dibuat.'));
    }

    public function test_order_history_remains_an_order_overview_with_the_newest_order_first(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $older = Order::factory()->create(['user_id' => $customer->id, 'created_at' => now()->subMinute()]);
        $newest = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);

        $this->actingAs($customer)->get(route('orders.history'))
            ->assertInertia(fn ($page) => $page
                ->component('OrderHistory')
                ->where('orders.0.order_id', $newest->order_id)
                ->where('orders.1.order_id', $older->order_id));

    }

    public function test_customer_owner_can_open_the_payment_page_for_unpaid_and_rejected_orders_without_a_redirect(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $unpaid = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        $rejected = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => 'rejected']);

        foreach ([$unpaid, $rejected] as $order) {
            $this->actingAs($customer)->get(route('orders.payment', $order->order_id))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Payment')
                    ->where('order.order_id', $order->order_id));
        }
    }

    public function test_uploading_an_unpaid_or_rejected_payment_proof_redirects_to_submission_confirmation_with_pending_confirmation(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create(['role' => 'customer']);

        foreach (['unpaid', 'rejected'] as $paymentStatus) {
            $order = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => $paymentStatus]);

            $this->actingAs($customer)
                ->post(route('orders.proof', $order->order_id), ['proof' => UploadedFile::fake()->image('proof.jpg')])
                ->assertRedirect(route('orders.payment.submitted', $order->order_id))
                ->assertSessionHas('success', 'Bukti pembayaran berhasil dikirim.');

            $this->assertDatabaseHas('orders', [
                'order_id' => $order->order_id,
                'status' => 'awaiting_payment',
                'payment_status' => 'pending_confirmation',
            ]);
        }
    }

    public function test_customer_owner_can_open_their_payment_submission_confirmation_page(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $customer->id, 'status' => 'awaiting_payment', 'payment_status' => 'pending_confirmation']);

        $this->actingAs($customer)->get(route('orders.payment.submitted', $order->order_id))
            ->assertInertia(fn ($page) => $page
                ->component('PaymentSubmitted')
                ->where('order.order_id', $order->order_id)
                ->where('order.status', 'awaiting_payment')
                ->where('order.payment_status', 'pending_confirmation'));
    }

    public function test_customer_cannot_open_another_customers_payment_submission_confirmation_page(): void
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $other = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $owner->id, 'payment_status' => 'pending_confirmation']);

        $this->actingAs($other)->get(route('orders.payment.submitted', $order->order_id))->assertForbidden();
    }

    public function test_payment_submission_confirmation_routes_to_history_detail_and_storefront(): void
    {
        $order = Order::factory()->create(['payment_status' => 'pending_confirmation']);

        $this->assertStringEndsWith('/orders/'.$order->order_id.'/payment-submitted', route('orders.payment.submitted', $order->order_id));
        $this->assertStringEndsWith('/orders/'.$order->order_id, route('orders.show', $order->order_id));
        $this->assertNotEmpty(route('orders.history'));
        $this->assertNotEmpty(route('home'));
    }

    public function test_paid_order_cannot_upload_another_payment_proof(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $customer->id, 'payment_status' => 'paid']);

        $this->actingAs($customer)
            ->post(route('orders.proof', $order->order_id), ['proof' => UploadedFile::fake()->image('proof.jpg')])
            ->assertStatus(422);
    }

    public function test_new_checkout_does_not_create_tracking_number_before_courier_pickup(): void
    {
        $this->checkout()->assertRedirect();

        $this->assertDatabaseHas('orders', ['tracking_number' => null]);
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
        PaymentSetting::create(['bank_name' => 'BCA', 'account_name' => 'Kopi Gajahmada', 'account_number' => '111111', 'is_active' => true, 'created_by' => $user->id]);
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
