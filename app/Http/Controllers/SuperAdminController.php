<?php

namespace App\Http\Controllers;

use App\Models\PaymentSetting;
use App\Models\PaymentSettingChangeRequest;
use App\Models\RoleChangeLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function dashboard(): Response
    {
        return Inertia::render('SuperAdmin/Dashboard', [
            'userCount' => User::count(),
        ]);
    }

    public function users(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        return Inertia::render('SuperAdmin/Users', [
            'users' => User::query()
                ->when($search, fn ($query) => $query->where(fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")))
                ->latest()->get(['id', 'name', 'email', 'role', 'google_id', 'created_at']),
            'filters' => ['search' => $search],
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate(['role' => ['required', 'in:customer,admin,courier']]);

        // Super Admin accounts are never editable via this ordinary role endpoint.
        abort_if($user->isSuperAdmin(), 403, 'Role Super Admin tidak dapat diubah dari endpoint ini.');

        if ($user->role !== $validated['role']) {
            DB::transaction(function () use ($request, $user, $validated): void {
                $oldRole = $user->role;

                $user->update(['role' => $validated['role']]);

                RoleChangeLog::create([
                    'target_user_id' => $user->id,
                    'changed_by' => $request->user()->id,
                    'old_role' => $oldRole,
                    'new_role' => $validated['role'],
                ]);
            });
        }

        return back()->with('success', 'Role pengguna berhasil diperbarui.');
    }

    public function paymentSettings(): Response
    {
        return Inertia::render('SuperAdmin/PaymentSettings', [
            'activeSetting' => PaymentSetting::with('creator')->where('is_active', true)->first(),
            'history' => PaymentSetting::with('creator')->latest()->get(),
            'requests' => PaymentSettingChangeRequest::with(['requester', 'reviewer', 'currentPaymentSetting'])->latest()->get(),
        ]);
    }

    public function createInitialPaymentSetting(Request $request): RedirectResponse
    {
        $data = $request->validate(['bank_name' => 'required|string|max:100', 'account_name' => 'required|string|max:255', 'account_number' => 'required|string|max:100']);
        DB::transaction(function () use ($data, $request): void {
            // Lock the setting set before testing so two initial requests cannot both activate one.
            abort_if(PaymentSetting::lockForUpdate()->where('is_active', true)->exists(), 422, 'Payment Account aktif sudah tersedia.');
            PaymentSetting::create($data + ['is_active' => true, 'created_by' => $request->user()->id]);
        });

        return back()->with('success', 'Payment Account berhasil diaktifkan.');
    }

    public function reviewPaymentSettingChange(Request $request, PaymentSettingChangeRequest $paymentSettingChangeRequest): RedirectResponse
    {
        $data = $request->validate(['action' => 'required|in:approve,reject', 'review_note' => 'nullable|string|max:1000']);
        if ($data['action'] === 'reject' && blank($data['review_note'] ?? null)) {
            return back()->withErrors(['review_note' => 'Alasan penolakan wajib diisi.']);
        }
        DB::transaction(function () use ($request, $paymentSettingChangeRequest, $data): void {
            $change = PaymentSettingChangeRequest::lockForUpdate()->findOrFail($paymentSettingChangeRequest->id);
            abort_if($change->status !== 'pending', 422, 'Request ini tidak lagi menunggu review.');
            $active = PaymentSetting::where('is_active', true)->lockForUpdate()->first();
            if ($data['action'] === 'approve') {
                abort_if(! $active || $active->id !== $change->current_payment_setting_id, 422, 'Request sudah tidak sesuai dengan Payment Account aktif.');
                $active->update(['is_active' => false]);
                PaymentSetting::create(['bank_name' => $change->proposed_bank_name, 'account_name' => $change->proposed_account_name, 'account_number' => $change->proposed_account_number, 'is_active' => true, 'created_by' => $request->user()->id]);
            }
            $change->update(['status' => $data['action'] === 'approve' ? 'approved' : 'rejected', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'review_note' => $data['review_note'] ?? null]);
        });

        return back()->with('success', 'Request Payment Account telah direview.');
    }
}
