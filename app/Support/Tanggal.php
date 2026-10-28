<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use DateTimeInterface;

/**
 * Pemformatan tanggal berbahasa Indonesia.
 *
 * Locale aplikasi bernilai `en`, sehingga `translatedFormat()` bawaan Carbon
 * akan menghasilkan nama hari/bulan berbahasa Inggris. Helper ini memaksa
 * locale `id` per instance sehingga tampilan konsisten Bahasa Indonesia
 * tanpa mengubah locale global aplikasi.
 */
class Tanggal
{
    public static function carbon(DateTimeInterface|string|null $date): ?CarbonInterface
    {
        if ($date === null) {
            return null;
        }

        return Carbon::parse($date)->locale('id');
    }

    /**
     * Nama hari, contoh: "Rabu".
     */
    public static function hari(DateTimeInterface|string|null $date): string
    {
        return self::carbon($date)?->translatedFormat('l') ?? '-';
    }

    /**
     * Tanggal panjang, contoh: "28 Oktober 2026".
     */
    public static function tanggalPanjang(DateTimeInterface|string|null $date): string
    {
        return self::carbon($date)?->translatedFormat('d F Y') ?? '-';
    }

    /**
     * Hari + tanggal, contoh: "Rabu, 28 Oktober 2026".
     */
    public static function label(DateTimeInterface|string|null $date): string
    {
        return self::carbon($date)?->translatedFormat('l, d F Y') ?? '-';
    }

    /**
     * Format bebas dengan locale Indonesia.
     */
    public static function format(DateTimeInterface|string|null $date, string $format): string
    {
        return self::carbon($date)?->translatedFormat($format) ?? '-';
    }

    /**
     * Singkatan nama hari, contoh: "Rab", untuk header kalender mingguan.
     */
    public static function hariSingkat(DateTimeInterface|string|null $date): string
    {
        return self::carbon($date)?->translatedFormat('D') ?? '-';
    }
}
