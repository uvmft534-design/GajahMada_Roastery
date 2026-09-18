<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard_Admin', [
            'section' => 'products',
            'products' => Product::query()->withVariantSummary()->withAvg('reviews', 'rating')->withCount('reviews')->latest('product_id')->get(),
            'categories' => ProductCategory::query()->orderBy('name')->pluck('name')->values(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'category' => 'required|string|exists:product_categories,name',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'variants' => 'required|array|min:1',
            'variants.*.weight_grams' => 'required|integer|in:200,1000|distinct',
            'variants.*.price' => 'required|integer|min:1',
            'variants.*.stock' => 'required|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $variants = $validated['variants'];
        unset($validated['variants']);

        // Legacy columns remain populated only because the existing schema requires them.
        // All sale-time price and stock decisions use product_variants.
        $validated['price'] = $variants[0]['price'];
        $validated['stock'] = $variants[0]['stock'];
        $validated['weight_grams'] = $variants[0]['weight_grams'];

        $product = Product::create($validated);
        foreach ($variants as $variant) {
            $product->variants()->create($variant);
        }

        return redirect()->back()->with('success', 'Produk berhasil ditambahkan!');
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'category' => 'required|string|exists:product_categories,name',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'variants' => 'required|array|min:1',
            'variants.*.weight_grams' => 'required|integer|min:1|distinct',
            'variants.*.price' => 'required|integer|min:1',
            'variants.*.stock' => 'required|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $variants = $validated['variants'];
        unset($validated['variants']);

        $product->update($validated);
        foreach ($variants as $variant) {
            $product->variants()->updateOrCreate(
                ['weight_grams' => $variant['weight_grams']],
                ['price' => $variant['price'], 'stock' => $variant['stock']],
            );
        }

        return redirect()->back()->with('success', 'Produk berhasil diupdate!');
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return redirect()->back()->with('success', 'Produk berhasil dihapus!');
    }
}
