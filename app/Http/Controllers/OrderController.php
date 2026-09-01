<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function checkout(Request $request, $product_id)
    {
        $product = Product::where('product_id', $product_id)->first();

        if (! $product) {
            abort(404, 'Produk tidak ditemukan.');
        }

        if (! Auth::check()) {
            return redirect()->route('login');
        }

        return Inertia::render('Checkout', [
            'product' => $product,
            'qty' => (int) $request->query('qty', 1),
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'qty' => 'required|integer|min:1',
            'brew_method' => 'required|in:espresso,filter',
            'shipping_method' => 'required|in:instant,regular',
            'payment_method' => 'required|in:virtual_account',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:30',
            'customer_address' => 'required|string|max:1000',
            'customer_note' => 'nullable|string|max:500',
        ]);

        $paymentSetting = PaymentSetting::where('is_active', true)->first();
        if (! $paymentSetting) {
            return back()->withErrors(['payment_method' => 'Metode pembayaran sedang belum tersedia. Silakan coba kembali nanti.']);
        }

        $order = DB::transaction(function () use ($validated, $paymentSetting) {
            // Lock row produk agar checkout bersamaan tidak dapat menjual stok yang sama.
            $product = Product::where('product_id', $validated['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($validated['qty'] > $product->stock) {
                throw ValidationException::withMessages([
                    'qty' => "Jumlah pesanan melebihi stok yang tersedia ({$product->stock} pcs).",
                ]);
            }

            $user = Auth::user();
            $subtotal = (int) ($product->price * $validated['qty']);
            $deliveryFee = $validated['shipping_method'] === 'instant' ? 30000 : 25000;
            $total = $subtotal + $deliveryFee;

            $order = Order::create([
                'user_id' => $user?->id,
                'order_number' => 'ROAST-'.strtoupper(Str::random(8)),
                'status' => 'pending',
                'shipping_method' => $validated['shipping_method'],
                'payment_method' => 'virtual_account',
                'payment_status' => 'unpaid',
                'va_number' => $paymentSetting->account_number,
                'payment_bank_name' => $paymentSetting->bank_name,
                'payment_account_name' => $paymentSetting->account_name,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_address' => $validated['customer_address'],
                'customer_note' => $validated['customer_note'] ?? null,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total_amount' => $total,
                'tracking_number' => 'TRK-'.strtoupper(Str::random(10)),
            ]);

            OrderItem::create([
                'order_id' => $order->order_id,
                'product_id' => $product->product_id,
                'product_name' => $product->product_name,
                'product_category' => $product->category,
                'qty' => $validated['qty'],
                'unit_price' => (int) $product->price,
                'subtotal' => $subtotal,
                'brew_method' => $validated['brew_method'],
            ]);

            $product->decrement('stock', $validated['qty']);

            return $order;
        });

        return redirect()->route('orders.payment', $order->order_id)->with('success', 'Pesanan dibuat, silakan lanjutkan pembayaran.');
    }

    public function payment(Order $order)
    {
        $this->authorize('view', $order);

        return Inertia::render('Payment', [
            'order' => $order,
        ]);
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);
        $order->load('items.product', 'user');

        return Inertia::render('OrderDetail', [
            'order' => $order,
            'items' => $order->items,
        ]);
    }

    public function history()
    {
        $orders = Order::with('items.product')->where('user_id', Auth::id())->latest('created_at')->get();

        return Inertia::render('OrderHistory', [
            'orders' => $orders,
        ]);
    }

    public function tracking(Order $order)
    {
        $this->authorize('view', $order);
        $order->load('items.product');

        return Inertia::render('OrderTracking', [
            'order' => $order,
        ]);
    }

    public function adminIndex()
    {
        $orders = Order::with('items.product', 'user')->latest('created_at')->get();

        $chartData = [];
        $chartLabels = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $revenue = Order::whereDate('created_at', $date)->sum('total_amount');
            $chartData[] = (int) $revenue;
            $chartLabels[] = now()->subDays($i)->format('d M');
        }

        $analytics = [
            'monthlyRevenue' => Order::whereMonth('created_at', now()->month)->sum('total_amount'),
            'monthlyOrderCount' => Order::whereMonth('created_at', now()->month)->count(),
            'transactions' => Order::count(),
            'avgTransaction' => Order::avg('total_amount') ?: 0,
            'chartData' => $chartData,
            'chartLabels' => $chartLabels,
        ];

        return Inertia::render('Dashboard_Admin', [
            'products' => Product::latest('product_id')->get(),
            'orders' => $orders,
            'analytics' => $analytics,
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:pending,shipped,completed,cancelled',
        ]);

        $order->update([
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Status pesanan berhasil diperbarui.');
    }

    public function uploadProof(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        abort_unless(in_array($order->payment_status, ['unpaid', 'rejected'], true), 422, 'Bukti pembayaran tidak dapat diunggah pada status saat ini.');

        $request->validate([
            'proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($request->hasFile('proof')) {
            if ($order->payment_proof) {
                Storage::disk('public')->delete($order->payment_proof);
            }

            $path = $request->file('proof')->store('payment-proof', 'public');
            $order->update([
                'payment_proof' => $path,
                'payment_status' => 'pending_confirmation',
                'payment_review_note' => null,
                'payment_reviewed_by' => null,
                'payment_reviewed_at' => null,
            ]);
        }

        return redirect()->back()->with('success', 'Bukti pembayaran berhasil diunggah.');
    }

    public function approvePayment(Request $request, Order $order)
    {
        abort_unless($order->payment_status === 'pending_confirmation', 422, 'Pembayaran tidak dapat dikonfirmasi pada status saat ini.');

        $order->update([
            'payment_status' => 'paid',
            'payment_review_note' => $request->input('review_note'),
            'payment_reviewed_by' => $request->user()->id,
            'payment_reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Status pembayaran berhasil disimpan.');
    }

    public function rejectPayment(Request $request, Order $order)
    {
        abort_unless($order->payment_status === 'pending_confirmation', 422, 'Pembayaran tidak dapat ditolak pada status saat ini.');
        $validated = $request->validate(['review_note' => 'required|string|max:1000']);
        $order->update(['payment_status' => 'rejected', 'payment_review_note' => $validated['review_note'], 'payment_reviewed_by' => $request->user()->id, 'payment_reviewed_at' => now()]);

        return back()->with('success', 'Bukti pembayaran ditolak.');
    }

    public function complete(Order $order)
    {
        $this->authorize('update', $order);

        $order->update([
            'status' => 'completed',
        ]);

        return redirect()->back()->with('success', 'Pesanan telah dikonfirmasi selesai.');
    }
}
