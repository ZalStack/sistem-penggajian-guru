<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\SunnahGuru;
use App\Models\TeachingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SatelliteApiController extends Controller
{
    /**
     * Reset riwayat & transaksi SatuGuru (dipanggil dari SuperAdmin Web Induk).
     * Akun Guru, User, Grade, Lokasi, dan Master Data tetap aman.
     */
    public function resetProgress(Request $request): JsonResponse
    {
        $providedKey = (string) $request->header('X-API-Key', $request->input('api_key', ''));
        $validKeys = array_filter([
            config('services.adik.api_key'),
            env('ADIK_API_KEY'),
            'kpm-satellite-secret-key-2026',
        ]);

        if ($providedKey === '' || ! in_array($providedKey, $validKeys, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized API Key.',
            ], 401);
        }

        DB::transaction(function () {
            Attendance::query()->delete();
            TeachingSession::query()->delete();
            Perizinan::query()->delete();
            SunnahGuru::query()->delete();
            Penggajian::query()->delete();
        });

        Cache::flush();

        return response()->json([
            'success' => true,
            'message' => 'Seluruh riwayat absensi, sesi mengajar, perizinan, dan penggajian SatuGuru berhasil direset.',
        ]);
    }
}
