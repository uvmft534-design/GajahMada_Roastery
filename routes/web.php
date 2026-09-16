<?php

use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductCategoryController;
use App\Http\Controllers\Admin\ComplaintController as AdminComplaintController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ShippingMethodController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentSettingController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\SuperAdminReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/products/{id}', [HomeController::class, 'show'])->name('products.show');
Route::get('/collections/espresso', [HomeController::class, 'espressoCollection'])->name('collections.espresso');
Route::get('/collections/filter', [HomeController::class, 'filterCollection'])->name('collections.filter');

Route::get('/auth/google', [GoogleController::class, 'redirectToGoogle'])->name('google.login');
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

require __DIR__.'/auth.php';

Route::middleware(['auth', 'verified', 'role:customer'])->group(function () {
    Route::get('/dashboard', [HomeController::class, 'dashboard'])->name('dashboard');

    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/products/{product}', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/items/{cartItem}', [CartController::class, 'update'])->name('cart.items.update');
    Route::delete('/cart/items/{cartItem}', [CartController::class, 'destroy'])->name('cart.items.destroy');

    Route::get('/orders/history', [OrderController::class, 'history'])->name('orders.history');
    Route::get('/orders/{order}/payment-submitted', [OrderController::class, 'paymentSubmitted'])->name('orders.payment.submitted');
    Route::get('/orders/{order}/payment', [OrderController::class, 'payment'])->name('orders.payment');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/orders/{order}/tracking', [OrderController::class, 'tracking'])->name('orders.tracking');
    Route::post('/orders/{order}/complete', [OrderController::class, 'complete'])->name('orders.complete');
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::post('/orders/{order}/proof', [OrderController::class, 'uploadProof'])->name('orders.proof');
    Route::post('/orders/{order}/complaints', [ComplaintController::class, 'store'])->name('orders.complaints.store');
    Route::post('/orders/{order}/items/{orderItem}/review', [ProductReviewController::class, 'store'])->name('orders.items.review.store');

    Route::get('/checkout', [OrderController::class, 'checkout'])->name('checkout');
    Route::post('/checkout/current-location', [OrderController::class, 'reverseGeocode'])->name('checkout.current-location');
    Route::post('/orders/checkout', [OrderController::class, 'store'])->name('orders.store');

});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/orders/{order}/payment-proof', [OrderController::class, 'viewPaymentProof'])->name('orders.proof.view');
    Route::get('/complaints/{complaint}/evidence/{evidence}', [ComplaintController::class, 'evidence'])->name('complaints.evidence');
    Route::get('/complaints/{complaint}', [ComplaintController::class, 'show'])->name('complaints.show');
    Route::post('/complaints/{complaint}/replies', [ComplaintController::class, 'reply'])->name('complaints.replies.store');
});

