<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\GoogleAccountLinker;
use App\Services\RoleRedirector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = app(GoogleAccountLinker::class)->link(
                $googleUser->getEmail(), $googleUser->getId(), $googleUser->getName(),
            );

            Auth::login($user);
            $request->session()->regenerate();

            return app(RoleRedirector::class)->redirect($user);
        } catch (\Throwable $exception) {
            Log::error('Google OAuth login failed.', ['exception' => $exception]);

            return redirect()->route('login')->with('error', 'Login melalui Google gagal. Silakan coba lagi.');
        }
    }
}
