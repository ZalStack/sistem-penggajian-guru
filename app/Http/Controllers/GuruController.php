<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GuruController extends Controller
{
    public function index(Request $request)
    {
        $query = Guru::with(['grade', 'user'])
            ->when($request->search, fn ($q, $s) => $q->where('nama', 'like', "%{$s}%"))
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
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['nama'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'guru',
        ]);

        $guru = Guru::create([
            'nama' => $validated['nama'],
            'grade_id' => $validated['grade_id'],
            'mapel' => $validated['mapel'],
            'jenjang' => $validated['jenjang'] ?? null,
            'user_id' => $user->id,
        ]);

        $user->update(['guru_id' => $guru->id]);

        return redirect()->route('guru.index')->with('success', 'Akun guru berhasil dibuat. Email: '.$validated['email'].' | Password: '.$validated['password']);
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
            'email' => 'required|email|unique:users,email,'.$guru->user_id,
        ]);

        $guru->update([
            'nama' => $validated['nama'],
            'grade_id' => $validated['grade_id'],
            'mapel' => $validated['mapel'],
            'jenjang' => $validated['jenjang'] ?? null,
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
        if ($guru->user) {
            $guru->user->delete();
        }

        $guru->delete();

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil dihapus.');
    }

    public function resetPassword(Guru $guru)
    {
        if (! $guru->user) {
            return back()->withErrors(['error' => 'Guru ini belum memiliki akun login.']);
        }

        $newPassword = Str::lower(substr($guru->nama, 0, 4)).'123456';

        $guru->user->update(['password' => $newPassword]);

        return back()->with('success', 'Password berhasil direset. Password baru: '.$newPassword);
    }
}
