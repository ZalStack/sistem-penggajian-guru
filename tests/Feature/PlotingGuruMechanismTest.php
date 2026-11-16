<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Material;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlotingGuruMechanismTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $guruUser;

    protected Guru $guru;

    protected Location $location;

    protected Transport $transport;

    protected Program $program;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-11-14 10:00:00', 'Asia/Jakarta'));

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->guruUser = User::factory()->create([
            'name' => 'Guru Pengajar 1',
            'role' => 'guru',
        ]);

        $grade = Grade::create(['kode_grade' => 'A1', 'honor_per_sesi' => 100000]);
        $this->location = Location::create([
            'nama_lokasi' => 'KPM Pusat',
            'alamat' => 'Bogor',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'radius' => 100,
        ]);
        $this->transport = Transport::create(['jenis' => 'Dalam Kota', 'biaya' => 35000]);
        $this->program = Program::create(['nama' => 'Kelas Khusus', 'slug' => 'kelas-khusus', 'urutan' => 1]);

        $this->guru = Guru::create([
            'user_id' => $this->guruUser->id,
            'nama' => 'Guru Pengajar 1',
            'grade_id' => $grade->id,
            'mapel' => 'MTK',
            'is_active_this_week' => true,
        ]);

        $this->guru->programs()->attach($this->program->id);
        $this->guruUser->update(['guru_id' => $this->guru->id]);
    }

    public function test_ploting_guru_index_orders_schedules_descending(): void
    {
        TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'MTK',
            'tanggal' => '2026-11-05',
            'pekan' => 1,
            'session_time' => '08:00 - 09:30',
            'kelas' => 'Kelas 3',
        ]);

        TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'MTK',
            'tanggal' => '2026-11-12',
            'pekan' => 2,
            'session_time' => '10:00 - 11:30',
            'kelas' => 'Kelas 4',
        ]);

        $this->actingAs($this->adminUser)
            ->get('/session?month=11&year=2026')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sessions/Index')
                ->has('schedules', 2)
                ->where('schedules.0.session_date', '2026-11-12')
                ->where('schedules.1.session_date', '2026-11-05')
            );
    }

    public function test_multiple_sessions_can_be_added_in_the_same_week(): void
    {
        // Sesi 1 di Pekan 1
        $this->actingAs($this->adminUser)
            ->post('/session', [
                'teacher_id' => $this->guru->id,
                'month' => 11,
                'year' => 2026,
                'pekan' => 1,
                'session_date' => '2026-11-05',
                'session_time' => '08:00 - 09:30',
                'kelas' => 'Kelas 3',
            ])
            ->assertSessionHasNoErrors();

        // Sesi 2 di Pekan 1 yang sama di kelas berbeda
        $this->actingAs($this->adminUser)
            ->post('/session', [
                'teacher_id' => $this->guru->id,
                'month' => 11,
                'year' => 2026,
                'pekan' => 1,
                'session_date' => '2026-11-05',
                'session_time' => '10:00 - 11:30',
                'kelas' => 'Kelas 4',
            ])
            ->assertSessionHasNoErrors();

        $pekan1Count = TeachingSession::where('guru_id', $this->guru->id)
            ->whereMonth('tanggal', 11)
            ->whereYear('tanggal', 2026)
            ->where('pekan', 1)
            ->count();

        $this->assertEquals(2, $pekan1Count);
    }

    public function test_direct_material_pdf_upload_creates_material(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('modul_matematika_pekan_1.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->adminUser)
            ->post('/session/upload-material', [
                'title' => 'Modul Matematika Pekan 1',
                'file' => $file,
                'subject' => 'MTK',
                'pekan' => 'Pekan 1',
                'kelas' => 'Kelas 3',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('materials', [
            'title' => 'Modul Matematika Pekan 1',
            'subject' => 'MTK',
            'status' => 'approved',
        ]);
    }

    public function test_anti_bentrok_alarm_triggers_when_guru_scheduled_duplicate_on_same_date_and_class(): void
    {
        TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'MTK',
            'tanggal' => '2026-11-05',
            'pekan' => 1,
            'session_time' => '08:00 - 09:30',
            'kelas' => 'Kelas 3',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->from('/session')
            ->post('/session', [
                'teacher_id' => $this->guru->id,
                'month' => 11,
                'year' => 2026,
                'pekan' => 1,
                'session_date' => '2026-11-05',
                'session_time' => '08:00 - 09:30',
                'kelas' => 'Kelas 3',
            ]);

        $response->assertRedirect('/session');
        $response->assertSessionHasErrors('conflict');
    }

    public function test_anti_bentrok_alarm_triggers_when_class_scheduled_with_different_teacher_on_same_date(): void
    {
        $guruUser2 = User::factory()->create(['role' => 'guru']);
        $guru2 = Guru::create([
            'user_id' => $guruUser2->id,
            'nama' => 'Guru Pengajar 2',
            'grade_id' => $this->guru->grade_id,
            'mapel' => 'IPA',
        ]);

        TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'MTK',
            'tanggal' => '2026-11-05',
            'pekan' => 1,
            'session_time' => '08:00 - 09:30',
            'kelas' => 'Kelas 3',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->from('/session')
            ->post('/session', [
                'teacher_id' => $guru2->id,
                'month' => 11,
                'year' => 2026,
                'pekan' => 1,
                'session_date' => '2026-11-05',
                'session_time' => '08:00 - 09:30',
                'kelas' => 'Kelas 3',
            ]);

        $response->assertRedirect('/session');
        $response->assertSessionHasErrors('conflict');
    }

    public function test_dropdown_status_toggle_updates_teacher_status(): void
    {
        $this->actingAs($this->adminUser)
            ->post("/session/teachers/{$this->guru->id}/toggle-active", [
                'status' => 'nonaktif',
                'is_active_this_week' => false,
            ])
            ->assertRedirect();

        $this->assertFalse((bool) $this->guru->fresh()->is_active_this_week);

        $this->actingAs($this->adminUser)
            ->post("/session/teachers/{$this->guru->id}/toggle-active", [
                'status' => 'aktif',
                'is_active_this_week' => true,
            ])
            ->assertRedirect();

        $this->assertTrue((bool) $this->guru->fresh()->is_active_this_week);
    }

    public function test_bulk_weeks_plotting_works(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post('/session', [
                'teacher_id' => $this->guru->id,
                'month' => 11,
                'year' => 2026,
                'weeks' => [
                    [
                        'pekan' => 1,
                        'kelas' => 'Kelas 1',
                        'session_date' => '2026-11-03',
                        'session_time' => '08:00 - 09:30',
                        'bidang' => 'MTK',
                    ],
                    [
                        'pekan' => 2,
                        'kelas' => 'Kelas 2',
                        'session_date' => '2026-11-10',
                        'session_time' => '08:00 - 09:30',
                        'bidang' => 'MTK',
                    ],
                ],
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals(2, TeachingSession::where('guru_id', $this->guru->id)->count());
    }
}
