<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    public function requestPickup(Order $order, User $courier): void
    {
        abort_unless($courier->isCourier(), 422, 'Courier yang dipilih tidak valid.');
        abort_unless($order->status === 'packed' && $order->payment_status === 'paid', 422, 'Pickup hanya dapat diminta untuk pesanan yang sudah dikemas dan dibayar.');

        $order->update(['courier_id' => $courier->id, 'status' => 'pickup_requested']);
    }

    public function confirmPickup(Order $order): void
    {
        abort_unless($order->status === 'pickup_requested', 422, 'Pesanan tidak berada pada tahap pickup.');
        $order->update(['status' => 'picked_up', 'picked_up_at' => now()]);
    }

    public function setTrackingNumber(Order $order, ?string $trackingNumber = null): void
    {
        abort_unless($order->status === 'picked_up', 422, 'Resi hanya dapat dibuat setelah pickup dikonfirmasi.');
        abort_unless(! $order->tracking_number, 422, 'Nomor resi sudah dikunci.');

        $trackingNumber ??= $this->uniqueTrackingNumber();
        $order->update(['tracking_number' => $trackingNumber]);
    }

    public function startShipping(Order $order): void
    {
        abort_unless($order->status === 'picked_up' && $order->tracking_number, 422, 'Nomor resi wajib tersedia sebelum pengiriman dimulai.');
        $order->update(['status' => 'shipped', 'shipped_at' => now()]);
    }

    public function markDelivered(Order $order): void
    {
        abort_unless($order->status === 'shipped', 422, 'Hanya pesanan dalam pengiriman yang dapat ditandai sampai.');
        $order->update(['status' => 'delivered', 'delivered_at' => now()]);
    }

    public function complete(Order $order): void
    {
        abort_unless($order->status === 'delivered', 422, 'Pesanan hanya dapat diselesaikan setelah sampai tujuan.');
        $order->update(['status' => 'completed']);
    }

    private function uniqueTrackingNumber(): string
    {
        do {
            $trackingNumber = 'TRK-'.strtoupper(Str::random(10));
        } while (Order::where('tracking_number', $trackingNumber)->exists());

        return $trackingNumber;
    }
}
