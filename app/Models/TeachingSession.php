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

    public const STATUS_BERLANGSUNG = 'berlangsung';

    public const STATUSES = [
        self::STATUS_DIJADWALKAN,
        self::STATUS_SELESAI,
        self::STATUS_DIBATALKAN,
    ];

    protected $fillable = [
        'guru_id', 'location_id', 'transport_id', 'program_id', 'mapel',
        'tanggal', 'pekan', 'bahan_ajar', 'jam_mulai', 'jam_selesai', 'jumlah_sesi', 'status', 'catatan',
    ];

    protected $appends = [
        'effective_status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'pekan' => 'integer',
            'jam_mulai' => 'datetime:H:i',
            'jam_selesai' => 'datetime:H:i',
            'jumlah_sesi' => 'integer',
        ];
    }

    /**
     * Status efektif untuk tampilan — derived dari data presensi aktual sesi ini:
     * - dibatalkan (manual)   → Dibatalkan
     * - ada checkout_time      → Selesai
     * - ada checkin_time saja  → Berlangsung
     * - tidak ada keduanya    → Dijadwalkan
     *
     * Berlaku per sesi untuk SEMUA baris (bukan hanya sesi aktif).
     */
    public function getEffectiveStatusAttribute(): string
    {
        // Status manual "dibatalkan" selalu dihormati.
        if ($this->status === self::STATUS_DIBATALKAN) {
            return self::STATUS_DIBATALKAN;
        }

        // Periksa koleksi attendances (eager-loaded agar tidak N+1).
        if ($this->relationLoaded('attendances')) {
            $attendances = $this->attendances;

            // Ada guru yang sudah checkout → selesai.
            if ($attendances->contains(fn ($a) => $a->checkout_time !== null)) {
                return self::STATUS_SELESAI;
            }

            // Ada guru yang sudah checkin tapi belum checkout → berlangsung.
            if ($attendances->contains(fn ($a) => $a->checkin_time !== null)) {
                return self::STATUS_BERLANGSUNG;
            }
        }

        // Tidak ada data presensi → dijadwalkan (sesi lampau tanpa check-in tetap dijadwalkan
        // sesuai keputusan bisnis: "past session without check-in stays Dijadwalkan").
        return self::STATUS_DIJADWALKAN;
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
