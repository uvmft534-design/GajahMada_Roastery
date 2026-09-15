<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['status' => 'nullable|in:submitted,in_review,resolved,rejected', 'search' => 'nullable|string|max:255']);
        $complaints = Complaint::query()->with(['order:order_id,order_number', 'item:order_item_id,product_name', 'customer:id,name'])->latest('submitted_at')
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query->whereHas('order', fn ($query) => $query->where('order_number', 'like', "%{$search}%"))->orWhereHas('customer', fn ($query) => $query->where('name', 'like', "%{$search}%"))->orWhere('description', 'like', "%{$search}%")))
            ->paginate(15)->withQueryString();

        return Inertia::render('Admin/Complaints/Index', ['complaints' => $complaints, 'filters' => $filters]);
    }

    public function update(Request $request, Complaint $complaint)
    {
        $data = $request->validate(['status' => 'required|in:submitted,in_review,resolved,rejected', 'admin_note' => 'nullable|string|max:3000']);
        $update = ['status' => $data['status'], 'admin_note' => $data['admin_note'] ?? null, 'handled_by' => $request->user()->id];
        if (in_array($data['status'], ['resolved', 'rejected'], true)) $update['resolved_at'] = now();
        if (in_array($data['status'], ['submitted', 'in_review'], true)) $update['resolved_at'] = null;
        $complaint->update($update);

        return back()->with('success', 'Status komplain berhasil diperbarui.');
    }
}
