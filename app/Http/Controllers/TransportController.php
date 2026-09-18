<?php

namespace App\Http\Controllers;

use App\Models\Transport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransportController extends Controller
{
    public function index()
    {
        return Inertia::render('Transport/Index', [
            'transports' => Transport::withCount('penggajians')->orderBy('jenis')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jenis' => 'required|string|max:50|unique:transports,jenis',
            'biaya' => 'required|numeric|min:1',
        ]);

        Transport::create($validated);

        return redirect()->route('transport.index')->with('success', 'Transport berhasil ditambahkan.');
    }

    public function update(Request $request, Transport $transport)
    {
        $validated = $request->validate([
            'jenis' => 'required|string|max:50|unique:transports,jenis,'.$transport->id,
            'biaya' => 'required|numeric|min:1',
        ]);

        $transport->update($validated);

        return redirect()->route('transport.index')->with('success', 'Transport berhasil diperbarui.');
    }

    public function destroy(Transport $transport)
    {
        $penggajiansCount = $transport->penggajians()->count();
        if ($penggajiansCount > 0) {
            return redirect()->route('transport.index')->with('error', 'Transport tidak dapat dihapus karena masih digunakan pada '.$penggajiansCount.' riwayat penggajian.');
        }

        $transport->delete();

        return redirect()->route('transport.index')->with('success', 'Transport berhasil dihapus.');
    }
}
