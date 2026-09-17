<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Guru;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuruController extends Controller
{
    public function index(Request $request)
    {
        $query = Guru::with('grade')
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
        ]);

        Guru::create($validated);

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil ditambahkan.');
    }

    public function show(Guru $guru)
    {
        $guru->load('grade', 'penggajians.transport');

        return Inertia::render('Guru/Show', ['guru' => $guru]);
    }

    public function edit(Guru $guru)
    {
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
        ]);

        $guru->update($validated);

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil diperbarui.');
    }

    public function destroy(Guru $guru)
    {
        $guru->delete();

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil dihapus.');
    }
}
