<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transport extends Model
{
    use HasFactory;

    protected $fillable = ['jenis', 'biaya'];

    protected function casts(): array
    {
        return [
            'biaya' => 'decimal:2',
        ];
    }

    public function penggajians(): HasMany
    {
        return $this->hasMany(Penggajian::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TeachingSession::class);
    }
}
