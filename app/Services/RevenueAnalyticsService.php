<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class RevenueAnalyticsService
{
    /**
     * Calculate the revenue-valid KPI set for the current calendar month in
     * the analytics timezone.
     *
     * @return array{revenue: int, valid_order_count: int, average_order_value: int}
     */
    public function currentMonthKpis(): array
    {
        $timezone = config('analytics.timezone');
        $start = now($timezone)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $totals = Order::revenueValid()
            ->whereBetween('created_at', [$start->copy()->utc(), $end->copy()->utc()])
            ->selectRaw('COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as valid_order_count')
            ->first();

        $revenue = (int) $totals->revenue;
        $validOrderCount = (int) $totals->valid_order_count;

        return [
            'revenue' => $revenue,
            'valid_order_count' => $validOrderCount,
            'average_order_value' => $validOrderCount === 0 ? 0 : (int) round($revenue / $validOrderCount),
        ];
    }

    /**
     * Build the seven most recent calendar days of revenue in the analytics timezone.
     *
     * @return array<int, array{date: string, label: string, revenue: int, valid_order_count: int, daily_aov: int}>
     */
    public function sevenDayTrend(): array
    {
        return $this->dashboardAnalytics()['trend'];
    }

    /**
     * Build the current revenue trend and summary from one fourteen-day query.
     *
     * @return array{trend: array<int, array{date: string, label: string, revenue: int, valid_order_count: int, daily_aov: int}>, summary: array{current_revenue: int, average_daily_revenue: int, valid_order_count: int, highest_revenue_day: array{date: string, label: string, revenue: int}|null, previous_revenue: int, change_percentage: float|int|null, change_status: string}}
     */
    public function dashboardAnalytics(): array
    {
        $timezone = config('analytics.timezone');
        $today = now($timezone)->startOfDay();
        $currentStart = $today->copy()->subDays(6);
        $previousStart = $currentStart->copy()->subDays(7);
        $end = $today->copy()->endOfDay();

        $ordersByDate = Order::revenueValid()
            ->whereBetween('created_at', [$previousStart->copy()->utc(), $end->copy()->utc()])
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn (Order $order) => $order->created_at->setTimezone($timezone)->toDateString());

        $trend = $this->trendForPeriod($currentStart, $ordersByDate);
        $currentRevenue = (int) collect($trend)->sum('revenue');
        $validOrderCount = (int) collect($trend)->sum('valid_order_count');
        $previousRevenue = $this->revenueForPeriod($previousStart, $ordersByDate);
        $highestRevenueDay = null;

        foreach ($trend as $day) {
            if ($day['revenue'] > 0 && (! $highestRevenueDay || $day['revenue'] >= $highestRevenueDay['revenue'])) {
                $highestRevenueDay = [
                    'date' => $day['date'],
                    'label' => $day['label'],
                    'revenue' => $day['revenue'],
                ];
            }
        }

        if ($previousRevenue === 0) {
            $changePercentage = $currentRevenue === 0 ? 0 : null;
            $changeStatus = $currentRevenue === 0 ? 'neutral' : 'new_activity';
        } else {
            $changePercentage = round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 2);
            $changeStatus = $currentRevenue > $previousRevenue ? 'increase' : ($currentRevenue < $previousRevenue ? 'decrease' : 'neutral');
        }

        return [
            'trend' => $trend,
            'summary' => [
                'current_revenue' => $currentRevenue,
                'average_daily_revenue' => (int) round($currentRevenue / 7),
                'valid_order_count' => $validOrderCount,
                'highest_revenue_day' => $highestRevenueDay,
                'previous_revenue' => $previousRevenue,
                'change_percentage' => $changePercentage,
                'change_status' => $changeStatus,
            ],
        ];
    }

    /**
     * Return the five products with the most units sold in revenue-valid orders.
     *
     * @return array<int, array{product_id: int|null, name: string, total_quantity: int, total_revenue: int}>
     */
    public function topProducts(): array
    {
        return OrderItem::query()
            ->whereHas('order', fn ($query) => $query->revenueValid())
            ->selectRaw('product_id, product_name, SUM(qty) as total_quantity, SUM(subtotal) as total_revenue')
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_quantity')
            ->orderByDesc('total_revenue')
            ->orderBy('product_id')
            ->limit(5)
            ->get()
            ->map(fn (OrderItem $item): array => [
                'product_id' => $item->product_id === null ? null : (int) $item->product_id,
                'name' => $item->product_name,
                'total_quantity' => (int) $item->total_quantity,
                'total_revenue' => (int) $item->total_revenue,
            ])
            ->all();
    }

    /**
     * Return the five customers with the most revenue-valid orders.
     *
     * @return array<int, array{customer_id: int, name: string, valid_order_count: int, total_spent: int}>
     */
    public function frequentCustomers(): array
    {
        return Order::revenueValid()
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->where('users.role', 'customer')
            ->selectRaw('users.id as customer_id, users.name, COUNT(orders.order_id) as valid_order_count, SUM(orders.total_amount) as total_spent')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('valid_order_count')
            ->orderByDesc('total_spent')
            ->orderBy('users.id')
            ->limit(5)
            ->get()
            ->map(fn (Order $order): array => [
                'customer_id' => (int) $order->customer_id,
                'name' => $order->name,
                'valid_order_count' => (int) $order->valid_order_count,
                'total_spent' => (int) $order->total_spent,
            ])
            ->all();
    }

    /**
     * @param  Collection<string, Collection<int, Order>>  $ordersByDate
     * @return array<int, array{date: string, label: string, revenue: int, valid_order_count: int, daily_aov: int}>
     */
    private function trendForPeriod(CarbonInterface $start, Collection $ordersByDate): array
    {
        return collect(range(0, 6))
            ->map(function (int $offset) use ($start, $ordersByDate): array {
                $day = $start->copy()->addDays($offset);
                /** @var Collection<int, Order> $orders */
                $orders = $ordersByDate->get($day->toDateString(), collect());
                $revenue = (int) $orders->sum('total_amount');
                $count = $orders->count();

                return [
                    'date' => $day->toDateString(),
                    'label' => $day->format('d M'),
                    'revenue' => $revenue,
                    'valid_order_count' => $count,
                    'daily_aov' => $count ? (int) round($revenue / $count) : 0,
                ];
            })
            ->all();
    }

    /**
     * @param  Collection<string, Collection<int, Order>>  $ordersByDate
     */
    private function revenueForPeriod(CarbonInterface $start, Collection $ordersByDate): int
    {
        return (int) collect(range(0, 6))
            ->sum(function (int $offset) use ($start, $ordersByDate): int {
                return (int) $ordersByDate->get($start->copy()->addDays($offset)->toDateString(), collect())->sum('total_amount');
            });
    }
}
