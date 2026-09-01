<?php

use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/products/{id}', [HomeController::class, 'show'])->name('products.show');
Route::post('/products/{id}/rating', [HomeController::class, 'rate'])->name('products.rate');

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
    Route::post('/orders/{order}/proof', [OrderController::class, 'uploadProof'])->name('orders.proof');

    Route::get('/checkout/{product_id}', [OrderController::class, 'checkout'])->name('checkout');
    Route::post('/orders/checkout', [OrderController::class, 'store'])->name('orders.store');

});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin,super_admin'])->group(function () {
    Route::get('/admin/dashboard', [OrderController::class, 'adminIndex'])->name('admin.dashboard');
    Route::post('/admin/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('admin.orders.status');
    Route::post('/admin/orders/{order}/va', [OrderController::class, 'updateVaNumber'])->name('admin.orders.va');
    Route::post('/admin/orders/{order}/approve-payment', [OrderController::class, 'approvePayment'])->name('admin.orders.approvePayment');
    Route::post('/admin/products', [ProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/products/{id}', [ProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy'])->name('admin.products.destroy');
});

Route::middleware(['auth', 'verified', 'role:courier'])->get('/courier/dashboard', fn () => Inertia::render('Courier/Dashboard'))->name('courier.dashboard');

Route::middleware(['auth', 'verified', 'role:super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [SuperAdminController::class, 'users'])->name('users.index');
    Route::patch('/users/{user}/role', [SuperAdminController::class, 'updateRole'])->name('users.role.update');
});
