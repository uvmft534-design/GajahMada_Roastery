<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductCategoryController extends Controller
{
    public function store(Request $request)
    {
        $data = $this->validatedName($request);

        ProductCategory::create($data);

        return redirect()->back()->with('success', 'Kategori produk berhasil ditambahkan.');
    }

    public function update(Request $request, ProductCategory $category)
    {
        $data = $this->validatedName($request, $category);
        $oldName = $category->name;

        DB::transaction(function () use ($category, $data, $oldName) {
            $category->update($data);
            Product::query()->where('category', $oldName)->update(['category' => $data['name']]);
        });

        return redirect()->back()->with('success', 'Kategori dan produk terkait berhasil diperbarui.');
    }

    public function destroy(ProductCategory $category)
    {
        if (Product::query()->where('category', $category->name)->exists()) {
            return redirect()->back()->withErrors([
                'category' => 'Kategori tidak dapat dihapus karena masih digunakan oleh produk.',
            ]);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Kategori produk berhasil dihapus.');
    }

    private function validatedName(Request $request, ?ProductCategory $category = null): array
    {
        $request->merge(['name' => trim((string) $request->input('name'))]);

        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('product_categories', 'name')->ignore($category),
            ],
        ]);
    }
}
