import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import StatCard from '@/Components/ui/stat-card';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface DashboardProps {
    stats: {
        total_guru?: number;
        total_sesi_bulan?: number;
        total_pengeluaran?: number;
        total_guru_hadir?: number;
        total_sesi?: number;
        total_hadir?: number;
        total_jam?: number;
        gaji_bulan?: number;
        status_bayar?: string;
    };
    recentSessions?: any[];
    recentPenggajian?: any[];
    todaySessions?: any[];
    todayAttendances?: Record<string, any>;
    guru?: any;
    role: 'admin' | 'guru';
}

function getGuruAttendanceStatus(attendance: any): 'none' | 'checkin' | 'checkout' | 'valid' | 'invalid' {
    if (!attendance || !attendance.checkin_time) return 'none';
    if (!attendance.checkout_time) return 'checkin';
    if (attendance.status === 'valid') return 'valid';
    return 'invalid';
}

function formatTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function computeCanCheckin(jamMulai: string, jamSelesai: string): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [hm, sm] = jamMulai.split(':').map(Number);
    const [hs, ss] = (jamSelesai || jamMulai).split(':').map(Number);
    const mulai = new Date(`${today}T${String(hm).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`);
    const selesai = new Date(`${today}T${String(hs).padStart(2, '0')}:${String(ss).padStart(2, '0')}:00`);
    const windowStart = new Date(mulai.getTime() - 30 * 60 * 1000);
    return now >= windowStart && now <= selesai;
}

function computeCanCheckout(jamMulai: string, jamSelesai: string): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [hm, sm] = jamMulai.split(':').map(Number);
    const [hs, ss] = (jamSelesai || jamMulai).split(':').map(Number);
    const mulai = new Date(`${today}T${String(hm).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`);
    const selesai = new Date(`${today}T${String(hs).padStart(2, '0')}:${String(ss).padStart(2, '0')}:00`);
    const windowEnd = new Date(selesai.getTime() + 30 * 60 * 1000);
    return now >= mulai && now <= windowEnd;
}

function handleCheckin(sessionId: number) {
    if (!navigator.geolocation) {
        alert('Geolocation tidak didukung browser Anda.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            router.post(route('checkin'), {
                session_id: sessionId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }, { preserveState: true });
        },
        () => {
            alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        },
        { enableHighAccuracy: true }
    );
}

function handleCheckout(sessionId: number) {
    if (!navigator.geolocation) {
        alert('Geolocation tidak didukung browser Anda.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            router.post(route('checkout'), {
                session_id: sessionId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }, { preserveState: true });
        },
        () => {
            alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        },
        { enableHighAccuracy: true }
    );
}

