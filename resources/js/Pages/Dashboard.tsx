import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import StatCard from '@/Components/ui/stat-card';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface DashboardProps {
    stats: {
        total_guru?: number;
        total_sesi_bulan?: number;
        total_pengeluaran?: number;
        total_guru_hadir?: number;
        total_hadir?: number;
        total_sesi_semua?: number;
        gaji_bulan?: number;
        potensi_gaji?: number;
        status_bayar?: string;
    };
    recentSessions?: any[];
    recentPenggajian?: any[];
    todaySessions?: any[];
    todayAttendances?: Record<string, any>;
    allSessions?: any[];
    guru?: any;
    grades?: any[];
    role: 'admin' | 'guru';
}

interface Position {
    lat: number;
    lng: number;
    accuracy: number;
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

function getLocalDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function computeCanCheckin(jamMulai: string, jamSelesai: string): boolean {
    const now = new Date();
    const today = getLocalDateStr(now);
    const [hm, sm] = jamMulai.split(':').map(Number);
    const [hs, ss] = (jamSelesai || jamMulai).split(':').map(Number);
    const mulai = new Date(`${today}T${String(hm).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`);
    const selesai = new Date(`${today}T${String(hs).padStart(2, '0')}:${String(ss).padStart(2, '0')}:00`);
    const windowStart = new Date(mulai.getTime() - 30 * 60 * 1000);
    return now >= windowStart && now <= selesai;
}

function computeCanCheckout(jamMulai: string, jamSelesai: string): boolean {
    const now = new Date();
    const today = getLocalDateStr(now);
    const [hm, sm] = jamMulai.split(':').map(Number);
    const [hs, ss] = (jamSelesai || jamMulai).split(':').map(Number);
    const mulai = new Date(`${today}T${String(hm).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`);
    const selesai = new Date(`${today}T${String(hs).padStart(2, '0')}:${String(ss).padStart(2, '0')}:00`);
    const windowEnd = new Date(selesai.getTime() + 30 * 60 * 1000);
    return now >= mulai && now <= windowEnd;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function useCurrentPosition(): Position | null {
    const [position, setPosition] = useState<Position | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const phaseRef = useRef<'network' | 'gps'>('network');

    useEffect(() => {
        if (!navigator.geolocation) return;

        const onSuccess = (pos: GeolocationPosition) => {
            const newPos: Position = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            };
            setPosition((prev) => {
                if (!prev) return newPos;
                if (newPos.accuracy < prev.accuracy) return newPos;
                if (newPos.accuracy === prev.accuracy) return newPos;
                return prev;
            });
        };

        const onError = () => {
            if (phaseRef.current === 'network') {
                phaseRef.current = 'gps';
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }
                watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 30000,
                });
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 10000,
        });

        const upgradeTimer = setTimeout(() => {
            if (phaseRef.current === 'network') {
                phaseRef.current = 'gps';
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }
                watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 30000,
                });
            }
        }, 3000);

        return () => {
            clearTimeout(upgradeTimer);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return position;
}

function getPositionOneShot(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation tidak didukung browser Anda.'));
            return;
        }

        let resolved = false;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (!resolved) {
                    resolved = true;
                    resolve(pos);
                }
            },
            () => {
                if (!resolved) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            if (!resolved) {
                                resolved = true;
                                resolve(pos);
                            }
                        },
                        (err) => {
                            if (!resolved) {
                                resolved = true;
                                reject(err);
                            }
                        },
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
                    );
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

function handleCheckin(sessionId: number) {
    getPositionOneShot()
        .then((position) => {
            router.post(route('checkin'), {
                session_id: sessionId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }, { preserveState: true });
        })
        .catch(() => {
            alert('Gagal mendapatkan lokasi. Pastikan GPS/lokasi aktif di browser Anda.');
        });
}

function handleCheckout(sessionId: number) {
    getPositionOneShot()
        .then((position) => {
            router.post(route('checkout'), {
                session_id: sessionId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }, { preserveState: true });
        })
        .catch(() => {
            alert('Gagal mendapatkan lokasi. Pastikan GPS/lokasi aktif di browser Anda.');
        });
}

