<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(), 'order_number' => 'ROAST-'.strtoupper(Str::random(8)),
            'status' => 'pending', 'shipping_method' => 'regular', 'payment_method' => 'virtual_account',
            'payment_status' => 'unpaid', 'subtotal' => 10000, 'delivery_fee' => 25000,
            'total_amount' => 35000,
        ];
    }
}
