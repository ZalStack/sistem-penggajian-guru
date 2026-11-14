<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - {{ $penggajian->guru->nama ?? 'Guru' }} - Periode {{ $penggajian->periode }}</title>
    <style>
        @page {
            size: a5 portrait;
            margin: 8mm 10mm 8mm 10mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8px;
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
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .header-logo {
            width: 52px;
            vertical-align: middle;
        }
        .header-logo img {
            height: 42px;
            width: auto;
        }
        .header-text {
            vertical-align: middle;
            padding-left: 8px;
        }
        .header-org {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header-sub {
            font-size: 7.5px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-top: 1px;
        }
        .header-address {
            font-size: 6.5px;
            color: #64748b;
            margin-top: 1px;
        }

        /* Document Title Ribbon */
        .title-table {
            width: 100%;
            margin-bottom: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 5px 8px;
        }
        .doc-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .doc-subtitle {
            font-size: 7px;
            color: #64748b;
            font-weight: 600;
            margin-top: 1px;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 7px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .status-paid {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .status-unpaid {
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fcd34d;
        }

        /* Info Grid Table */
        .info-table {
            width: 100%;
            margin-bottom: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background: #ffffff;
        }
        .info-table td {
            padding: 4px 6px;
            vertical-align: top;
            font-size: 7.5px;
        }
        .info-col-left {
            width: 50%;
            border-right: 1px dashed #cbd5e1;
        }
        .info-col-right {
            width: 50%;
        }
        .info-row-table {
            width: 100%;
        }
        .info-row-table td {
            padding: 1.5px 2px;
        }
        .info-label {
            color: #64748b;
            width: 72px;
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }
        .info-sep {
            width: 8px;
            color: #94a3b8;
        }
        .info-value {
            color: #0f172a;
            font-weight: 700;
            font-size: 7.5px;
        }
        .font-mono {
            font-family: 'Courier New', Courier, monospace;
        }

        /* Rincian Penghitungan Table */
        .section-title {
            font-size: 8px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            padding-left: 2px;
        }
        .calc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 7.5px;
        }
        .calc-table th {
            background: #0f172a;
            color: #ffffff;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 4px 4px;
            border: 1px solid #0f172a;
        }
        .calc-table td {
            padding: 4px 4px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
            color: #1e293b;
        }
        .calc-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: 700; }

        /* Total Highlight Box */
        .total-banner {
            width: 100%;
            background: #0f172a;
            color: #ffffff;
            border-radius: 4px;
            margin-top: 6px;
            margin-bottom: 6px;
            padding: 6px 10px;
        }
        .total-banner td {
            vertical-align: middle;
        }
        .total-banner .title {
            font-size: 8.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #f8fafc;
        }
        .total-banner .sub {
            font-size: 6.5px;
            color: #94a3b8;
            margin-top: 1px;
        }
        .total-banner .amount {
            font-size: 14px;
            font-weight: 800;
            color: #38bdf8;
            text-align: right;
            font-family: 'Courier New', Courier, monospace;
            letter-spacing: 0.5px;
        }

        /* Terbilang Box */
        .terbilang-box {
            background: #f1f5f9;
            border-left: 3px solid #2563eb;
            border-radius: 3px;
            padding: 4px 8px;
            font-size: 7.5px;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .terbilang-box strong {
            color: #0f172a;
        }

        /* Notes & Rekap Sesi Box */
        .notes-table {
            width: 100%;
            margin-bottom: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
        }
        .notes-table td {
            font-size: 6.5px;
            color: #475569;
            line-height: 1.35;
            vertical-align: middle;
        }

        /* Signatures Section */
        .signature-table {
            width: 100%;
            margin-top: 6px;
            page-break-inside: avoid;
        }
        .signature-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 12px;
        }
        .sig-role {
            font-size: 7.5px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 32px;
        }
        .sig-name {
            font-size: 8px;
            font-weight: 700;
            color: #0f172a;
            text-decoration: underline;
        }
        .sig-title {
            font-size: 6.5px;
            color: #64748b;
            margin-top: 1px;
        }

        /* Footer */
        .footer-note {
            margin-top: 8px;
            border-top: 1px solid #e2e8f0;
            padding-top: 3px;
            font-size: 6.5px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('assets/images/LOGO KPM PUSAT.png');
        $logoBase64 = file_exists($logoPath) ? base64_encode(file_get_contents($logoPath)) : null;
        $nip = sprintf('GUR-%s-%04d', date('Y'), $penggajian->guru?->id ?? $penggajian->id);
        $periodeFormatted = \App\Support\Tanggal::format($penggajian->periode . '-01', 'F Y');
        if ($periodeFormatted === '-') {
            $periodeFormatted = $penggajian->periode;
        }
        $docNumber = sprintf('SLIP/%s/%04d', str_replace('-', '', $penggajian->periode), $penggajian->id);
        $honorSesiTarif = (float) ($penggajian->guru?->grade?->honor_per_sesi ?? 0);
    @endphp

    <!-- Kop Surat Resmi Lembaga -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                @if ($logoBase64)
                    <img src="data:image/png;base64,{{ $logoBase64 }}" alt="Logo KPM">
                @else
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a;">KPM</div>
                @endif
            </td>
            <td class="header-text">
                <div class="header-org">Klinik Pendidikan MIPA (KPM) Pusat</div>
                <div class="header-sub">Divisi Kelas Khusus &bull; Penjamin Mutu Pengajar & Payroll</div>
                <div class="header-address">Ruko Graha Niaga No. 209, Jl. Raya Laladon, Ciomas, Bogor 16610 &bull; Telp: (0251) 7522612 &bull; kpmacademic.io</div>
            </td>
        </tr>
    </table>

    <!-- Title & Status Ribbon -->
    <table class="title-table">
        <tr>
            <td style="text-align: left; vertical-align: middle;">
                <div class="doc-title">Slip Gaji & Bukti Realisasi Honor</div>
                <div class="doc-subtitle">Nomor Bukti: <span class="font-mono" style="font-weight: 700; color: #0f172a;">{{ $docNumber }}</span></div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
                @if ($penggajian->status_bayar === 'sudah_dibayar')
                    <span class="status-badge status-paid">&#10003; Sudah Dibayar (Lunas)</span>
                @else
                    <span class="status-badge status-unpaid">&#9203; Menunggu Pembayaran</span>
                @endif
            </td>
        </tr>
    </table>

    <!-- Profil Guru & Rincian Periode -->
    <table class="info-table">
        <tr>
            <td class="info-col-left">
                <table class="info-row-table">
                    <tr>
                        <td class="info-label">Nama Pengajar</td>
                        <td class="info-sep">:</td>
                        <td class="info-value">{{ $penggajian->guru->nama ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">NIP / ID Guru</td>
                        <td class="info-sep">:</td>
                        <td class="info-value font-mono">{{ $nip }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Grade & Tarif</td>
                        <td class="info-sep">:</td>
                        <td class="info-value">
                            Grade {{ $penggajian->guru->grade->kode_grade ?? '-' }}
                            @if ($honorSesiTarif > 0)
                                <span style="font-weight: normal; color: #64748b;">(Rp {{ number_format($honorSesiTarif, 0, ',', '.') }} / sesi)</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Mata Pelajaran</td>
                        <td class="info-sep">:</td>
                        <td class="info-value">{{ $penggajian->guru->mapel ?? '-' }}</td>
                    </tr>
                </table>
            </td>
            <td class="info-col-right">
                <table class="info-row-table">
                    <tr>
                        <td class="info-label">Periode Gaji</td>
                        <td class="info-sep">:</td>
                        <td class="info-value">{{ $periodeFormatted }} ({{ $penggajian->periode }})</td>
                    </tr>
                    <tr>
                        <td class="info-label">Rekening Bank</td>
                        <td class="info-sep">:</td>
                        <td class="info-value">
                            @if ($penggajian->guru?->bank && $penggajian->guru?->nomor_rekening)
                                {{ $penggajian->guru->bank }} &mdash; <span class="font-mono">{{ $penggajian->guru->nomor_rekening }}</span>
                            @else
                                <span style="color: #64748b; font-weight: normal;">Transfer Bank / Kas</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Sesi & Kehadiran</td>
                        <td class="info-sep">:</td>
                        <td class="info-value">
                            {{ $penggajian->jumlah_sesi }} Sesi Rencana &bull; <strong>{{ $penggajian->jumlah_hadir }} Sesi Hadir</strong>
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Durasi Mengajar</td>
                        <td class="info-sep">:</td>
                        <td class="info-value font-mono">{{ number_format($penggajian->total_jam, 1) }} Jam</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Rincian Penghitungan Honor -->
    <div class="section-title">Rincian Komponen Honorarium & Transportasi</div>
    <table class="calc-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 20px;">No</th>
                <th class="text-left" style="width: 105px;">Program / Jenis Kelas</th>
                <th class="text-left" style="width: 75px;">Transportasi</th>
                <th class="text-center" style="width: 32px;">Hadir</th>
                <th class="text-right" style="width: 58px;">Honor (Rp)</th>
                <th class="text-right" style="width: 58px;">Biaya Trans (Rp)</th>
                <th class="text-right" style="width: 65px;">Subtotal (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @if ($penggajian->detail && count($penggajian->rincian()) > 0)
                @foreach ($penggajian->rincian() as $idx => $row)
                    <tr>
                        <td class="text-center font-mono">{{ $idx + 1 }}</td>
                        <td class="font-bold text-left">{{ $row['program'] }}</td>
                        <td class="text-left">{{ $row['transport'] }}</td>
                        <td class="text-center font-bold">{{ $row['jumlah_hadir'] }} sesi</td>
                        <td class="text-right font-mono">{{ number_format($row['honor'], 0, ',', '.') }}</td>
                        <td class="text-right font-mono">{{ number_format($row['transport_biaya'], 0, ',', '.') }}</td>
                        <td class="text-right font-mono font-bold">{{ number_format($row['total'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td class="text-center font-mono">1</td>
                    <td class="font-bold text-left">Honor Sesi Mengajar</td>
                    <td class="text-left">{{ $penggajian->transport->jenis ?? '-' }}</td>
                    <td class="text-center font-bold">{{ $penggajian->jumlah_hadir }} sesi</td>
                    <td class="text-right font-mono">{{ number_format($penggajian->honor, 0, ',', '.') }}</td>
                    <td class="text-right font-mono">{{ number_format($penggajian->total_transport, 0, ',', '.') }}</td>
                    <td class="text-right font-mono font-bold">{{ number_format($penggajian->honor + $penggajian->total_transport, 0, ',', '.') }}</td>
                </tr>
            @endif

            @if ((float) $penggajian->tunjangan_khusus > 0)
                <tr>
                    <td class="text-center font-mono">&bull;</td>
                    <td class="font-bold text-left" colspan="2">Tunjangan Khusus / Intensif Jabatan</td>
                    <td class="text-center font-mono">&mdash;</td>
                    <td class="text-right font-mono">&mdash;</td>
                    <td class="text-right font-mono">&mdash;</td>
                    <td class="text-right font-mono font-bold">{{ number_format((float) $penggajian->tunjangan_khusus, 0, ',', '.') }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Highlight Total Banner -->
    <table class="total-banner">
        <tr>
            <td style="text-align: left;">
                <div class="title">Total Gaji Diterima (Take Home Pay)</div>
                <div class="sub">Realisasi total honor mengajar + fasilitas transport + tunjangan</div>
            </td>
            <td style="text-align: right;">
                <div class="amount">Rp {{ number_format($penggajian->total, 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <!-- Terbilang Box -->
    <div class="terbilang-box">
        <strong>Terbilang:</strong> <em># {{ \App\Support\Terbilang::make($penggajian->total) }} #</em>
    </div>

    <!-- Catatan & Keterangan Administratif -->
    <table class="notes-table">
        <tr>
            <td>
                <strong>Keterangan:</strong> Pembayaran honor ditransfer langsung ke rekening terdaftar. Apabila terdapat ketidaksesuaian data jam mengajar atau rincian honor, silakan konfirmasi kepada Bagian Administrasi KPM Pusat maksimal 3 hari kerja setelah dokumen diterbitkan.
            </td>
        </tr>
    </table>

    <!-- Lembar Pengesahan / Tanda Tangan -->
    <table class="signature-table">
        <tr>
            <td>
                <div class="sig-role">Penerima Honor,</div>
                <div class="sig-name">{{ $penggajian->guru->nama ?? 'Guru Pengajar' }}</div>
                <div class="sig-title">NIP: {{ $nip }}</div>
            </td>
            <td>
                <div class="sig-role">Bogor, {{ now()->translatedFormat('d F Y') }}<br>Bagian Keuangan & Payroll KPM,</div>
                <div class="sig-name">( Bendahara Penggajian )</div>
                <div class="sig-title">Klinik Pendidikan MIPA Pusat</div>
            </td>
        </tr>
    </table>

    <!-- Footer Note -->
    <div class="footer-note">
        Dokumen resmi diterbitkan secara elektronik oleh SATU GURU KPM (Sistem Informasi Administrasi Terpadu Guru KPM) &bull; Sah tanpa tanda tangan basah &bull; Dicetak pada {{ now()->translatedFormat('d M Y H:i') }} WIB
    </div>
</body>
</html>
