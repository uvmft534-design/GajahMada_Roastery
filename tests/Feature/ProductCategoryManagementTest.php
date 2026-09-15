<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_categories_and_renaming_keeps_products_connected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.product-categories.store'), ['name' => ' Arabika '])
            ->assertRedirect();

        $category = ProductCategory::where('name', 'Arabika')->firstOrFail();
        Product::create([
            'product_name' => 'Gayo',
            'category' => 'Arabika',
            'price' => 75000,
            'stock' => 8,
        ]);

        $this->actingAs($admin)->put(route('admin.product-categories.update', $category), ['name' => 'Arabika Nusantara'])
            ->assertRedirect();

        $this->assertDatabaseHas('product_categories', ['id' => $category->id, 'name' => 'Arabika Nusantara']);
        $this->assertDatabaseHas('products', ['product_name' => 'Gayo', 'category' => 'Arabika Nusantara']);
    }

    public function test_category_in_use_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = ProductCategory::create(['name' => 'Robusta']);
        Product::create(['product_name' => 'Temanggung', 'category' => 'Robusta', 'price' => 60000, 'stock' => 2]);

        $this->actingAs($admin)->delete(route('admin.product-categories.destroy', $category))
            ->assertSessionHasErrors('category');

        $this->assertDatabaseHas('product_categories', ['id' => $category->id]);
    }
}
