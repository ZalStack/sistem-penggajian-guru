<?php

namespace App\Services;

use App\Models\Guru;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AdikSyncService
{
    /**
     * Push Guru model data to SI ADIK-KK (Web Induk KPM)
     */
    public static function pushTeacherToAdik(Guru $guru): bool
    {
        $baseUrl = rtrim((string) config('services.adik.base_url', 'https://kelas-khusus.kpmacademic.io'), '/');
        $apiKey = (string) config('services.adik.api_key', 'kpm-satellite-secret-key-2026');

        if (empty($baseUrl)) {
            return false;
        }

        try {
            $guru->loadMissing(['user', 'grade']);

            $payload = [
                'id' => $guru->id,
                'nama' => $guru->nama,
                'email' => $guru->user?->email,
                'mapel' => $guru->mapel,
                'jenjang' => $guru->jenjang,
                'domisili' => $guru->domisili,
                'alamat' => $guru->alamat,
                'tanggal_bergabung' => $guru->tanggal_bergabung?->toDateString(),
                'pelatihan_suprarasional' => (bool) $guru->pelatihan_suprarasional,
                'nomor_telepon' => $guru->nomor_telepon,
                'tunjangan_khusus' => (float) $guru->tunjangan_khusus,
                'bank' => $guru->bank,
                'nomor_rekening' => $guru->nomor_rekening,
                'lama_mengajar' => $guru->lama_mengajar,
                'riwayat_pendidikan' => $guru->riwayat_pendidikan,
                'riwayat_mengajar' => $guru->riwayat_mengajar,
                'keterangan_mengajar' => $guru->keterangan_mengajar,
                'grade' => $guru->grade ? [
                    'id' => $guru->grade->id,
                    'kode_grade' => $guru->grade->kode_grade,
                ] : null,
            ];

            $response = Http::timeout(6)
                ->withHeaders([
                    'X-API-Key' => $apiKey,
                    'Accept' => 'application/json',
                ])
                ->post("{$baseUrl}/api/v1/siguru/teachers/sync", $payload);

            if ($response->successful()) {
                Log::info("AdikSyncService: Berhasil menyinkronkan Guru #{$guru->id} ({$guru->nama}) ke SI ADIK-KK.");

                return true;
            }

            Log::warning("AdikSyncService: Gagal menyinkronkan Guru #{$guru->id} ke SI ADIK-KK [HTTP {$response->status()}]: ".$response->body());
        } catch (\Throwable $e) {
            Log::warning("AdikSyncService exception syncing Guru #{$guru->id} to SI ADIK-KK: ".$e->getMessage());
        }

        return false;
    }
}
