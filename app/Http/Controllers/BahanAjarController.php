<?php

namespace App\Http\Controllers;

use App\Models\BahanAjar;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BahanAjarController extends Controller
{
    private const DISK = 'local';

    private const DIRECTORY = 'bahan-ajar';

    /**
     * Admin: daftar bahan ajar dengan pencarian & filter mapel.
     */
    public function index(Request $request)
    {
        $query = BahanAjar::with('uploader')
            ->when($request->filled('search'), function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->where(function ($w) use ($safe) {
                    $w->where('judul', 'like', "%{$safe}%", '\\')
                        ->orWhere('deskripsi', 'like', "%{$safe}%", '\\');
                });
            })
            ->when($request->filled('filter_mapel'), fn ($q, $m) => $q->where('mapel', $m));

        return Inertia::render('BahanAjar/Index', [
            'bahanAjar' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'filter_mapel']),
        ]);
    }

    /**
     * Admin: upload bahan ajar baru + notifikasi semua guru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'mapel' => 'required|in:IPA,MTK,umum',
            'file' => 'required|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,webp,zip|max:10240',
        ], [
            'file.required' => 'File materi wajib dipilih.',
            'file.mimes' => 'Format file harus PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, WEBP, atau ZIP.',
            'file.max' => 'Ukuran file maksimal 10 MB.',
        ]);

        $file = $request->file('file');
        $filename = Str::slug($validated['judul']).'-'.Str::lower(Str::random(8)).'.'.$file->extension();
        $path = $file->storeAs(self::DIRECTORY, $filename, self::DISK);

        $bahanAjar = BahanAjar::create([
            'user_id' => $request->user()->id,
            'judul' => $validated['judul'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'mapel' => $validated['mapel'],
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        $this->notifyGuru($bahanAjar);

        return redirect()->route('bahan-ajar.index')->with('success', 'Bahan ajar "'.$bahanAjar->judul.'" berhasil diunggah & notifikasi terkirim ke semua guru.');
    }

    /**
     * Admin: perbarui meta / ganti file bahan ajar.
     */
    public function update(Request $request, BahanAjar $bahanAjar)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'mapel' => 'required|in:IPA,MTK,umum',
            'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,webp,zip|max:10240',
        ], [
            'file.mimes' => 'Format file harus PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, WEBP, atau ZIP.',
            'file.max' => 'Ukuran file maksimal 10 MB.',
        ]);

        $attributes = [
            'judul' => $validated['judul'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'mapel' => $validated['mapel'],
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = Str::slug($validated['judul']).'-'.Str::lower(Str::random(8)).'.'.$file->extension();
            $path = $file->storeAs(self::DIRECTORY, $filename, self::DISK);

            if ($bahanAjar->file_path && Storage::disk(self::DISK)->exists($bahanAjar->file_path)) {
                Storage::disk(self::DISK)->delete($bahanAjar->file_path);
            }

            $attributes['file_path'] = $path;
            $attributes['file_name'] = $file->getClientOriginalName();
            $attributes['file_mime'] = $file->getMimeType();
            $attributes['file_size'] = $file->getSize();
        }

        $bahanAjar->update($attributes);

        return redirect()->route('bahan-ajar.index')->with('success', 'Bahan ajar berhasil diperbarui.');
    }

    /**
     * Admin: hapus bahan ajar beserta file fisiknya.
     */
    public function destroy(BahanAjar $bahanAjar)
    {
        if ($bahanAjar->file_path && Storage::disk(self::DISK)->exists($bahanAjar->file_path)) {
            Storage::disk(self::DISK)->delete($bahanAjar->file_path);
        }

        $judul = $bahanAjar->judul;
        $bahanAjar->delete();

        return redirect()->route('bahan-ajar.index')->with('success', 'Bahan ajar "'.$judul.'" berhasil dihapus.');
    }

    /**
     * Admin & Guru: unduh file (hanya lewat route ber-auth).
     */
    public function download(BahanAjar $bahanAjar)
    {
        abort_unless(
            Storage::disk(self::DISK)->exists($bahanAjar->file_path),
            404,
            'File bahan ajar tidak ditemukan.'
        );

        return Storage::disk(self::DISK)->download($bahanAjar->file_path, $bahanAjar->file_name);
    }

    /**
     * Guru: daftar bahan ajar yang bisa diakses semua guru.
     */
    public function guruIndex(Request $request)
    {
        $query = BahanAjar::query()
            ->when($request->filled('search'), function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->where(function ($w) use ($safe) {
                    $w->where('judul', 'like', "%{$safe}%", '\\')
                        ->orWhere('deskripsi', 'like', "%{$safe}%", '\\');
                });
            })
            ->when($request->filled('filter_mapel'), fn ($q, $m) => $q->where('mapel', $m));

        return Inertia::render('BahanAjar/GuruIndex', [
            'bahanAjar' => $query->latest()->paginate(12)->withQueryString(),
            'filters' => $request->only(['search', 'filter_mapel']),
        ]);
    }

    /**
     * Kirim notifikasi in-app ke seluruh user ber-role guru.
     */
    private function notifyGuru(BahanAjar $bahanAjar): void
    {
        $guruUserIds = User::where('role', 'guru')->pluck('id');

        if ($guruUserIds->isEmpty()) {
            return;
        }

        $now = now();
        $rows = $guruUserIds->map(fn ($userId) => [
            'user_id' => $userId,
            'judul' => 'Bahan Ajar Baru: '.$bahanAjar->judul,
            'pesan' => 'Admin mengunggah bahan ajar baru'.($bahanAjar->mapel !== 'umum' ? ' untuk mapel '.$bahanAjar->mapel : '').'. Silakan buka menu Bahan Ajar untuk mengunduhnya.',
            'tipe' => 'info',
            'kategori' => 'sistem',
            'dibaca' => false,
            'dibaca_pada' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        Notification::insert($rows);
    }
}
