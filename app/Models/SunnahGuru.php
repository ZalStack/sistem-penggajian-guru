<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SunnahGuru extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const POIN_WAJIB_KOSONG = 0;

    public const POIN_WAJIB_PER_ITEM = 1;

    public const POIN_WAJIB_LENGKAP = 20;

    protected $table = 'sunnah_gurus';

    protected $fillable = [
        'guru_id',
        'tanggal',
        'sholat_subuh',
        'sholat_subuh_berjamaah',
        'sholat_zuhur',
        'sholat_zuhur_berjamaah',
        'sholat_asar',
        'sholat_asar_berjamaah',
        'sholat_maghrib',
        'sholat_maghrib_berjamaah',
        'sholat_isya',
        'sholat_isya_berjamaah',
        'sholat_tahajud',
        'infaq_sedekah',
        'dzikir_sholawat',
        'tilawah_quran',
        'sholat_dhuha',
        'menjaga_wudhu',
        'puasa_sunnah',
        'total_poin',
        'status_approval',
        'catatan',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'sholat_subuh' => 'boolean',
            'sholat_subuh_berjamaah' => 'boolean',
            'sholat_zuhur' => 'boolean',
            'sholat_zuhur_berjamaah' => 'boolean',
            'sholat_asar' => 'boolean',
            'sholat_asar_berjamaah' => 'boolean',
            'sholat_maghrib' => 'boolean',
            'sholat_maghrib_berjamaah' => 'boolean',
            'sholat_isya' => 'boolean',
            'sholat_isya_berjamaah' => 'boolean',
            'sholat_tahajud' => 'boolean',
            'infaq_sedekah' => 'boolean',
            'dzikir_sholawat' => 'boolean',
            'tilawah_quran' => 'boolean',
            'sholat_dhuha' => 'boolean',
            'menjaga_wudhu' => 'boolean',
            'puasa_sunnah' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Konfigurasi amalan 7SPS. Urutan dan poin disamakan dengan Sunnah Daily
     * agar hasil perhitungan konsisten di kedua aplikasi.
     *
     * @return array<string, array{label: string, poin: int, icon: string, has_jamaah: bool}>
     */
    public static function getPoinConfig(): array
    {
        return [
            'sholat_subuh' => ['label' => 'Sholat Subuh', 'poin' => 1, 'icon' => 'mdi:weather-sunset-up', 'has_jamaah' => true],
            'sholat_zuhur' => ['label' => 'Sholat Zuhur', 'poin' => 1, 'icon' => 'mdi:weather-sunny', 'has_jamaah' => true],
            'sholat_asar' => ['label' => 'Sholat Asar', 'poin' => 1, 'icon' => 'mdi:weather-partly-cloudy', 'has_jamaah' => true],
            'sholat_maghrib' => ['label' => 'Sholat Maghrib', 'poin' => 1, 'icon' => 'mdi:weather-sunset-down', 'has_jamaah' => true],
            'sholat_isya' => ['label' => 'Sholat Isya', 'poin' => 1, 'icon' => 'mdi:moon-waning-crescent', 'has_jamaah' => true],
            'sholat_tahajud' => ['label' => 'Sholat Tahajud', 'poin' => 35, 'icon' => 'mdi:weather-night', 'has_jamaah' => false],
            'infaq_sedekah' => ['label' => 'Infaq/Sedekah', 'poin' => 5, 'icon' => 'mdi:hand-heart', 'has_jamaah' => false],
            'dzikir_sholawat' => ['label' => 'Dzikir/Sholawat', 'poin' => 5, 'icon' => 'mdi:comment-text-outline', 'has_jamaah' => false],
            'tilawah_quran' => ['label' => 'Tilawah Quran', 'poin' => 5, 'icon' => 'mdi:book-open-page-variant', 'has_jamaah' => false],
            'sholat_dhuha' => ['label' => 'Sholat Dhuha', 'poin' => 5, 'icon' => 'mdi:weather-sunset-up', 'has_jamaah' => false],
            'menjaga_wudhu' => ['label' => 'Menjaga Wudhu', 'poin' => 10, 'icon' => 'mdi:water', 'has_jamaah' => false],
            'puasa_sunnah' => ['label' => 'Puasa Sunnah', 'poin' => 15, 'icon' => 'mdi:moon-waning-crescent', 'has_jamaah' => false],
        ];
    }

    /**
     * Kolom checklist utama (tanpa kolom berjamaah).
     *
     * @return array<int, string>
     */
    public static function getChecklistFields(): array
    {
        return array_keys(self::getPoinConfig());
    }

    /**
     * @return array<int, string>
     */
    public static function getSholatWajibKeys(): array
    {
        return [
            'sholat_subuh',
            'sholat_zuhur',
            'sholat_asar',
            'sholat_maghrib',
            'sholat_isya',
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function getJamaahFields(): array
    {
        return [
            'sholat_subuh_berjamaah',
            'sholat_zuhur_berjamaah',
            'sholat_asar_berjamaah',
            'sholat_maghrib_berjamaah',
            'sholat_isya_berjamaah',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{jumlah_dikerjakan: int, jumlah_berjamaah: int, poin: int}
     */
    public static function hitungPoinWajib(array $data): array
    {
        $jumlahDikerjakan = 0;
        $jumlahBerjamaah = 0;

        foreach (self::getSholatWajibKeys() as $key) {
            if (! empty($data[$key])) {
                $jumlahDikerjakan++;
            }

            if (! empty($data[$key.'_berjamaah'])) {
                $jumlahBerjamaah++;
            }
        }

        if ($jumlahDikerjakan >= 5) {
            $poin = 5 * 4;
        } elseif ($jumlahDikerjakan >= 1) {
            $poin = $jumlahDikerjakan * self::POIN_WAJIB_PER_ITEM;
        } else {
            $poin = self::POIN_WAJIB_KOSONG;
        }

        return [
            'jumlah_dikerjakan' => $jumlahDikerjakan,
            'jumlah_berjamaah' => $jumlahBerjamaah,
            'poin' => $poin,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function calculateTotalPoin(array $data): int
    {
        $config = self::getPoinConfig();
        $wajibKeys = self::getSholatWajibKeys();

        $total = self::hitungPoinWajib($data)['poin'];

        foreach ($config as $key => $value) {
            if (in_array($key, $wajibKeys, true)) {
                continue;
            }

            if (! empty($data[$key])) {
                $total += $value['poin'];
            }
        }

        return $total;
    }

    public function getJumlahSholatDikerjakanAttribute(): int
    {
        return self::hitungPoinWajib($this->attributesToArray())['jumlah_dikerjakan'];
    }

    public function getJumlahSholatBerjamaahAttribute(): int
    {
        return self::hitungPoinWajib($this->attributesToArray())['jumlah_berjamaah'];
    }

    public function getPoinSholatWajibAttribute(): int
    {
        return self::hitungPoinWajib($this->attributesToArray())['poin'];
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status_approval) {
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_REJECTED => 'Ditolak',
            default => 'Menunggu',
        };
    }

    public function isApproved(): bool
    {
        return $this->status_approval === self::STATUS_APPROVED;
    }
}
