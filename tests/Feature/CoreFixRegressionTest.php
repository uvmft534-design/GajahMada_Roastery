<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\RevenueAnalyticsService;
use Carbon\Carbon;
use Database\Seeders\ProductCategorySeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CoreFixRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_unverified_customer_and_sends_verification(): void
    {
        Notification::fake();
        $this->post('/register', ['name' => 'Budi', 'email' => 'budi@example.com', 'password' => 'password', 'password_confirmation' => 'password']);
        $user = User::where('email', 'budi@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        $this->assertSame('customer', $user->role);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_unverified_user_cannot_access_verified_dashboard_and_resend_is_only_for_unverified(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('verification.notice'));
        $this->actingAs($user)->post(route('verification.send'))->assertSessionHas('status', 'verification-link-sent');
        Notification::assertSentTo($user, VerifyEmail::class);
        Notification::fake();
        $verified = User::factory()->create();
        $this->actingAs($verified)->post(route('verification.send'))->assertRedirect(route('dashboard'));
        Notification::assertNothingSent();
    }

    public function test_category_seeder_is_idempotent_and_product_rules_are_enforced(): void
    {
        $this->seed(ProductCategorySeeder::class);
        $this->seed(ProductCategorySeeder::class);
        $this->assertSame(['Kategori A', 'Kategori B', 'Kategori C', 'Kategori D'], ProductCategory::orderBy('name')->pluck('name')->all());
        $admin = User::factory()->create(['role' => 'admin']);
        $payload = ['product_name' => 'Arabika', 'category' => 'Kategori A', 'variants' => [['weight_grams' => 200, 'price' => 125000, 'stock' => 3]]];
        $this->actingAs($admin)->post(route('admin.products.store'), $payload)->assertRedirect();
        $product = Product::where('product_name', 'Arabika')->firstOrFail();
        $this->assertSame(125000, $product->variants()->sole()->price);
        $this->assertSame(200, $product->variants()->sole()->weight_grams);
        foreach ([['variants' => [['weight_grams' => 200, 'price' => 0, 'stock' => 3]]], ['variants' => [['weight_grams' => 200, 'price' => -1, 'stock' => 3]]], ['variants' => [['weight_grams' => 200, 'price' => 'Rp 125.000', 'stock' => 3]]], ['variants' => [['weight_grams' => 0, 'price' => 1, 'stock' => 3]]], ['variants' => [['weight_grams' => 200, 'price' => 1, 'stock' => -1]]], ['category' => 'Tidak Ada']] as $invalid) {
            $this->actingAs($admin)->post(route('admin.products.store'), array_merge($payload, $invalid))->assertSessionHasErrors();
        }
    }

    public function test_delivery_note_is_separate_and_only_admin_can_set_it_on_valid_pickup(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $courier = User::factory()->create(['role' => 'courier']);
        $order = Order::factory()->create(['status' => 'packed', 'payment_status' => 'paid', 'customer_note' => 'Tanpa gula']);
        $this->actingAs($admin)->post(route('admin.orders.request-pickup', $order), ['courier_id' => $courier->id, 'delivery_note' => 'Pintu samping'])->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_id' => $order->order_id, 'customer_note' => 'Tanpa gula', 'delivery_note' => 'Pintu samping']);
        $this->actingAs(User::factory()->create(['role' => 'customer']))->post(route('admin.orders.request-pickup', $order), ['courier_id' => $courier->id, 'delivery_note' => 'x'])->assertForbidden();
    }

    public function test_revenue_valid_scope_includes_paid_fulfillment_orders_only(): void
    {
        $validOrders = collect(['processing', 'packed', 'pickup_requested', 'picked_up', 'shipped', 'delivered', 'completed'])
            ->map(fn (string $status) => Order::factory()->create(['payment_status' => 'paid', 'status' => $status]));
        $unpaid = Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment']);
        $paymentReview = Order::factory()->create(['payment_status' => 'pending_confirmation', 'status' => 'awaiting_payment']);
        $cancelled = Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled']);

        $this->assertEqualsCanonicalizing(
            $validOrders->pluck('order_id')->all(),
            Order::revenueValid()->pluck('order_id')->all(),
        );
        $this->assertNotContains($unpaid->order_id, Order::revenueValid()->pluck('order_id'));
        $this->assertNotContains($paymentReview->order_id, Order::revenueValid()->pluck('order_id'));
        $this->assertNotContains($cancelled->order_id, Order::revenueValid()->pluck('order_id'));
    }

    public function test_dashboard_revenue_and_aov_use_revenue_valid_scope_and_are_numeric(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Order::factory()->create(['payment_status' => 'paid', 'status' => 'processing', 'total_amount' => 100000]);
        Order::factory()->create(['payment_status' => 'paid', 'status' => 'shipped', 'total_amount' => 200000]);
        Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 300000]);
        Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment', 'total_amount' => 999999]);
        Order::factory()->create(['payment_status' => 'pending_confirmation', 'status' => 'awaiting_payment', 'total_amount' => 999999]);
        Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled', 'total_amount' => 999999]);

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertInertia(function ($page) {
            $page->where('analytics.monthlyRevenue', 600000)
                ->where('analytics.avgTransaction', 200000)
                ->where('analytics.monthlyRevenue', fn ($value) => is_int($value))
                ->where('analytics.avgTransaction', fn ($value) => is_int($value));
        });
    }

    public function test_dashboard_aov_is_zero_when_there_are_no_revenue_valid_orders(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment']);
        Order::factory()->create(['payment_status' => 'pending_confirmation', 'status' => 'awaiting_payment']);
        Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled']);

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertInertia(function ($page) {
            $page->where('analytics.monthlyRevenue', 0)
                ->where('analytics.avgTransaction', 0)
                ->where('analytics.monthlyRevenue', fn ($value) => is_int($value))
                ->where('analytics.avgTransaction', fn ($value) => is_int($value));
        });
    }

    public function test_seven_day_revenue_trend_uses_wib_calendar_boundaries_and_revenue_valid_orders(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02 17:30:00', 'UTC'));

        try {
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 50000, 'created_at' => Carbon::parse('2026-09-02 16:30:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'shipped', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-09-02 17:30:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'delivered', 'total_amount' => 200000, 'created_at' => Carbon::parse('2026-09-02 19:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment', 'total_amount' => 999999, 'created_at' => Carbon::parse('2026-09-02 18:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'pending_confirmation', 'status' => 'awaiting_payment', 'total_amount' => 999999, 'created_at' => Carbon::parse('2026-09-02 18:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled', 'total_amount' => 999999, 'created_at' => Carbon::parse('2026-09-02 18:00:00', 'UTC')]);

            $trend = app(RevenueAnalyticsService::class)->sevenDayTrend();
            $byDate = collect($trend)->keyBy('date');

            $this->assertCount(7, $trend);
            $this->assertSame(['2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'], collect($trend)->pluck('date')->all());
            $this->assertSame(['revenue' => 0, 'valid_order_count' => 0, 'daily_aov' => 0], collect($byDate->get('2026-08-28'))->only(['revenue', 'valid_order_count', 'daily_aov'])->all());
            $this->assertSame(['revenue' => 50000, 'valid_order_count' => 1, 'daily_aov' => 50000], collect($byDate->get('2026-09-02'))->only(['revenue', 'valid_order_count', 'daily_aov'])->all());
            $this->assertSame(['revenue' => 300000, 'valid_order_count' => 2, 'daily_aov' => 150000], collect($byDate->get('2026-09-03'))->only(['revenue', 'valid_order_count', 'daily_aov'])->all());
            $this->assertIsInt($byDate['2026-09-03']['revenue']);
            $this->assertIsInt($byDate['2026-09-03']['valid_order_count']);
            $this->assertIsInt($byDate['2026-09-03']['daily_aov']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_admin_dashboard_exposes_the_seven_day_revenue_trend_prop(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02 17:30:00', 'UTC'));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $product = Product::create(['product_name' => 'Gayo', 'price' => 50000, 'stock' => 10]);
            $order = Order::factory()->create(['payment_status' => 'paid', 'status' => 'shipped', 'total_amount' => 100000]);
            OrderItem::create(['order_id' => $order->order_id, 'product_id' => $product->product_id, 'product_name' => 'Gayo', 'qty' => 2, 'unit_price' => 50000, 'subtotal' => 100000]);

            $this->actingAs($admin)->get(route('admin.dashboard'))->assertInertia(fn ($page) => $page
                ->has('revenueAnalytics.trend', 7)
                ->where('revenueAnalytics.trend.6.date', '2026-09-03')
                ->has('revenueAnalytics.summary')
                ->where('revenueAnalytics.summary.current_revenue', 100000)
                ->where('revenueAnalytics.summary.valid_order_count', 1)
                ->has('revenueAnalytics.top_products', 1)
                ->where('revenueAnalytics.top_products.0.total_quantity', 2)
                ->where('revenueAnalytics.top_products.0.total_revenue', 100000)
                ->has('revenueAnalytics.frequent_customers', 1)
                ->where('revenueAnalytics.frequent_customers.0.valid_order_count', 1)
                ->where('revenueAnalytics.frequent_customers.0.total_spent', 100000));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_revenue_summary_uses_adjacent_wib_periods_and_latest_highest_day_on_tie(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-09-03 16:30:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'processing', 'total_amount' => 90000, 'created_at' => Carbon::parse('2026-09-03 17:30:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'packed', 'total_amount' => 200000, 'created_at' => Carbon::parse('2026-09-08 04:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'shipped', 'total_amount' => 200000, 'created_at' => Carbon::parse('2026-09-10 04:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment', 'total_amount' => 999999, 'created_at' => Carbon::parse('2026-09-08 04:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled', 'total_amount' => 999999, 'created_at' => Carbon::parse('2026-09-08 04:00:00', 'UTC')]);

            $analytics = app(RevenueAnalyticsService::class)->dashboardAnalytics();
            $summary = $analytics['summary'];

            $this->assertSame(['2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10'], collect($analytics['trend'])->pluck('date')->all());
            $this->assertSame(490000, $summary['current_revenue']);
            $this->assertSame(100000, $summary['previous_revenue']);
            $this->assertSame(70000, $summary['average_daily_revenue']);
            $this->assertSame(3, $summary['valid_order_count']);
            $this->assertSame(['date' => '2026-09-10', 'label' => '10 Sep', 'revenue' => 200000], $summary['highest_revenue_day']);
            $this->assertSame(390.0, $summary['change_percentage']);
            $this->assertSame('increase', $summary['change_status']);
            $this->assertIsInt($summary['current_revenue']);
            $this->assertIsInt($summary['average_daily_revenue']);
            $this->assertIsInt($summary['valid_order_count']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_revenue_summary_reports_decrease_and_neutral_comparisons(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 200000, 'created_at' => Carbon::parse('2026-09-01 04:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'delivered', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-09-08 04:00:00', 'UTC')]);
            $summary = app(RevenueAnalyticsService::class)->dashboardAnalytics()['summary'];

            $this->assertSame(-50.0, $summary['change_percentage']);
            $this->assertSame('decrease', $summary['change_status']);

            Order::query()->delete();
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-09-01 04:00:00', 'UTC')]);
            Order::factory()->create(['payment_status' => 'paid', 'status' => 'delivered', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-09-08 04:00:00', 'UTC')]);
            $summary = app(RevenueAnalyticsService::class)->dashboardAnalytics()['summary'];

            $this->assertSame(0.0, $summary['change_percentage']);
            $this->assertSame('neutral', $summary['change_status']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_revenue_summary_handles_zero_previous_and_empty_periods_without_invalid_percentages(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-10 12:00:00', 'Asia/Jakarta'));

        try {
            $summary = app(RevenueAnalyticsService::class)->dashboardAnalytics()['summary'];
            $this->assertSame(0, $summary['change_percentage']);
            $this->assertSame('neutral', $summary['change_status']);
            $this->assertNull($summary['highest_revenue_day']);

            Order::factory()->create(['payment_status' => 'paid', 'status' => 'picked_up', 'total_amount' => 100000, 'created_at' => Carbon::parse('2026-09-08 04:00:00', 'UTC')]);
            $summary = app(RevenueAnalyticsService::class)->dashboardAnalytics()['summary'];

            $this->assertNull($summary['change_percentage']);
            $this->assertSame('new_activity', $summary['change_status']);
            $this->assertNotSame(INF, $summary['change_percentage']);
            $this->assertNotSame(NAN, $summary['change_percentage']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_top_products_uses_revenue_valid_order_items_and_historical_subtotals(): void
    {
        $products = collect([
            ['name' => 'Arabika', 'price' => 10000],
            ['name' => 'Robusta', 'price' => 15000],
            ['name' => 'Liberika', 'price' => 4000],
            ['name' => 'Excelsa', 'price' => 1000],
            ['name' => 'Toraja', 'price' => 1000],
            ['name' => 'Bali', 'price' => 1000],
        ])->map(fn (array $data) => Product::create(['product_name' => $data['name'], 'price' => $data['price'], 'stock' => 10]));
        $valid = Order::factory()->create(['payment_status' => 'paid', 'status' => 'processing']);
        $fulfilled = Order::factory()->create(['payment_status' => 'paid', 'status' => 'delivered']);
        $unpaid = Order::factory()->create(['payment_status' => 'unpaid', 'status' => 'awaiting_payment']);
        $pending = Order::factory()->create(['payment_status' => 'pending_confirmation', 'status' => 'awaiting_payment']);
        $rejected = Order::factory()->create(['payment_status' => 'rejected', 'status' => 'awaiting_payment']);
        $cancelled = Order::factory()->create(['payment_status' => 'paid', 'status' => 'cancelled']);
        $item = fn (Order $order, Product $product, int $qty, int $subtotal) => OrderItem::create(['order_id' => $order->order_id, 'product_id' => $product->product_id, 'product_name' => $product->product_name, 'qty' => $qty, 'unit_price' => (int) ($subtotal / $qty), 'subtotal' => $subtotal]);

        $item($valid, $products[0], 1, 10000);
        $item($fulfilled, $products[0], 3, 30000);
        $item($valid, $products[1], 4, 80000);
        $item($fulfilled, $products[2], 5, 20000);
        $item($valid, $products[3], 3, 3000);
        $item($valid, $products[4], 2, 2000);
        $item($valid, $products[5], 1, 1000);
        $item($unpaid, $products[5], 99, 999999);
        $item($pending, $products[5], 99, 999999);
        $item($rejected, $products[5], 99, 999999);
        $item($cancelled, $products[5], 99, 999999);
        $products[0]->update(['price' => 999999]);

        $topProducts = app(RevenueAnalyticsService::class)->topProducts();

        $this->assertCount(5, $topProducts);
        $this->assertSame('Liberika', $topProducts[0]['name']);
        $this->assertSame('Robusta', $topProducts[1]['name']);
        $this->assertSame(['product_id' => $products[0]->product_id, 'name' => 'Arabika', 'total_quantity' => 4, 'total_revenue' => 40000], $topProducts[2]);
        $this->assertSame('Toraja', $topProducts[4]['name']);
        $this->assertIsInt($topProducts[0]['total_quantity']);
        $this->assertIsInt($topProducts[0]['total_revenue']);
    }

    public function test_top_products_keeps_snapshot_name_when_product_has_been_deleted(): void
    {
        $product = Product::create(['product_name' => 'Produk Lama', 'price' => 50000, 'stock' => 10]);
        $order = Order::factory()->create(['payment_status' => 'paid', 'status' => 'completed']);
        OrderItem::create(['order_id' => $order->order_id, 'product_id' => $product->product_id, 'product_name' => 'Produk Lama', 'qty' => 2, 'unit_price' => 50000, 'subtotal' => 100000]);
        $product->delete();

        $this->assertSame([['product_id' => null, 'name' => 'Produk Lama', 'total_quantity' => 2, 'total_revenue' => 100000]], app(RevenueAnalyticsService::class)->topProducts());
    }

    public function test_frequent_customers_uses_only_revenue_valid_customer_orders_and_stable_sorting(): void
    {
        $customers = collect([
            ['name' => 'Ayu', 'role' => 'customer'],
            ['name' => 'Bima', 'role' => 'customer'],
            ['name' => 'Citra', 'role' => 'customer'],
            ['name' => 'Deni', 'role' => 'customer'],
            ['name' => 'Eka', 'role' => 'customer'],
            ['name' => 'Farah', 'role' => 'customer'],
            ['name' => 'Invalid', 'role' => 'customer'],
            ['name' => 'Admin', 'role' => 'admin'],
            ['name' => 'Courier', 'role' => 'courier'],
            ['name' => 'Super Admin', 'role' => 'super_admin'],
        ])->map(fn (array $data) => User::factory()->create($data));
        $order = fn (User $user, string $status, string $paymentStatus, int $total) => Order::factory()->create(['user_id' => $user->id, 'status' => $status, 'payment_status' => $paymentStatus, 'total_amount' => $total]);

        $order($customers[0], 'processing', 'paid', 100000);
        $order($customers[0], 'delivered', 'paid', 200000);
        $order($customers[1], 'packed', 'paid', 200000);
        $order($customers[1], 'completed', 'paid', 200000);
        $order($customers[2], 'processing', 'paid', 100000);
        $order($customers[2], 'pickup_requested', 'paid', 100000);
        $order($customers[2], 'shipped', 'paid', 100000);
        $order($customers[3], 'completed', 'paid', 90000);
        $order($customers[4], 'completed', 'paid', 50000);
        $order($customers[5], 'completed', 'paid', 50000);
        $order($customers[6], 'awaiting_payment', 'unpaid', 999999);
        $order($customers[6], 'awaiting_payment', 'pending_confirmation', 999999);
        $order($customers[6], 'awaiting_payment', 'rejected', 999999);
        $order($customers[6], 'cancelled', 'paid', 999999);
        $order($customers[7], 'completed', 'paid', 999999);
        $order($customers[8], 'completed', 'paid', 999999);
        $order($customers[9], 'completed', 'paid', 999999);

        $frequentCustomers = app(RevenueAnalyticsService::class)->frequentCustomers();

        $this->assertCount(5, $frequentCustomers);
        $this->assertSame(['customer_id' => $customers[2]->id, 'name' => 'Citra', 'valid_order_count' => 3, 'total_spent' => 300000], $frequentCustomers[0]);
        $this->assertSame(['customer_id' => $customers[1]->id, 'name' => 'Bima', 'valid_order_count' => 2, 'total_spent' => 400000], $frequentCustomers[1]);
        $this->assertSame(['customer_id' => $customers[0]->id, 'name' => 'Ayu', 'valid_order_count' => 2, 'total_spent' => 300000], $frequentCustomers[2]);
        $this->assertSame(['customer_id' => $customers[4]->id, 'name' => 'Eka', 'valid_order_count' => 1, 'total_spent' => 50000], $frequentCustomers[4]);
        $this->assertSame(['customer_id', 'name', 'valid_order_count', 'total_spent'], array_keys($frequentCustomers[0]));
        $this->assertArrayNotHasKey('email', $frequentCustomers[0]);
        $this->assertArrayNotHasKey('phone', $frequentCustomers[0]);
        $this->assertArrayNotHasKey('address', $frequentCustomers[0]);
        $this->assertArrayNotHasKey('password', $frequentCustomers[0]);
        $this->assertIsInt($frequentCustomers[0]['valid_order_count']);
        $this->assertIsInt($frequentCustomers[0]['total_spent']);
    }

    public function test_customer_and_courier_cannot_access_admin_frequent_customer_analytics(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']))->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'courier']))->get(route('admin.dashboard'))->assertForbidden();
    }
}