function SessionCard({ session, attendance, attStatus }: { session: any; attendance: any; attStatus: string }) {
    const [canCheckin, setCanCheckin] = useState(false);
    const [canCheckout, setCanCheckout] = useState(false);

    useEffect(() => {
        const update = () => {
            const jm = session.jam_mulai?.substring(0, 5) || '00:00';
            const js = session.jam_selesai?.substring(0, 5) || jm;
            setCanCheckin(computeCanCheckin(jm, js));
            setCanCheckout(computeCanCheckout(jm, js));
        };
        update();
        const interval = setInterval(update, 30000);
        return () => clearInterval(interval);
    }, [session.jam_mulai, session.jam_selesai]);

    let statusBadge = null;
    if (attStatus === 'valid') {
        statusBadge = <Badge variant="success">Selesai</Badge>;
    } else if (attStatus === 'checkin') {
        statusBadge = <Badge variant="warning">Check-in</Badge>;
    } else if (attStatus === 'invalid') {
        statusBadge = <Badge variant="danger">Tidak Valid</Badge>;
    }

    return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon icon="lucide:book-open" className="text-white text-sm" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{session.location?.nama_lokasi}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)} &bull; {session.mapel} &bull; {session.jumlah_sesi} sesi
                        </p>
                        {session.transport && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                Transport: {session.transport.jenis}
                            </p>
                        )}
                        {attStatus !== 'none' && attendance?.checkin_time && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                Masuk: {formatTime(attendance.checkin_time)}
                                {attendance?.checkout_time && (
                                    <> &bull; Keluar: {formatTime(attendance.checkout_time)}</>
                                )}
                                {attendance?.durasi > 0 && (
                                    <> &bull; {attendance.durasi} menit</>
                                )}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {statusBadge}
                    <div className="flex gap-1.5">
                        {attStatus === 'none' && (
                            canCheckin ? (
                                <Button variant="success" size="sm" onClick={() => handleCheckin(session.id)}>
                                    <Icon icon="lucide:log-in" /> Masuk
                                </Button>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed">
                                    <Icon icon="lucide:clock" className="text-xs" /> Belum Waktunya
                                </span>
                            )
                        )}
                        {attStatus === 'checkin' && (
                            canCheckout ? (
                                <Button variant="danger" size="sm" onClick={() => handleCheckout(session.id)}>
                                    <Icon icon="lucide:log-out" /> Keluar
                                </Button>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-600 bg-amber-50 rounded-lg cursor-not-allowed">
                                    <Icon icon="lucide:clock" className="text-xs" /> Menunggu Selesai
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ stats, recentSessions, recentPenggajian, todaySessions, todayAttendances, guru, role }: DashboardProps) {
    if (role === 'guru') {
        return (
            <AuthenticatedLayout>
                <Head title="Dashboard Guru" />
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang, {guru?.nama}</h1>
                    <p className="text-sm text-slate-500 mt-1">Dashboard guru — lihat jadwal, absensi, dan gaji hari ini</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Sesi Bulan Ini" value={stats.total_sesi ?? 0} icon="lucide:book-open" color="blue" />
                    <StatCard title="Kehadiran" value={stats.total_hadir ?? 0} icon="lucide:check-circle" color="green" />
                    <StatCard title="Jam Mengajar" value={`${stats.total_jam ?? 0} jam`} icon="lucide:clock" color="amber" />
                    <StatCard title="Gaji Bulan Ini" value={formatCurrency(stats.gaji_bulan ?? 0)} icon="lucide:banknote" color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Jadwal Hari Ini">
                        {todaySessions && todaySessions.length > 0 ? (
                            <div className="space-y-3">
                                {todaySessions.map((session: any) => {
                                    const attStatus = getGuruAttendanceStatus(todayAttendances?.[String(session.id)]);
                                    const attendance = todayAttendances?.[String(session.id)];
                                    return (
                                        <SessionCard
                                            key={session.id}
                                            session={session}
                                            attendance={attendance}
                                            attStatus={attStatus}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Icon icon="lucide:calendar-off" className="text-3xl text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Tidak ada jadwal hari ini</p>
                            </div>
                        )}
                    </Card>

                    <Card title="Status Pembayaran">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Gaji Bulan Ini</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${stats.status_bayar === 'sudah_dibayar' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm font-medium text-slate-700">
                                    Status: {stats.status_bayar === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => router.get(route('my-attendance'))}>
                                    <Icon icon="lucide:clipboard-check" /> Absensi Saya
                                </Button>
                                <Button variant="outline" onClick={() => router.get(route('my-salary'))}>
                                    <Icon icon="lucide:wallet" /> Gaji Saya
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Admin" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
                <p className="text-sm text-slate-500 mt-1">Ringkasan sistem penggajian dan absensi guru</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Guru" value={stats.total_guru ?? 0} icon="lucide:users" color="blue" />
                <StatCard title="Sesi Bulan Ini" value={stats.total_sesi_bulan ?? 0} icon="lucide:book-open" color="green" />
                <StatCard title="Guru Hadir" value={stats.total_guru_hadir ?? 0} icon="lucide:user-check" color="amber" />
                <StatCard title="Pengeluaran Bulan" value={formatCurrency(stats.total_pengeluaran ?? 0)} icon="lucide:banknote" color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Sesi Mengajar Terbaru">
                    {recentSessions && recentSessions.length > 0 ? (
                        <div className="space-y-3">
                            {recentSessions.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <span className="text-xs font-bold text-slate-600">{s.guru?.grade?.kode_grade}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{s.guru?.nama}</p>
                                            <p className="text-xs text-slate-500">{s.location?.nama_lokasi} &bull; {s.tanggal}</p>
                                        </div>
                                    </div>
                                    <Badge>{s.jumlah_sesi} sesi</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Icon icon="lucide:calendar-off" className="text-3xl text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Belum ada sesi mengajar</p>
                        </div>
                    )}
                </Card>

                <Card title="Rekap Penggajian Terbaru">
                    {recentPenggajian && recentPenggajian.length > 0 ? (
                        <div className="space-y-3">
                            {recentPenggajian.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <span className="text-xs font-bold text-slate-600">{p.guru?.grade?.kode_grade}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{p.guru?.nama}</p>
                                            <p className="text-xs text-slate-500">{p.periode} &bull; {p.jumlah_sesi} sesi</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{formatCurrency(p.total)}</p>
                                        <Badge variant={p.status_bayar === 'sudah_dibayar' ? 'success' : 'danger'}>
                                            {p.status_bayar === 'sudah_dibayar' ? 'Dibayar' : 'Belum'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Icon icon="lucide:wallet" className="text-3xl text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Belum ada data penggajian</p>
                        </div>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
