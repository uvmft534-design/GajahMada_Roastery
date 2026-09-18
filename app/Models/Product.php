<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'weight_grams',
        'description',
        'image',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
        'weight_grams' => 'integer',
    ];

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class, 'product_id', 'product_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id', 'product_id');
    }

    public function scopeWithVariantSummary($query)
    {
        return $query
            ->with(['variants' => fn ($variants) => $variants->orderBy('weight_grams')])
            ->addSelect([
                'variant_stock_total' => ProductVariant::query()
                    ->selectRaw('COALESCE(SUM(stock), 0)')
                    ->whereColumn('product_id', 'products.product_id'),
                'variant_price_from' => ProductVariant::query()
                    ->selectRaw('MIN(price)')
                    ->whereColumn('product_id', 'products.product_id')
                    ->where('stock', '>', 0),
            ]);
    }

    public function scopeWithLowVariantStock($query, int $threshold)
    {
        return $query->whereRaw(
            '(SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_variants.product_id = products.product_id) <= ?',
            [$threshold],
        );
    }
}
