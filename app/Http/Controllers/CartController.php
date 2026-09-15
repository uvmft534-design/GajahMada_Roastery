<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
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
            'items' => $this->cartFor($request)->items()->with('product')->latest()->get(),
        ]);
    }

    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'qty' => 'nullable|integer|min:1|max:100',
            'brew_method' => 'nullable|in:espresso,filter',
            'stay_on_product' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($request, $product, $validated) {
            $product = Product::query()->lockForUpdate()->findOrFail($product->product_id);
            abort_if($product->stock < 1, 422, 'Produk sedang tidak tersedia.');

            $cart = $this->cartFor($request);
            $quantity = $validated['qty'] ?? 1;
            $brewMethod = $validated['brew_method'] ?? 'filter';
            $item = CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('product_id', $product->product_id)
                ->where('brew_method', $brewMethod)
                ->lockForUpdate()
                ->first();

            if ($item) {
                $item->update(['qty' => min($item->qty + $quantity, $product->stock)]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->product_id,
                    'qty' => min($quantity, $product->stock),
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
        ]);

        DB::transaction(function () use ($request, $cartItem, $validated) {
            $item = $this->ownedItem($request, $cartItem);
            $product = Product::query()->lockForUpdate()->findOrFail($item->product_id);
            abort_if($validated['qty'] > $product->stock, 422, "Jumlah melebihi stok yang tersedia ({$product->stock} pcs).");

            $duplicate = CartItem::query()
                ->where('cart_id', $item->cart_id)
                ->where('product_id', $item->product_id)
                ->where('brew_method', $validated['brew_method'])
                ->whereKeyNot($item->id)
                ->lockForUpdate()
                ->first();

            if ($duplicate) {
                abort_if($duplicate->qty + $validated['qty'] > $product->stock, 422, "Jumlah melebihi stok yang tersedia ({$product->stock} pcs).");
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
