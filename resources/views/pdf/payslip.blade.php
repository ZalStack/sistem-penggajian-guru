<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - {{ $penggajian->guru->nama ?? 'Guru' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #1a1a1a; }
        .slip { width: 100%; max-width: 700px; margin: 0 auto; padding: 30px; }
        .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #111; }
        .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 2px; letter-spacing: 1px; }
        .header .subtitle { font-size: 11px; color: #666; margin-bottom: 2px; }
        .header .slip-title { font-size: 14px; font-weight: 700; color: #111; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px; }
        .info-box { flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 10px 12px; }
        .info-box .label { font-size: 9px; text-transform: uppercase; color: #6c757d; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-box .value { font-size: 12px; font-weight: 700; color: #111; }
        .detail-section { margin-bottom: 20px; }
        .detail-section h3 { font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 600; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e9ecef; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #111; color: #fff; padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 8px 10px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
        tr:nth-child(even) td { background: #f8f9fa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .total-box { background: #111; color: #fff; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
        .total-box .label { font-size: 12px; font-weight: 600; }
        .total-box .amount { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-unpaid { background: #fef3c7; color: #d97706; }
        .footer { margin-top: 25px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e9ecef; padding-top: 12px; }
        .divider { border: none; border-top: 1px dashed #ddd; margin: 12px 0; }
    </style>
</head>
<body>
    <div class="slip">
        <div class="header">
            <h1>SIGURU</h1>
            <p class="subtitle">Sistem Informasi Penggajian Guru KPM Pusat</p>
            <p class="slip-title">Slip Gaji / Pay Slip</p>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <div class="label">Nama Guru</div>
                <div class="value">{{ $penggajian->guru->nama ?? '-' }}</div>
            </div>
            <div class="info-box">
                <div class="label">Grade</div>
                <div class="value">Grade {{ $penggajian->guru->grade->kode_grade ?? '-' }}</div>
            </div>
            <div class="info-box">
                <div class="label">Mapel</div>
                <div class="value">{{ $penggajian->guru->mapel ?? '-' }}</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <div class="label">Periode</div>
                <div class="value">{{ $penggajian->periode }}</div>
            </div>
            <div class="info-box">
                <div class="label">Jenis Transport</div>
                <div class="value">{{ $penggajian->transport->jenis ?? '-' }}</div>
            </div>
            <div class="info-box">
                <div class="label">Status Pembayaran</div>
                <div class="value">
                    @if($penggajian->status_bayar === 'sudah_dibayar')
                        <span class="status-badge status-paid">Sudah Dibayar</span>
                    @else
                        <span class="status-badge status-unpaid">Belum Dibayar</span>
                    @endif
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Rincian Perhitungan</h3>
            <table>
                <thead>
                    <tr>
                        <th>Komponen</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Harga per Sesi</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="font-bold">Honor Mengajar</td>
                        <td class="text-center">{{ $penggajian->jumlah_hadir }} sesi</td>
                        <td class="text-right">Rp {{ number_format($penggajian->honor / max($penggajian->jumlah_hadir, 1), 0, ',', '.') }}</td>
                        <td class="text-right font-bold">Rp {{ number_format($penggajian->honor, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td class="font-bold">Biaya Transport</td>
                        <td class="text-center">{{ $penggajian->jumlah_hadir }} sesi</td>
                        <td class="text-right">Rp {{ number_format($penggajian->total_transport / max($penggajian->jumlah_hadir, 1), 0, ',', '.') }}</td>
                        <td class="text-right font-bold">Rp {{ number_format($penggajian->total_transport, 0, ',', '.') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <div class="label">Total Sesi Direncanakan</div>
                <div class="value">{{ $penggajian->jumlah_sesi }} sesi</div>
            </div>
            <div class="info-box">
                <div class="label">Jumlah Hadir</div>
                <div class="value">{{ $penggajian->jumlah_hadir }} sesi</div>
            </div>
            <div class="info-box">
                <div class="label">Total Jam Mengajar</div>
                <div class="value">{{ number_format($penggajian->total_jam, 1) }} jam</div>
            </div>
        </div>

        <div class="total-box">
            <div class="label">TOTAL GAJI DITERIMA</div>
            <div class="amount">Rp {{ number_format($penggajian->total, 0, ',', '.') }}</div>
        </div>

        <div class="footer">
            <p>Dicetak pada {{ now()->format('d M Y H:i') }} &mdash; Slip ini merupakan bukti resmi penggajian dari SIGURU KPM Pusat</p>
        </div>
    </div>
</body>
</html>
