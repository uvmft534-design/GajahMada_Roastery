<?php

namespace App\Http\Controllers;

use App\Models\RoleChangeLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function dashboard(): Response
    {
        return Inertia::render('SuperAdmin/Dashboard', [
            'userCount' => User::count(),
        ]);
    }

    public function users(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        return Inertia::render('SuperAdmin/Users', [
            'users' => User::query()
                ->when($search, fn ($query) => $query->where(fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")))
                ->latest()->get(['id', 'name', 'email', 'role', 'google_id', 'created_at']),
            'filters' => ['search' => $search],
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate(['role' => ['required', 'in:customer,admin,courier']]);

        // Super Admin accounts are never editable via this ordinary role endpoint.
        abort_if($user->isSuperAdmin(), 403, 'Role Super Admin tidak dapat diubah dari endpoint ini.');

        if ($user->role !== $validated['role']) {
            DB::transaction(function () use ($request, $user, $validated): void {
                $oldRole = $user->role;

                $user->update(['role' => $validated['role']]);

                RoleChangeLog::create([
                    'target_user_id' => $user->id,
                    'changed_by' => $request->user()->id,
                    'old_role' => $oldRole,
                    'new_role' => $validated['role'],
                ]);
            });
        }

        return back()->with('success', 'Role pengguna berhasil diperbarui.');
    }
}
