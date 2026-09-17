<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Rekap Penggajian - SIGURU</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #111; }
        .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #666; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10px; }
        .meta span { background: #f5f5f5; padding: 4px 10px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #111; color: #fff; padding: 8px 6px; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 6px; border-bottom: 1px solid #e5e5e5; font-size: 10px; }
        tr:nth-child(even) td { background: #fafafa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .total-row td { background: #111 !important; color: #fff; padding: 10px 6px; border-bottom: none; font-weight: 700; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e5e5; padding-top: 10px; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 8px; font-weight: 600; }
        .badge-purple { background: #f3e8ff; color: #7c3aed; }
        .badge-blue { background: #dbeafe; color: #2563eb; }
        .badge-green { background: #dcfce7; color: #16a34a; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SIGURU - Sistem Informasi Penggajian Guru</h1>
        <p>Rekap Penggajian Guru KPM Pusat Tahun Ajaran 2026/2027</p>
    </div>
    <div class="meta">
        <span>Periode: {{ $periode }}</span>
        <span>Total Data: {{ $penggajians->count() }}</span>
        <span>Total Sesi: {{ $totalSesi }}</span>
    </div>
    <table>
        <thead>
            <tr>
                <th class="text-center">No</th>
                <th>Guru</th>
                <th>Grade</th>
                <th>Mapel</th>
                <th class="text-center">Sesi</th>
                <th>Transport</th>
                <th class="text-right">Honor</th>
                <th class="text-right">Transport</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($penggajians as $i => $p)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td class="font-bold">{{ $p->guru->nama ?? '-' }}</td>
                    <td><span class="badge badge-purple">{{ $p->guru->grade->kode_grade ?? '-' }}</span></td>
                    <td><span class="badge badge-{{ $p->guru->mapel === 'IPA' ? 'green' : 'blue' }}">{{ $p->guru->mapel ?? '-' }}</span></td>
                    <td class="text-center">{{ $p->jumlah_sesi }}</td>
                    <td>{{ $p->transport->jenis ?? '-' }}</td>
                    <td class="text-right">Rp {{ number_format($p->honor, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($p->total_transport, 0, ',', '.') }}</td>
                    <td class="text-right font-bold">Rp {{ number_format($p->total, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="4" class="text-right">GRAND TOTAL</td>
                <td class="text-center">{{ $totalSesi }}</td>
                <td colspan="3"></td>
                <td class="text-right">Rp {{ number_format($grandTotal, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
    <div class="footer">
        <p>Dicetak pada {{ now()->format('d M Y H:i') }} &mdash; SIGURU Sistem Informasi Penggajian Guru KPM Pusat</p>
    </div>
</body>
</html>
