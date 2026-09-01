<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductReview;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    public function store(Request $request, Order $order, OrderItem $orderItem)
    {
        abort_unless($order->user_id === $request->user()->id, 403);
        abort_unless($order->status === 'completed', 422, 'Penilaian hanya dapat diberikan setelah pesanan selesai.');
        abort_unless($orderItem->order_id === $order->order_id && $orderItem->product_id, 422, 'Item pesanan tidak valid.');
        abort_if(ProductReview::where('order_item_id', $orderItem->order_item_id)->exists(), 422, 'Item ini sudah dinilai.');

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            ProductReview::create([
                'user_id' => $request->user()->id,
                'product_id' => $orderItem->product_id,
                'order_id' => $order->order_id,
                'order_item_id' => $orderItem->order_item_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);
        } catch (QueryException) {
            abort(422, 'Item ini sudah dinilai.');
        }

        return back()->with('success', 'Terima kasih, penilaian Anda telah disimpan.');
    }
}
