<?php

namespace App\Http\Middleware;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\PaymentSettingChangeRequest;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'cartItemCount' => fn (): int => $request->user()
                ? (int) CartItem::query()
                    ->whereHas('cart', fn ($query) => $query->where('user_id', $request->user()->id))
                    ->count()
                : 0,
            'adminNotifications' => fn (): array => $request->user() && in_array($request->user()->role, ['admin', 'super_admin'], true)
                ? $this->adminNotifications()
                : ['newOrders' => 0, 'ordersNeedAttention' => 0, 'orderNotificationCount' => 0],
            'superAdminNotifications' => fn (): array => $request->user()?->role === 'super_admin'
                ? [
                    'paymentRequests' => PaymentSettingChangeRequest::query()->where('status', 'pending')->count(),
                    'reportsToReview' => Report::query()->where('status', 'generated')->count(),
                ]
                : ['paymentRequests' => 0, 'reportsToReview' => 0],
            'flash' => [
                'success' => fn (): ?string => $request->session()->get('success'),
            ],
        ];
    }

    /**
     * Orders remain in the badge until an admin action is needed no longer,
     * rather than disappearing merely because the order list was opened.
     */
    private function adminNotifications(): array
    {
        $needsAction = fn ($query) => $query
            ->where('payment_status', 'pending_confirmation')
            ->orWhere(fn ($query) => $query->where('status', 'awaiting_payment')->where('payment_status', 'paid'))
            ->orWhereIn('status', ['processing', 'packed']);

        $newOrders = Order::query()->whereNull('admin_seen_at')->count();
        $ordersNeedAttention = Order::query()->where($needsAction)->count();
        $orderNotificationCount = Order::query()
            ->where(fn ($query) => $query->whereNull('admin_seen_at')->orWhere($needsAction))
            ->count();

        return compact('newOrders', 'ordersNeedAttention', 'orderNotificationCount');
    }
}
