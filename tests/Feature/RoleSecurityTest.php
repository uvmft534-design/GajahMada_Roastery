<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\GoogleAccountLinker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class RoleSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_always_creates_customer(): void
    {
        $this->post('/register', [
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'super_admin',
        ]);

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com', 'role' => 'customer']);
    }

    public function test_non_super_admin_roles_cannot_access_super_admin_routes_or_change_roles(): void
    {
        $target = User::factory()->create(['role' => 'customer']);

        foreach (['customer', 'admin', 'courier'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user)->get(route('super-admin.dashboard'))->assertForbidden();
            $this->actingAs($user)
                ->patch(route('super-admin.users.role.update', $target), ['role' => 'admin'])
                ->assertForbidden();
        }

        $this->assertDatabaseHas('users', ['id' => $target->id, 'role' => 'customer']);
    }

    public function test_super_admin_can_change_customer_to_admin_and_creates_audit_log(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($superAdmin)
            ->patch(route('super-admin.users.role.update', $customer), ['role' => 'admin'])
            ->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $customer->id, 'role' => 'admin']);
        $this->assertDatabaseHas('role_change_logs', [
            'target_user_id' => $customer->id,
            'changed_by' => $superAdmin->id,
            'old_role' => 'customer',
            'new_role' => 'admin',
        ]);
    }

    public function test_super_admin_can_change_customer_to_courier(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($superAdmin)
            ->patch(route('super-admin.users.role.update', $customer), ['role' => 'courier'])
            ->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $customer->id, 'role' => 'courier']);
    }

    public function test_role_management_cannot_create_or_demote_a_super_admin(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($superAdmin)
            ->patch(route('super-admin.users.role.update', $customer), ['role' => 'super_admin'])
            ->assertSessionHasErrors('role');
        $this->actingAs($superAdmin)
            ->patch(route('super-admin.users.role.update', $superAdmin), ['role' => 'customer'])
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $superAdmin->id, 'role' => 'super_admin']);
    }

    public function test_google_linking_normalizes_email_and_preserves_existing_role_and_password(): void
    {
        $linker = app(GoogleAccountLinker::class);
        $newUser = $linker->link(' New@Example.COM ', 'google-new', 'New User');
        $admin = User::factory()->create(['email' => 'admin@example.com', 'role' => 'admin']);
        $superAdmin = User::factory()->create(['email' => 'super@example.com', 'role' => 'super_admin']);
        $adminPassword = $admin->password;
        $superAdminPassword = $superAdmin->password;

        $linker->link(' ADMIN@EXAMPLE.COM ', 'google-admin', 'Different Name');
        $linker->link($superAdmin->email, 'google-super', 'Different Name');

        $this->assertSame('customer', $newUser->role);
        $this->assertSame('new@example.com', $newUser->email);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin', 'password' => $adminPassword, 'google_id' => 'google-admin']);
        $this->assertDatabaseHas('users', ['id' => $superAdmin->id, 'role' => 'super_admin', 'password' => $superAdminPassword, 'google_id' => 'google-super']);
    }

    public function test_google_id_conflict_is_rejected_before_linking_another_user(): void
    {
        $linker = app(GoogleAccountLinker::class);
        User::factory()->create(['email' => 'linked@example.com', 'google_id' => 'google-id']);
        User::factory()->create(['email' => 'other@example.com']);

        $this->expectException(RuntimeException::class);

        $linker->link('other@example.com', 'google-id', 'Other User');
    }

    public function test_customer_can_open_own_order(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $customer->id]);

        $this->actingAs($customer)->get(route('orders.show', $order))->assertOk();
    }

    public function test_customer_cannot_access_another_users_order_endpoints(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create(['role' => 'customer']);
        $other = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->get(route('orders.show', $order))->assertForbidden();
        $this->actingAs($other)->get(route('orders.tracking', $order))->assertForbidden();
        $this->actingAs($other)->get(route('orders.payment', $order))->assertForbidden();
        $this->actingAs($other)->post(route('orders.proof', $order), ['proof' => UploadedFile::fake()->image('proof.jpg')])->assertForbidden();
        $this->actingAs($other)->post(route('orders.complete', $order))->assertForbidden();
    }
}
