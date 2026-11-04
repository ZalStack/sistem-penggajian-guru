<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }

    public function test_guru_profile_page_is_displayed_with_guru_data_props(): void
    {
        [$user, $guru] = $this->createGuruUser();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('guru.id', $guru->id)
                ->has('grades')
                ->has('programs'));
    }

    public function test_guru_can_update_profile_with_the_same_fields_as_the_admin_form(): void
    {
        [$user, $guru] = $this->createGuruUser();

        $program = Program::create([
            'nama' => 'Kelas Khusus',
            'slug' => 'kelas-khusus',
            'deskripsi' => 'Kelas pendamping khusus',
            'urutan' => 1,
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Guru Baru Nama',
                'email' => $user->email,
                'mapel' => 'MTK',
                'program_ids' => [$program->id],
                'jenjang' => 'SMP',
                'domisili' => 'Kota Bogor',
                'alamat' => 'Jl. Kenanga No. 7, Bogor',
                'riwayat_pendidikan' => 'S1 Pendidikan Matematika — UI',
                'pendidikan_terakhir' => 'S.Pd, M.Pd',
                'tanggal_bergabung' => '2024-01-15',
                'lama_mengajar' => 4,
                'riwayat_mengajar' => '2020–2024 — SMPN 1 Bogor',
                'nomor_telepon' => '0812-3456-7890',
                'bank' => 'BRI',
                'nomor_rekening' => '1234567890',
                'keterangan_mengajar' => 'IPA Kelas 8 dan 9',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $guru->refresh();
        $user->refresh();

        $this->assertSame('Guru Baru Nama', $user->name);
        $this->assertSame('Guru Baru Nama', $guru->nama);
        $this->assertSame('MTK', $guru->mapel);
        $this->assertSame('SMP', $guru->jenjang);
        $this->assertSame('Kota Bogor', $guru->domisili);
        $this->assertSame('Jl. Kenanga No. 7, Bogor', $guru->alamat);
        $this->assertSame('S1 Pendidikan Matematika — UI', $guru->riwayat_pendidikan);
        $this->assertSame('S.Pd, M.Pd', $guru->pendidikan_terakhir);
        $this->assertSame('2024-01-15', $guru->tanggal_bergabung->toDateString());
        $this->assertSame(4, $guru->lama_mengajar);
        $this->assertSame('2020–2024 — SMPN 1 Bogor', $guru->riwayat_mengajar);
        $this->assertSame('0812-3456-7890', $guru->nomor_telepon);
        $this->assertSame('BRI', $guru->bank);
        $this->assertSame('1234567890', $guru->nomor_rekening);
        $this->assertSame('IPA Kelas 8 dan 9', $guru->keterangan_mengajar);
        $this->assertTrue($guru->programs->contains($program->id));
    }

    public function test_guru_cannot_change_grade_or_special_allowance_from_profile(): void
    {
        [$user, $guru] = $this->createGuruUser();
        $originalGradeId = $guru->grade_id;

        $otherGrade = Grade::create([
            'kode_grade' => 'ZZ',
            'honor_per_sesi' => 900000,
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'mapel' => $guru->mapel,
                'grade_id' => $otherGrade->id,
                'tunjangan_khusus' => 999999999,
            ]);

        $response->assertSessionHasNoErrors();

        $guru->refresh();

        $this->assertSame($originalGradeId, $guru->grade_id);
        $this->assertNotSame($otherGrade->id, $guru->grade_id);
        $this->assertSame('150000.00', $guru->tunjangan_khusus);
    }

    public function test_guru_can_upload_profile_photo(): void
    {
        Storage::fake('local');
        [$user, $guru] = $this->createGuruUser();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'mapel' => $guru->mapel,
                'foto' => UploadedFile::fake()->image('foto-profil.jpg'),
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $guru->refresh();

        $this->assertNotNull($guru->foto);
        $this->assertStringStartsWith('guru-foto/', $guru->foto);
        Storage::disk('local')->assertExists($guru->foto);
        $this->assertStringContainsString('/profile/foto', $guru->fotoUrl());
    }

    public function test_invalid_profile_photo_is_rejected_with_indonesian_message(): void
    {
        Storage::fake('local');
        [$user, $guru] = $this->createGuruUser();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'mapel' => $guru->mapel,
                'foto' => UploadedFile::fake()->create('dokumen.txt', 10, 'text/plain'),
            ]);

        $response->assertSessionHasErrors([
            'foto' => 'Format foto harus JPG, JPEG, PNG, atau WEBP.',
        ]);

        $this->assertNull($guru->refresh()->foto);
    }

    public function test_uploading_new_profile_photo_replaces_the_old_file(): void
    {
        Storage::fake('local');
        [$user, $guru] = $this->createGuruUser();

        Storage::disk('local')->put('guru-foto/foto-lama.jpg', 'isi-foto-lama');
        $guru->update(['foto' => 'guru-foto/foto-lama.jpg']);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'mapel' => $guru->mapel,
                'foto' => UploadedFile::fake()->image('foto-baru.jpg'),
            ]);

        $response->assertSessionHasNoErrors();

        $guru->refresh();

        $this->assertNotSame('guru-foto/foto-lama.jpg', $guru->foto);
        Storage::disk('local')->assertExists($guru->foto);
        Storage::disk('local')->assertMissing('guru-foto/foto-lama.jpg');
    }

    public function test_guru_can_delete_profile_photo(): void
    {
        Storage::fake('local');
        [$user, $guru] = $this->createGuruUser();

        Storage::disk('local')->put('guru-foto/foto.jpg', 'isi-foto');
        $guru->update(['foto' => 'guru-foto/foto.jpg']);

        $response = $this
            ->actingAs($user)
            ->delete('/profile/foto');

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNull($guru->refresh()->foto);
        Storage::disk('local')->assertMissing('guru-foto/foto.jpg');
    }

    public function test_profile_photo_is_served_to_logged_in_guru(): void
    {
        Storage::fake('local');
        [$user, $guru] = $this->createGuruUser();

        Storage::disk('local')->put('guru-foto/foto.jpg', 'isi-foto');
        $guru->update(['foto' => 'guru-foto/foto.jpg']);

        $this
            ->actingAs($user)
            ->get('/profile/foto')
            ->assertOk()
            ->assertHeader('content-type', 'image/jpeg');
    }

    public function test_profile_photo_returns_not_found_when_guru_has_no_photo(): void
    {
        [$user] = $this->createGuruUser();

        $this
            ->actingAs($user)
            ->get('/profile/foto')
            ->assertNotFound();
    }

    /**
     * Buat satu guru beserta akun login ber-role guru untuk test profil.
     *
     * @param  array<string, mixed>  $guruAttributes
     * @return array{0: User, 1: Guru}
     */
    private function createGuruUser(array $guruAttributes = []): array
    {
        $grade = Grade::create([
            'kode_grade' => 'A',
            'honor_per_sesi' => 60000,
        ]);

        $guru = Guru::create(array_merge([
            'nama' => 'Guru Contoh',
            'grade_id' => $grade->id,
            'mapel' => 'IPA',
            'tunjangan_khusus' => 150000,
        ], $guruAttributes));

        $user = User::factory()->create([
            'role' => 'guru',
            'guru_id' => $guru->id,
        ]);

        return [$user, $guru];
    }
}
