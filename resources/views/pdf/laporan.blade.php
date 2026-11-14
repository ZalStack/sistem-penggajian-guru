<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Rekap Penggajian Guru - {{ $periode }} - SATU GURU KPM</title>
    <style>
        @page {
            size: a4 landscape;
            margin: 10mm 12mm 10mm 12mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5px;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.35;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table {
            width: 100%;
            border-bottom: 2.5px double #0f172a;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }
        .header-logo {
            width: 75px;
            vertical-align: middle;
        }
        .header-logo img {
            height: 52px;
            width: auto;
        }
        .header-text {
            vertical-align: middle;
            padding-left: 10px;
        }
        .header-org {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.6px;
            text-transform: uppercase;
        }
        .header-sub {
            font-size: 9px;
            font-weight: 700;
            color: #2563eb;
            letter-spacing: 0.4px;
            margin-top: 1px;
            text-transform: uppercase;
        }
        .header-title {
            font-size: 11px;
            font-weight: 800;
            color: #1e293b;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header-address {
            font-size: 7.5px;
            color: #64748b;
            margin-top: 2px;
        }
        .header-meta {
            width: 230px;
            vertical-align: middle;
            text-align: right;
        }
        .meta-card {
            display: inline-block;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 5px 8px;
            text-align: left;
            font-size: 7.5px;
        }
        .meta-card table td {
            padding: 1px 3px;
            font-size: 7.5px;
        }
        .badge-verified {
            display: inline-block;
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
            font-size: 7px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        /* KPI / Summary cards */
        .summary-table {
            width: 100%;
            margin-bottom: 10px;
        }
        .summary-table td {
            width: 25%;
            padding: 0 4px;
        }
        .summary-table td:first-child { padding-left: 0; }
        .summary-table td:last-child { padding-right: 0; }
        .summary-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #2563eb;
            border-radius: 4px;
            padding: 5px 8px;
        }
        .summary-box.highlight {
            border-left-color: #059669;
            background: #f0fdf4;
        }
        .summary-box .label {
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.4px;
        }
        .summary-box .value {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 1px;
        }
        .summary-box.highlight .value {
            color: #065f46;
        }

        /* Main Data Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 8px;
        }
        .data-table th {
            background: #0f172a;
            color: #ffffff;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 4px;
            border: 1px solid #0f172a;
            vertical-align: middle;
        }
        .data-table td {
            padding: 5px 4px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
            color: #1e293b;
        }
        .data-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: 'Courier New', Courier, monospace; }
        .nip-text {
            font-size: 7px;
            color: #64748b;
            font-family: 'Courier New', Courier, monospace;
        }

        .badge-pill {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: 700;
            text-align: center;
        }
        .badge-grade { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; }
        .badge-ipa { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-mtk { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }

        .program-item {
            font-size: 7px;
            color: #334155;
            line-height: 1.25;
            padding: 1px 0;
        }

        /* Grand Total Row */
        .total-row td {
            background: #0f172a !important;
            color: #ffffff !important;
            font-weight: 700;
            font-size: 8.5px;
            padding: 6px 4px;
            border: 1px solid #0f172a;
        }

        /* Terbilang Box */
        .terbilang-box {
            background: #f1f5f9;
            border-left: 3px solid #2563eb;
            border-radius: 3px;
            padding: 5px 8px;
            font-size: 8px;
            color: #1e293b;
            margin-bottom: 12px;
        }
        .terbilang-box strong {
            color: #0f172a;
        }

        /* Signatures Section */
        .signature-table {
            width: 100%;
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .signature-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }
        .sig-role {
            font-size: 8px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 38px;
        }
        .sig-name {
            font-size: 8.5px;
            font-weight: 700;
            color: #0f172a;
            text-decoration: underline;
        }
        .sig-title {
            font-size: 7px;
            color: #64748b;
            margin-top: 2px;
        }

        /* Footer */
        .footer-table {
            width: 100%;
            margin-top: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            font-size: 7px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('assets/images/LOGO KPM PUSAT.png');
        $logoBase64 = file_exists($logoPath) ? base64_encode(file_get_contents($logoPath)) : null;
        $periodeFormatted = \App\Support\Tanggal::format($periode . '-01', 'F Y');
        if ($periodeFormatted === '-') {
            $periodeFormatted = $periode;
        }
        $totalHadir = $penggajians->sum('jumlah_hadir');
        $totalJam = $penggajians->sum('total_jam');
        $totalHonor = $penggajians->sum('honor');
        $totalTransport = $penggajians->sum('total_transport');
        $totalTunjangan = $penggajians->sum('tunjangan_khusus');
    @endphp

    <!-- Header / Kop Dokumen -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                @if ($logoBase64)
                    <img src="data:image/png;base64,{{ $logoBase64 }}" alt="Logo KPM">
                @else
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a;">KPM</div>
                @endif
            </td>
            <td class="header-text">
                <div class="header-org">Klinik Pendidikan MIPA (KPM) Pusat</div>
                <div class="header-sub">Satu Guru &mdash; Sistem Informasi Administrasi & Payroll Pengajar</div>
                <div class="header-title">Laporan & Rekapitulasi Realisasi Penggajian Guru</div>
                <div class="header-address">Komplek Ruko Graha Niaga No. 209, Jl. Raya Laladon, Ciomas, Bogor 16610 &bull; Telp: (0251) 7522612 &bull; www.kpmacademic.io</div>
            </td>
            <td class="header-meta">
                <div class="meta-card">
                    <table>
                        <tr>
                            <td style="color:#64748b;">No. Dokumen</td>
                            <td>: <strong>REKAP/{{ str_replace('-', '', $periode) }}/{{ date('Ymd') }}</strong></td>
                        </tr>
                        <tr>
                            <td style="color:#64748b;">Periode</td>
                            <td>: <strong>{{ $periodeFormatted }} ({{ $periode }})</strong></td>
                        </tr>
                        <tr>
                            <td style="color:#64748b;">Waktu Unduh</td>
                            <td>: {{ now()->translatedFormat('d M Y, H:i') }} WIB</td>
                        </tr>
                        <tr>
                            <td style="color:#64748b;">Status</td>
                            <td>: <span class="badge-verified">Dokumen Sah Terverifikasi</span></td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Eksekutif Keuangan (KPI Cards) -->
    <table class="summary-table">
        <tr>
            <td>
                <div class="summary-box">
                    <div class="label">Total Pengajar (Guru)</div>
                    <div class="value">{{ $penggajians->count() }} Guru</div>
                </div>
            </td>
            <td>
                <div class="summary-box">
                    <div class="label">Beban Mengajar (Sesi / Jam)</div>
                    <div class="value">{{ $totalSesi }} Sesi / {{ number_format($totalJam, 1) }} Jam</div>
                </div>
            </td>
            <td>
                <div class="summary-box">
                    <div class="label">Realisasi Kehadiran</div>
                    <div class="value">{{ $totalHadir }} Sesi Hadir</div>
                </div>
            </td>
            <td>
                <div class="summary-box highlight">
                    <div class="label">Total Realisasi Payroll</div>
                    <div class="value">Rp {{ number_format($grandTotal, 0, ',', '.') }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Tabel Data Rekapitulasi -->
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 24px;">No</th>
                <th class="text-left" style="width: 130px;">Nama Guru & NIP</th>
                <th class="text-center" style="width: 44px;">Grade</th>
                <th class="text-center" style="width: 40px;">Mapel</th>
                <th class="text-center" style="width: 32px;">Sesi</th>
                <th class="text-center" style="width: 32px;">Hadir</th>
                <th class="text-right" style="width: 78px;">Honor (Rp)</th>
                <th class="text-right" style="width: 72px;">Tunjangan (Rp)</th>
                <th class="text-right" style="width: 90px;">Total Gaji (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($penggajians as $i => $p)
                @php
                    $nip = sprintf('GUR-%s-%04d', date('Y'), $p->guru?->id ?? $p->id);
                @endphp
                <tr>
                    <td class="text-center font-mono">{{ $i + 1 }}</td>
                    <td>
                        <div class="font-bold" style="color: #0f172a;">{{ $p->guru->nama ?? '-' }}</div>
                        <div class="nip-text">{{ $nip }}</div>
                    </td>
                    <td class="text-center">
                        <span class="badge-pill badge-grade">Grade {{ $p->guru->grade->kode_grade ?? '-' }}</span>
                    </td>
                    <td class="text-center">
                        <span class="badge-pill {{ ($p->guru->mapel ?? '') === 'IPA' ? 'badge-ipa' : 'badge-mtk' }}">
                            {{ $p->guru->mapel ?? '-' }}
                        </span>
                    </td>
                    <td class="text-center font-bold">{{ $p->jumlah_sesi }}</td>
                    <td class="text-center font-bold" style="color: #059669;">{{ $p->jumlah_hadir }}</td>
                    <td class="text-right font-mono">{{ number_format($p->honor, 0, ',', '.') }}</td>
                    <td class="text-right font-mono">
                        @if ((float) $p->tunjangan_khusus > 0)
                            {{ number_format((float) $p->tunjangan_khusus, 0, ',', '.') }}
                        @else
                            <span style="color: #94a3b8;">0</span>
                        @endif
                    </td>
                    <td class="text-right font-mono font-bold" style="color: #0f172a;">
                        {{ number_format($p->total, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" class="text-center" style="padding: 20px; color: #94a3b8;">
                        Tidak ada data rekapitulasi penggajian untuk periode ini.
                    </td>
                </tr>
            @endforelse

            <!-- Grand Total Row -->
            <tr class="total-row">
                <td colspan="4" class="text-right" style="letter-spacing: 0.5px;">GRAND TOTAL REALISASI</td>
                <td class="text-center font-mono">{{ $totalSesi }}</td>
                <td class="text-center font-mono">{{ $totalHadir }}</td>
                <td class="text-right font-mono">Rp {{ number_format($totalHonor, 0, ',', '.') }}</td>
                <td class="text-right font-mono">Rp {{ number_format($totalTunjangan, 0, ',', '.') }}</td>
                <td class="text-right font-mono font-bold" style="font-size: 9.5px;">
                    Rp {{ number_format($grandTotal, 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Terbilang Box -->
    <div class="terbilang-box">
        <strong>Terbilang:</strong> <em># {{ \App\Support\Terbilang::make($grandTotal) }} #</em>
    </div>

    <!-- Lembar Pengesahan / Tanda Tangan Resmi -->
    <table class="signature-table">
        <tr>
            <td>
                <div class="sig-role">Dibuat Oleh,<br>Staf Administrasi & Payroll</div>
                <div class="sig-name">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</div>
                <div class="sig-title">Divisi Administrasi KPM Pusat</div>
            </td>
            <td>
                <div class="sig-role">Diperiksa & Diverifikasi Oleh,<br>Manajer Keuangan</div>
                <div class="sig-name">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</div>
                <div class="sig-title">Departemen Keuangan & Akuntansi KPM</div>
            </td>
            <td>
                <div class="sig-role">Bogor, {{ now()->translatedFormat('d F Y') }}<br>Disetujui Oleh, Pimpinan KPM</div>
                <div class="sig-name">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</div>
                <div class="sig-title">Kepala Divisi Pendidikan KPM Pusat</div>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <table class="footer-table">
        <tr>
            <td class="text-left">
                Dokumen rekapitulasi penggajian resmi SATU GURU KPM &bull; Bersifat RAHASIA (Confidential) untuk arsip keuangan.
            </td>
            <td class="text-right">
                Dicetak pada {{ now()->translatedFormat('d F Y H:i:s') }} WIB &bull; Sistem Otomasi KPM Pusat
            </td>
        </tr>
    </table>
</body>
</html>
