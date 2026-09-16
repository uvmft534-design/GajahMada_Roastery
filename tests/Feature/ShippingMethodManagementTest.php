<?php

namespace Tests\Feature;

use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShippingMethodManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_shipping_methods(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.shipping-methods.store'), [
            'name' => 'Pengiriman Reguler',
            'type' => 'Reguler',
            'description' => 'Estimasi dua sampai empat hari kerja.',
            'delivery_fee' => 25000,
        ])->assertRedirect();

        $method = ShippingMethod::where('name', 'Pengiriman Reguler')->firstOrFail();

        $this->actingAs($admin)->put(route('admin.shipping-methods.update', $method), [
            'name' => 'Pengiriman Same Day',
            'type' => 'Same Day',
            'description' => 'Dikirim pada hari yang sama.',
            'delivery_fee' => 40000,
        ])->assertRedirect();

        $this->assertDatabaseHas('shipping_methods', ['id' => $method->id, 'name' => 'Pengiriman Same Day', 'type' => 'Same Day', 'delivery_fee' => 40000]);

        $this->actingAs($admin)->delete(route('admin.shipping-methods.destroy', $method))->assertRedirect();

        $this->assertDatabaseMissing('shipping_methods', ['id' => $method->id]);
    }

    public function test_customer_cannot_manage_shipping_methods(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->get(route('admin.shipping-methods.index'))->assertForbidden();
    }
}
