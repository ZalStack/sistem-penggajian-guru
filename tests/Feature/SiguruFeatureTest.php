<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Notification;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SiguruFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Grade $grade;

    private Transport $transport;

    private Guru $guru;

    private Program $program;

    private User $guruUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'admin@satugurukpm.id',
            'role' => 'admin',
        ]);

        $this->grade = Grade::create([
            'kode_grade' => 'A',
            'honor_per_sesi' => 60000,
        ]);

        $this->transport = Transport::create([
            'jenis' => 'Dalam Kota',
            'biaya' => 25000,
        ]);

        $this->program = Program::create([
            'nama' => 'Kelas Khusus',
            'slug' => 'kelas-khusus',
            'deskripsi' => 'Kelas pendamping khusus',
            'urutan' => 1,
        ]);

        $this->guru = Guru::create([
            'nama' => 'Budi Santoso, S.Pd',
            'mapel' => 'IPA',
            'jenjang' => 'SMP',
            'grade_id' => $this->grade->id,
            'domisili' => 'Kota Bogor',
            'pendidikan_terakhir' => 'S.Pd',
            'lama_mengajar' => 5,
            'tanggal_bergabung' => '2021-08-01',
        ]);

        $this->guru->programs()->attach($this->program->id);

        $this->guruUser = User::factory()->create([
            'email' => 'guru@satugurukpm.id',
            'role' => 'guru',
            'guru_id' => $this->guru->id,
        ]);

        $this->guru->update(['user_id' => $this->guruUser->id]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/guru')->assertRedirect('/login');
        $this->get('/grade')->assertRedirect('/login');
        $this->get('/transport')->assertRedirect('/login');
        $this->get('/penggajian')->assertRedirect('/login');
        $this->get('/laporan')->assertRedirect('/login');
        $this->get('/jadwal')->assertRedirect('/login');
        $this->get('/session')->assertRedirect('/login');
        $this->get('/perizinan')->assertRedirect('/login');
    }

    public function test_authenticated_admin_can_access_all_pages(): void
    {
        $this->actingAs($this->user)->get('/dashboard')->assertOk();
        $this->actingAs($this->user)->get('/guru')->assertOk();
        $this->actingAs($this->user)->get('/guru/create')->assertOk();
        $this->actingAs($this->user)->get('/grade')->assertOk();
        $this->actingAs($this->user)->get('/transport')->assertOk();
        $this->actingAs($this->user)->get('/penggajian')->assertOk();
        $this->actingAs($this->user)->get('/laporan')->assertOk();
        $this->actingAs($this->user)->get('/jadwal')->assertOk();
        $this->actingAs($this->user)->get('/session')->assertOk();
        $this->actingAs($this->user)->get('/attendance')->assertOk();
        $this->actingAs($this->user)->get('/perizinan')->assertOk();
        $this->actingAs($this->user)->get('/location')->assertOk();
        $this->actingAs($this->user)->get('/notifications')->assertOk();
        $this->actingAs($this->user)->get('/profile')->assertOk();
    }

    public function test_guru_cannot_access_admin_pages(): void
    {
        $this->actingAs($this->guruUser)->get('/penggajian')->assertForbidden();
        $this->actingAs($this->guruUser)->get('/guru')->assertForbidden();
        $this->actingAs($this->guruUser)->get('/session')->assertForbidden();
        $this->actingAs($this->guruUser)->get('/attendance')->assertForbidden();
        $this->actingAs($this->guruUser)->get('/laporan')->assertForbidden();
    }

    public function test_jadwal_bulanan_redirects_to_weekly_schedule(): void
    {
        $this->actingAs($this->user)
            ->get('/jadwal-bulanan')
            ->assertRedirect('/jadwal');
    }

    public function test_cannot_delete_grade_if_guru_is_assigned(): void
    {
        $response = $this->actingAs($this->user)->delete("/grade/{$this->grade->id}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('grades', ['id' => $this->grade->id]);
    }

    public function test_weekly_schedule_shows_session_and_recap(): void
    {
        $this->createSession(today()->toDateString());

        $this->actingAs($this->user)
            ->get('/jadwal')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Jadwal/Index')
                ->has('days', 7)
                ->where('role', 'admin')
                ->where('rekapMinggu.total_sesi', 2)
            );

        // Navigasi minggu sebelumnya tetap valid.
        $this->actingAs($this->user)
            ->get('/jadwal?minggu='.today()->subWeek()->toDateString())
            ->assertOk();
    }

    public function test_guru_only_sees_own_schedule(): void
    {
        $this->createSession(today()->toDateString());

        $this->actingAs($this->guruUser)
            ->get('/jadwal')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Jadwal/Index')
                ->where('role', 'guru')
            );
    }

    public function test_guru_list_can_be_filtered_by_program(): void
    {
        $this->actingAs($this->user)
            ->get('/guru?filter_program='.$this->program->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Index')
                ->where('filters.filter_program', (string) $this->program->id)
                ->has('gurus.data', 1)
            );

        $otherProgram = Program::create(['nama' => 'Kelas Online', 'slug' => 'kelas-online', 'urutan' => 2]);

        $this->actingAs($this->user)
            ->get('/guru?filter_program='.$otherProgram->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('gurus.data', 0));
    }

    public function test_teaching_session_store_with_program_and_status(): void
    {
        $location = Location::create([
            'nama_lokasi' => 'Kelas A',
            'alamat' => 'Jl. Pendidikan No. 1, Kota Bogor',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 100,
        ]);

        $response = $this->actingAs($this->user)->post('/session', [
            'guru_id' => $this->guru->id,
            'location_id' => $location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'IPA',
            'tanggal' => today()->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
            'status' => TeachingSession::STATUS_DIJADWALKAN,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('teaching_sessions', [
            'guru_id' => $this->guru->id,
            'location_id' => $location->id,
            'program_id' => $this->program->id,
            'status' => TeachingSession::STATUS_DIJADWALKAN,
            'jumlah_sesi' => 2,
        ]);

        $this->actingAs($this->user)->get('/session')->assertOk();
        $this->actingAs($this->user)->get('/attendance')->assertOk();
    }

    public function test_session_cannot_overlap_existing_schedule(): void
    {
        $this->createSession(today()->toDateString());

        $location = Location::create([
            'nama_lokasi' => 'Kelas B',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 100,
        ]);

        $this->actingAs($this->user)
            ->post('/session', [
                'guru_id' => $this->guru->id,
                'location_id' => $location->id,
                'transport_id' => $this->transport->id,
                'program_id' => $this->program->id,
                'mapel' => 'IPA',
                'tanggal' => today()->toDateString(),
                'jam_mulai' => '09:00',
                'jam_selesai' => '11:00',
                'jumlah_sesi' => 2,
                'status' => TeachingSession::STATUS_DIJADWALKAN,
            ])
            ->assertSessionHasErrors(['jam_mulai']);
    }

    public function test_penggajian_is_calculated_from_valid_attendance(): void
    {
        $session = $this->createSession(today()->subMonth()->toDateString());

        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'tanggal' => $session->tanggal,
            'checkin_time' => $session->tanggal->copy()->setTime(8, 0),
            'checkout_time' => $session->tanggal->copy()->setTime(10, 0),
            'durasi' => 120,
            'status' => 'valid',
        ]);

        $periode = $session->tanggal->format('Y-m');

        $response = $this->actingAs($this->user)->post('/penggajian/calculate', [
            'periode' => $periode,
        ]);

        $response->assertSessionHas('success');

        // Satu baris per guru per periode — tidak ada penghitungan ganda.
        $this->assertSame(1, Penggajian::where('guru_id', $this->guru->id)->where('periode', $periode)->count());

        $penggajian = Penggajian::where('guru_id', $this->guru->id)->where('periode', $periode)->firstOrFail();

        $this->assertEquals('belum_dibayar', $penggajian->status_bayar);
        $this->assertEquals(1, $penggajian->jumlah_hadir);
        $this->assertEquals(60000, (float) $penggajian->honor);
        $this->assertEquals(25000, (float) $penggajian->total_transport);
        $this->assertEquals(85000, (float) $penggajian->total);

        // Rincian per program & transport dapat ditelusuri.
        $rincian = $penggajian->rincian();
        $this->assertCount(1, $rincian);
        $this->assertSame($this->program->nama, $rincian->first()['program']);
        $this->assertSame('Dalam Kota', $rincian->first()['transport']);
        $this->assertEquals(1, $rincian->first()['jumlah_hadir']);
    }

    public function test_penggajian_recalculation_does_not_duplicate_rows(): void
    {
        $session = $this->createSession(today()->subMonth()->toDateString());

        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'tanggal' => $session->tanggal,
            'checkin_time' => $session->tanggal->copy()->setTime(8, 0),
            'checkout_time' => $session->tanggal->copy()->setTime(10, 0),
            'durasi' => 120,
            'status' => 'valid',
        ]);

        $periode = $session->tanggal->format('Y-m');

        Penggajian::calculateForGuru($this->guru, $periode);
        Penggajian::calculateForGuru($this->guru, $periode);

        $this->assertSame(1, Penggajian::where('guru_id', $this->guru->id)->where('periode', $periode)->count());
    }

    public function test_paid_penggajian_is_not_recalculated(): void
    {
        $session = $this->createSession(today()->subMonth()->toDateString());

        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'tanggal' => $session->tanggal,
            'checkin_time' => $session->tanggal->copy()->setTime(8, 0),
            'checkout_time' => $session->tanggal->copy()->setTime(10, 0),
            'durasi' => 120,
            'status' => 'valid',
        ]);

        $periode = $session->tanggal->format('Y-m');

        Penggajian::calculateForGuru($this->guru, $periode);
        Penggajian::where('guru_id', $this->guru->id)->where('periode', $periode)->update(['status_bayar' => Penggajian::STATUS_SUDAH]);

        // Presensi tambahan tidak mengubah baris yang sudah dibayar.
        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'tanggal' => $session->tanggal->copy()->addDay(),
            'checkin_time' => $session->tanggal->copy()->addDay()->setTime(8, 0),
            'checkout_time' => $session->tanggal->copy()->addDay()->setTime(10, 0),
            'durasi' => 120,
            'status' => 'valid',
        ]);

        Penggajian::calculateForGuru($this->guru, $periode);

        $penggajian = Penggajian::where('guru_id', $this->guru->id)->where('periode', $periode)->firstOrFail();
        $this->assertEquals(1, $penggajian->jumlah_hadir);
        $this->assertEquals('sudah_dibayar', $penggajian->status_bayar);
    }

    public function test_salary_calculate_and_pay_notifies_guru(): void
    {
        $session = $this->createSession(today()->subMonth()->toDateString());

        Attendance::create([
            'guru_id' => $this->guru->id,
            'session_id' => $session->id,
            'tanggal' => $session->tanggal,
            'checkin_time' => $session->tanggal->copy()->setTime(8, 0),
            'checkout_time' => $session->tanggal->copy()->setTime(10, 0),
            'durasi' => 120,
            'status' => 'valid',
        ]);

        $periode = $session->tanggal->format('Y-m');

        $response = $this->actingAs($this->user)->post('/penggajian/calculate', [
            'periode' => $periode,
        ]);

        $response->assertSessionHas('success');

        $penggajian = Penggajian::where('guru_id', $this->guru->id)->where('periode', $periode)->firstOrFail();
        $this->assertEquals('belum_dibayar', $penggajian->status_bayar);

        $payResponse = $this->actingAs($this->user)->post("/penggajian/{$penggajian->id}/pay");
        $payResponse->assertSessionHas('success');

        $this->assertEquals('sudah_dibayar', $penggajian->fresh()->status_bayar);

        $this->assertTrue(
            Notification::where('user_id', $this->guruUser->id)->where('kategori', 'gaji')->exists(),
            'Guru menerima notifikasi setelah honor dibayar.'
        );
    }

    public function test_penggajian_page_shows_consolidated_recap(): void
    {
        Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 4,
            'jumlah_hadir' => 2,
            'honor' => 120000,
            'total_transport' => 50000,
            'tunjangan_khusus' => 10000,
            'detail' => [[
                'program_id' => $this->program->id,
                'program' => $this->program->nama,
                'transport_id' => $this->transport->id,
                'transport' => 'Dalam Kota',
                'jumlah_sesi' => 4,
                'jumlah_hadir' => 2,
                'honor' => 120000,
                'transport_biaya' => 50000,
                'total' => 170000,
            ]],
            'total' => 180000,
        ]);

        $this->actingAs($this->user)
            ->get('/penggajian')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Salary/Index')
                ->has('penggajians.data', 1)
                ->where('ringkasan.grand_total', fn ($v) => (float) $v === 180000.0)
                ->where('ringkasan.total_tunjangan', fn ($v) => (float) $v === 10000.0)
            );
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
            'alamat' => 'Jl. Merdeka No. 10, Kota Bogor',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 150,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('locations', ['nama_lokasi' => 'Kampus KPM Pusat', 'alamat' => 'Jl. Merdeka No. 10, Kota Bogor']);

        $location = Location::where('nama_lokasi', 'Kampus KPM Pusat')->first();

        $this->actingAs($this->user)->put("/location/{$location->id}", [
            'nama_lokasi' => 'Kampus KPM Pusat Updated',
            'alamat' => 'Jl. Merdeka No. 10, Kota Bogor',
            'latitude' => -6.5971,
            'longitude' => 106.8060,
            'radius' => 200,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('locations', ['nama_lokasi' => 'Kampus KPM Pusat Updated', 'radius' => 200]);

        $this->actingAs($this->user)->delete("/location/{$location->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('locations', ['id' => $location->id]);
    }

    public function test_perizinan_admin_decision_notifies_guru(): void
    {
        $perizinan = Perizinan::create([
            'guru_id' => $this->guru->id,
            'jenis' => 'sakit',
            'tanggal_mulai' => today()->addDays(2),
            'tanggal_selesai' => today()->addDays(3),
            'alasan' => 'Demam, perlu istirahat.',
            'status' => Perizinan::STATUS_PENDING,
        ]);

        $this->actingAs($this->user)->get('/perizinan')->assertOk();

        $this->actingAs($this->user)
            ->put("/perizinan/{$perizinan->id}", [
                'status' => Perizinan::STATUS_DISETUJUI,
                'catatan_admin' => 'Sesi dialihkan, mohon istirahat.',
            ])
            ->assertSessionHas('success');

        $this->assertEquals(Perizinan::STATUS_DISETUJUI, $perizinan->fresh()->status);

        $this->assertTrue(
            Notification::where('user_id', $this->guruUser->id)
                ->where('kategori', 'perizinan')
                ->where('judul', 'Perizinan Disetujui')
                ->exists()
        );
    }

    public function test_guru_role_dashboard_and_views(): void
    {
        $this->createSession(today()->toDateString());

        $this->actingAs($this->guruUser)->get('/dashboard')->assertOk();
        $this->actingAs($this->guruUser)->get('/jadwal')->assertOk();
        $this->actingAs($this->guruUser)->get('/my-attendance')->assertOk();
        $this->actingAs($this->guruUser)->get('/my-salary')->assertOk();
        $this->actingAs($this->guruUser)->get('/my-perizinan')->assertOk();
        $this->actingAs($this->guruUser)->get('/notifications')->assertOk();
    }

    public function test_notification_mark_all_as_read(): void
    {
        Notification::send($this->guruUser, 'Judul', 'Pesan info.');

        $this->actingAs($this->guruUser)
            ->post('/notifications/mark-all-read')
            ->assertSessionHas('success');

        $this->assertTrue(Notification::where('user_id', $this->guruUser->id)->first()->dibaca);
    }

    public function test_checkin_ditolak_saat_izin_disetujui_berlaku(): void
    {
        $session = $this->createSession(today()->toDateString());

        Perizinan::create([
            'guru_id' => $this->guru->id,
            'jenis' => 'izin',
            'tanggal_mulai' => today(),
            'tanggal_selesai' => today(),
            'alasan' => 'Ada keperluan mendesak.',
            'status' => Perizinan::STATUS_DISETUJUI,
        ]);

        // Route web check-in penggajian sudah dinonaktifkan — presensi guru
        // dilakukan di SI ADIK-KK (geofence GPS), bukan di aplikasi ini.
        $this->actingAs($this->guruUser)->post('/checkin', [
            'session_id' => $session->id,
            'latitude' => -6.2,
            'longitude' => 106.8451,
            'accuracy' => 10,
        ])->assertNotFound();
        $this->actingAs($this->guruUser)->post('/checkout', [
            'session_id' => $session->id,
            'latitude' => -6.2,
            'longitude' => 106.8451,
            'accuracy' => 10,
        ])->assertNotFound();

        // Proteksi izin tetap berlaku pada endpoint API check-in yang dipertahankan.
        Sanctum::actingAs($this->guruUser);
        $response = $this->postJson('/api/v1/attendances/check-in', [
            'session_id' => $session->id,
            'latitude' => -6.2,
            'longitude' => 106.8451,
            'accuracy' => 10,
        ]);

        $response->assertStatus(422);
        $message = mb_strtolower((string) ($response->json('message') ?? '').json_encode($response->json('errors') ?? []));
        $this->assertTrue(
            str_contains($message, 'izin') || str_contains($message, 'leave'),
            "Pesan penolakan tidak menyebut izin/leave: {$message}"
        );
        $this->assertSame(0, Attendance::count());
    }

    public function test_rekap_presensi_admin_menampilkan_sesi_tanpa_checkin_dan_izin(): void
    {
        $tanggalIzin = today()->subDays(2)->toDateString();
        $tanggalBiasa = today()->subDay()->toDateString();

        // Sesi tanpa check-in dan tanpa perizinan.
        $this->createSession($tanggalBiasa);

        // Sesi pada tanggal yang tertutup perizinan disetujui.
        $sesiIzin = $this->createSession($tanggalIzin);
        Perizinan::create([
            'guru_id' => $this->guru->id,
            'session_id' => $sesiIzin->id,
            'jenis' => 'cuti',
            'tanggal_mulai' => $tanggalIzin,
            'tanggal_selesai' => $tanggalIzin,
            'alasan' => 'Cuti keluarga.',
            'status' => Perizinan::STATUS_DISETUJUI,
        ]);

        $this->actingAs($this->user)
            ->get('/attendance')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Attendance/Index')
                ->has('attendances.data', 2)
                ->where('recap.total', 2)
                ->where('recap.belum_checkin', 1)
                ->where('recap.izin', 1)
                ->where('recap.valid', 0)
            );

        // Filter status ikut bekerja untuk status baru.
        $this->actingAs($this->user)
            ->get('/attendance?filter_status=izin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('attendances.data', 1)
                ->where('attendances.data.0.status', 'izin')
            );

        $this->actingAs($this->user)
            ->get('/attendance?filter_status=belum_checkin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('attendances.data', 1)
                ->where('attendances.data.0.status', 'belum_checkin')
            );
    }

    public function test_perizinan_terhubung_ke_jadwal_mengajar(): void
    {
        $this->createSession(today()->addDays(2)->toDateString());

        Perizinan::create([
            'guru_id' => $this->guru->id,
            'jenis' => 'izin',
            'tanggal_mulai' => today()->addDay(),
            'tanggal_selesai' => today()->addDays(3),
            'alasan' => 'Ada keperluan keluarga.',
            'status' => Perizinan::STATUS_PENDING,
        ]);

        // Guru: sesi mendatang disiapkan untuk dikaitkan dengan pengajuan,
        // dan jumlah sesi terdampak ikut ditampilkan.
        $this->actingAs($this->guruUser)
            ->get('/my-perizinan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Perizinan/Index')
                ->has('sesiTerjadwal', 1)
                ->where('perizinan.0.jumlah_sesi_terdampak', 1)
            );

        // Admin: jumlah sesi terdampak ikut dikirim untuk ditinjau.
        $this->actingAs($this->user)
            ->get('/perizinan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Perizinan/Index')
                ->where('perizinan.data.0.jumlah_sesi_terdampak', 1)
            );
    }

    public function test_pengajuan_perizinan_harus_mencakup_sesi_terpilih(): void
    {
        $session = $this->createSession(today()->addDays(5)->toDateString());

        // Sesi di luar rentang tanggal pengajuan ditolak.
        $this->actingAs($this->guruUser)
            ->post('/my-perizinan', [
                'jenis' => 'izin',
                'tanggal_mulai' => today()->addDay()->toDateString(),
                'tanggal_selesai' => today()->addDays(2)->toDateString(),
                'session_id' => $session->id,
                'alasan' => 'Keperluan keluarga mendesak.',
            ])
            ->assertSessionHasErrors(['session_id']);

        $this->assertSame(0, Perizinan::count());

        // Rentang yang mencakup sesi diterima dan tersimpan sebagai satu pengajuan.
        $this->actingAs($this->guruUser)
            ->post('/my-perizinan', [
                'jenis' => 'izin',
                'tanggal_mulai' => today()->addDays(4)->toDateString(),
                'tanggal_selesai' => today()->addDays(6)->toDateString(),
                'session_id' => $session->id,
                'alasan' => 'Keperluan keluarga mendesak.',
            ])
            ->assertSessionHas('success');

        $this->assertSame(1, Perizinan::count());
        $this->assertSame($session->id, Perizinan::first()->session_id);
    }

    private function createSession(string $tanggal): TeachingSession
    {
        $location = Location::firstOrCreate(
            ['nama_lokasi' => 'KPM Pusat - Gedung Utama'],
            ['alamat' => 'Jl. Raya Bogor No. 1, Kota Bogor', 'latitude' => -6.2, 'longitude' => 106.8451, 'radius' => 100]
        );

        return TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'IPA',
            'tanggal' => $tanggal,
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
            'status' => TeachingSession::STATUS_SELESAI,
        ]);
    }
}
