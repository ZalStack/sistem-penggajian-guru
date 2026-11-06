<?php

namespace Tests\Feature;

use App\Models\BahanAjar;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Pencarian data (Data Guru, Bahan Ajar, API publik) harus selalu 200.
 *
 * Regresi: klausa LIKE sempat dipanggil dengan argumen boolean keempat ('\\')
 * sehingga SQL menjadi cacat (SQLSTATE 42000 / HTTP 500).
 */
class SearchDataTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guruUser;

    private Grade $grade;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@satugurukpm.id',
            'role' => 'admin',
        ]);

        $this->grade = Grade::create([
            'kode_grade' => 'A',
            'honor_per_sesi' => 60000,
        ]);

        $guru = Guru::create([
            'nama' => 'Ayunda Rahmawati, S.Pd',
            'mapel' => 'IPA',
            'jenjang' => 'SMP',
            'grade_id' => $this->grade->id,
            'domisili' => 'Kota Bogor',
            'pendidikan_terakhir' => 'S.Pd',
            'lama_mengajar' => 3,
            'tanggal_bergabung' => '2021-08-01',
        ]);

        Guru::create([
            'nama' => 'Budi Santoso, S.Pd',
            'mapel' => 'MTK',
            'jenjang' => 'SMP',
            'grade_id' => $this->grade->id,
            'domisili' => 'Kota Depok',
            'pendidikan_terakhir' => 'S.Pd',
            'lama_mengajar' => 5,
            'tanggal_bergabung' => '2020-01-01',
        ]);

        $this->guruUser = User::factory()->create([
            'email' => 'guru@satugurukpm.id',
            'role' => 'guru',
            'guru_id' => $guru->id,
        ]);

        $guru->update(['user_id' => $this->guruUser->id]);

        BahanAjar::create([
            'user_id' => $this->admin->id,
            'judul' => 'Modul IPA Kelas 8',
            'deskripsi' => 'Materi zat aditif dan adiktif',
            'mapel' => 'IPA',
            'file_path' => 'bahan-ajar/modul-ipa.pdf',
            'file_name' => 'modul-ipa.pdf',
            'file_size' => 1024,
        ]);

        BahanAjar::create([
            'user_id' => $this->admin->id,
            'judul' => 'Latihan MTK Persamaan Linear',
            'deskripsi' => 'Bank soal persamaan linear satu variabel',
            'mapel' => 'MTK',
            'file_path' => 'bahan-ajar/mtk-linear.pdf',
            'file_name' => 'mtk-linear.pdf',
            'file_size' => 2048,
        ]);
    }

    public function test_guru_index_search_returns_ok_and_filters_rows(): void
    {
        $this->actingAs($this->admin)
            ->get('/guru?search=ayunda')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Index')
                ->has('gurus.data', 1)
                ->where('gurus.data.0.nama', 'Ayunda Rahmawati, S.Pd')
            );

        $this->actingAs($this->admin)
            ->get('/guru?search=budi')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('gurus.data', 1));
    }

    public function test_guru_index_search_treats_wildcard_characters_literally(): void
    {
        // '%' dan '_' adalah wildcard LIKE; harus dicari sebagai karakter literal,
        // bukan sebagai pola — dan tetap tidak boleh memicu error SQL.
        $this->actingAs($this->admin)
            ->get('/guru?search='.urlencode('100%'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('gurus.data', 0));

        $this->actingAs($this->admin)
            ->get('/guru?search='.urlencode('a_yunda'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('gurus.data', 0));

        $this->actingAs($this->admin)
            ->get('/guru?search='.urlencode('%'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('gurus.data', 0));
    }

    public function test_guru_export_credentials_pdf_with_search_returns_ok(): void
    {
        $this->actingAs($this->admin)
            ->get('/guru/export-credentials-pdf?search=ayunda')
            ->assertOk();
    }

    public function test_bahan_ajar_index_search_returns_ok_and_filters_rows(): void
    {
        $this->actingAs($this->admin)
            ->get('/bahan-ajar?search=ipa')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('BahanAjar/Index')
                ->has('bahanAjar.data', 1)
            );

        $this->actingAs($this->admin)
            ->get('/bahan-ajar?search='.urlencode('100%'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('bahanAjar.data', 0));
    }

    public function test_my_bahan_ajar_search_returns_ok(): void
    {
        $this->actingAs($this->guruUser)
            ->get('/my-bahan-ajar?search=ipa')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('BahanAjar/GuruIndex')
                ->has('bahanAjar.data', 1)
            );

        $this->actingAs($this->guruUser)
            ->get('/my-bahan-ajar?search='.urlencode('a_yunda'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('bahanAjar.data', 0));
    }

    public function test_api_teachers_search_returns_success_json(): void
    {
        $this->getJson('/api/v1/teachers?search=ayunda')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.nama', 'Ayunda Rahmawati, S.Pd');

        $this->getJson('/api/v1/teachers?search='.urlencode('100%'))
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_api_teaching_materials_search_returns_success_json(): void
    {
        $this->getJson('/api/v1/teaching-materials?search=ipa')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/v1/teaching-materials?search='.urlencode('a_yunda'))
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
