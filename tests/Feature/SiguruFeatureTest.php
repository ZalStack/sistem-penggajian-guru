<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiguruFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Grade $grade;

    private Transport $transport;

    private Guru $guru;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'admin@siguru.com',
        ]);

        $this->grade = Grade::create([
            'kode_grade' => 'A',
            'honor_per_sesi' => 60000,
        ]);

        $this->transport = Transport::create([
            'jenis' => 'Dalam Kota',
            'biaya' => 25000,
        ]);

        $this->guru = Guru::create([
            'nip' => '198501012010011001',
            'nama' => 'Budi Santoso, S.Pd',
            'mapel' => 'IPA',
            'jenjang' => 'SMP',
            'grade_id' => $this->grade->id,
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/guru')->assertRedirect('/login');
        $this->get('/grade')->assertRedirect('/login');
        $this->get('/transport')->assertRedirect('/login');
        $this->get('/penggajian')->assertRedirect('/login');
        $this->get('/laporan')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_all_pages(): void
    {
        $this->actingAs($this->user)->get('/dashboard')->assertOk();
        $this->actingAs($this->user)->get('/guru')->assertOk();
        $this->actingAs($this->user)->get('/grade')->assertOk();
        $this->actingAs($this->user)->get('/transport')->assertOk();
        $this->actingAs($this->user)->get('/penggajian')->assertOk();
        $this->actingAs($this->user)->get('/penggajian/create')->assertOk();
        $this->actingAs($this->user)->get('/laporan')->assertOk();
    }

    public function test_cannot_delete_grade_if_guru_is_assigned(): void
    {
        $response = $this->actingAs($this->user)->delete("/grade/{$this->grade->id}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('grades', ['id' => $this->grade->id]);
    }

    public function test_penggajian_can_be_created_and_calculates_total(): void
    {
        $response = $this->actingAs($this->user)->post('/penggajian', [
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 10,
            'transport_id' => $this->transport->id,
        ]);

        $response->assertRedirect('/penggajian');
        $response->assertSessionHas('success');

        // Honor: 10 * 60,000 = 600,000
        // Transport: 10 * 25,000 = 250,000
        // Total: 850,000
        $this->assertDatabaseHas('penggajians', [
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 10,
            'transport_id' => $this->transport->id,
            'honor' => 600000,
            'total_transport' => 250000,
            'total' => 850000,
        ]);
    }

    public function test_cannot_create_duplicate_penggajian_in_same_period(): void
    {
        Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 10,
            'transport_id' => $this->transport->id,
            'honor' => 600000,
            'total_transport' => 250000,
            'total' => 850000,
        ]);

        $response = $this->actingAs($this->user)->post('/penggajian', [
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 5,
            'transport_id' => $this->transport->id,
        ]);

        $response->assertSessionHasErrors(['guru_id']);
    }

    public function test_penggajian_can_be_edited_and_updated(): void
    {
        $penggajian = Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 10,
            'transport_id' => $this->transport->id,
            'honor' => 600000,
            'total_transport' => 250000,
            'total' => 850000,
        ]);

        $this->actingAs($this->user)
            ->get("/penggajian/{$penggajian->id}/edit")
            ->assertOk();

        $response = $this->actingAs($this->user)->put("/penggajian/{$penggajian->id}", [
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 15,
            'transport_id' => $this->transport->id,
        ]);

        $response->assertRedirect('/penggajian');
        $response->assertSessionHas('success');

        // New total: 15 * 60,000 + 15 * 25,000 = 900,000 + 375,000 = 1,275,000
        $this->assertDatabaseHas('penggajians', [
            'id' => $penggajian->id,
            'jumlah_sesi' => 15,
            'honor' => 900000,
            'total_transport' => 375000,
            'total' => 1275000,
        ]);
    }

    public function test_cannot_delete_transport_if_penggajian_exists(): void
    {
        Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => '2026-09',
            'jumlah_sesi' => 10,
            'transport_id' => $this->transport->id,
            'honor' => 600000,
            'total_transport' => 250000,
            'total' => 850000,
        ]);

        $response = $this->actingAs($this->user)->delete("/transport/{$this->transport->id}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('transports', ['id' => $this->transport->id]);
    }

    public function test_laporan_pdf_export_succeeds(): void
    {
        $response = $this->actingAs($this->user)->get('/laporan/export-pdf?periode=2026-09');

        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('content-type', ''), 'application/pdf'));
    }

    public function test_laporan_excel_export_succeeds(): void
    {
        $response = $this->actingAs($this->user)->get('/laporan/export-excel?periode=2026-09');

        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('content-type', ''), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
    }

    public function test_location_crud(): void
    {
        $response = $this->actingAs($this->user)->post('/location', [
            'nama_lokasi' => 'Kampus KPM Pusat',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 150,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('locations', ['nama_lokasi' => 'Kampus KPM Pusat']);

        $location = Location::where('nama_lokasi', 'Kampus KPM Pusat')->first();

        $this->actingAs($this->user)->put("/location/{$location->id}", [
            'nama_lokasi' => 'Kampus KPM Pusat Updated',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 200,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('locations', ['nama_lokasi' => 'Kampus KPM Pusat Updated', 'radius' => 200]);

        $this->actingAs($this->user)->delete("/location/{$location->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('locations', ['id' => $location->id]);
    }

    public function test_teaching_session_and_attendance(): void
    {
        $location = Location::create([
            'nama_lokasi' => 'Kelas A',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 100,
        ]);

        $response = $this->actingAs($this->user)->post('/session', [
            'guru_id' => $this->guru->id,
            'location_id' => $location->id,
            'transport_id' => $this->transport->id,
            'mapel' => 'IPA',
            'tanggal' => '2026-09-15',
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('teaching_sessions', [
            'guru_id' => $this->guru->id,
            'location_id' => $location->id,
            'jumlah_sesi' => 2,
        ]);

        $this->actingAs($this->user)->get('/attendance')->assertOk();
    }

    public function test_salary_calculate_and_pay(): void
    {
        $location = Location::create([
            'nama_lokasi' => 'Kelas B',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 100,
        ]);

        $session = TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $location->id,
            'transport_id' => $this->transport->id,
            'mapel' => 'IPA',
            'tanggal' => '2026-09-10',
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
        ]);

        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'tanggal' => '2026-09-10',
            'checkin_time' => '2026-09-10 08:00:00',
            'checkout_time' => '2026-09-10 10:00:00',
            'durasi' => 120,
            'status' => 'valid',
        ]);

        $response = $this->actingAs($this->user)->post('/salary/calculate', [
            'periode' => '2026-09',
        ]);

        $response->assertSessionHas('success');

        $penggajian = Penggajian::where('guru_id', $this->guru->id)->where('periode', '2026-09')->first();
        $this->assertNotNull($penggajian);
        $this->assertEquals('belum_dibayar', $penggajian->status_bayar);

        $payResponse = $this->actingAs($this->user)->post("/salary/{$penggajian->id}/pay");
        $payResponse->assertSessionHas('success');

        $this->assertEquals('sudah_dibayar', $penggajian->fresh()->status_bayar);
    }

    public function test_guru_role_dashboard_and_views(): void
    {
        $guruUser = User::factory()->create([
            'role' => 'guru',
            'guru_id' => $this->guru->id,
        ]);

        $this->actingAs($guruUser)->get('/dashboard')->assertOk();
        $this->actingAs($guruUser)->get('/my-attendance')->assertOk();
        $this->actingAs($guruUser)->get('/my-salary')->assertOk();
    }
}
