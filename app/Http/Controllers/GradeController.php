<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GradeController extends Controller
{
    public function index()
    {
        return Inertia::render('Grade/Index', [
            'grades' => Grade::withCount('gurus')->orderBy('kode_grade')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_grade' => 'required|string|max:10|unique:grades,kode_grade',
            'honor_per_sesi' => 'required|numeric|min:1',
        ]);

        Grade::create($validated);

        return redirect()->route('grade.index')->with('success', 'Grade berhasil ditambahkan.');
    }

    public function update(Request $request, Grade $grade)
    {
        $validated = $request->validate([
            'kode_grade' => 'required|string|max:10|unique:grades,kode_grade,'.$grade->id,
            'honor_per_sesi' => 'required|numeric|min:1',
        ]);

        $grade->update($validated);

        return redirect()->route('grade.index')->with('success', 'Grade berhasil diperbarui.');
    }

    public function destroy(Grade $grade)
    {
        $gurusCount = $grade->gurus()->count();
        if ($gurusCount > 0) {
            return redirect()->route('grade.index')->with('error', 'Grade tidak dapat dihapus karena masih digunakan oleh '.$gurusCount.' guru.');
        }

        $grade->delete();

        return redirect()->route('grade.index')->with('success', 'Grade berhasil dihapus.');
    }
}
