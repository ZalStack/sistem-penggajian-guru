<?php

namespace Tests\Feature\Api;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SalaryApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Grade $grade;

    private Transport $transport;

    private Location $location;

    private Guru $guru;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->grade = Grade::create(['kode_grade' => 'A', 'honor_per_sesi' => 60000]);
        $this->transport = Transport::create(['jenis' => 'Dalam Kota', 'biaya' => 25000]);
        $this->location = Location::create([
            'nama_lokasi' => 'SMPN 1 Jakarta',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'radius' => 100,
        ]);
        $this->guru = Guru::create([
            'nama' => 'Budi Santoso',
            'grade_id' => $this->grade->id,
            'mapel' => 'IPA',
        ]);
    }

    public function test_salary_list_requires_an_admin_token(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/v1/salaries')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['meta' => ['current_page', 'per_page', 'total', 'last_page']]);
    }

    public function test_salary_list_is_forbidden_for_teachers(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'guru']));

        $this->getJson('/api/v1/salaries')->assertForbidden();
    }

    public function test_salary_list_requires_authentication(): void
    {
        $this->getJson('/api/v1/salaries')->assertUnauthorized();
    }

    public function test_admin_can_calculate_salary_for_a_period(): void
    {
        $session = TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'mapel' => 'IPA',
            'tanggal' => now()->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
        ]);

        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'checkin_time' => now(),
            'checkout_time' => now()->addHours(2),
            'durasi' => 120,
            'status' => 'valid',
            'tanggal' => now()->toDateString(),
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/salaries/calculate', [
            'periode' => now()->format('Y-m'),
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.jumlah_guru_dihitung', 1);

        $this->assertDatabaseHas('penggajians', [
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_hadir' => 1,
            'honor' => 60000,
            'total_transport' => 25000,
            'total' => 85000,
        ]);
    }

    public function test_admin_can_mark_a_record_as_paid(): void
    {
        $payroll = Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 2,
            'transport_id' => $this->transport->id,
            'honor' => 120000,
            'total_transport' => 50000,
            'total' => 170000,
            'status_bayar' => 'belum_dibayar',
        ]);

        Sanctum::actingAs($this->admin);

        $this->postJson("/api/v1/salaries/{$payroll->id}/pay")
            ->assertOk()
            ->assertJsonPath('data.status_bayar', 'sudah_dibayar');

        $this->assertDatabaseHas('penggajians', [
            'id' => $payroll->id,
            'status_bayar' => 'sudah_dibayar',
        ]);
    }

    public function test_teacher_can_see_own_salaries_only(): void
    {
        $user = User::factory()->create(['role' => 'guru']);
        $user->forceFill(['guru_id' => $this->guru->id])->save();

        Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 2,
            'transport_id' => $this->transport->id,
            'honor' => 120000,
            'total_transport' => 50000,
            'total' => 170000,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/salaries/mine')
            ->assertOk()
            ->assertJsonPath('data.summary.total_gaji', 170000)
            ->assertJsonPath('data.guru.nama', 'Budi Santoso')
            ->assertJsonCount(1, 'data.penggajians');
    }

    public function test_payroll_records_comput_totals_server_side(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/payroll', [
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 3,
            'transport_id' => $this->transport->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.jumlah_sesi', 3)
            ->assertJsonPath('data.honor', 180000)
            ->assertJsonPath('data.total_transport', 75000)
            ->assertJsonPath('data.total', 255000);
    }

    public function test_paid_payroll_records_cannot_be_deleted(): void
    {
        $payroll = Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 2,
            'transport_id' => $this->transport->id,
            'honor' => 120000,
            'total_transport' => 50000,
            'total' => 170000,
            'status_bayar' => 'sudah_dibayar',
        ]);

        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/v1/payroll/{$payroll->id}")
            ->assertStatus(409);

        $this->assertDatabaseCount('penggajians', 1);
    }
}
