<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_completed_order_owner_can_submit_rating_one_to_five_with_optional_comment(): void
    {
        [$owner, $order, $item] = $this->reviewableOrder();

        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 5])->assertRedirect();
        $this->assertDatabaseHas('product_reviews', ['user_id' => $owner->id, 'order_item_id' => $item->order_item_id, 'rating' => 5, 'comment' => null]);

        [$secondOwner, $secondOrder, $secondItem] = $this->reviewableOrder();
        $this->actingAs($secondOwner)->post(route('orders.items.review.store', [$secondOrder, $secondItem]), ['rating' => 1, 'comment' => 'Tidak sesuai selera'])->assertRedirect();
        $this->assertDatabaseHas('product_reviews', ['user_id' => $secondOwner->id, 'order_item_id' => $secondItem->order_item_id, 'rating' => 1]);
    }

    public function test_rating_must_be_between_one_and_five_and_comment_is_limited(): void
    {
        [$owner, $order, $item] = $this->reviewableOrder();

        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 0])->assertSessionHasErrors('rating');
        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 6])->assertSessionHasErrors('rating');
        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 4, 'comment' => str_repeat('a', 1001)])->assertSessionHasErrors('comment');
    }

    public function test_review_is_rejected_before_completed_for_non_owner_and_for_wrong_item(): void
    {
        [$owner, $order, $item] = $this->reviewableOrder('delivered');
        $other = User::factory()->create(['role' => 'customer']);
        [, $otherOrder, $otherItem] = $this->reviewableOrder();

        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 4])->assertStatus(422);
        $order->update(['status' => 'completed']);
        $this->actingAs($other)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 4])->assertForbidden();
        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $otherItem]), ['rating' => 4])->assertStatus(422);
    }

    public function test_duplicate_review_and_non_customer_roles_are_rejected(): void
    {
        [$owner, $order, $item] = $this->reviewableOrder();
        ProductReview::create(['user_id' => $owner->id, 'product_id' => $item->product_id, 'order_id' => $order->order_id, 'order_item_id' => $item->order_item_id, 'rating' => 4]);
        $courier = User::factory()->create(['role' => 'courier']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($owner)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 5])->assertStatus(422);
        $this->actingAs($courier)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 5])->assertForbidden();
        $this->actingAs($admin)->post(route('orders.items.review.store', [$order, $item]), ['rating' => 5])->assertForbidden();
    }

    public function test_product_review_aggregate_and_item_relationship_are_correct(): void
    {
        $product = Product::create(['product_name' => 'Gayo', 'price' => 50000, 'stock' => 10]);
        foreach ([5, 4, 3] as $rating) {
            [$owner, $order, $item] = $this->reviewableOrder('completed', $product);
            ProductReview::create(['user_id' => $owner->id, 'product_id' => $product->product_id, 'order_id' => $order->order_id, 'order_item_id' => $item->order_item_id, 'rating' => $rating]);
        }

        $ratedProduct = Product::withAvg('reviews', 'rating')->withCount('reviews')->findOrFail($product->product_id);
        $this->assertSame(3, $ratedProduct->reviews_count);
        $this->assertEquals(4.0, $ratedProduct->reviews_avg_rating);
        $this->assertNotNull(OrderItem::firstOrFail()->review);
    }

    public function test_legacy_direct_product_rating_endpoint_is_not_available(): void
    {
        $product = Product::create(['product_name' => 'Gayo', 'price' => 50000, 'stock' => 10]);

        $this->post("/products/{$product->product_id}/rating", ['rating' => 5])->assertNotFound();
        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'rating' => 0, 'rating_count' => 0]);
    }

    private function reviewableOrder(string $status = 'completed', ?Product $product = null): array
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $product ??= Product::create(['product_name' => 'Product '.uniqid(), 'price' => 50000, 'stock' => 10]);
        $order = Order::factory()->create(['user_id' => $owner->id, 'status' => $status]);
        $item = OrderItem::create(['order_id' => $order->order_id, 'product_id' => $product->product_id, 'product_name' => $product->product_name, 'qty' => 1, 'unit_price' => 50000, 'subtotal' => 50000]);

        return [$owner, $order, $item];
    }
}
