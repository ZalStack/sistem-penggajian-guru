<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Test revisi item 1-14: ploting guru, anti-bentrok, riwayat mengajar,
 * perizinan tanpa cuti + wajib surat sakit, dua bidang, dan pencarian nama.
 */
class RevisiSiguruTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Grade $grade;

    private Transport $transport;

    private Guru $guru;

    private Program $program;

    private User $guruUser;

    private Location $location;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'admin.revisi@satugurukpm.id',
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

        $this->location = Location::create([
            'nama_lokasi' => 'KPM Pusat - Gedung Utama',
            'alamat' => 'Jl. Raya Bogor No. 1, Kota Bogor',
            'latitude' => -6.2,
            'longitude' => 106.8451,
            'radius' => 100,
        ]);

        $this->guru = Guru::create([
            'nama' => 'Budi Santoso, S.Pd',
            'mapel' => 'IPA',
            'bidang_2' => 'MTK',
            'jenjang' => 'SMP',
            'grade_id' => $this->grade->id,
            'domisili' => 'Kota Bogor',
            'pendidikan_terakhir' => 'S.Pd',
            'lama_mengajar' => 5,
            'tanggal_bergabung' => '2021-08-01',
        ]);

        $this->guru->programs()->attach($this->program->id);

        $this->guruUser = User::factory()->create([
            'email' => 'guru.revisi@satugurukpm.id',
            'role' => 'guru',
            'guru_id' => $this->guru->id,
        ]);
    }

    // ── Item 3: urutan terbaru lebih dulu ─────────────────────────────

    public function test_session_list_is_sorted_newest_first(): void
    {
        $this->createSession(today()->subDays(2)->toDateString(), '08:00', '10:00');
        $this->createSession(today()->toDateString(), '08:00', '10:00');
        $this->createSession(today()->toDateString(), '10:00', '12:00');

        $this->actingAs($this->user)
            ->get('/session')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sessions/Index')
                ->where('sessions.data.0.jam_mulai', '10:00')
                ->where('sessions.data.0.tanggal', fn ($v) => $this->tanggalString($v) === today()->toDateString())
                ->where('sessions.data.1.jam_mulai', '08:00')
                ->where('sessions.data.1.tanggal', fn ($v) => $this->tanggalString($v) === today()->toDateString())
                ->where('sessions.data.2.tanggal', fn ($v) => $this->tanggalString($v) === today()->subDays(2)->toDateString())
                ->has('sessions.data', 3)
            );
    }

    // ── Item 4: pekan + bahan ajar ────────────────────────────────────

    public function test_session_stores_pekan_and_bahan_ajar_and_defaults_pekan(): void
    {
        $this->actingAs($this->user)
            ->post('/session', $this->sessionPayload([
                'tanggal' => today()->addDay()->toDateString(),
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'pekan' => 2,
                'bahan_ajar' => 'Aljabar linear dan matriks',
            ]))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('teaching_sessions', [
            'guru_id' => $this->guru->id,
            'pekan' => 2,
            'bahan_ajar' => 'Aljabar linear dan matriks',
        ]);

        // Pekan tidak diisi -> default pekan 1.
        $this->actingAs($this->user)
            ->post('/session', $this->sessionPayload([
                'tanggal' => today()->addDays(3)->toDateString(),
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
            ]))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('teaching_sessions', [
            'guru_id' => $this->guru->id,
            'pekan' => 1,
            'bahan_ajar' => null,
        ]);
    }

    // ── Item 5: alarm ploting ganda & kelas di luar penugasan ─────────

    public function test_double_plotting_on_same_class_and_day_is_blocked(): void
    {
        $this->createSession(today()->toDateString(), '08:00', '10:00');

        // Jam tidak bertabrakan, tetapi kelas + hari sama -> tetap ditolak.
        $this->actingAs($this->user)
            ->post('/session', $this->sessionPayload([
                'tanggal' => today()->toDateString(),
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
            ]))
            ->assertSessionHasErrors(['program_id']);

        $this->assertSame(1, TeachingSession::count());
    }

    public function test_plotting_class_outside_teacher_assignment_is_blocked(): void
    {
        $otherProgram = Program::create(['nama' => 'Kelas Online', 'slug' => 'kelas-online', 'urutan' => 2]);

        $this->actingAs($this->user)
            ->post('/session', $this->sessionPayload([
                'program_id' => $otherProgram->id,
                'tanggal' => today()->addDay()->toDateString(),
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
            ]))
            ->assertSessionHasErrors(['program_id']);

        $this->assertSame(0, TeachingSession::count());
    }

    // ── Item 4: presensi hanya pada kelas plotingan ───────────────────

    public function test_checkin_is_rejected_for_class_outside_plotting(): void
    {
        $otherProgram = Program::create(['nama' => 'Kelas Online', 'slug' => 'kelas-online', 'urutan' => 2]);

        $session = TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $otherProgram->id,
            'mapel' => 'IPA',
            'tanggal' => today()->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
            'status' => TeachingSession::STATUS_DIJADWALKAN,
        ]);

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
            str_contains($message, 'plotingan') || str_contains($message, 'plotted'),
            "Pesan penolakan tidak menyebut plotingan: {$message}"
        );

        $this->assertSame(0, Attendance::count());
    }

    // ── Item 9: tanpa cuti & wajib surat sakit ────────────────────────

    public function test_cuti_option_is_removed_and_sakit_requires_attachment(): void
    {
        Storage::fake('local');

        // Jenis cuti tidak lagi diterima.
        $this->actingAs($this->guruUser)
            ->post('/my-perizinan', [
                'jenis' => 'cuti',
                'tanggal_mulai' => today()->addDay()->toDateString(),
                'tanggal_selesai' => today()->addDays(2)->toDateString(),
                'alasan' => 'Cuti tahunan.',
            ])
            ->assertSessionHasErrors(['jenis']);

        // Sakit tanpa lampiran surat ditolak.
        $this->actingAs($this->guruUser)
            ->post('/my-perizinan', [
                'jenis' => 'sakit',
                'tanggal_mulai' => today()->addDay()->toDateString(),
                'tanggal_selesai' => today()->addDays(2)->toDateString(),
                'alasan' => 'Demam tinggi.',
            ])
            ->assertSessionHasErrors(['lampiran_surat_sakit']);

        $this->assertSame(0, Perizinan::count());

        // Sakit dengan lampiran diterima dan filenya tersimpan.
        $this->actingAs($this->guruUser)
            ->post('/my-perizinan', [
                'jenis' => 'sakit',
                'tanggal_mulai' => today()->addDay()->toDateString(),
                'tanggal_selesai' => today()->addDays(2)->toDateString(),
                'alasan' => 'Demam tinggi.',
                'lampiran_surat_sakit' => UploadedFile::fake()->image('surat-sakit.jpg'),
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $perizinan = Perizinan::firstOrFail();
        $this->assertSame('sakit', $perizinan->jenis);
        $this->assertNotNull($perizinan->lampiran_surat_sakit);
        Storage::disk('local')->assertExists($perizinan->lampiran_surat_sakit);

        // Pemilik pengajuan dapat mengunduh surat sakitnya.
        $this->actingAs($this->guruUser)
            ->get(route('perizinan.surat-sakit', $perizinan->id))
            ->assertOk();

        // Data cuti legacy tetap ditampilkan (tidak bisa dibuat lagi).
        Perizinan::create([
            'guru_id' => $this->guru->id,
            'jenis' => 'cuti',
            'tanggal_mulai' => today()->addDays(10),
            'tanggal_selesai' => today()->addDays(12),
            'alasan' => 'Cuti lama.',
            'status' => Perizinan::STATUS_PENDING,
        ]);

        $this->actingAs($this->user)->get('/perizinan')->assertOk();
        $this->actingAs($this->guruUser)->get('/my-perizinan')->assertOk();
    }

    // ── Item 11 & 12: aktivitas luar KPM + tepat 2 bidang ────────────

    public function test_guru_requires_two_different_bidangs(): void
    {
        $payload = [
            'nama' => 'Guru Dua Bidang',
            'grade_id' => $this->grade->id,
            'mapel' => 'MTK',
            'email' => 'dua.bidang@satugurukpm.id',
        ];

        // Bidang kedua wajib diisi.
        $this->actingAs($this->user)
            ->post('/guru', $payload)
            ->assertSessionHasErrors(['bidang_2']);

        // Bidang kedua tidak boleh sama dengan bidang utama.
        $this->actingAs($this->user)
            ->post('/guru', [...$payload, 'bidang_2' => 'MTK'])
            ->assertSessionHasErrors(['bidang_2']);

        // Payload valid: dua bidang berbeda + aktivitas luar KPM.
        $this->actingAs($this->user)
            ->post('/guru', [
                ...$payload,
                'bidang_2' => 'IPA',
                'aktivitas_luar_kpm' => "Les privat di luar KPM\nMenjadi juri olimpiade",
            ])
            ->assertSessionHasNoErrors();

        $guru = Guru::where('nama', 'Guru Dua Bidang')->firstOrFail();
        $this->assertSame('MTK', $guru->mapel);
        $this->assertSame('IPA', $guru->bidang_2);
        $this->assertStringContainsString('Les privat di luar KPM', (string) $guru->aktivitas_luar_kpm);
        $this->assertSame(['MTK', 'IPA'], $guru->daftarBidang());
    }

    // ── Item 7: filter nama + riwayat mengajar & potensi ──────────────

    public function test_payroll_can_filter_by_teacher_name_and_exposes_teaching_history(): void
    {
        $otherGuru = Guru::create([
            'nama' => 'Citra Lestari',
            'mapel' => 'MTK',
            'bidang_2' => 'IPA',
            'grade_id' => $this->grade->id,
        ]);

        Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 4,
            'jumlah_hadir' => 4,
            'honor' => 240000,
            'total_transport' => 0,
            'tunjangan_khusus' => 0,
            'total' => 240000,
        ]);

        Penggajian::create([
            'guru_id' => $otherGuru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 2,
            'jumlah_hadir' => 2,
            'honor' => 120000,
            'total_transport' => 0,
            'tunjangan_khusus' => 0,
            'total' => 120000,
        ]);

        // Filter nama: hanya guru yang cocok yang tampil.
        $this->actingAs($this->user)
            ->get('/penggajian?search=Budi')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Salary/Index')
                ->has('penggajians.data', 1)
                ->where('penggajians.data.0.guru.nama', 'Budi Santoso, S.Pd')
                ->where('filters.search', 'Budi')
                ->has('riwayatMengajar')
            );

        // Tanpa filter: kedua guru tampil + riwayat mengajar ikut dikirim.
        $this->createSession(today()->toDateString(), '08:00', '10:00');

        $this->actingAs($this->user)
            ->get('/penggajian')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('penggajians.data', 2)
                ->where('riwayatMengajar.'.$this->guru->id.'.total_sesi', 2)
                ->where('riwayatMengajar.'.$this->guru->id.'.potensi_gaji', fn ($v) => (float) $v === 120000.0)
            );
    }

    public function test_guru_salary_page_exposes_teaching_history_and_potential(): void
    {
        $this->createSession(today()->toDateString(), '08:00', '10:00');

        $this->actingAs($this->guruUser)
            ->get('/my-salary')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Salary/Index')
                ->where('periodeAktif', now()->format('Y-m'))
                ->where('riwayatMengajar.'.$this->guru->id.'.total_sesi', 2)
                ->where('riwayatMengajar.'.$this->guru->id.'.sessions.0.program', 'Kelas Khusus')
                ->where('riwayatMengajar.'.$this->guru->id.'.potensi_gaji', fn ($v) => (float) $v === 120000.0)
            );

        // Filter periode diterima tanpa error.
        $this->actingAs($this->guruUser)
            ->get('/my-salary?periode='.now()->format('Y-m'))
            ->assertOk()
            ->assertSessionHasNoErrors();
    }

    // ── Item 8: laporan mengirim riwayat mengajar lengkap ─────────────

    public function test_laporan_exposes_full_teaching_history(): void
    {
        Penggajian::create([
            'guru_id' => $this->guru->id,
            'periode' => now()->format('Y-m'),
            'jumlah_sesi' => 2,
            'jumlah_hadir' => 2,
            'honor' => 120000,
            'total_transport' => 0,
            'tunjangan_khusus' => 0,
            'total' => 120000,
        ]);

        $this->createSession(today()->toDateString(), '08:00', '10:00');

        $this->actingAs($this->user)
            ->get('/laporan?periode='.now()->format('Y-m'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Laporan/Index')
                ->where('periodeAktif', now()->format('Y-m'))
                ->where('riwayatMengajar.'.$this->guru->id.'.total_sesi', 2)
                ->where('riwayatMengajar.'.$this->guru->id.'.sessions.0.bahan_ajar', null)
                ->where('riwayatMengajar.'.$this->guru->id.'.potensi_gaji', fn ($v) => (float) $v === 120000.0)
            );
    }

    /**
     * Normalisasi serialisasi tanggal (ISO-8601) ke format Y-m-d sesuai timezone aplikasi.
     */
    private function tanggalString(string $value): string
    {
        return Carbon::parse($value)
            ->timezone(config('app.timezone'))
            ->toDateString();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function sessionPayload(array $overrides = []): array
    {
        return array_merge([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'IPA',
            'tanggal' => today()->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'jumlah_sesi' => 2,
            'status' => TeachingSession::STATUS_DIJADWALKAN,
        ], $overrides);
    }

    private function createSession(string $tanggal, string $jamMulai = '08:00', string $jamSelesai = '10:00'): TeachingSession
    {
        return TeachingSession::create([
            'guru_id' => $this->guru->id,
            'location_id' => $this->location->id,
            'transport_id' => $this->transport->id,
            'program_id' => $this->program->id,
            'mapel' => 'IPA',
            'tanggal' => $tanggal,
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
            'jumlah_sesi' => 2,
            'status' => TeachingSession::STATUS_SELESAI,
        ]);
    }
}
