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
        'foto',
        'grade_id',
        'mapel',
        'bidang_2',
        'jenjang',
        'user_id',
        'domisili',
        'alamat',
        'riwayat_pendidikan',
        'pendidikan_terakhir',
        'tanggal_bergabung',
        'pelatihan_suprarasional',
        'lama_mengajar',
        'riwayat_mengajar',
        'nomor_telepon',
        'tunjangan_khusus',
        'bank',
        'nomor_rekening',
        'keterangan_mengajar',
        'aktivitas_luar_kpm',
    ];

    protected $casts = [
        'tunjangan_khusus' => 'decimal:2',
        'tanggal_bergabung' => 'date:Y-m-d',
        'pelatihan_suprarasional' => 'boolean',
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
     * URL foto profil guru (dilayani route profile.photo milik pemilik akun).
     * Parameter versi dari updated_at agar browser tidak menampilkan foto lama.
     */
    public function fotoUrl(): ?string
    {
        if (! $this->foto) {
            return null;
        }

        return url('/profile/foto?v='.($this->updated_at?->timestamp ?? 0));
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

    /**
     * Daftar bidang / mata pelajaran guru (bidang utama + bidang kedua).
     *
     * @return array<int, string>
     */
    public function daftarBidang(): array
    {
        $bidang = array_values(array_unique(array_filter([
            $this->mapel,
            $this->bidang_2,
        ])));

        return $bidang;
    }
}
