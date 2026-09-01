<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = mb_strtolower(trim((string) config('access.super_admin_email')));
        if (blank($email)) {
            $this->command?->warn('SUPER_ADMIN_EMAIL is empty; SuperAdminSeeder skipped.');

            return;
        }

        $otherSuperAdmin = User::query()
            ->where('role', 'super_admin')
            ->whereRaw('LOWER(email) != ?', [$email])
            ->first();

        if ($otherSuperAdmin) {
            $message = "SuperAdminSeeder stopped: a super_admin already exists for {$otherSuperAdmin->email}; it does not match SUPER_ADMIN_EMAIL.";
            $this->command?->error($message);

            throw new \RuntimeException($message);
        }

        $user = User::whereRaw('LOWER(email) = ?', [$email])->firstOrNew(['email' => $email]);
        if (! $user->exists) {
            $user->fill(['name' => 'Super Admin', 'password' => Hash::make(Str::random(48)), 'email_verified_at' => now()]);
        }
        $user->role = 'super_admin';
        $user->save();
    }
}
