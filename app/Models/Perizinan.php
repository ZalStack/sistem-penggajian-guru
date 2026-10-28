<?php

namespace App\Models;

use App\Support\Tanggal;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Perizinan extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_DISETUJUI = 'disetujui';

    public const STATUS_DITOLAK = 'ditolak';

    protected $table = 'perizinan';

    protected $fillable = [
        'guru_id', 'session_id', 'jenis', 'tanggal_mulai', 'tanggal_selesai', 'alasan', 'status', 'catatan_admin',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    /**
     * Sesi mengajar spesifik yang terdampak izin (opsional).
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(TeachingSession::class, 'session_id');
    }

    /**
     * Sesi mengajar aktif milik pengaju izin.
     *
     * Relasi dibangun dari `guru_id` baris izin (bukan lewat relasi `guru`)
     * sehingga tetap berfungsi saat `guru` belum di-eager-load. Filter rentang
     * tanggal diterapkan lewat `jumlahSesiTerdampak()` karena rentang tanggal
     * baru tersedia pada model yang sudah terisi.
     *
     * @return HasMany<TeachingSession>
     */
    public function sesiTerdampak(): HasMany
    {
        return $this->hasMany(TeachingSession::class, 'guru_id', 'guru_id')->aktif();
    }

    /**
     * Jumlah sesi mengajar yang terdampak izin (rentang tanggal pengajuan).
     */
    public function jumlahSesiTerdampak(): int
    {
        if (! $this->tanggal_mulai || ! $this->tanggal_selesai) {
            return 0;
        }

        return $this->sesiTerdampak()
            ->whereBetween('tanggal', [$this->tanggal_mulai->toDateString(), $this->tanggal_selesai->toDateString()])
            ->count();
    }

    public function rentangTanggal(): string
    {
        if ($this->tanggal_mulai->isSameDay($this->tanggal_selesai)) {
            return Tanggal::tanggalPanjang($this->tanggal_mulai);
        }

        return Tanggal::format($this->tanggal_mulai, 'd M Y')
            .' – '.Tanggal::format($this->tanggal_selesai, 'd M Y');
    }

    public function labelJenis(): string
    {
        return match ($this->jenis) {
            'sakit' => 'Sakit',
            'cuti' => 'Cuti',
            default => 'Izin',
        };
    }

    public function labelStatus(): string
    {
        return match ($this->status) {
            self::STATUS_DISETUJUI => 'Disetujui',
            self::STATUS_DITOLAK => 'Ditolak',
            default => 'Menunggu',
        };
    }
}
