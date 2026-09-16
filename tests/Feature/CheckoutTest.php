<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_requires_at_least_one_selected_cart_item(): void
    {
        $this->checkout(['cart_item_ids' => []])->assertSessionHasErrors('cart_item_ids');
    }

    public function test_checkout_rejects_cart_items_owned_by_another_customer(): void
    {
        $other = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();
        $cart = Cart::create(['user_id' => $other->id]);
        $item = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->product_id, 'qty' => 1, 'brew_method' => 'filter']);

        $this->checkout(['cart_item_ids' => [$item->id]])->assertSessionHasErrors('cart_item_ids');
    }

    public function test_customer_note_is_saved_with_the_order(): void
    {
        $this->checkout(['customer_note' => 'Packing double'])->assertRedirect();

        $this->assertDatabaseHas('orders', ['customer_note' => 'Packing double']);
    }

    public function test_checkout_succeeds_without_order_or_product_notes(): void
    {
        $this->checkout()->assertRedirect();

        $this->assertDatabaseHas('orders', ['customer_note' => null]);
        $this->assertDatabaseHas('order_items', ['item_note' => null]);
    }

    public function test_checkout_saves_a_product_note_on_its_order_item(): void
    {
        $this->checkout(['item_notes' => [1 => 'Giling sedikit lebih halus']])->assertRedirect();

        $this->assertDatabaseHas('order_items', ['item_note' => 'Giling sedikit lebih halus']);
    }

    public function test_checkout_saves_destination_coordinates_when_provided(): void
    {
        $this->checkout([
            'destination_latitude' => -6.1753924,
            'destination_longitude' => 106.8271528,
        ])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'destination_latitude' => -6.1753924,
            'destination_longitude' => 106.8271528,
        ]);
    }

    public function test_current_location_checkout_keeps_coordinates_when_delivery_details_are_added(): void
    {
        $this->checkout([
            'customer_address' => 'Kecamatan Medan Kota, Kota Medan, Sumatera Utara',
            'street_name' => 'Kisamaun',
            'house_number' => '4',
            'address_detail' => 'GG. SMEA, rumah pagar putih',
            'final_address_preview' => 'Jl. Kisamaun, No. 4, GG. SMEA, rumah pagar putih, Kecamatan Medan Kota, Kota Medan, Sumatera Utara',
            'destination_latitude' => 3.589665,
            'destination_longitude' => 98.673826,
        ])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'customer_address' => 'Jl. Kisamaun, No. 4, GG. SMEA, rumah pagar putih, Kecamatan Medan Kota, Kota Medan, Sumatera Utara',
            'destination_latitude' => 3.589665,
            'destination_longitude' => 98.673826,
        ]);
    }

    public function test_manual_address_checkout_leaves_destination_coordinates_null(): void
    {
        $this->checkout()->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'destination_latitude' => null,
            'destination_longitude' => null,
        ]);
    }

    public function test_switching_to_a_manual_destination_stores_no_current_location_coordinates(): void
    {
        $this->checkout([
            'customer_address' => 'Jl. Tujuan Manual No. 10, Medan',
            'destination_latitude' => null,
            'destination_longitude' => null,
        ])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'customer_address' => 'Jl. Tujuan Manual No. 10, Medan',
            'destination_latitude' => null,
            'destination_longitude' => null,
        ]);
    }

    public function test_checkout_keeps_profile_address_unchanged_and_saves_an_order_address_snapshot(): void
    {
        $this->checkout([
            'profile_address' => 'Jl. Profil No. 1, Medan',
            'customer_address' => 'Jl. Tujuan Pesanan No. 8, Medan',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['address' => 'Jl. Profil No. 1, Medan']);
        $this->assertDatabaseHas('orders', ['customer_address' => 'Jl. Tujuan Pesanan No. 8, Medan']);
    }

    public function test_customer_note_cannot_exceed_five_hundred_characters(): void
    {
        $this->checkout(['customer_note' => str_repeat('a', 501)])->assertSessionHasErrors('customer_note');
    }

    public function test_receiver_information_is_required(): void
    {
        foreach (['customer_address'] as $field) {
            $this->checkout([$field => null])->assertSessionHasErrors($field);
        }
    }

    public function test_checkout_requires_street_and_house_number_when_address_has_no_delivery_details(): void
    {
        $this->checkout(['customer_address' => 'Kelurahan Petojo Utara, Jakarta'])
            ->assertSessionHasErrors(['street_name', 'house_number']);
    }

    public function test_checkout_combines_manual_street_and_house_number_with_an_incomplete_address(): void
    {
        $this->checkout([
            'customer_address' => 'Kelurahan Petojo Utara, Jakarta',
            'street_name' => 'Gajah Mada',
            'house_number' => '12A',
        ])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'customer_address' => 'Jl. Gajah Mada, No. 12A, Kelurahan Petojo Utara, Jakarta',
        ]);
    }

    public function test_customer_without_a_profile_phone_is_redirected_to_profile_before_checkout(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'phone' => null]);

        $this->actingAs($customer)->post(route('orders.store'), [])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHas('checkout_phone_required');
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
        $method = $this->shippingMethod('Pengiriman Reguler', 'Reguler', 25000);
        $this->checkout(['shipping_method_id' => $method->id])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'subtotal' => 100000,
            'delivery_fee' => 25000,
            'total_amount' => 125000,
        ]);
    }

    public function test_instant_shipping_uses_the_server_calculated_fee(): void
    {
        $method = $this->shippingMethod('Pengiriman Instant', 'Instant', 30000);
        $this->checkout(['shipping_method_id' => $method->id])->assertRedirect();

        $this->assertDatabaseHas('orders', [
            'subtotal' => 100000,
            'shipping_method' => 'Pengiriman Instant',
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

    public function test_selected_cart_items_create_one_order_with_multiple_order_items_and_leave_unselected_items_in_cart(): void
    {
        $user = User::factory()->create(['name' => 'Andi', 'role' => 'customer', 'phone' => '08123456789']);
        PaymentSetting::create(['bank_name' => 'BCA', 'account_name' => 'Kopi Gajahmada', 'account_number' => '111111', 'is_active' => true, 'created_by' => $user->id]);
        $shippingMethod = $this->shippingMethod('Pengiriman Reguler', 'Reguler', 25000);
        $first = Product::factory()->create(['price' => 100000, 'stock' => 10]);
        $second = Product::factory()->create(['price' => 200000, 'stock' => 10]);
        $third = Product::factory()->create(['price' => 50000, 'stock' => 10]);
        $cart = Cart::create(['user_id' => $user->id]);
        $firstItem = CartItem::create(['cart_id' => $cart->id, 'product_id' => $first->product_id, 'qty' => 1, 'brew_method' => 'filter']);
        $secondItem = CartItem::create(['cart_id' => $cart->id, 'product_id' => $second->product_id, 'qty' => 1, 'brew_method' => 'espresso']);
        $unselectedItem = CartItem::create(['cart_id' => $cart->id, 'product_id' => $third->product_id, 'qty' => 1, 'brew_method' => 'filter']);

        $this->actingAs($user)->post(route('orders.store'), [
            'cart_item_ids' => [$firstItem->id, $secondItem->id],
            'shipping_method_id' => $shippingMethod->id, 'payment_method' => 'virtual_account',
            'customer_name' => 'Andi', 'customer_phone' => '08123456789', 'customer_address' => 'Jl. Contoh No. 1',
            'item_notes' => [$firstItem->id => 'A', $secondItem->id => 'B'],
        ])->assertRedirect();

        $order = Order::sole();
        $this->assertSame(2, $order->items()->count());
        $this->assertSame(300000, $order->subtotal);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->order_id, 'product_id' => $first->product_id, 'item_note' => 'A']);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->order_id, 'product_id' => $second->product_id, 'item_note' => 'B']);
        $this->assertDatabaseMissing('order_items', ['order_id' => $order->order_id, 'product_id' => $first->product_id, 'item_note' => 'B']);
        $this->assertDatabaseMissing('cart_items', ['id' => $firstItem->id]);
        $this->assertDatabaseMissing('cart_items', ['id' => $secondItem->id]);
        $this->assertDatabaseHas('cart_items', ['id' => $unselectedItem->id]);
        $this->assertDatabaseHas('products', ['product_id' => $first->product_id, 'stock' => 9]);
        $this->assertDatabaseHas('products', ['product_id' => $second->product_id, 'stock' => 9]);
    }

    private function checkout(array $overrides = [])
    {
        $profileAddress = $overrides['profile_address'] ?? null;
        unset($overrides['profile_address']);

        $user = User::factory()->create(['name' => 'Andi', 'role' => 'customer', 'phone' => '08123456789', 'address' => $profileAddress]);
        PaymentSetting::create(['bank_name' => 'BCA', 'account_name' => 'Kopi Gajahmada', 'account_number' => '111111', 'is_active' => true, 'created_by' => $user->id]);
        $shippingMethod = $this->shippingMethod('Pengiriman Reguler', 'Reguler', 25000);
        $product = Product::create([
            'product_name' => 'Gayo',
            'category' => 'Arabica',
            'price' => 50000,
            'stock' => 10,
        ]);

        $cart = Cart::create(['user_id' => $user->id]);
        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->product_id,
            'qty' => 2,
            'brew_method' => $overrides['brew_method'] ?? 'filter',
        ]);

        unset($overrides['brew_method']);

        return $this->actingAs($user)->post(route('orders.store'), array_merge([
            'cart_item_ids' => [$cartItem->id],
            'shipping_method_id' => $shippingMethod->id,
            'payment_method' => 'virtual_account',
            'customer_name' => 'Andi',
            'customer_phone' => '08123456789',
            'customer_address' => 'Jl. Contoh No. 1',
            'customer_note' => null,
        ], $overrides));
    }

    private function shippingMethod(string $name, string $type, int $deliveryFee): ShippingMethod
    {
        return ShippingMethod::firstOrCreate(
            ['name' => $name],
            ['type' => $type, 'description' => null, 'delivery_fee' => $deliveryFee],
        );
    }
}
