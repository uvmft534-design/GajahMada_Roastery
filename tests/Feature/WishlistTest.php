<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_add_retrieve_and_remove_their_wishlist_product(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();

        $this->actingAs($customer)->post(route('wishlist.store', $product))->assertRedirect();
        $this->assertDatabaseHas('wishlists', ['user_id' => $customer->id, 'product_id' => $product->product_id]);

        $this->actingAs($customer)->getJson(route('wishlist.index'))
            ->assertOk()
            ->assertJsonPath('items.0.product_id', $product->product_id);

        $this->actingAs($customer)->delete(route('wishlist.destroy', $product))->assertRedirect();
        $this->assertDatabaseMissing('wishlists', ['user_id' => $customer->id, 'product_id' => $product->product_id]);
    }

    public function test_wishlist_is_scoped_to_the_authenticated_customer_and_persists_between_sessions(): void
    {
        $customerA = User::factory()->create(['role' => 'customer']);
        $customerB = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();

        $this->actingAs($customerA)->post(route('wishlist.store', $product));
        $this->post(route('logout'));

        $this->actingAs($customerA)->getJson(route('wishlist.index'))
            ->assertOk()
            ->assertJsonPath('items.0.product_id', $product->product_id);
        $this->actingAs($customerB)->getJson(route('wishlist.index'))
            ->assertOk()
            ->assertJsonCount(0, 'items');
        $this->actingAs($customerB)->delete(route('wishlist.destroy', $product))->assertNotFound();
    }

    public function test_guest_cannot_access_wishlist_endpoints_and_duplicates_are_prevented(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();

        $this->get(route('wishlist.index'))->assertRedirect(route('login'));
        $this->post(route('wishlist.store', $product))->assertRedirect(route('login'));
        $this->delete(route('wishlist.destroy', $product))->assertRedirect(route('login'));

        $this->actingAs($customer)->post(route('wishlist.store', $product));
        $this->actingAs($customer)->post(route('wishlist.store', $product));
        $this->assertSame(1, Wishlist::query()->where('user_id', $customer->id)->where('product_id', $product->product_id)->count());
    }

    public function test_deleted_product_removes_its_wishlist_entries_and_catalog_remains_available(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();

        $this->actingAs($customer)->post(route('wishlist.store', $product));
        $product->delete();

        $this->assertDatabaseMissing('wishlists', ['user_id' => $customer->id, 'product_id' => $product->product_id]);
        $this->actingAs($customer)->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page->component('Dashboard')->where('wishlist', []));
    }
}
