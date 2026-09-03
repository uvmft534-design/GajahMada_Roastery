<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\OrderFulfillmentService;
use App\Services\RevenueAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*' => 'integer|distinct',
        ]);

        $items = CartItem::query()
            ->with('product')
            ->whereIn('id', $validated['items'])
            ->whereHas('cart', fn ($query) => $query->where('user_id', $request->user()->id))
            ->get();

        if ($items->count() !== count($validated['items'])) {
            abort(403);
        }

        return Inertia::render('Checkout', [
            'items' => $items,
            'auth' => [
                'user' => $request->user(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cart_item_ids' => 'required|array|min:1',
            'cart_item_ids.*' => 'integer|distinct',
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

        $order = DB::transaction(function () use ($request, $validated, $paymentSetting) {
            $cartItems = CartItem::query()
                ->whereIn('id', $validated['cart_item_ids'])
                ->whereHas('cart', fn ($query) => $query->where('user_id', $request->user()->id))
                ->orderBy('product_id')
                ->lockForUpdate()
                ->get();

            if ($cartItems->count() !== count($validated['cart_item_ids'])) {
                throw ValidationException::withMessages([
                    'cart_item_ids' => 'Item keranjang tidak valid.',
                ]);
            }

            // Lock every product in a stable order before checking stock or creating the order.
            $products = Product::query()
                ->whereIn('product_id', $cartItems->pluck('product_id')->unique())
                ->orderBy('product_id')
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            $subtotal = 0;
            foreach ($cartItems as $cartItem) {
                $product = $products->get($cartItem->product_id);

                if (! $product || $cartItem->qty > $product->stock) {
                    $productName = $product?->product_name ?? 'produk';

                    throw ValidationException::withMessages([
                        'cart_item_ids' => "Stok {$productName} tidak mencukupi.",
                    ]);
                }

                $subtotal += (int) $product->price * $cartItem->qty;
            }

            $user = $request->user();
            $deliveryFee = $validated['shipping_method'] === 'instant' ? 30000 : 25000;
            $total = $subtotal + $deliveryFee;

            $order = Order::create([
                'user_id' => $user?->id,
                'order_number' => 'ROAST-'.strtoupper(Str::random(8)),
                'status' => 'awaiting_payment',
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
                'tracking_number' => null,
            ]);

            foreach ($cartItems as $cartItem) {
                $product = $products->get($cartItem->product_id);
                $itemSubtotal = (int) $product->price * $cartItem->qty;

                OrderItem::create([
                    'order_id' => $order->order_id,
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'product_category' => $product->category,
                    'qty' => $cartItem->qty,
                    'unit_price' => (int) $product->price,
                    'subtotal' => $itemSubtotal,
                    'brew_method' => $cartItem->brew_method,
                ]);

                $product->decrement('stock', $cartItem->qty);
            }

            CartItem::query()->whereIn('id', $cartItems->pluck('id'))->delete();

            return $order;
        });

        return redirect()->route('orders.payment', $order->order_id)
            ->with('success', 'Pesanan berhasil dibuat.');
    }

    public function payment(Order $order)
    {
        $this->authorize('view', $order);

        return Inertia::render('Payment', [
            'order' => $order,
        ]);
    }

    public function paymentSubmitted(Order $order)
    {
        $this->authorize('view', $order);

        abort_unless($order->payment_status === 'pending_confirmation', 404);

        return Inertia::render('PaymentSubmitted', [
            'order' => $order,
        ]);
    }

    public function viewPaymentProof(Order $order)
    {
        $this->authorize('view', $order);
        $disk = $this->paymentProofDisk($order->payment_proof);
        abort_unless($order->payment_proof && $disk->exists($order->payment_proof), 404);

        return $disk->response($order->payment_proof);
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);
        $order->load('items.product', 'items.review', 'user', 'courier');

        return Inertia::render('OrderDetail', [
            'order' => $order,
            'items' => $order->items,
        ]);
    }

    public function history()
    {
        $orders = Order::with('items.product')
            ->where('user_id', Auth::id())
            ->latest('created_at')
            ->latest('order_id')
            ->get();

        return Inertia::render('OrderHistory', [
            'orders' => $orders,
        ]);
    }

    public function tracking(Order $order)
    {
        $this->authorize('view', $order);
        $order->load('items.product', 'courier');

        return Inertia::render('OrderTracking', [
            'order' => $order,
        ]);
    }

    public function adminIndex(RevenueAnalyticsService $revenueAnalytics)
    {
        $orders = Order::with('items.product', 'user', 'courier')->latest('created_at')->get();
        $dashboardRevenueAnalytics = $revenueAnalytics->dashboardAnalytics();
        $dashboardRevenueAnalytics['top_products'] = $revenueAnalytics->topProducts();
        $dashboardRevenueAnalytics['frequent_customers'] = $revenueAnalytics->frequentCustomers();
        $revenueTrend = $dashboardRevenueAnalytics['trend'];
        $monthlyKpis = $revenueAnalytics->currentMonthKpis();

        $analytics = [
            'monthlyRevenue' => $monthlyKpis['revenue'],
            'monthlyOrderCount' => $monthlyKpis['valid_order_count'],
            'transactions' => $monthlyKpis['valid_order_count'],
            'avgTransaction' => $monthlyKpis['average_order_value'],
            'chartData' => collect($revenueTrend)->pluck('revenue')->all(),
            'chartLabels' => collect($revenueTrend)->pluck('label')->all(),
        ];

        return Inertia::render('Dashboard_Admin', [
            'products' => Product::query()->withAvg('reviews', 'rating')->withCount('reviews')->latest('product_id')->get(),
            'orders' => $orders,
            'couriers' => User::query()->where('role', 'courier')->orderBy('name')->get(['id', 'name']),
            'categories' => ProductCategory::query()->orderBy('name')->pluck('name'),
            'analytics' => $analytics,
            'revenueAnalytics' => $dashboardRevenueAnalytics,
        ]);
    }

    public function processOrder(Order $order, OrderFulfillmentService $fulfillment)
    {
        $fulfillment->process($order);

        return back()->with('success', 'Pesanan sedang diproses.');
    }

    public function markPacked(Order $order, OrderFulfillmentService $fulfillment)
    {
        $fulfillment->pack($order);

        return back()->with('success', 'Pesanan siap untuk tahap pickup.');
    }

    public function requestPickup(Request $request, Order $order, OrderFulfillmentService $fulfillment)
    {
        $validated = $request->validate(['courier_id' => 'required|integer|exists:users,id', 'delivery_note' => 'nullable|string|max:1000']);
        $fulfillment->requestPickup($order, User::findOrFail($validated['courier_id']));
        $order->update(['delivery_note' => $validated['delivery_note'] ?? $order->delivery_note]);

        return back()->with('success', 'Pickup berhasil diminta kepada courier.');
    }

    public function courierDashboard(Request $request)
    {
        $orders = Order::with(['items.product', 'user'])
            ->where('courier_id', $request->user()->id)
            ->latest('created_at')
            ->get();

        return Inertia::render('Courier/Dashboard', [
            'orders' => $orders,
            'overview' => [
                'newPickups' => $orders->where('status', 'pickup_requested')->count(),
                'inDelivery' => $orders->whereIn('status', ['picked_up', 'shipped'])->count(),
                'completedToday' => $orders->filter(fn (Order $order) => $order->delivered_at?->isToday())->count(),
            ],
        ]);
    }

    public function confirmPickup(Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('courier', $order);
        $fulfillment->confirmPickup($order);

        return back()->with('success', 'Pickup berhasil dikonfirmasi.');
    }

    public function generateTracking(Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('courier', $order);
        $fulfillment->setTrackingNumber($order);

        return back()->with('success', 'Nomor resi berhasil dibuat.');
    }

    public function saveTracking(Request $request, Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('courier', $order);
        $validated = $request->validate(['tracking_number' => 'required|string|max:100|unique:orders,tracking_number']);
        $fulfillment->setTrackingNumber($order, $validated['tracking_number']);

        return back()->with('success', 'Nomor resi berhasil disimpan.');
    }

    public function startShipping(Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('courier', $order);
        $fulfillment->startShipping($order);

        return back()->with('success', 'Pengiriman dimulai.');
    }

    public function markDelivered(Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('courier', $order);
        $fulfillment->markDelivered($order);

        return back()->with('success', 'Pesanan ditandai sudah sampai.');
    }

    public function cancel(Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('update', $order);
        $fulfillment->cancel($order);

        return back()->with('success', 'Pesanan dibatalkan.');
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
                $this->paymentProofDisk($order->payment_proof)->delete($order->payment_proof);
            }

            // Payment proof is private: it is served only through the authorized endpoint.
            $path = $request->file('proof')->store('payment-proof', 'local');
            $order->update([
                'payment_proof' => $path,
                'payment_status' => 'pending_confirmation',
                'payment_review_note' => null,
                'payment_reviewed_by' => null,
                'payment_reviewed_at' => null,
            ]);
        }

        return redirect()->route('orders.payment.submitted', $order->order_id)
            ->with('success', 'Bukti pembayaran berhasil dikirim.');
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

    public function complete(Order $order, OrderFulfillmentService $fulfillment)
    {
        $this->authorize('update', $order);
        $fulfillment->complete($order);

        return back()->with('success', 'Pesanan selesai.');
    }

    private function paymentProofDisk(?string $path)
    {
        // Keep already-uploaded legacy files viewable through the same authorized endpoint.
        return $path && Storage::disk('local')->exists($path) ? Storage::disk('local') : Storage::disk('public');
    }
}
