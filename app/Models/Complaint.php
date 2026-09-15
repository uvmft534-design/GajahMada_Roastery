<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Complaint extends Model
{
    public const STATUSES = ['submitted', 'in_review', 'resolved', 'rejected'];

    protected $fillable = ['order_id', 'order_item_id', 'customer_id', 'category', 'description', 'status', 'admin_note', 'handled_by', 'submitted_at', 'resolved_at'];

    protected function casts(): array { return ['submitted_at' => 'datetime', 'resolved_at' => 'datetime']; }
    public function order(): BelongsTo { return $this->belongsTo(Order::class, 'order_id', 'order_id'); }
    public function item(): BelongsTo { return $this->belongsTo(OrderItem::class, 'order_item_id', 'order_item_id'); }
    public function customer(): BelongsTo { return $this->belongsTo(User::class, 'customer_id'); }
    public function handler(): BelongsTo { return $this->belongsTo(User::class, 'handled_by'); }
    public function evidences(): HasMany { return $this->hasMany(ComplaintEvidence::class); }
    public function messages(): HasMany { return $this->hasMany(ComplaintMessage::class)->oldest(); }
}
