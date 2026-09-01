<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentSettingChangeRequest extends Model
{
    protected $fillable = ['requested_by', 'current_payment_setting_id', 'proposed_bank_name', 'proposed_account_name', 'proposed_account_number', 'reason', 'status', 'reviewed_by', 'review_note', 'reviewed_at'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function currentPaymentSetting(): BelongsTo
    {
        return $this->belongsTo(PaymentSetting::class, 'current_payment_setting_id');
    }
}
