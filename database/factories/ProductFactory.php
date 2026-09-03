<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'product_name' => fake()->unique()->words(2, true),
            'category' => 'Arabica',
            'price' => 50000,
            'stock' => 10,
            'weight_grams' => 250,
        ];
    }
}
