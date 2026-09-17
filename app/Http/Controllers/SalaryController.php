<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\TeachingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryController extends Controller
{
    public function index(Request $request)
    {
        $query = Penggajian::with(['guru.grade', 'transport'])
            ->when($request->periode, fn ($q, $p) => $q->where('periode', $p))
            ->when($request->filter_guru, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($request->status_bayar, fn ($q, $s) => $q->where('status_bayar', $s))
            ->orderBy('periode', 'desc')
            ->orderBy('guru_id');

        $penggajians = $query->get();

        return Inertia::render('Admin/Salary/Index', [
            'penggajians' => $penggajians,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru', 'status_bayar']),
        ]);
    }

    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'required|string|size:7',
            'guru_id' => 'nullable|exists:gurus,id',
        ]);

        $guruQuery = Guru::with('grade');
        if ($validated['guru_id'] ?? null) {
            $guruQuery->where('id', $validated['guru_id']);
        }
        $gurus = $guruQuery->get();

        $periodo = $validated['periode'];
        [$year, $month] = explode('-', $periodo);

        foreach ($gurus as $guru) {
            $sessions = TeachingSession::where('guru_id', $guru->id)
                ->whereYear('tanggal', $year)
                ->whereMonth('tanggal', $month)
                ->get();

            $attendances = Attendance::where('guru_id', $guru->id)
                ->whereYear('tanggal', $year)
                ->whereMonth('tanggal', $month)
                ->where('status', 'valid')
                ->get();

            $jumlahSesi = $sessions->sum('jumlah_sesi');
            $jumlahHadir = $attendances->count();
            $totalJam = round($attendances->sum('durasi') / 60, 2);

            $transportId = $sessions->first()?->transport_id ?? 1;
            $biayaTransport = $sessions->first()?->transport?->biaya ?? 0;

            $honor = $jumlahSesi * ($guru->grade->honor_per_sesi ?? 0);
            $totalTransport = $jumlahHadir * $biayaTransport;
            $totalGaji = $honor + $totalTransport;

            Penggajian::updateOrCreate(
                ['guru_id' => $guru->id, 'periode' => $periodo, 'transport_id' => $transportId],
                [
                    'jumlah_sesi' => $jumlahSesi,
                    'jumlah_hadir' => $jumlahHadir,
                    'total_jam' => $totalJam,
                    'honor' => $honor,
                    'total_transport' => $totalTransport,
                    'total' => $totalGaji,
                ]
            );
        }

        return back()->with('success', 'Gaji berhasil dihitung untuk periode '.$periodo);
    }

    public function pay(Request $request, Penggajian $penggajian)
    {
        $penggajian->update(['status_bayar' => 'sudah_dibayar']);

        return back()->with('success', 'Status pembayaran berhasil diperbarui.');
    }

    public function guruSalary(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return Inertia::render('Guru/Salary/Index', [
                'penggajians' => [],
                'guru' => (object) ['nama' => $user->name],
                'totalGaji' => 0,
                'totalBayar' => 0,
                'gajiBulanIni' => null,
            ]);
        }

        $penggajians = Penggajian::with('transport')
            ->where('guru_id', $guru->id)
            ->orderBy('periode', 'desc')
            ->get();

        $now = now();
        $mingguIni = Penggajian::where('guru_id', $guru->id)
            ->where('periode', $now->format('Y-m'))
            ->first();

        $totalGaji = $penggajians->sum('total');
        $totalBayar = $penggajians->where('status_bayar', 'sudah_dibayar')->sum('total');

        return Inertia::render('Guru/Salary/Index', [
            'penggajians' => $penggajians,
            'guru' => $guru,
            'totalGaji' => $totalGaji,
            'totalBayar' => $totalBayar,
            'gajiBulanIni' => $mingguIni,
        ]);
    }
}
