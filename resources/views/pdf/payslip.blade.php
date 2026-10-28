<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - {{ $penggajian->guru->nama ?? 'Guru' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #1a1a1a; }
        .slip { width: 100%; margin: 0 auto; padding: 14px 16px; }
        .header { text-align: center; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #111; }
        .header h1 { font-size: 16px; font-weight: 700; margin-bottom: 1px; letter-spacing: 0.6px; }
        .header .subtitle { font-size: 9px; color: #666; margin-bottom: 1px; }
        .header .slip-title { font-size: 11px; font-weight: 700; color: #111; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 10px; gap: 8px; }
        .info-box { flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 6px 8px; }
        .info-box .label { font-size: 7px; text-transform: uppercase; color: #6c757d; font-weight: 600; letter-spacing: 0.4px; margin-bottom: 2px; }
        .info-box .value { font-size: 9px; font-weight: 700; color: #111; line-height: 1.3; }
        .detail-section { margin-bottom: 10px; }
        .detail-section h3 { font-size: 9px; text-transform: uppercase; color: #6c757d; font-weight: 600; letter-spacing: 1px; margin-bottom: 6px; border-bottom: 1px solid #e9ecef; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 8px; }
        th { background: #111; color: #fff; padding: 5px 4px; text-align: left; font-size: 7px; text-transform: uppercase; letter-spacing: 0.3px; }
        td { padding: 5px 4px; border-bottom: 1px solid #e9ecef; font-size: 8.5px; line-height: 1.3; }
        tr:nth-child(even) td { background: #f8f9fa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .total-box { background: #111; color: #fff; padding: 9px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .total-box .label { font-size: 10px; font-weight: 600; }
        .total-box .amount { font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-unpaid { background: #fef3c7; color: #d97706; }
        .footer { margin-top: 12px; text-align: center; font-size: 7.5px; color: #999; border-top: 1px solid #e9ecef; padding-top: 8px; }
    </style>
</head>
<body>
    <div class="slip">
        <div class="header">
            <h1>Satu Guru KPM</h1>
            <p class="subtitle">Sistem Administrasi Guru KPM</p>
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
                <div class="label">Program Kelas</div>
                <div class="value">
                    @if ($penggajian->detail)
                        {{ collect($penggajian->detail)->pluck('program')->unique()->implode(', ') }}
                    @else
                        {{ $penggajian->transport->jenis ?? '-' }}
                    @endif
                </div>
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
                        <th style="width: 104pt;">Program</th>
                        <th style="width: 66pt;">Transport</th>
                        <th class="text-center" style="width: 46pt;">Hadir</th>
                        <th class="text-right" style="width: 60pt;">Honor (Rp)</th>
                        <th class="text-right" style="width: 56pt;">Biaya (Rp)</th>
                        <th class="text-right" style="width: 62pt;">Subtotal (Rp)</th>
                    </tr>
                </thead>
                <tbody>
                    @if ($penggajian->detail)
                        @foreach ($penggajian->rincian() as $row)
                            <tr>
                                <td class="font-bold">{{ $row['program'] }}</td>
                                <td>{{ $row['transport'] }}</td>
                                <td class="text-center">{{ $row['jumlah_hadir'] }}</td>
                                <td class="text-right">{{ number_format($row['honor'], 0, ',', '.') }}</td>
                                <td class="text-right">{{ number_format($row['transport_biaya'], 0, ',', '.') }}</td>
                                <td class="text-right font-bold">{{ number_format($row['total'], 0, ',', '.') }}</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="6" class="text-center">Tidak ada rincian program</td>
                        </tr>
                    @endif
                    @if ((float) $penggajian->tunjangan_khusus > 0)
                        <tr>
                            <td class="font-bold" colspan="5">Tunjangan Khusus (Rp)</td>
                            <td class="text-right font-bold">{{ number_format((float) $penggajian->tunjangan_khusus, 0, ',', '.') }}</td>
                        </tr>
                    @endif
                    <tr>
                        <td colspan="5" class="text-right font-bold">TOTAL (Rp)</td>
                        <td class="text-right font-bold">{{ number_format((float) $penggajian->total, 0, ',', '.') }}</td>
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
            <p>Dicetak pada {{ now()->format('d M Y H:i') }} &mdash; Slip ini merupakan bukti resmi penggajian dari Satu Guru KPM</p>
        </div>
    </div>
</body>
</html>