function LocationIndicator({ distance, radius, accuracy }: { distance: number | null; radius: number; accuracy: number | null }) {
    if (distance === null) {
        return (
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon icon="lucide:map-pin-off" className="text-xs" />
                <span className="text-[11px]">Mendeteksi lokasi...</span>
            </div>
        );
    }

    const withinRadius = distance <= radius;

    const getAccuracyLabel = (acc: number | null): string => {
        if (acc === null) return '';
        if (acc <= 20) return 'Sangat Akurat';
        if (acc <= 50) return 'Akurat';
        if (acc <= 200) return 'Cukup Akurat';
        return 'Kurang Akurat';
    };

    return (
        <div className="space-y-0.5">
            <div className={`flex items-center gap-1.5 ${withinRadius ? 'text-green-600' : 'text-red-500'}`}>
                <Icon icon={withinRadius ? 'lucide:map-pin-check' : 'lucide:map-pin-x'} className="text-xs" />
                <span className="text-[11px] font-medium">
                    {withinRadius
                        ? `${Math.round(distance)}m dari lokasi`
                        : `${Math.round(distance)}m — di luar radius`
                    }
                </span>
            </div>
            {accuracy !== null && accuracy > 50 && (
                <div className="flex items-center gap-1.5 text-amber-500">
                    <Icon icon="lucide:alert-triangle" className="text-[10px]" />
                    <span className="text-[10px]">
                        Akurasi GPS: ~{Math.round(accuracy)}m ({getAccuracyLabel(accuracy)})
                    </span>
                </div>
            )}
        </div>
    );
}

