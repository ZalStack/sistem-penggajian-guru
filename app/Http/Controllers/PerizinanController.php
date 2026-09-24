<?php

namespace App\Http\Controllers;

use App\Models\Perizinan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PerizinanController extends Controller
{
    public function guruIndex(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        $perizinan = Perizinan::where('guru_id', $guru->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Guru/Perizinan/Index', [
            'perizinan' => $perizinan,
        ]);
    }

    public function guruStore(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        $validated = $request->validate([
            'jenis' => 'required|in:izin,sakit,cuti',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string|max:500',
        ]);

        Perizinan::create([
            'guru_id' => $guru->id,
            ...$validated,
        ]);

        return back()->with('success', ' pengajuan perizinan berhasil dikirim.');
    }

    public function adminIndex(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,disetujui,ditolak',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
        ]);

        $query = Perizinan::with('guru.grade')
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Perizinan/Index', [
            'perizinan' => $query,
            'gurus' => \App\Models\Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['status', 'filter_guru']),
        ]);
    }

    public function adminUpdate(Request $request, Perizinan $perizinan)
    {
        $validated = $request->validate([
            'status' => 'required|in:disetujui,ditolak',
            'catatan_admin' => 'required|string|max:500',
        ]);

        $perizinan->update($validated);

        return back()->with('success', 'Status perizinan berhasil diperbarui.');
    }
}
