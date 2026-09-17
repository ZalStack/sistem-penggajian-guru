<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penggajian extends Model
{
    use HasFactory;

    protected $fillable = [
        'guru_id',
        'periode',
        'jumlah_sesi',
        'transport_id',
        'honor',
        'total_transport',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'jumlah_sesi' => 'integer',
            'honor' => 'decimal:2',
            'total_transport' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function transport(): BelongsTo
    {
        return $this->belongsTo(Transport::class);
    }
}