function SessionCard({ session, attendance, attStatus, position }: { session: any; attendance: any; attStatus: string; position: Position | null }) {
    const [canCheckinTime, setCanCheckinTime] = useState(false);
    const [canCheckoutTime, setCanCheckoutTime] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);

    useEffect(() => {
        const update = () => {
            const jm = session.jam_mulai?.substring(0, 5) || '00:00';
            const js = session.jam_selesai?.substring(0, 5) || jm;
            setCanCheckinTime(computeCanCheckin(jm, js));
            setCanCheckoutTime(computeCanCheckout(jm, js));
        };
        update();
        const interval = setInterval(update, 5000);
        return () => clearInterval(interval);
    }, [session.jam_mulai, session.jam_selesai]);

    useEffect(() => {
        if (position && session.location) {
            const d = haversineDistance(
                position.lat, position.lng,
                session.location.latitude, session.location.longitude
            );
            setDistance(d);
        }
    }, [position, session.location]);

    const radius = session.location?.radius ?? 0;
    const locationWithinRadius = distance !== null && distance <= radius;
    const accuracy = position?.accuracy ?? null;
    const accuracyReliable = accuracy !== null && accuracy <= radius;
    const locationValid = locationWithinRadius || (accuracy !== null && accuracy > radius && distance !== null && distance <= radius * 3);
    const canCheckin = canCheckinTime && locationValid;
    const canCheckout = canCheckoutTime && locationValid;

    let statusBadge = null;
    if (attStatus === 'valid') {
        statusBadge = <Badge variant="success">Selesai</Badge>;
    } else if (attStatus === 'checkin') {
        statusBadge = <Badge variant="warning">Check-in</Badge>;
    } else if (attStatus === 'invalid') {
        statusBadge = <Badge variant="danger">Tidak Valid</Badge>;
    }

    let checkinDisabledReason = '';
    if (!canCheckin && attStatus === 'none') {
        if (!canCheckinTime) {
            checkinDisabledReason = 'Belum waktunya';
        } else if (distance === null) {
            checkinDisabledReason = 'Mendeteksi lokasi...';
        } else if (!locationValid) {
            checkinDisabledReason = 'Di luar radius lokasi';
        }
    }

    let checkoutDisabledReason = '';
    if (!canCheckout && attStatus === 'checkin') {
        if (!canCheckoutTime) {
            checkoutDisabledReason = 'Menunggu selesai';
        } else if (distance === null) {
            checkoutDisabledReason = 'Mendeteksi lokasi...';
        } else if (!locationValid) {
            checkoutDisabledReason = 'Di luar radius lokasi';
        }
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
                    {attStatus === 'none' && session.location && (
                        <LocationIndicator distance={distance} radius={session.location.radius} accuracy={accuracy} />
                    )}
                    <div className="flex gap-1.5">
                        {attStatus === 'none' && (
                            canCheckin ? (
                                <Button variant="success" size="sm" onClick={() => handleCheckin(session.id)}>
                                    <Icon icon="lucide:log-in" /> Masuk
                                </Button>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed">
                                    <Icon icon="lucide:map-pin" className="text-xs" /> {checkinDisabledReason || 'Belum Waktunya'}
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
                                    <Icon icon="lucide:map-pin" className="text-xs" /> {checkoutDisabledReason || 'Menunggu Selesai'}
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SesiDetailDropdown({ allSessions, grades }: { allSessions: any[]; grades: any[] }) {
    const [expanded, setExpanded] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [filterGrade, setFilterGrade] = useState<string>('');
    const [filterMapel, setFilterMapel] = useState<string>('');
    const [filterJenjang, setFilterJenjang] = useState<string>('');

    const months = allSessions.map(s => ({ key: s.month_key, label: s.month_label }));
    const filteredMonths = selectedMonth ? months.filter(m => m.key === selectedMonth) : months;

    const uniqueMapel = [...new Set(allSessions.flatMap(s => s.sessions.map((ss: any) => ss.mapel)).filter(Boolean))];
    const uniqueGrade = [...new Set(allSessions.flatMap(s => s.sessions.map((ss: any) => ss.kode_grade)).filter(Boolean))];
    const uniqueJenjang = [...new Set(allSessions.flatMap(s => s.sessions.map((ss: any) => ss.jenjang)).filter(Boolean))];

    const allFilteredSessions = filteredMonths.flatMap(m => {
        const monthData = allSessions.find(s => s.month_key === m.key);
        if (!monthData) return [];
        let filtered = monthData.sessions;
        if (filterMapel) {
            filtered = filtered.filter((ss: any) => ss.mapel === filterMapel);
        }
        if (filterGrade) {
            filtered = filtered.filter((ss: any) => ss.kode_grade === filterGrade);
        }
        if (filterJenjang) {
            filtered = filtered.filter((ss: any) => ss.jenjang === filterJenjang);
        }
        return filtered.map((ss: any) => ({ ...ss, month_label: m.label }));
    });

    const totalFilteredSesi = allFilteredSessions.reduce((acc: number, s: any) => acc + s.jumlah_sesi, 0);

    return (
        <div className="mt-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:list" className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Detail Sesi per Bulan</span>
                </div>
                <Icon
                    icon={expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                    className="text-slate-400"
                />
            </button>

            {expanded && (
                <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        >
                            <option value="">Semua Bulan</option>
                            {months.map(m => (
                                <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                        </select>

                        <select
                            value={filterMapel}
                            onChange={(e) => setFilterMapel(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        >
                            <option value="">Semua Mapel</option>
                            {uniqueMapel.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        >
                            <option value="">Semua Grade</option>
                            {uniqueGrade.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>

                        <select
                            value={filterJenjang}
                            onChange={(e) => setFilterJenjang(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        >
                            <option value="">Semua Jenjang</option>
                            {uniqueJenjang.map(j => (
                                <option key={j} value={j}>{j}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Total Sesi Terfilter</span>
                        <span className="text-lg font-bold text-blue-900">{totalFilteredSesi} sesi</span>
                    </div>

                    {allFilteredSessions.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {allFilteredSessions.map((s: any) => (
                                <div key={`${s.tanggal}-${s.id}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <Icon icon="lucide:book-open" className="text-slate-500 text-xs" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-900">{s.tanggal} &bull; {s.jam_mulai}-{s.jam_selesai}</p>
                                            <p className="text-xs text-slate-500">{s.mapel} &bull; {s.lokasi}</p>
                                        </div>
                                    </div>
                                    <Badge>{s.jumlah_sesi} sesi</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-slate-500">Tidak ada sesi ditemukan</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ stats, recentSessions, recentPenggajian, todaySessions, todayAttendances, allSessions, guru, grades, role }: DashboardProps) {
    const position = useCurrentPosition();

    if (role === 'guru') {
        return (
            <AuthenticatedLayout>
                <Head title="Dashboard Guru" />
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang, {guru?.nama}</h1>
                    <p className="text-sm text-slate-500 mt-1">Dashboard guru — lihat jadwal, absensi, dan gaji hari ini</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Sesi Bulan Ini" value={stats.total_sesi_bulan ?? 0} icon="lucide:book-open" color="blue" />
                    <StatCard title="Kehadiran" value={stats.total_hadir ?? 0} icon="lucide:check-circle" color="green" />
                    <StatCard title="Total Sesi" value={stats.total_sesi_semua ?? 0} icon="lucide:layers" color="amber" description="Keseluruhan" />
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Gaji Bulan Ini</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Potensi: <span className="font-semibold text-purple-600">{formatCurrency(stats.potensi_gaji ?? 0)}</span>
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                <Icon icon="lucide:banknote" className="text-xl" />
                            </div>
                        </div>
                    </div>
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
                                            position={position}
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

                        {allSessions && allSessions.length > 0 && (
                            <SesiDetailDropdown allSessions={allSessions} grades={grades ?? []} />
                        )}
                    </Card>

                    <Card title="Status Pembayaran">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Gaji Bulan Ini</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Potensi: <span className="font-semibold text-purple-600">{formatCurrency(stats.potensi_gaji ?? 0)}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${stats.status_bayar === 'sudah_dibayar' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm font-medium text-slate-700">
                                    Status: {stats.status_bayar === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                </span>
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
