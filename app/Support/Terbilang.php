<?php

namespace App\Support;

class Terbilang
{
    private static array $bilangan = [
        '',
        'Satu',
        'Dua',
        'Tiga',
        'Empat',
        'Lima',
        'Enam',
        'Tujuh',
        'Delapan',
        'Sembilan',
        'Sepuluh',
        'Sebelas',
    ];

    public static function make(float|int|string $angka): string
    {
        $nominal = (int) round((float) $angka);

        if ($nominal <= 0) {
            return 'Nol Rupiah';
        }

        return trim(self::convert($nominal)).' Rupiah';
    }

    private static function convert(int $angka): string
    {
        if ($angka < 12) {
            return ' '.self::$bilangan[$angka];
        } elseif ($angka < 20) {
            return self::convert($angka - 10).' Belas';
        } elseif ($angka < 100) {
            return self::convert((int) ($angka / 10)).' Puluh'.self::convert($angka % 10);
        } elseif ($angka < 200) {
            return ' Seratus'.self::convert($angka - 100);
        } elseif ($angka < 1000) {
            return self::convert((int) ($angka / 100)).' Ratus'.self::convert($angka % 100);
        } elseif ($angka < 2000) {
            return ' Seribu'.self::convert($angka - 1000);
        } elseif ($angka < 1000000) {
            return self::convert((int) ($angka / 1000)).' Ribu'.self::convert($angka % 1000);
        } elseif ($angka < 1000000000) {
            return self::convert((int) ($angka / 1000000)).' Juta'.self::convert($angka % 1000000);
        } elseif ($angka < 1000000000000) {
            return self::convert((int) ($angka / 1000000000)).' Miliar'.self::convert($angka % 1000000000);
        }

        return self::convert((int) ($angka / 1000000000000)).' Triliun'.self::convert($angka % 1000000000000);
    }
}
