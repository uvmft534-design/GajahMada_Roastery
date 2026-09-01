<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderFulfillmentService
{
    public function process(Order $order): void
    {
        abort_unless($order->status === 'awaiting_payment' && $order->payment_status === 'paid', 422, 'Pesanan hanya dapat diproses setelah pembayaran dikonfirmasi.');
        $order->update(['status' => 'processing']);
    }

    public function pack(Order $order): void
    {
        abort_unless($order->status === 'processing', 422, 'Hanya pesanan yang sedang diproses yang dapat dikemas.');
        $order->update(['status' => 'packed']);
    }

    public function cancel(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order = Order::with('items')->lockForUpdate()->findOrFail($order->order_id);
            abort_unless($order->status === 'awaiting_payment' && in_array($order->payment_status, ['unpaid', 'rejected'], true), 422, 'Pesanan yang sudah dibayar atau sedang diverifikasi tidak dapat dibatalkan melalui flow ini.');
            if (! $order->stock_released_at) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('product_id', $item->product_id)->lockForUpdate()->increment('stock', $item->qty);
                    }
                }
            } $order->update(['status' => 'cancelled', 'stock_released_at' => now()]);
        });
    }
}
