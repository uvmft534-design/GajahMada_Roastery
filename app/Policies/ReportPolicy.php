<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function view(User $user, Report $report): bool
    {
        return $user->isSuperAdmin() || ($user->isAdmin() && $report->created_by === $user->id);
    }

    public function review(User $user, Report $report): bool
    {
        return $user->isSuperAdmin() && $report->status === 'generated';
    }
}
