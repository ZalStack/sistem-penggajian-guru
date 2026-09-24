<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GuruController extends Controller
{
    public function index(Request $request)
    {
        $query = Guru::with(['grade', 'user'])
            ->when($request->search, function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                return $q->where(function ($w) use ($safe) {
                    $w->where('nama', 'like', "%{$safe}%", '\\')
                        ->orWhere('domisili', 'like', "%{$safe}%", '\\')
                        ->orWhere('nomor_telepon', 'like', "%{$safe}%", '\\');
                });
            })
            ->when($request->filter_grade, fn ($q, $g) => $q->where('grade_id', $g))
            ->when($request->filter_mapel, fn ($q, $m) => $q->where('mapel', $m));

        return Inertia::render('Guru/Index', [
            'gurus' => $query->orderBy('nama')->paginate(10)->withQueryString(),
            'grades' => Grade::orderBy('kode_grade')->get(),
            'filters' => $request->only(['search', 'filter_grade', 'filter_mapel']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Guru/Create', [
            'grades' => Grade::orderBy('kode_grade')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'mapel' => 'required|in:IPA,MTK',
            'jenjang' => 'nullable|string|max:100',
            'domisili' => 'nullable|string|max:255',
            'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
            'tunjangan_khusus' => 'nullable|numeric|min:0|max:9999999999',
            'bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:50',
            'keterangan_mengajar' => 'nullable|string|max:1000',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $passwordToUse = $validated['password'] ?? Str::random(16);
        $isGenerated = ! isset($validated['password']);

        DB::transaction(function () use ($validated, $passwordToUse, &$guru) {
            $user = User::create([
                'name' => $validated['nama'],
                'email' => $validated['email'],
                'password' => Hash::make($passwordToUse),
            ]);

            $user->forceFill(['role' => 'guru'])->save();

            $guru = Guru::create([
                'nama' => $validated['nama'],
                'grade_id' => $validated['grade_id'],
                'mapel' => $validated['mapel'],
                'jenjang' => $validated['jenjang'] ?? null,
                'domisili' => $validated['domisili'] ?? null,
                'nomor_telepon' => $validated['nomor_telepon'] ?? null,
                'tunjangan_khusus' => $validated['tunjangan_khusus'] ?? 0,
                'bank' => $validated['bank'] ?? null,
                'nomor_rekening' => $validated['nomor_rekening'] ?? null,
                'keterangan_mengajar' => $validated['keterangan_mengajar'] ?? null,
                'user_id' => $user->id,
            ]);

            $user->forceFill(['guru_id' => $guru->id])->save();
        });

        $msg = $isGenerated
            ? 'Akun guru berhasil dibuat. Email: '.$validated['email'].' | Password: '.$passwordToUse
            : 'Akun guru berhasil dibuat. Email: '.$validated['email'];

        return redirect()->route('guru.index')->with('success', $msg);
    }

    public function show(Guru $guru)
    {
        $guru->load('grade', 'user', 'penggajians.transport');

        return Inertia::render('Guru/Show', ['guru' => $guru]);
    }

    public function edit(Guru $guru)
    {
        $guru->load('user');

        return Inertia::render('Guru/Edit', [
            'guru' => $guru,
            'grades' => Grade::orderBy('kode_grade')->get(),
        ]);
    }

    public function update(Request $request, Guru $guru)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'mapel' => 'required|in:IPA,MTK',
            'jenjang' => 'nullable|string|max:100',
            'domisili' => 'nullable|string|max:255',
            'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
            'tunjangan_khusus' => 'nullable|numeric|min:0|max:9999999999',
            'bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:50',
            'keterangan_mengajar' => 'nullable|string|max:1000',
            'email' => 'required|email|unique:users,email,'.$guru->user_id,
        ]);

        $guru->update([
            'nama' => $validated['nama'],
            'grade_id' => $validated['grade_id'],
            'mapel' => $validated['mapel'],
            'jenjang' => $validated['jenjang'] ?? null,
            'domisili' => $validated['domisili'] ?? null,
            'nomor_telepon' => $validated['nomor_telepon'] ?? null,
            'tunjangan_khusus' => $validated['tunjangan_khusus'] ?? 0,
            'bank' => $validated['bank'] ?? null,
            'nomor_rekening' => $validated['nomor_rekening'] ?? null,
            'keterangan_mengajar' => $validated['keterangan_mengajar'] ?? null,
        ]);

        if ($guru->user) {
            $guru->user->update([
                'name' => $validated['nama'],
                'email' => $validated['email'],
            ]);
        }

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil diperbarui.');
    }

    public function destroy(Guru $guru)
    {
        DB::transaction(function () use ($guru) {
            if ($guru->user) {
                $guru->user->delete();
            }
            $guru->delete();
        });

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil dihapus.');
    }

    public function resetPassword(Guru $guru)
    {
        if (! $guru->user) {
            return back()->withErrors(['error' => 'Guru ini belum memiliki akun login.']);
        }

        $newPassword = Str::random(16);

        $guru->user->update(['password' => Hash::make($newPassword)]);

        return back()->with('success', 'Password berhasil direset. Password baru: '.$newPassword);
    }

    public function exportCredentialsPdf(Request $request)
    {
        $gurus = Guru::with(['grade', 'user'])
            ->when($request->search, function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                return $q->where('nama', 'like', "%{$safe}%", '\\');
            })
            ->when($request->filter_grade, fn ($q, $g) => $q->where('grade_id', $g))
            ->orderBy('nama')
            ->get();

        $pdf = Pdf::loadView('pdf.guru-credentials', ['gurus' => $gurus])
            ->setPaper('a4', 'landscape');

        $filename = 'data-login-guru-'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($filename);
    }
}
