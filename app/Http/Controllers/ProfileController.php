<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Grade;
use App\Models\Program;
use App\Services\AdikSyncService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileController extends Controller
{
    /**
     * Disk & direktori penyimpanan foto profil guru (privat, dilayani route sendiri).
     */
    private const FOTO_DISK = 'local';

    private const FOTO_DIRECTORY = 'guru-foto';

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load('guru.grade', 'guru.programs');

        return Inertia::render('Profile/Edit', [
            'user' => $user,
            'guru' => $user->guru,
            'grades' => Grade::orderBy('kode_grade')->get(),
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
            'fotoUrl' => $user->guru?->fotoUrl(),
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information, including guru data & foto profil.
     *
     * Catatan: grade_id (honorarium) dan tunjangan_khusus TIDAK boleh diubah guru —
     * keduanya tidak divalidasi di sini sehingga permintaan apa pun diabaikan.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        /**
         * Validasi data guru lebih dulu agar tidak ada data tersimpan
         * sebagian saat validasi gagal.
         *
         * @var array<string, mixed>|null $guruData
         */
        $guruData = null;

        if ($user->isGuru() && $user->guru) {
            $guruData = $request->validate($this->guruRules(), [
                'foto.file' => 'File foto tidak valid.',
                'foto.mimes' => 'Format foto harus JPG, JPEG, PNG, atau WEBP.',
                'foto.max' => 'Ukuran foto maksimal 5 MB.',
                'nomor_telepon.regex' => 'Format nomor telepon hanya boleh berisi angka, spasi, +, -, (, dan ).',
            ]);

            if (isset($guruData['riwayat_pendidikan']) && is_array($guruData['riwayat_pendidikan'])) {
                $guruData['riwayat_pendidikan'] = implode("\n", array_values(array_filter(array_map('trim', $guruData['riwayat_pendidikan']))));
            }
            if (isset($guruData['riwayat_mengajar']) && is_array($guruData['riwayat_mengajar'])) {
                $cleanMeng = array_values(array_filter(array_map('trim', $guruData['riwayat_mengajar'])));
                $guruData['riwayat_mengajar'] = implode("\n", $cleanMeng);
                if (empty($guruData['keterangan_mengajar'])) {
                    $guruData['keterangan_mengajar'] = implode("\n", $cleanMeng);
                }
            }
        }

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        if ($request->filled('password')) {
            $request->validate([
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ]);
            $user->password = Hash::make($request->input('password'));
        }

        $user->save();

        if ($guruData !== null && $user->guru) {
            $guru = $user->guru;

            // Sinkronkan nama guru dengan name user
            $guruData['nama'] = $user->name;

            if ($request->hasFile('foto')) {
                $newPath = $this->simpanFoto($request, $user->name);
                $this->hapusFoto($guru->foto);
                $guruData['foto'] = $newPath;
            } else {
                unset($guruData['foto']);
            }

            $guru->update($guruData);
            $guru->programs()->sync(collect($request->input('program_ids', []))->filter()->map(fn ($id) => (int) $id)->all());

            // Sinkronisasi otomatis ke SI ADIK-KK
            AdikSyncService::pushTeacherToAdik($guru);
        }

        // Admin tidak memiliki data guru, jadi tidak perlu update tambahan

        return Redirect::route('profile.edit')->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Sajikan foto profil milik user yang sedang login (untuk <img> sidebar & profil).
     */
    public function photo(Request $request): StreamedResponse
    {
        $guru = $request->user()->guru;

        abort_unless($guru?->foto, 404);

        $disk = Storage::disk(self::FOTO_DISK);

        abort_unless($disk->exists($guru->foto), 404);

        return $disk->response($guru->foto, null, [
            'Cache-Control' => 'private, max-age=3600, must-revalidate',
        ]);
    }

    /**
     * Hapus foto profil guru beserta file fisiknya.
     */
    public function destroyFoto(Request $request): RedirectResponse
    {
        $guru = $request->user()->guru;

        if (! $guru?->foto) {
            return Redirect::route('profile.edit')->with('warning', 'Belum ada foto profil untuk dihapus.');
        }

        $this->hapusFoto($guru->foto);
        $guru->update(['foto' => null]);

        return Redirect::route('profile.edit')->with('success', 'Foto profil berhasil dihapus.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Aturan validasi data guru untuk update profil (form sama dengan Data Guru admin,
     * kecuali grade_id & tunjangan_khusus yang hanya diubah admin).
     *
     * @return array<string, string>
     */
    private function guruRules(): array
    {
        return [
            'mapel' => 'required|in:IPA,MTK',
            'bidang_2' => 'required|in:IPA,MTK|different:mapel',
            'aktivitas_luar_kpm' => 'nullable|string|max:2000',
            'program_ids' => 'nullable|array',
            'program_ids.*' => 'integer|exists:programs,id',
            'jenjang' => 'nullable|string|max:100',
            'domisili' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:1000',
            'riwayat_pendidikan' => 'nullable',
            'pendidikan_terakhir' => 'nullable|string|max:100',
            'tanggal_bergabung' => 'nullable|date',
            'pelatihan_suprarasional' => 'nullable|boolean',
            'lama_mengajar' => 'nullable|integer|min:0|max:60',
            'riwayat_mengajar' => 'nullable',
            'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
            'bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:50',
            'keterangan_mengajar' => 'nullable|string|max:1000',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
        ];
    }

    /**
     * Simpan foto profil baru ke disk privat dan kembalikan path-nya.
     */
    private function simpanFoto(Request $request, string $namaGuru): string
    {
        $file = $request->file('foto');
        $filename = Str::slug($namaGuru).'-'.Str::lower(Str::random(8)).'.'.$file->extension();

        return $file->storeAs(self::FOTO_DIRECTORY, $filename, self::FOTO_DISK);
    }

    /**
     * Hapus file foto profil lama bila masih ada.
     */
    private function hapusFoto(?string $path): void
    {
        if ($path && Storage::disk(self::FOTO_DISK)->exists($path)) {
            Storage::disk(self::FOTO_DISK)->delete($path);
        }
    }
}
