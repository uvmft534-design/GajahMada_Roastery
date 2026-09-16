<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $primaryKey = 'order_id';

    protected $fillable = [
        'user_id',
        'courier_id',
        'order_number',
        'status',
        'shipping_method',
        'payment_method',
        'payment_status',
        'payment_proof',
        'va_number',
        'payment_bank_name',
        'payment_account_name',
        'payment_review_note',
        'payment_reviewed_by',
        'payment_reviewed_at',
        'customer_name',
        'customer_phone',
        'customer_address',
        'customer_note',
        'delivery_note',
        'subtotal',
        'delivery_fee',
        'total_amount',
        'tracking_number',
        'stock_released_at',
        'processing_at',
        'packed_at',
        'pickup_requested_at',
        'picked_up_at',
        'shipped_at',
        'delivered_at',
        'completed_at',
        'admin_seen_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'order_id');
    }

    public function paymentReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payment_reviewed_by');
    }

    public function courier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'courier_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class, 'order_id', 'order_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'order_id', 'order_id');
    }

    protected function casts(): array
    {
        return [
            'stock_released_at' => 'datetime',
            'payment_reviewed_at' => 'datetime',
            'processing_at' => 'datetime',
            'packed_at' => 'datetime',
            'pickup_requested_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'completed_at' => 'datetime',
            'admin_seen_at' => 'datetime',
        ];
    }

    /**
     * Scope orders whose payment has been approved and which were not cancelled.
     */
    public function scopeRevenueValid(Builder $query): Builder
    {
        return $query
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'cancelled');
    }
}
