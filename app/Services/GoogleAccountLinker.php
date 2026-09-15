<?php

namespace App\Services;

use App\Models\RoleChangeLog;
use App\Models\StaffAccess;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GoogleAccountLinker
{
    public function link(string $email, string $googleId, ?string $name): User
    {
        $email = mb_strtolower(trim($email));
        $linkedUser = User::where('google_id', $googleId)->first();
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($linkedUser && (! $user || $linkedUser->id !== $user->id)) {
            throw new \RuntimeException('Akun Google ini sudah terhubung ke pengguna lain.');
        }

        if (! $user) {
            $user = User::create([
                'name' => $name ?: 'Google User', 'email' => $email, 'google_id' => $googleId,
                'role' => 'customer', 'email_verified_at' => now(), 'password' => Hash::make(Str::random(48)),
            ]);
        } elseif ($user->google_id && $user->google_id !== $googleId) {
            throw new \RuntimeException('Email ini telah terhubung ke akun Google lain.');
        } else {
            $user->forceFill(['google_id' => $googleId, 'email_verified_at' => $user->email_verified_at ?? now()])->save();
        }

        $this->activateStaffAccess($user, $email);

        return $user;
    }

    private function activateStaffAccess(User $user, string $email): void
    {
        DB::transaction(function () use ($user, $email): void {
            $access = StaffAccess::query()
                ->where('email', $email)
                ->whereIn('status', ['pending', 'active'])
                ->lockForUpdate()
                ->first();

            if (! $access) {
                return;
            }

            if ($user->role !== $access->role) {
                $oldRole = $user->role;
                $user->update(['role' => $access->role]);
                RoleChangeLog::create([
                    'target_user_id' => $user->id,
                    'changed_by' => $access->created_by,
                    'old_role' => $oldRole,
                    'new_role' => $access->role,
                ]);
            }

            $access->update([
                'status' => 'active',
                'activated_user_id' => $user->id,
                'activated_at' => $access->activated_at ?? now(),
            ]);
        });
    }
}
