<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    protected $fillable = [
        'name',
        'type',
        'description',
        'delivery_fee',
    ];

    protected function casts(): array
    {
        return [
            'delivery_fee' => 'integer',
        ];
    }
}
