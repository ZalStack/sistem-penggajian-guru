<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = ['kode_grade', 'honor_per_sesi'];

    protected function casts(): array
    {
        return [
            'honor_per_sesi' => 'decimal:2',
        ];
    }

    public function gurus(): HasMany
    {
        return $this->hasMany(Guru::class);
    }
}
