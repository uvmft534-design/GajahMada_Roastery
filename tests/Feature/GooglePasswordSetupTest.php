<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GooglePasswordSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_linked_user_sees_google_connected_profile_state(): void
    {
        $user = User::factory()->create(['google_id' => 'google-user-id']);

        $this->actingAs($user)->get(route('profile.edit'))
            ->assertInertia(fn ($page) => $page
                ->component('Profile/Edit')
                ->where('googleLinked', true));
    }

    public function test_google_linked_user_can_request_a_password_setup_link_for_their_own_email(): void
    {
        Notification::fake();
        $user = User::factory()->create(['google_id' => 'google-user-id']);
        $other = User::factory()->create();

        $this->actingAs($user)
            ->post(route('password.setup-link'), ['email' => $other->email])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHas('status', 'password-setup-link-sent');

        Notification::assertSentTo($user, ResetPassword::class);
        Notification::assertNotSentTo($other, ResetPassword::class);
    }

    public function test_guest_cannot_request_a_password_setup_link(): void
    {
        $this->post(route('password.setup-link'))->assertRedirect(route('login'));
    }

    public function test_unverified_user_cannot_request_a_password_setup_link(): void
    {
        $user = User::factory()->unverified()->create(['google_id' => 'google-user-id']);

        $this->actingAs($user)
            ->post(route('password.setup-link'))
            ->assertRedirect(route('verification.notice'));
    }
}
