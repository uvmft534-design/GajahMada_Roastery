<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderItem extends Model
{
    protected $primaryKey = 'order_item_id';

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_category',
        'qty',
        'unit_price',
        'subtotal',
        'brew_method',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(ProductReview::class, 'order_item_id', 'order_item_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'order_item_id', 'order_item_id');
    }
}
