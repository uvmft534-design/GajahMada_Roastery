<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Complaint;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ReportGeneratorService
{
    public const LOW_STOCK_THRESHOLD = 5;

    public function generate(string $type, ?string $periodStart = null, ?string $periodEnd = null): array
    {
        return match ($type) {
            'sales' => $this->sales($periodStart, $periodEnd),
            'orders' => $this->orders($periodStart, $periodEnd),
            'payments' => $this->payments($periodStart, $periodEnd),
            'deliveries' => $this->deliveries($periodStart, $periodEnd),
            'inventory' => $this->inventory(),
            'complaints' => $this->complaints($periodStart, $periodEnd),
            default => throw new \InvalidArgumentException('Unsupported report type.'),
        };
    }

    private function period(?string $start, ?string $end): Builder
    {
        return Order::query()->whereBetween('created_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()]);
    }

    private function sales(?string $start, ?string $end): array
    {
        $orders = $this->period($start, $end)->where('payment_status', 'paid')->where('status', '!=', 'cancelled');
        $totalOrders = (clone $orders)->count();
        $revenue = (int) (clone $orders)->sum('total_amount');
        $items = OrderItem::query()->whereIn('order_id', (clone $orders)->select('order_id'));

        return ['total_orders' => $totalOrders, 'total_revenue' => $revenue, 'total_product_types_sold' => (int) (clone $items)->distinct('product_id')->count('product_id'), 'total_items_sold' => (int) $items->sum('qty'), 'average_order_value' => $totalOrders ? (int) round($revenue / $totalOrders) : 0,
            'products' => OrderItem::query()->selectRaw('product_id, product_name, SUM(qty) as quantity, SUM(subtotal) as total')->whereIn('order_id', (clone $orders)->select('order_id'))->groupBy('product_id', 'product_name')->orderByDesc('quantity')->limit(50)->get()->map(fn ($item) => ['product_id' => $item->product_id, 'product_name' => $item->product_name, 'quantity' => (int) $item->quantity, 'total' => (int) $item->total])->all()];
    }

    private function orders(?string $start, ?string $end): array
    {
        $base = $this->period($start, $end);
        $counts = (clone $base)->selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status');
        $statuses = ['awaiting_payment', 'processing', 'packed', 'pickup_requested', 'picked_up', 'shipped', 'delivered', 'completed', 'cancelled'];

        return ['total_orders' => (clone $base)->count(), 'statuses' => collect($statuses)->mapWithKeys(fn ($status) => [$status => (int) ($counts[$status] ?? 0)])->all()];
    }

    private function payments(?string $start, ?string $end): array
    {
        $base = $this->period($start, $end);
        $counts = (clone $base)->selectRaw('payment_status, COUNT(*) as count')->groupBy('payment_status')->pluck('count', 'payment_status');

        return ['unpaid_count' => (int) ($counts['unpaid'] ?? 0), 'pending_confirmation_count' => (int) ($counts['pending_confirmation'] ?? 0), 'paid_count' => (int) ($counts['paid'] ?? 0), 'rejected_count' => (int) ($counts['rejected'] ?? 0), 'total_paid_amount' => (int) (clone $base)->where('payment_status', 'paid')->sum('total_amount'), 'period_basis' => 'orders.created_at'];
    }

    private function deliveries(?string $start, ?string $end): array
    {
        $base = $this->period($start, $end);
        $counts = (clone $base)->selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status');

        return ['pickup_requested' => (int) ($counts['pickup_requested'] ?? 0), 'picked_up' => (int) ($counts['picked_up'] ?? 0), 'shipped' => (int) ($counts['shipped'] ?? 0), 'delivered' => (int) ($counts['delivered'] ?? 0), 'completed_deliveries' => (int) ($counts['completed'] ?? 0), 'assigned_couriers_count' => (int) (clone $base)->whereNotNull('courier_id')->distinct('courier_id')->count('courier_id'), 'period_basis' => 'orders.created_at'];
    }

    private function inventory(): array
    {
        $products = Product::query()->orderBy('product_id')->get(['product_id', 'product_name', 'stock']);

        return ['total_products' => $products->count(), 'total_stock_units' => (int) $products->sum('stock'), 'out_of_stock_products' => $products->where('stock', '<=', 0)->count(), 'low_stock_products' => $products->filter(fn ($product) => $product->stock > 0 && $product->stock <= self::LOW_STOCK_THRESHOLD)->count(), 'low_stock_threshold' => self::LOW_STOCK_THRESHOLD, 'products' => $products->map(fn ($product) => ['product_id' => $product->product_id, 'product_name' => $product->product_name, 'current_stock' => (int) $product->stock])->all()];
    }

    private function complaints(?string $start, ?string $end): array
    {
        $base = Complaint::query()->whereBetween('submitted_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()]);
        $byStatus = (clone $base)->selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status');
        $rows = (clone $base)->with(['order:order_id,order_number', 'item:order_item_id,product_name', 'customer:id,name'])->latest('submitted_at')->get();

        return ['total_complaints' => $rows->count(), 'submitted' => (int) ($byStatus['submitted'] ?? 0), 'in_review' => (int) ($byStatus['in_review'] ?? 0), 'resolved' => (int) ($byStatus['resolved'] ?? 0), 'rejected' => (int) ($byStatus['rejected'] ?? 0), 'complaints' => $rows->map(fn (Complaint $complaint) => ['order_number' => $complaint->order?->order_number, 'customer_name' => $complaint->customer?->name, 'product_name' => $complaint->item?->product_name ?? 'Pengiriman', 'category' => $complaint->category, 'status' => $complaint->status, 'submitted_at' => $complaint->submitted_at?->format('Y-m-d H:i')])->all()];
    }
}
