<?php

namespace App\Http\Controllers;

use App\Models\PaymentSetting;
use App\Models\PaymentSettingChangeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentSettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/PaymentSettings', [
            'activeSetting' => PaymentSetting::where('is_active', true)->first(),
            'requests' => PaymentSettingChangeRequest::with(['requester', 'reviewer'])->latest()->get(),
            'hasPendingRequest' => PaymentSettingChangeRequest::where('status', 'pending')->exists(),
        ]);
    }

    public function requestChange(Request $request): RedirectResponse
    {
        if (PaymentSettingChangeRequest::where('status', 'pending')->exists()) {
            return back()->withErrors(['payment_setting' => 'Masih terdapat perubahan Payment Account yang menunggu persetujuan Super Admin.']);
        }
        $validated = $request->validate([
            'proposed_bank_name' => 'required|string|max:100', 'proposed_account_name' => 'required|string|max:255',
            'proposed_account_number' => 'required|string|max:100', 'reason' => 'required|string|max:1000',
        ]);
        DB::transaction(function () use ($validated, $request): void {
            // The active-setting row is a shared lock target, serializing concurrent submissions.
            $active = PaymentSetting::where('is_active', true)->lockForUpdate()->first();
            abort_if(PaymentSettingChangeRequest::where('status', 'pending')->lockForUpdate()->exists(), 422, 'Masih terdapat perubahan Payment Account yang menunggu persetujuan Super Admin.');
            PaymentSettingChangeRequest::create($validated + ['requested_by' => $request->user()->id, 'current_payment_setting_id' => $active?->id, 'status' => 'pending']);
        });

        return back()->with('success', 'Permintaan perubahan Payment Account telah dikirim.');
    }
}
