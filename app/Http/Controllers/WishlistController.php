<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['items' => $this->itemsFor($request)]);
    }

    public function store(Request $request, Product $product): RedirectResponse
    {
        Wishlist::firstOrCreate(['user_id' => $request->user()->id, 'product_id' => $product->product_id]);

        return back();
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $deleted = Wishlist::query()
            ->where('user_id', $request->user()->id)
            ->where('product_id', $product->product_id)
            ->delete();

        abort_unless($deleted, 404);

        return back();
    }

    private function itemsFor(Request $request)
    {
        return $request->user()->wishlistProducts()
            ->withVariantSummary()
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->latest('wishlists.created_at')
            ->get();
    }
}
