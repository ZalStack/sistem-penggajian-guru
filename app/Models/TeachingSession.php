<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeachingSession extends Model
{
    use HasFactory;

    public const STATUS_DIJADWALKAN = 'dijadwalkan';

    public const STATUS_SELESAI = 'selesai';

    public const STATUS_DIBATALKAN = 'dibatalkan';

    public const STATUSES = [
        self::STATUS_DIJADWALKAN,
        self::STATUS_SELESAI,
        self::STATUS_DIBATALKAN,
    ];

    protected $fillable = [
        'guru_id', 'location_id', 'transport_id', 'program_id', 'mapel',
        'tanggal', 'jam_mulai', 'jam_selesai', 'jumlah_sesi', 'status', 'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'jam_mulai' => 'datetime:H:i',
            'jam_selesai' => 'datetime:H:i',
            'jumlah_sesi' => 'integer',
        ];
    }

    /**
     * Status efektif untuk tampilan: sesi terjadwal yang waktunya sudah lewat
     * dianggap selesai meskipun belum diperbarui manual.
     */
    public function getEffectiveStatusAttribute(): string
    {
        if ($this->status !== self::STATUS_DIJADWALKAN) {
            return $this->status;
        }

        return $this->tanggal?->isBefore(today()) ? self::STATUS_SELESAI : self::STATUS_DIJADWALKAN;
    }

    public function scopeAktif($query)
    {
        return $query->where('status', '!=', self::STATUS_DIBATALKAN);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function transport(): BelongsTo
    {
        return $this->belongsTo(Transport::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'session_id');
    }
}