Route::middleware(['auth', 'verified', 'role:admin,super_admin'])->group(function () {
    Route::get('/admin/dashboard', [OrderController::class, 'adminIndex'])->name('admin.dashboard');
    Route::get('/admin/orders', [OrderController::class, 'adminOrders'])->name('admin.orders.index');
    Route::get('/admin/products', [ProductController::class, 'index'])->name('admin.products.index');
    Route::post('/admin/orders/{order}/process', [OrderController::class, 'processOrder'])->name('admin.orders.process');
    Route::post('/admin/orders/{order}/packed', [OrderController::class, 'markPacked'])->name('admin.orders.packed');
    Route::post('/admin/orders/{order}/request-pickup', [OrderController::class, 'requestPickup'])->name('admin.orders.request-pickup');
    Route::post('/admin/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('admin.orders.cancel');
    Route::post('/admin/orders/{order}/approve-payment', [OrderController::class, 'approvePayment'])->name('admin.orders.approvePayment');
    Route::post('/admin/orders/{order}/reject-payment', [OrderController::class, 'rejectPayment'])->name('admin.orders.rejectPayment');
    Route::get('/admin/complaints', [AdminComplaintController::class, 'index'])->name('admin.complaints.index');
    Route::patch('/admin/complaints/{complaint}', [AdminComplaintController::class, 'update'])->name('admin.complaints.update');
    Route::post('/admin/products', [ProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/products/{id}', [ProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy'])->name('admin.products.destroy');
    Route::post('/admin/product-categories', [ProductCategoryController::class, 'store'])->name('admin.product-categories.store');
    Route::put('/admin/product-categories/{category}', [ProductCategoryController::class, 'update'])->name('admin.product-categories.update');
    Route::delete('/admin/product-categories/{category}', [ProductCategoryController::class, 'destroy'])->name('admin.product-categories.destroy');
    Route::get('/admin/shipping-methods', [ShippingMethodController::class, 'index'])->name('admin.shipping-methods.index');
    Route::post('/admin/shipping-methods', [ShippingMethodController::class, 'store'])->name('admin.shipping-methods.store');
    Route::put('/admin/shipping-methods/{shippingMethod}', [ShippingMethodController::class, 'update'])->name('admin.shipping-methods.update');
    Route::delete('/admin/shipping-methods/{shippingMethod}', [ShippingMethodController::class, 'destroy'])->name('admin.shipping-methods.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin,super_admin'])->get('/admin/payment-settings', [PaymentSettingController::class, 'index'])->name('admin.payment-settings.index');
Route::middleware(['auth', 'verified', 'role:admin'])->post('/admin/payment-settings/requests', [PaymentSettingController::class, 'requestChange'])->name('admin.payment-settings.requests.store');

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin/reports')->name('admin.reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/create', [ReportController::class, 'create'])->name('create');
    Route::post('/', [ReportController::class, 'store'])->name('store');
    Route::post('/{report}/archive', [ReportController::class, 'archive'])->name('archive');
    Route::post('/{report}/restore', [ReportController::class, 'restore'])->name('restore');
    Route::get('/{report}', [ReportController::class, 'show'])->name('show');
    Route::get('/{report}/pdf', [ReportController::class, 'pdf'])->name('pdf');
    Route::get('/{report}/excel', [ReportController::class, 'excel'])->name('excel');
});

Route::middleware(['auth', 'verified', 'role:courier'])->group(function () {
    Route::get('/courier/dashboard', [OrderController::class, 'courierDashboard'])->name('courier.dashboard');
    Route::post('/courier/orders/{order}/confirm-pickup', [OrderController::class, 'confirmPickup'])->name('courier.orders.confirm-pickup');
    Route::post('/courier/orders/{order}/generate-tracking', [OrderController::class, 'generateTracking'])->name('courier.orders.generate-tracking');
    Route::post('/courier/orders/{order}/tracking', [OrderController::class, 'saveTracking'])->name('courier.orders.save-tracking');
    Route::post('/courier/orders/{order}/start-shipping', [OrderController::class, 'startShipping'])->name('courier.orders.start-shipping');
    Route::post('/courier/orders/{order}/delivered', [OrderController::class, 'markDelivered'])->name('courier.orders.delivered');
});

Route::middleware(['auth', 'verified', 'role:super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [SuperAdminController::class, 'users'])->name('users.index');
    Route::post('/staff-accesses', [SuperAdminController::class, 'storeStaffAccess'])->name('staff-accesses.store');
    Route::delete('/staff-accesses/{staffAccess}', [SuperAdminController::class, 'revokeStaffAccess'])->name('staff-accesses.destroy');
    Route::patch('/users/{user}/role', [SuperAdminController::class, 'updateRole'])->name('users.role.update');
    Route::get('/payment-settings', [SuperAdminController::class, 'paymentSettings'])->name('payment-settings.index');
    Route::post('/payment-settings', [SuperAdminController::class, 'createInitialPaymentSetting'])->name('payment-settings.store');
    Route::post('/payment-settings/requests/{paymentSettingChangeRequest}/review', [SuperAdminController::class, 'reviewPaymentSettingChange'])->name('payment-settings.requests.review');
    Route::get('/reports', [SuperAdminReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/{report}', [SuperAdminReportController::class, 'show'])->name('reports.show');
    Route::post('/reports/{report}/review', [SuperAdminReportController::class, 'review'])->name('reports.review');
    Route::get('/reports/{report}/pdf', [SuperAdminReportController::class, 'pdf'])->name('reports.pdf');
    Route::get('/reports/{report}/excel', [SuperAdminReportController::class, 'excel'])->name('reports.excel');
});
