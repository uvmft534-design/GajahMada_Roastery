<?php

use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Auth\GoogleController;
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

Route::get('/auth/google', [GoogleController::class, 'redirectToGoogle'])->name('google.login');
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

require __DIR__.'/auth.php';

Route::middleware(['auth', 'verified', 'role:customer'])->group(function () {
    Route::get('/dashboard', [HomeController::class, 'dashboard'])->name('dashboard');

    Route::get('/orders/history', [OrderController::class, 'history'])->name('orders.history');
    Route::get('/orders/{order}/payment', [OrderController::class, 'payment'])->name('orders.payment');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/orders/{order}/tracking', [OrderController::class, 'tracking'])->name('orders.tracking');
    Route::post('/orders/{order}/complete', [OrderController::class, 'complete'])->name('orders.complete');
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::post('/orders/{order}/proof', [OrderController::class, 'uploadProof'])->name('orders.proof');
    Route::post('/orders/{order}/items/{orderItem}/review', [ProductReviewController::class, 'store'])->name('orders.items.review.store');

    Route::get('/checkout/{product_id}', [OrderController::class, 'checkout'])->name('checkout');
    Route::post('/orders/checkout', [OrderController::class, 'store'])->name('orders.store');

});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/orders/{order}/payment-proof', [OrderController::class, 'viewPaymentProof'])->name('orders.proof.view');
});

Route::middleware(['auth', 'verified', 'role:admin,super_admin'])->group(function () {
    Route::get('/admin/dashboard', [OrderController::class, 'adminIndex'])->name('admin.dashboard');
    Route::post('/admin/orders/{order}/process', [OrderController::class, 'processOrder'])->name('admin.orders.process');
    Route::post('/admin/orders/{order}/packed', [OrderController::class, 'markPacked'])->name('admin.orders.packed');
    Route::post('/admin/orders/{order}/request-pickup', [OrderController::class, 'requestPickup'])->name('admin.orders.request-pickup');
    Route::post('/admin/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('admin.orders.cancel');
    Route::post('/admin/orders/{order}/approve-payment', [OrderController::class, 'approvePayment'])->name('admin.orders.approvePayment');
    Route::post('/admin/orders/{order}/reject-payment', [OrderController::class, 'rejectPayment'])->name('admin.orders.rejectPayment');
    Route::post('/admin/products', [ProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/products/{id}', [ProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy'])->name('admin.products.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin,super_admin'])->get('/admin/payment-settings', [PaymentSettingController::class, 'index'])->name('admin.payment-settings.index');
Route::middleware(['auth', 'verified', 'role:admin'])->post('/admin/payment-settings/requests', [PaymentSettingController::class, 'requestChange'])->name('admin.payment-settings.requests.store');

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin/reports')->name('admin.reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/create', [ReportController::class, 'create'])->name('create');
    Route::post('/', [ReportController::class, 'store'])->name('store');
    Route::post('/preview', [ReportController::class, 'preview'])->name('preview');
    Route::get('/{report}', [ReportController::class, 'show'])->name('show');
    Route::put('/{report}', [ReportController::class, 'update'])->name('update');
    Route::post('/{report}/submit', [ReportController::class, 'submit'])->name('submit');
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
    Route::patch('/users/{user}/role', [SuperAdminController::class, 'updateRole'])->name('users.role.update');
    Route::get('/payment-settings', [SuperAdminController::class, 'paymentSettings'])->name('payment-settings.index');
    Route::post('/payment-settings', [SuperAdminController::class, 'createInitialPaymentSetting'])->name('payment-settings.store');
    Route::post('/payment-settings/requests/{paymentSettingChangeRequest}/review', [SuperAdminController::class, 'reviewPaymentSettingChange'])->name('payment-settings.requests.review');
    Route::get('/reports', [SuperAdminReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/{report}', [SuperAdminReportController::class, 'show'])->name('reports.show');
    Route::post('/reports/{report}/review', [SuperAdminReportController::class, 'review'])->name('reports.review');
});
