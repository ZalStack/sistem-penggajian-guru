<?php

namespace Tests\Feature\Api;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Guru $guru;

    private Location $location;

    private Transport $transport;

    protected function setUp(): void
    {
        parent::setUp();

        // Freeze the clock mid-morning so check-in window assertions are
        // deterministic regardless of when the suite runs.
        Carbon::setTestNow(Carbon::now()->setTime(9, 0));

        $grade = Grade::create(['kode_grade' => 'A', 'honor_per_sesi' => 60000]);
        $this->transport = Transport::create(['jenis' => 'Dalam Kota', 'biaya' => 25000]);
        $this->location = Location::create([
            'nama_lokasi' => 'SMPN 1 Jakarta',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'radius' => 100,
        ]);

        $this->user = User::factory()->create(['role' => 'guru']);
        $this->guru = Guru::create([
            'nama' => 'Budi Santoso',
            'grade_id' => $grade->id,
            'mapel' => 'IPA',
            'user_id' => $this->user->id,
        ]);
        $this->user->forceFill(['guru_id' => $this->guru->id])->save();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function createSession(array $overrides = []): TeachingSession
    {
        return TeachingSession::create(array_merge([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'mapel' => 'IPA',
            'tanggal' => now()->toDateString(),
            'jam_mulai' => now()->subMinutes(10)->format('H:i'),
            'jam_selesai' => now()->addHours(2)->format('H:i'),
            'jumlah_sesi' => 2,
        ], $overrides));
    }

    public function test_check_in_requires_authentication(): void
    {
        $session = $this->createSession();

        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertUnauthorized();
    }

    public function test_teacher_can_check_in_within_the_location_radius(): void
    {
        $session = $this->createSession();

        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.attendance.status', 'belum_checkout')
            ->assertJsonPath('data.accurate_gps', true);

        $this->assertDatabaseHas('attendances', [
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'status' => 'belum_checkout',
        ]);
    }

    public function test_check_in_is_rejected_outside_the_location_radius(): void
    {
        $session = $this->createSession();

        Sanctum::actingAs($this->user);

        // ~111 km away from the location.
        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $session->id,
            'latitude' => -5.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_check_in_is_rejected_for_another_teachers_session(): void
    {
        $session = $this->createSession();

        // Another teacher with their own linked account.
        $grade = Grade::create(['kode_grade' => 'B', 'honor_per_sesi' => 50000]);
        $otherUser = User::factory()->create(['role' => 'guru']);
        $otherGuru = Guru::create([
            'nama' => 'Other Teacher',
            'grade_id' => $grade->id,
            'mapel' => 'MTK',
            'user_id' => $otherUser->id,
        ]);
        $otherUser->forceFill(['guru_id' => $otherGuru->id])->save();

        Sanctum::actingAs($otherUser);

        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_double_check_in_is_rejected(): void
    {
        $session = $this->createSession();

        Sanctum::actingAs($this->user);

        $payload = [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ];

        $this->postJson('/api/v1/attendances/check-in', $payload)->assertOk();
        $this->postJson('/api/v1/attendances/check-in', $payload)->assertStatus(422);
    }

    public function test_check_in_to_second_session_requires_check_out_of_first_session(): void
    {
        $firstSession = $this->createSession([
            'guru_id' => $this->guru->id,
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
            'jumlah_sesi' => 1,
        ]);

        $secondSession = $this->createSession([
            'guru_id' => $this->guru->id,
            'jam_mulai' => '08:30',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 1,
        ]);

        Sanctum::actingAs($this->user);

        // Set waktu ke 08:30 (dalam window check-in sesi pertama 07:30–09:00)
        Carbon::setTestNow(Carbon::parse('2026-11-05 08:30:00'));

        // Check-in ke sesi pertama berhasil.
        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $firstSession->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertOk();

        // Check-in ke sesi kedua harus ditolak sampai sesi pertama di-check-out.
        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $secondSession->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('attendances', 1);

        // Pindahkan waktu ke 09:30 (setelah jam_selesai sesi pertama 09:00).
        Carbon::setTestNow(Carbon::parse('2026-11-05 09:30:00'));

        // Check-out dari sesi pertama (jam_selesai 09:00 < now 09:30) baru mengizinkan check-in ke sesi kedua.
        $this->postJson('/api/v1/attendances/check-out', [
            'session_id' => $firstSession->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertOk();

        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $secondSession->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertOk();

        // Kembalikan waktu test agar tidak mengganggu test lain.
        Carbon::setTestNow(Carbon::now()->setTime(9, 0));
    }

    public function test_check_out_requires_a_prior_check_in(): void
    {
        $session = $this->createSession();

        Sanctum::actingAs($this->user);

        $this->postJson('/api/v1/attendances/check-out', [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertStatus(422);
    }

    public function test_teacher_can_check_out_and_salary_is_recalculated(): void
    {
        $session = $this->createSession();

        Sanctum::actingAs($this->user);

        $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ])->assertOk();

        // Simulate 45 minutes of teaching before checking out.
        Attendance::query()->update([
            'checkin_time' => now()->subMinutes(45),
            'durasi' => 0,
        ]);

        $response = $this->postJson('/api/v1/attendances/check-out', [
            'session_id' => $session->id,
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'accuracy' => 10,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.attendance.status', 'valid');

        $this->assertDatabaseHas('attendances', [
            'session_id' => $session->id,
            'status' => 'valid',
        ]);

        // Salary recalculated automatically after check-out.
        $this->assertDatabaseHas('penggajians', [
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_hadir' => 1,
        ]);
    }

    public function test_teacher_can_list_own_attendance(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/v1/attendances/mine')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total_hadir', 0)
            ->assertJsonPath('data.guru.nama', 'Budi Santoso');
    }

    public function test_attendance_recap_requires_an_admin_token(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/v1/attendances')->assertForbidden();
    }
}
