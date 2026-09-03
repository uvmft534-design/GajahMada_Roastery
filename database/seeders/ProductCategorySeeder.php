<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Kategori A', 'Kategori B', 'Kategori C', 'Kategori D'] as $name) {
            ProductCategory::firstOrCreate(['name' => $name]);
        }
    }
}
