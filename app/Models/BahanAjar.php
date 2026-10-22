<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BahanAjar extends Model
{
    use HasFactory;

    protected $table = 'bahan_ajar';

    protected $fillable = [
        'user_id',
        'judul',
        'deskripsi',
        'mapel',
        'file_path',
        'file_name',
        'file_mime',
        'file_size',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
