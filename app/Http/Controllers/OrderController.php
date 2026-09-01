<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
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
            'shipping_method' => 'required|in:instant,regular',
            'payment_method' => 'required|in:virtual_account',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_address' => 'nullable|string',
        ]);

        $order = DB::transaction(function () use ($validated) {
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
                'va_number' => '880'.random_int(1000000000, 9999999999),
                'customer_name' => $validated['customer_name'] ?? ($user?->name ?? null),
                'customer_phone' => $validated['customer_phone'] ?? ($user?->phone ?? null),
                'customer_address' => $validated['customer_address'] ?? ($user?->address ?? null),
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
            ]);
        }

        return redirect()->back()->with('success', 'Bukti pembayaran berhasil diunggah.');
    }

    public function updateVaNumber(Request $request, Order $order)
    {
        $request->validate([
            'va_number' => 'nullable|string|max:50',
        ]);

        $order->update([
            'va_number' => $request->va_number,
            'payment_status' => $order->payment_status === 'unpaid' ? 'unpaid' : $order->payment_status,
        ]);

        return redirect()->back()->with('success', 'Nomor VA berhasil diperbarui.');
    }

    public function approvePayment(Request $request, Order $order)
    {
        $request->validate([
            'payment_status' => 'required|in:paid,unpaid,pending_confirmation,rejected',
        ]);

        $order->update([
            'payment_status' => $request->payment_status,
            'status' => $request->payment_status === 'paid' ? 'pending' : $order->status,
        ]);

        return redirect()->back()->with('success', 'Status pembayaran berhasil disimpan.');
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
