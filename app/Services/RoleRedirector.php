<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\RedirectResponse;

class RoleRedirector
{
    public function redirect(User $user): RedirectResponse
    {
        return redirect()->route(match ($user->role) {
            'customer' => 'dashboard',
            'admin' => 'admin.dashboard',
            'courier' => 'courier.dashboard',
            'super_admin' => 'super-admin.dashboard',
            default => abort(403),
        });
    }
}
