<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShippingMethodController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/ShippingMethods/Index', [
            'shippingMethods' => ShippingMethod::query()->latest()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        ShippingMethod::create($this->validated($request));

        return back()->with('success', 'Metode pengiriman berhasil ditambahkan.');
    }

    public function update(Request $request, ShippingMethod $shippingMethod): RedirectResponse
    {
        $shippingMethod->update($this->validated($request, $shippingMethod));

        return back()->with('success', 'Metode pengiriman berhasil diperbarui.');
    }

    public function destroy(ShippingMethod $shippingMethod): RedirectResponse
    {
        $shippingMethod->delete();

        return back()->with('success', 'Metode pengiriman berhasil dihapus.');
    }

    private function validated(Request $request, ?ShippingMethod $shippingMethod = null): array
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
            'type' => trim((string) $request->input('type')),
        ]);

        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('shipping_methods', 'name')->ignore($shippingMethod)],
            'type' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'delivery_fee' => ['required', 'integer', 'min:0'],
        ]);
    }
}
