<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ComplaintEvidence extends Model
{
    /** Laravel treats "evidence" as an uncountable word; the migration uses the explicit plural name. */
    protected $table = 'complaint_evidences';

    protected $fillable = ['complaint_id', 'path', 'mime_type', 'original_name'];

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }
}
