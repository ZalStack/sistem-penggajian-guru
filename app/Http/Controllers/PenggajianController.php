<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\Transport;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PenggajianController extends Controller
{
    public function index(Request $request)
    {
        $query = Penggajian::with(['guru.grade', 'transport'])
            ->when($request->periode, fn ($q, $p) => $q->where('periode', $p))
            ->when($request->filter_grade, fn ($q, $g) => $q->whereHas('guru', fn ($gq) => $gq->where('grade_id', $g)))
            ->when($request->filter_transport, fn ($q, $t) => $q->where('transport_id', $t));

        return Inertia::render('Penggajian/Index', [
            'penggajians' => $query->orderBy('periode', 'desc')->paginate(10)->withQueryString(),
            'grades' => Grade::orderBy('kode_grade')->get(),
            'transports' => Transport::orderBy('jenis')->get(),
            'filters' => $request->only(['periode', 'filter_grade', 'filter_transport']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Penggajian/Create', [
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'transports' => Transport::orderBy('jenis')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'guru_id' => [
                'required',
                'exists:gurus,id',
                Rule::unique('penggajians', 'guru_id')
                    ->where('periode', $request->periode)
                    ->where('transport_id', $request->transport_id),
            ],
            'periode' => 'required|string|max:7',
            'jumlah_sesi' => 'required|integer|min:1',
            'transport_id' => 'required|exists:transports,id',
        ], [
            'guru_id.unique' => 'Guru ini sudah memiliki data penggajian pada periode yang dipilih.',
            'jumlah_sesi.min' => 'Jumlah sesi minimal 1.',
        ]);

        $guru = Guru::with('grade')->findOrFail($validated['guru_id']);
        $transport = Transport::findOrFail($validated['transport_id']);

        $honor = ($guru->grade?->honor_per_sesi ?? 0) * $validated['jumlah_sesi'];
        $totalTransport = $transport->biaya * $validated['jumlah_sesi'];

        Penggajian::create([
            ...$validated,
            'honor' => $honor,
            'total_transport' => $totalTransport,
            'total' => $honor + $totalTransport,
        ]);

        return redirect()->route('penggajian.index')->with('success', 'Data penggajian berhasil ditambahkan.');
    }

    public function edit(Penggajian $penggajian)
    {
        $penggajian->load(['guru.grade', 'transport']);

        return Inertia::render('Penggajian/Edit', [
            'penggajian' => $penggajian,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'transports' => Transport::orderBy('jenis')->get(),
        ]);
    }

    public function update(Request $request, Penggajian $penggajian)
    {
        $validated = $request->validate([
            'guru_id' => [
                'required',
                'exists:gurus,id',
                Rule::unique('penggajians', 'guru_id')
                    ->where('periode', $request->periode)
                    ->where('transport_id', $request->transport_id)
                    ->ignore($penggajian->id),
            ],
            'periode' => 'required|string|max:7',
            'jumlah_sesi' => 'required|integer|min:1',
            'transport_id' => 'required|exists:transports,id',
        ], [
            'guru_id.unique' => 'Guru ini sudah memiliki data penggajian pada periode dan transport yang dipilih.',
            'jumlah_sesi.min' => 'Jumlah sesi minimal 1.',
        ]);

        $guru = Guru::with('grade')->findOrFail($validated['guru_id']);
        $transport = Transport::findOrFail($validated['transport_id']);

        $honor = ($guru->grade?->honor_per_sesi ?? 0) * $validated['jumlah_sesi'];
        $totalTransport = $transport->biaya * $validated['jumlah_sesi'];

        $penggajian->update([
            ...$validated,
            'honor' => $honor,
            'total_transport' => $totalTransport,
            'total' => $honor + $totalTransport,
        ]);

        return redirect()->route('penggajian.index')->with('success', 'Data penggajian berhasil diperbarui.');
    }

    public function show(Penggajian $penggajian)
    {
        $penggajian->load(['guru.grade', 'transport']);

        return Inertia::render('Penggajian/Show', ['penggajian' => $penggajian]);
    }

    public function destroy(Penggajian $penggajian)
    {
        $penggajian->delete();

        return redirect()->route('penggajian.index')->with('success', 'Data penggajian berhasil dihapus.');
    }
}
