<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guru extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'grade_id',
        'mapel',
        'jenjang',
        'user_id',
        'domisili',
        'alamat',
        'riwayat_pendidikan',
        'pendidikan_terakhir',
        'tanggal_bergabung',
        'lama_mengajar',
        'riwayat_mengajar',
        'nomor_telepon',
        'tunjangan_khusus',
        'bank',
        'nomor_rekening',
        'keterangan_mengajar',
    ];

    protected $casts = [
        'tunjangan_khusus' => 'decimal:2',
        'tanggal_bergabung' => 'date',
        'lama_mengajar' => 'integer',
    ];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    /**
     * Jenis kelas / program yang diajar guru (bisa lebih dari satu).
     */
    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(Program::class)->withTimestamps()->orderBy('urutan');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function penggajians(): HasMany
    {
        return $this->hasMany(Penggajian::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TeachingSession::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function perizinan(): HasMany
    {
        return $this->hasMany(Perizinan::class);
    }

    public function sunnahGurus(): HasMany
    {
        return $this->hasMany(SunnahGuru::class);
    }

    /**
     * Daftar nama program untuk tampilan.
     *
     * @return array<int, string>
     */
    public function daftarProgram(): array
    {
        return $this->programs->pluck('nama')->all();
    }

    /**
     * Apakah guru memiliki penugasan kelas khusus.
     */
    public function mengajarKelasKhusus(): bool
    {
        return $this->programs->contains(
            fn (Program $program) => str_contains(strtolower($program->nama), 'khusus')
        );
    }
}
