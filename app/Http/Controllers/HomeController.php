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
            'products' => Product::latest()->get(),
        ]);
    }

    public function dashboard()
    {
        return Inertia::render('Dashboard', [
            'products' => Product::latest()->get(),
        ]);
    }

    public function show($product_id)
    {
        // Langsung cari pakai product_id yang dikirim dari route
        $product = Product::where('product_id', $product_id)->first();

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

    public function rate(Request $request, $product_id)
    {
        $product = Product::where('product_id', $product_id)->first();

        if (! $product) {
            abort(404, 'Produk tidak ditemukan.');
        }

        $validated = $request->validate([
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $product->addRating((float) $validated['rating']);

        return response()->json([
            'message' => 'Rating produk berhasil diperbarui.',
            'rating' => $product->rating,
            'rating_count' => $product->rating_count,
        ]);
    }
}
