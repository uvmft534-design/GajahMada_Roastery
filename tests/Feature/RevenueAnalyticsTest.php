<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\RevenueAnalyticsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevenueAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_month_kpis_exclude_non_revenue_valid_orders_and_calculate_aov(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'processing', 'total_amount' => 100000]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 200000]);
            Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment', 'total_amount' => 999999]);
            Order::factory()->create(['payment_status' => 'pending_confirmation', 'status' => 'awaiting_payment', 'total_amount' => 999999]);
            Order::factory()->create(['payment_status' => 'rejected', 'status' => 'awaiting_payment', 'total_amount' => 999999]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled', 'total_amount' => 999999]);

            $kpis = app(RevenueAnalyticsService::class)->currentMonthKpis();

            $this->assertSame([
                'revenue' => 300000,
                'valid_order_count' => 2,
                'average_order_value' => 150000,
            ], $kpis);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_current_month_kpis_return_zero_when_there_are_no_valid_orders(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            Order::factory()->create(['payment_status' => 'unpaid', 'total_amount' => 100000]);
            Order::factory()->create(['payment_status' => 'pending_confirmation', 'total_amount' => 200000]);
            Order::factory()->create(['payment_status' => 'rejected', 'total_amount' => 300000]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled', 'total_amount' => 400000]);

            $this->assertSame([
                'revenue' => 0,
                'valid_order_count' => 0,
                'average_order_value' => 0,
            ], app(RevenueAnalyticsService::class)->currentMonthKpis());
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_current_month_kpis_use_the_same_wib_calendar_period_for_revenue_and_order_count(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 90000, 'created_at' => Carbon::parse('2026-08-31 16:59:59', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-08-31 17:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 200000, 'created_at' => Carbon::parse('2026-09-30 16:59:59', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 300000, 'created_at' => Carbon::parse('2026-09-30 17:00:00', 'UTC')]);

            $this->assertSame([
                'revenue' => 300000,
                'valid_order_count' => 2,
                'average_order_value' => 150000,
            ], app(RevenueAnalyticsService::class)->currentMonthKpis());
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_admin_dashboard_uses_the_current_month_revenue_valid_kpis(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 100000]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'shipped', 'total_amount' => 200000]);
            Order::factory()->create(['payment_status' => 'unpaid', 'total_amount' => 999999]);

            $this->actingAs($admin)->get(route('admin.dashboard'))->assertInertia(fn ($page) => $page
                ->where('analytics.monthlyRevenue', 300000)
                ->where('analytics.monthlyOrderCount', 2)
                ->where('analytics.transactions', 2)
                ->where('analytics.avgTransaction', 150000));
        } finally {
            Carbon::setTestNow();
        }
    }
}
