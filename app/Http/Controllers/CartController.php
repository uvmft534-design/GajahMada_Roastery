<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Cart/Index', [
            'items' => $this->cartFor($request)->items()->with(['product.variants', 'variant'])->latest()->get(),
        ]);
    }

    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'qty' => 'nullable|integer|min:1|max:100',
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'brew_method' => 'nullable|in:espresso,filter',
            'stay_on_product' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($request, $product, $validated) {
            $variant = ProductVariant::query()->lockForUpdate()->findOrFail($validated['product_variant_id']);
            abort_unless($variant->product_id === $product->product_id, 422, 'Berat yang dipilih tidak sesuai dengan produk.');
            abort_if($variant->stock < 1, 422, 'Berat produk yang dipilih sedang tidak tersedia.');

            $cart = $this->cartFor($request);
            $quantity = $validated['qty'] ?? 1;
            $brewMethod = $validated['brew_method'] ?? 'filter';
            $item = CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('product_id', $product->product_id)
                ->where('product_variant_id', $variant->id)
                ->where('brew_method', $brewMethod)
                ->lockForUpdate()
                ->first();

            if ($item) {
                $item->update(['qty' => min($item->qty + $quantity, $variant->stock)]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->product_id,
                    'product_variant_id' => $variant->id,
                    'qty' => min($quantity, $variant->stock),
                    'brew_method' => $brewMethod,
                ]);
            }
        });

        if ($request->boolean('stay_on_product')) {
            return back()->with('success', 'Produk ditambahkan ke keranjang.');
        }

        return redirect()->route('cart.index')->with('success', 'Produk ditambahkan ke keranjang.');
    }

    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        $validated = $request->validate([
            'qty' => 'required|integer|min:1|max:100',
            'brew_method' => 'required|in:espresso,filter',
            'product_variant_id' => 'required|integer|exists:product_variants,id',
        ]);

        DB::transaction(function () use ($request, $cartItem, $validated) {
            $item = $this->ownedItem($request, $cartItem);
            $variant = ProductVariant::query()->lockForUpdate()->findOrFail($validated['product_variant_id']);
            abort_unless($variant->product_id === $item->product_id, 422, 'Berat yang dipilih tidak sesuai dengan produk.');
            abort_if($validated['qty'] > $variant->stock, 422, "Jumlah melebihi stok berat yang tersedia ({$variant->stock} pcs).");

            $duplicate = CartItem::query()
                ->where('cart_id', $item->cart_id)
                ->where('product_id', $item->product_id)
                ->where('product_variant_id', $variant->id)
                ->where('brew_method', $validated['brew_method'])
                ->whereKeyNot($item->id)
                ->lockForUpdate()
                ->first();

            if ($duplicate) {
                abort_if($duplicate->qty + $validated['qty'] > $variant->stock, 422, "Jumlah melebihi stok berat yang tersedia ({$variant->stock} pcs).");
                $duplicate->increment('qty', $validated['qty']);
                $item->delete();

                return;
            }

            $item->update($validated);
        });

        return back()->with('success', 'Keranjang diperbarui.');
    }

    public function destroy(Request $request, CartItem $cartItem): RedirectResponse
    {
        $this->ownedItem($request, $cartItem)->delete();

        return back()->with('success', 'Produk dihapus dari keranjang.');
    }

    private function cartFor(Request $request): Cart
    {
        return Cart::firstOrCreate(['user_id' => $request->user()->id]);
    }

    private function ownedItem(Request $request, CartItem $cartItem): CartItem
    {
        return CartItem::query()
            ->whereKey($cartItem->id)
            ->whereHas('cart', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();
    }
}
