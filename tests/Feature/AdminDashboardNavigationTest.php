<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_operational_sections_are_separate_and_keep_the_admin_guard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page->component('Dashboard_Admin')->where('section', 'overview'));
        $this->actingAs($admin)->get(route('admin.orders.index'))
            ->assertInertia(fn ($page) => $page->component('Dashboard_Admin')->where('section', 'orders'));
        $this->actingAs($admin)->get(route('admin.products.index'))
            ->assertInertia(fn ($page) => $page->component('Dashboard_Admin')->where('section', 'products'));

        $this->actingAs($customer)->get(route('admin.orders.index'))->assertForbidden();
        $this->actingAs($customer)->get(route('admin.products.index'))->assertForbidden();
    }
}
