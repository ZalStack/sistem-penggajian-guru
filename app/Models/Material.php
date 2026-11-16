<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'uploaded_by',
        'title',
        'description',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'subject',
        'pekan',
        'kelas',
        'level',
        'status',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TeachingSession::class, 'material_id');
    }
}
