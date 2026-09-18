<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Index', $this->catalogProps($request));
    }

    public function dashboard(Request $request)
    {
        return Inertia::render('Dashboard', $this->catalogProps($request));
    }

    public function show($product_id)
    {
        // Langsung cari pakai product_id yang dikirim dari route
        $product = Product::query()->withVariantSummary()->withAvg('reviews', 'rating')->withCount('reviews')->where('product_id', $product_id)->first();

        if (! $product) {
            abort(404, 'Produk tidak ditemukan.');
        }

        return Inertia::render('Show', [
            'product' => $product,
        ]);
    }

    public function espressoCollection()
    {
        return Inertia::render('Collections/Espresso');
    }

    public function filterCollection()
    {
        return Inertia::render('Collections/Filter');
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

    private function catalogProps(Request $request): array
    {
        $categories = ProductCategory::query()->orderBy('name')->pluck('name')->values();
        $selectedCategory = trim((string) $request->query('category', ''));
        $selectedCategory = $categories->contains($selectedCategory) ? $selectedCategory : null;

        return [
            'products' => Product::query()->withVariantSummary()
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->when($selectedCategory, fn ($query) => $query->where('category', $selectedCategory))
                ->latest()
                ->get(),
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
        ];
    }
}
