<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Notification;
use App\Models\SunnahGuru;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SunnahGuruFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Guru $guru;

    private User $guruUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@satugurukpm.id',
            'role' => 'admin',
        ]);

        $grade = Grade::create([
            'kode_grade' => 'A',
            'honor_per_sesi' => 60000,
        ]);

        $this->guru = Guru::create([
            'nama' => 'Budi Santoso, S.Pd',
            'mapel' => 'IPA',
            'jenjang' => 'SMP',
            'grade_id' => $grade->id,
            'domisili' => 'Kota Bogor',
            'pendidikan_terakhir' => 'S.Pd',
            'lama_mengajar' => 5,
            'tanggal_bergabung' => '2021-08-01',
        ]);

        $this->guruUser = User::factory()->create([
            'email' => 'guru@satugurukpm.id',
            'role' => 'guru',
            'guru_id' => $this->guru->id,
        ]);

        $this->guru->update(['user_id' => $this->guruUser->id]);
    }

    public function test_guest_is_redirected(): void
    {
        $this->get('/my-sunnah')->assertRedirect('/login');
        $this->get('/sunnah-guru')->assertRedirect('/login');
    }

    public function test_guru_can_view_checklist_page(): void
    {
        $this->actingAs($this->guruUser)
            ->get('/my-sunnah')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/SunnahGuru/Index')
                ->where('guru.id', $this->guru->id)
                ->where('selectedDate', today()->toDateString())
                ->where('today', today()->toDateString())
                ->where('yesterday', today()->subDay()->toDateString())
                ->has('poinConfig', 12)
                ->has('riwayat')
            );
    }

    public function test_guru_without_profile_gets_empty_state(): void
    {
        $user = User::factory()->create([
            'role' => 'guru',
            'guru_id' => null,
        ]);

        $this->actingAs($user)
            ->get('/my-sunnah')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/SunnahGuru/Index')
                ->where('guru', null)
                ->where('selectedData', null)
            );
    }

    public function test_guru_can_save_today_and_points_are_calculated(): void
    {
        $fields = [
            'sholat_subuh' => true,
            'sholat_zuhur' => true,
            'sholat_asar' => true,
            'sholat_maghrib' => true,
            'sholat_isya' => true,
            'sholat_subuh_berjamaah' => true,
            'sholat_tahajud' => true,
            'infaq_sedekah' => true,
            'dzikir_sholawat' => true,
            'tilawah_quran' => true,
            'sholat_dhuha' => true,
            'menjaga_wudhu' => true,
            'puasa_sunnah' => true,
        ];

        $response = $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->toDateString(),
            'fields' => $fields,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_poin', 100)
            ->assertJsonPath('data.poin_sholat_wajib', 20)
            ->assertJsonPath('data.jumlah_sholat_dikerjakan', 5)
            ->assertJsonPath('data.jumlah_sholat_berjamaah', 1)
            ->assertJsonPath('data.status_approval', SunnahGuru::STATUS_PENDING);

        $record = SunnahGuru::where('guru_id', $this->guru->id)
            ->whereDate('tanggal', today())
            ->first();

        $this->assertNotNull($record);
        $this->assertSame(100, (int) $record->total_poin);
    }

    public function test_unchecking_all_fields_resets_points(): void
    {
        SunnahGuru::create([
            'guru_id' => $this->guru->id,
            'tanggal' => today()->toDateString(),
            'sholat_tahajud' => true,
            'total_poin' => 35,
            'status_approval' => SunnahGuru::STATUS_PENDING,
        ]);

        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->toDateString(),
            'fields' => ['sholat_tahajud' => false],
        ])->assertOk()->assertJsonPath('data.total_poin', 0);
    }

    public function test_guru_can_only_fill_today_and_yesterday(): void
    {
        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->subDays(2)->toDateString(),
            'fields' => ['sholat_subuh' => true],
        ])->assertStatus(422);

        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->addDay()->toDateString(),
            'fields' => ['sholat_subuh' => true],
        ])->assertStatus(422);

        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->subDay()->toDateString(),
            'fields' => ['sholat_subuh' => true],
        ])->assertOk();
    }

    public function test_approved_record_is_locked_for_guru(): void
    {
        SunnahGuru::create([
            'guru_id' => $this->guru->id,
            'tanggal' => today()->toDateString(),
            'sholat_subuh' => true,
            'total_poin' => 1,
            'status_approval' => SunnahGuru::STATUS_APPROVED,
            'approved_by' => $this->admin->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->toDateString(),
            'fields' => ['sholat_tahajud' => true],
        ])->assertStatus(403);

        $this->assertDatabaseHas('sunnah_gurus', [
            'guru_id' => $this->guru->id,
            'total_poin' => 1,
            'status_approval' => SunnahGuru::STATUS_APPROVED,
        ]);
    }

    public function test_saving_new_record_notifies_admins(): void
    {
        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->toDateString(),
            'fields' => ['sholat_subuh' => true],
        ])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->admin->id,
            'kategori' => 'sunnah',
            'judul' => 'Checklist 7SPS Baru',
        ]);
    }

    public function test_admin_can_view_monitoring_and_detail(): void
    {
        $record = SunnahGuru::create([
            'guru_id' => $this->guru->id,
            'tanggal' => today()->toDateString(),
            'sholat_tahajud' => true,
            'total_poin' => 35,
            'status_approval' => SunnahGuru::STATUS_PENDING,
        ]);

        $this->actingAs($this->admin)
            ->get('/sunnah-guru')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/SunnahGuru/Index')
                ->has('records.data', 1)
                ->where('statistik.pending', 1)
                ->has('gurus')
                ->has('programs')
            );

        $this->actingAs($this->admin)
            ->get("/sunnah-guru/{$record->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/SunnahGuru/Show')
                ->where('record.id', $record->id)
                ->has('record.checklist', 12)
            );
    }

    public function test_guru_cannot_access_admin_monitoring(): void
    {
        $this->actingAs($this->guruUser)->get('/sunnah-guru')->assertForbidden();
        $this->actingAs($this->guruUser)->post('/sunnah-guru/bulk-approval')->assertForbidden();
    }

    public function test_admin_can_approve_single_record_with_note(): void
    {
        $record = SunnahGuru::create([
            'guru_id' => $this->guru->id,
            'tanggal' => today()->toDateString(),
            'total_poin' => 20,
            'status_approval' => SunnahGuru::STATUS_PENDING,
        ]);

        $this->actingAs($this->admin)
            ->put("/sunnah-guru/{$record->id}/approval", [
                'status' => SunnahGuru::STATUS_APPROVED,
                'catatan' => 'Amalan lengkap, pertahankan.',
            ])
            ->assertRedirect();

        $record->refresh();

        $this->assertSame(SunnahGuru::STATUS_APPROVED, $record->status_approval);
        $this->assertSame('Amalan lengkap, pertahankan.', $record->catatan);
        $this->assertSame($this->admin->id, $record->approved_by);
        $this->assertNotNull($record->approved_at);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->guruUser->id,
            'kategori' => 'sunnah',
        ]);
    }

    public function test_admin_can_reset_approval_to_pending(): void
    {
        $record = SunnahGuru::create([
            'guru_id' => $this->guru->id,
            'tanggal' => today()->toDateString(),
            'total_poin' => 20,
            'status_approval' => SunnahGuru::STATUS_APPROVED,
            'approved_by' => $this->admin->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->admin)
            ->put("/sunnah-guru/{$record->id}/approval", [
                'status' => SunnahGuru::STATUS_PENDING,
            ])
            ->assertRedirect();

        $record->refresh();

        $this->assertSame(SunnahGuru::STATUS_PENDING, $record->status_approval);
        $this->assertNull($record->approved_by);
        $this->assertNull($record->approved_at);
    }

    public function test_admin_can_bulk_approve_and_reject(): void
    {
        $records = collect([
            SunnahGuru::create([
                'guru_id' => $this->guru->id,
                'tanggal' => today()->toDateString(),
                'total_poin' => 20,
                'status_approval' => SunnahGuru::STATUS_PENDING,
            ]),
            SunnahGuru::create([
                'guru_id' => $this->guru->id,
                'tanggal' => today()->subDay()->toDateString(),
                'total_poin' => 10,
                'status_approval' => SunnahGuru::STATUS_PENDING,
            ]),
        ]);

        $this->actingAs($this->admin)
            ->post('/sunnah-guru/bulk-approval', [
                'ids' => $records->pluck('id')->all(),
                'target_status' => SunnahGuru::STATUS_REJECTED,
                'catatan' => 'Lengkapi sholat wajib.',
            ])
            ->assertRedirect();

        $this->assertSame(
            2,
            SunnahGuru::whereIn('id', $records->pluck('id'))
                ->where('status_approval', SunnahGuru::STATUS_REJECTED)
                ->where('catatan', 'Lengkapi sholat wajib.')
                ->count()
        );

        $this->assertSame(
            2,
            Notification::where('user_id', $this->guruUser->id)->where('kategori', 'sunnah')->count()
        );
    }

    public function test_resubmitting_rejected_record_notifies_admins(): void
    {
        SunnahGuru::create([
            'guru_id' => $this->guru->id,
            'tanggal' => today()->toDateString(),
            'total_poin' => 0,
            'status_approval' => SunnahGuru::STATUS_REJECTED,
            'catatan' => 'Perbaiki.',
        ]);

        $this->actingAs($this->guruUser)->postJson('/my-sunnah', [
            'tanggal' => today()->toDateString(),
            'fields' => ['sholat_tahajud' => true],
        ])->assertOk()->assertJsonPath('data.status_approval', SunnahGuru::STATUS_PENDING);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->admin->id,
            'kategori' => 'sunnah',
            'judul' => 'Checklist 7SPS Diperbarui',
        ]);
    }
}
