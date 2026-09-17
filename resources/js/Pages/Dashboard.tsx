import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import StatCard from '@/Components/ui/stat-card';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';

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
    todayAttendances?: Map<number, any>;
    guru?: any;
    role: 'admin' | 'guru';
}

export default function Dashboard({ stats, recentSessions, recentPenggajian, todaySessions, todayAttendances, guru, role }: DashboardProps) {
    if (role === 'guru') {
        return (
            <AuthenticatedLayout>
                <Head title="Dashboard Guru" />
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Selamat Datang, {guru?.nama}</h1>
                    <p className="text-sm text-gray-500 mt-1">Dashboard guru — lihat jadwal, absensi, dan gaji hari ini</p>
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
                                    const attendance = todayAttendances?.get?.(session.id) || (todayAttendances as any)?.[session.id];
                                    return (
                                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                                                    <Icon icon="lucide:book-open" className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{session.location?.nama_lokasi}</p>
                                                    <p className="text-xs text-gray-500">{session.jam_mulai} - {session.jam_selesai} • {session.mapel} • {session.jumlah_sesi} sesi</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {(!attendance || !attendance.checkin_time) && (
                                                    <Button variant="success" size="sm" onClick={() => handleCheckin(session.id)}>
                                                        <Icon icon="lucide:log-in" /> Masuk
                                                    </Button>
                                                )}
                                                {attendance?.checkin_time && !attendance?.checkout_time && (
                                                    <Button variant="danger" size="sm" onClick={() => handleCheckout(session.id)}>
                                                        <Icon icon="lucide:log-out" /> Keluar
                                                    </Button>
                                                )}
                                                {attendance?.status === 'valid' && (
                                                    <Badge variant="success">Selesai</Badge>
                                                )}
                                                {attendance?.status === 'belum_checkout' && (
                                                    <Badge>Check-in</Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Icon icon="lucide:calendar-off" className="text-3xl text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Tidak ada jadwal hari ini</p>
                            </div>
                        )}
                    </Card>

                    <Card title="Status Pembayaran">
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Gaji Bulan Ini</p>
                                <p className="text-2xl font-black text-gray-900">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${stats.status_bayar === 'sudah_dibayar' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm font-medium text-gray-700">
                                    Status: {stats.status_bayar === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                </span>
                            </div>
                            <Button variant="outline" onClick={() => router.get(route('my-salary'))}>
                                <Icon icon="lucide:wallet" /> Lihat Detail Gaji
                            </Button>
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
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Admin</h1>
                <p className="text-sm text-gray-500 mt-1">Ringkasan sistem penggajian dan absensi guru</p>
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
                                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-600">{s.guru?.grade?.kode_grade}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{s.guru?.nama}</p>
                                            <p className="text-xs text-gray-500">{s.location?.nama_lokasi} • {s.tanggal}</p>
                                        </div>
                                    </div>
                                    <Badge>{s.jumlah_sesi} sesi</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Icon icon="lucide:calendar-off" className="text-3xl text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Belum ada sesi mengajar</p>
                        </div>
                    )}
                </Card>

                <Card title="Rekap Penggajian Terbaru">
                    {recentPenggajian && recentPenggajian.length > 0 ? (
                        <div className="space-y-3">
                            {recentPenggajian.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-600">{p.guru?.grade?.kode_grade}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{p.guru?.nama}</p>
                                            <p className="text-xs text-gray-500">{p.periode} • {p.jumlah_sesi} sesi</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(p.total)}</p>
                                        <Badge variant={p.status_bayar === 'sudah_dibayar' ? 'success' : 'danger'}>
                                            {p.status_bayar === 'sudah_dibayar' ? 'Dibayar' : 'Belum'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Icon icon="lucide:wallet" className="text-3xl text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Belum ada data penggajian</p>
                        </div>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
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
