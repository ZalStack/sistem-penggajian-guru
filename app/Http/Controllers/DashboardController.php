<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Penggajian;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $periode = $request->periode ?? now()->format('Y-m');

        return Inertia::render('Dashboard', [
            'totalGuru' => Guru::count(),
            'totalGrade' => Grade::count(),
            'totalPenggajian' => Penggajian::where('periode', $periode)->count(),
            'totalHonor' => (float) Penggajian::where('periode', $periode)->sum('total'),
            'guruPerGrade' => Grade::withCount('gurus')->get()->map(fn ($g) => [
                'kode' => $g->kode_grade,
                'count' => $g->gurus_count,
                'honor' => number_format($g->honor_per_sesi, 0, ',', '.'),
            ]),
            'periode' => $periode,
        ]);
    }
}
