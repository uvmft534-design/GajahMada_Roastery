<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    public const TYPES = ['sales', 'orders', 'payments', 'deliveries', 'inventory'];

    public const EDITABLE_STATUSES = ['draft', 'revision_requested'];

    protected $fillable = ['report_number', 'created_by', 'type', 'title', 'period_start', 'period_end', 'admin_note', 'summary_data', 'status', 'generated_at', 'submitted_at', 'reviewed_by', 'reviewed_at', 'review_note'];

    protected function casts(): array
    {
        return ['summary_data' => 'array', 'period_start' => 'date', 'period_end' => 'date', 'generated_at' => 'datetime', 'submitted_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
