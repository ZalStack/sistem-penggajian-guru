<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Penggajian;
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
}
