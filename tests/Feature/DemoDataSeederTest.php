<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Notification;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_is_idempotent_and_wires_programs(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class); // aman dijalankan dua kali

        $this->assertSame(4, Program::count());
        $this->assertSame(4, Guru::count());
        $this->assertSame(5, User::count());

        // Seluruh guru memiliki program penugasan dan akun login terverifikasi.
        Guru::with('programs')->get()->each(function (Guru $guru) {
            $this->assertNotEmpty($guru->programs, $guru->nama.' belum memiliki program.');
            $this->assertNotNull($guru->user_id, $guru->nama.' belum memiliki akun login.');
        });

        $this->assertSame(0, User::whereNull('email_verified_at')->count());
        $this->assertSame(1, User::where('role', 'admin')->count());
    }

    public function test_demo_seeder_creates_connected_data_across_modules(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DemoDataSeeder::class);

        // Sesi mengajar tersedia lintas minggu dan seluruh guru punya jadwal.
        $this->assertGreaterThan(0, TeachingSession::count());
        Guru::all()->each(function (Guru $guru) {
            $this->assertGreaterThan(
                0,
                TeachingSession::where('guru_id', $guru->id)->count(),
                $guru->nama.' tidak memiliki sesi mengajar.'
            );
        });

        // Ada contoh tiap status sesi.
        $this->assertGreaterThan(0, TeachingSession::where('status', TeachingSession::STATUS_SELESAI)->count());
        $this->assertGreaterThan(0, TeachingSession::where('status', TeachingSession::STATUS_DIJADWALKAN)->count());
        $this->assertGreaterThan(0, TeachingSession::where('status', TeachingSession::STATUS_DIBATALKAN)->count());

        // Presensi terhubung ke sesi.
        $this->assertGreaterThan(0, Attendance::count());
        Attendance::all()->each(fn (Attendance $attendance) => $this->assertNotNull($attendance->session));

        // Rekap penggajian konsolidasi: satu baris per guru per periode.
        $this->assertGreaterThan(0, Penggajian::count());
        $this->assertSame(
            Penggajian::count(),
            Penggajian::selectRaw('guru_id, periode')->distinct()->count()
        );
        Penggajian::all()->each(function (Penggajian $penggajian) {
            $this->assertNotEmpty($penggajian->rincian(), 'Rincian honor kosong.');
            $this->assertEqualsWithDelta(
                (float) $penggajian->honor + (float) $penggajian->total_transport + (float) $penggajian->tunjangan_khusus,
                (float) $penggajian->total,
                0.01
            );
        });

        // Perizinan & notifikasi contoh tersedia (termasuk minimal satu yang disetujui).
        $this->assertGreaterThanOrEqual(3, Perizinan::count());
        $this->assertGreaterThan(0, Perizinan::where('status', Perizinan::STATUS_DISETUJUI)->count());
        $this->assertGreaterThan(0, Notification::count());

        // Menjalankan ulang tidak menggandakan data.
        $sebelum = [TeachingSession::count(), Attendance::count(), Penggajian::count()];
        $this->seed(DemoDataSeeder::class);
        $this->assertSame($sebelum, [TeachingSession::count(), Attendance::count(), Penggajian::count()]);
    }
}
