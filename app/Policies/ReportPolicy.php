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

    public function update(User $user, Report $report): bool
    {
        return $user->isAdmin() && $report->created_by === $user->id && in_array($report->status, Report::EDITABLE_STATUSES, true);
    }

    public function submit(User $user, Report $report): bool
    {
        return $this->update($user, $report);
    }

    public function review(User $user, Report $report): bool
    {
        return $user->isSuperAdmin() && $report->status === 'submitted';
    }
}
