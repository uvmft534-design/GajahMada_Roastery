<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Index', [
            'products' => Product::query()->withAvg('reviews', 'rating')->withCount('reviews')->latest()->get(),
        ]);
    }

    public function dashboard()
    {
        return Inertia::render('Dashboard', [
            'products' => Product::query()->withAvg('reviews', 'rating')->withCount('reviews')->latest()->get(),
        ]);
    }

    public function show($product_id)
    {
        // Langsung cari pakai product_id yang dikirim dari route
        $product = Product::query()->withAvg('reviews', 'rating')->withCount('reviews')->where('product_id', $product_id)->first();

        if (! $product) {
            abort(404, 'Produk tidak ditemukan.');
        }

        return Inertia::render('Show', [
            'product' => $product,
        ]);
    }

    public function checkout(Request $request, $product_id)
    {
        $product = Product::where('product_id', $product_id)->first();

        if (! $product) {
            abort(404, 'Produk tidak ditemukan.');
        }

        $qty = (int) $request->query('qty', 1);
        if ($qty < 1) {
            $qty = 1;
        }

        return Inertia::render('Checkout', [
            'product' => $product,
            'qty' => $qty,
        ]);
    }
}
