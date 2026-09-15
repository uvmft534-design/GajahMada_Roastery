<?php
namespace App\Http\Controllers;
use App\Models\Complaint;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ComplaintController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $this->authorize('view', $order);
        abort_unless($order->delivered_at && now()->lte($order->delivered_at->copy()->addDay()), 422, 'Komplain hanya dapat diajukan dalam 1×24 jam setelah pesanan sampai.');

        $data = $request->validate(['category' => 'required|in:product,delivery', 'order_item_id' => 'nullable|integer', 'description' => 'required|string|max:3000', 'evidences' => 'nullable|array|max:3', 'evidences.*' => 'image|mimes:jpeg,jpg,png,webp|max:4096']);
        if ($data['category'] === 'product') {
            abort_unless(! empty($data['order_item_id']) && $order->items()->whereKey($data['order_item_id'])->exists(), 422, 'Produk komplain tidak valid.');
        }

        $complaint = Complaint::create(['order_id' => $order->order_id, 'order_item_id' => $data['order_item_id'] ?? null, 'customer_id' => $request->user()->id, 'category' => $data['category'], 'description' => $data['description'], 'submitted_at' => now()]);
        foreach ($request->file('evidences', []) as $file) {
            $path = $file->store('complaint-evidence', 'local');
            $complaint->evidences()->create(['path' => $path, 'mime_type' => $file->getMimeType(), 'original_name' => $file->getClientOriginalName()]);
        }

        return redirect()->route('complaints.show', $complaint)->with('success', 'Komplain berhasil dikirim untuk ditinjau admin.');
    }

    public function show(Request $request, Complaint $complaint)
    {
        $this->ensureCanView($request, $complaint);
        $complaint->load(['order:order_id,order_number,delivered_at', 'item:order_item_id,product_name,qty', 'customer:id,name', 'handler:id,name', 'evidences', 'messages.user:id,name,role']);

        return Inertia::render('Complaints/Show', ['complaint' => $complaint, 'canManage' => $request->user()->canAccessAdmin()]);
    }

    public function reply(Request $request, Complaint $complaint)
    {
        $this->ensureCanView($request, $complaint);
        abort_if(in_array($complaint->status, ['resolved', 'rejected'], true), 422, 'Komplain ini sudah ditutup.');
        $data = $request->validate(['message' => 'required|string|max:3000']);
        $complaint->messages()->create(['user_id' => $request->user()->id, 'message' => $data['message']]);

        return back()->with('success', 'Pesan berhasil dikirim.');
    }

    public function evidence(Request $request, Complaint $complaint, int $evidence)
    {
        $this->ensureCanView($request, $complaint);
        $item = $complaint->evidences()->findOrFail($evidence);

        return Storage::disk('local')->response($item->path);
    }

    private function ensureCanView(Request $request, Complaint $complaint): void
    {
        abort_unless($complaint->customer_id === $request->user()->id || $request->user()->canAccessAdmin(), 403);
    }
}
