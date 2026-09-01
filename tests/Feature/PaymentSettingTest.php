<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\PaymentSettingChangeRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_super_admin_can_create_initial_payment_setting(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        foreach (['admin', 'customer', 'courier'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->post(route('super-admin.payment-settings.store'), $this->setting())->assertForbidden();
        }
        $this->actingAs($super)->post(route('super-admin.payment-settings.store'), $this->setting())->assertRedirect();
        $this->assertDatabaseHas('payment_settings', ['account_number' => '111111', 'is_active' => true]);
    }

    public function test_admin_request_does_not_change_active_setting_and_only_one_can_be_pending(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $active = $this->activeSetting();
        $payload = ['proposed_bank_name' => 'BCA', 'proposed_account_name' => 'Kopi Baru', 'proposed_account_number' => '222222', 'reason' => 'Perubahan operasional'];
        $this->actingAs($admin)->post(route('admin.payment-settings.requests.store'), $payload)->assertRedirect();
        $this->assertDatabaseHas('payment_settings', ['id' => $active->id, 'is_active' => true]);
        $this->actingAs($admin)->post(route('admin.payment-settings.requests.store'), $payload)->assertSessionHasErrors('payment_setting');
    }

    public function test_super_admin_approval_versions_the_active_setting(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        $admin = User::factory()->create(['role' => 'admin']);
        $old = $this->activeSetting();
        $request = PaymentSettingChangeRequest::create(['requested_by' => $admin->id, 'current_payment_setting_id' => $old->id, 'proposed_bank_name' => 'BCA', 'proposed_account_name' => 'Kopi Baru', 'proposed_account_number' => '222222', 'reason' => 'Operasional', 'status' => 'pending']);
        $this->actingAs($super)->post(route('super-admin.payment-settings.requests.review', $request), ['action' => 'approve'])->assertRedirect();
        $this->assertDatabaseHas('payment_settings', ['id' => $old->id, 'is_active' => false]);
        $this->assertDatabaseHas('payment_settings', ['account_number' => '222222', 'is_active' => true]);
        $this->assertDatabaseHas('payment_setting_change_requests', ['id' => $request->id, 'status' => 'approved', 'reviewed_by' => $super->id]);
    }

    public function test_payment_proof_and_review_transitions_are_enforced(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::factory()->create(['user_id' => $customer->id, 'payment_status' => 'pending_confirmation', 'status' => 'pending']);
        $this->actingAs($admin)->post(route('admin.orders.approvePayment', $order))->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'payment_status' => 'paid', 'payment_reviewed_by' => $admin->id, 'status' => 'pending']);
        $this->actingAs($admin)->post(route('admin.orders.rejectPayment', $order), ['review_note' => 'Tidak valid'])->assertStatus(422);
    }

    private function activeSetting(): PaymentSetting
    {
        $super = User::factory()->create(['role' => 'super_admin']);

        return PaymentSetting::create($this->setting() + ['is_active' => true, 'created_by' => $super->id]);
    }

    private function setting(): array
    {
        return ['bank_name' => 'BCA', 'account_name' => 'Kopi Gajahmada', 'account_number' => '111111'];
    }
}
