<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffAccess extends Model
{
    protected $fillable = ['email', 'role', 'status', 'created_by', 'activated_user_id', 'activated_at'];

    protected function casts(): array
    {
        return ['activated_at' => 'datetime'];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activatedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_user_id');
    }
}
