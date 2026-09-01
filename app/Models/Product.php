<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $primaryKey = 'product_id';

    protected $fillable = [
        'product_name',
        'category',
        'price',
        'stock',
        'description',
        'image',
        'rating',
        'rating_count',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
        'rating' => 'float',
        'rating_count' => 'integer',
    ];

    public function addRating(float $rating): void
    {
        $rating = max(0, min(5, $rating));
        $currentCount = $this->rating_count ?? 0;
        $currentAverage = $this->rating ?? 0;
        $newCount = $currentCount + 1;
        $newAverage = $newCount > 0
            ? round((($currentAverage * $currentCount) + $rating) / $newCount, 1)
            : $rating;

        $this->rating = $newAverage;
        $this->rating_count = $newCount;
        $this->save();
    }
}
