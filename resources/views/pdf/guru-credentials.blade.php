<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Data Login Guru - SIGURU</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 3px solid #0f172a; }
        .header h1 { font-size: 16px; font-weight: 800; margin-bottom: 4px; letter-spacing: 0.5px; }
        .header h2 { font-size: 11px; font-weight: 700; color: #1e40af; margin-bottom: 2px; }
        .header p { font-size: 9px; color: #64748b; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 9px; background: #f8fafc; padding: 8px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .alert { background: #fef3c7; border: 1px solid #fcd34d; padding: 8px 10px; border-radius: 6px; font-size: 8px; color: #92400e; margin-bottom: 12px; line-height: 1.4; }
        .alert strong { color: #b45309; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #0f172a; color: #fff; padding: 6px 5px; text-align: left; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.2; }
        th.center { text-align: center; }
        td { padding: 5px; border-bottom: 1px solid #e2e8f0; font-size: 8px; vertical-align: top; line-height: 1.3; word-break: break-word; }
        tr:nth-child(even) td { background: #f8fafc; }
        .mono { font-family: 'Courier New', monospace; font-size: 7.5px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .badge { display: inline-block; padding: 2px 5px; border-radius: 10px; font-size: 7px; font-weight: 700; }
        .badge-grade { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
        .email { color: #1e40af; font-weight: 600; }
        .pass { background: #fef3c7; padding: 1px 4px; border-radius: 3px; font-weight: 700; color: #92400e; }
        .footer { margin-top: 14px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SIGURU</h1>
        <h2>Sistem Informasi Penggajian Guru KPM Pusat</h2>
        <p>Data Login Akun Guru — Tahun Ajaran 2026/2027</p>
    </div>

    <div class="meta">
        <span><strong>Total Guru:</strong> {{ $gurus->count() }} akun</span>
        <span><strong>Tanggal Cetak:</strong> {{ now()->format('d M Y H:i') }}</span>
        <span><strong>Password Default:</strong> <span class="pass">password</span></span>
    </div>

    <div class="alert">
        <strong>⚠ Rahasia — Hanya untuk Administrator:</strong> Dokumen ini berisi email & password login guru. Segera ganti password setelah dibagikan dan jangan disebarluaskan. Password default untuk semua akun adalah <span class="pass">password</span>. Guru wajib login dan ganti password via menu Profil.
    </div>

    <table>
        <thead>
            <tr>
                <th class="center" style="width:22px;">No</th>
                <th style="width:24%;">Nama Guru</th>
                <th class="center" style="width:38px;">Grade</th>
                <th style="width:10%;">Domisili</th>
                <th class="center" style="width:52px;">Tunjangan</th>
                <th style="width:12%;">No Rekening</th>
                <th style="width:14%;">Ket Mengajar</th>
                <th style="width:18%;">Email Login</th>
                <th style="width:58px;" class="center">Password</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($gurus as $i => $g)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td class="font-bold">{{ $g->nama }}</td>
                    <td class="text-center"><span class="badge badge-grade">{{ $g->grade->kode_grade ?? '-' }}</span></td>
                    <td>{{ $g->domisili ?? '-' }}</td>
                    <td class="text-center">@if($g->tunjangan_khusus > 0) Rp{{ number_format($g->tunjangan_khusus, 0, ',', '.') }} @else - @endif</td>
                    <td class="mono">{{ $g->nomor_rekening ?? '-' }}</td>
                    <td style="font-size:7px; line-height:1.2;">{{ $g->keterangan_mengajar ?? '-' }}</td>
                    <td class="email mono">{{ $g->user->email ?? '-' }}</td>
                    <td class="text-center"><span class="pass">password</span></td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Dicetak pada {{ now()->format('d M Y H:i') }} — SIGURU Sistem Informasi Penggajian Guru KPM Pusat • {{ $gurus->count() }} akun • Dokumen rahasia admin</p>
        <p style="margin-top:4px; color:#64748b;">Guru silakan login di {{ config('app.url') }}/login menggunakan email di atas dan password <strong>password</strong>, lalu segera ganti password di menu Profil.</p>
    </div>
</body>
</html>
