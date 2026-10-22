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
        gaji_bulan?: number;
        potensi_gaji?: number;
        status_bayar?: string;
    };
    recentSessions?: any[];
    recentPenggajian?: any[];
    upcomingSessions?: any[];
    todayAttendances?: Record<string, any>;
    guru?: any;
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
    const phaseRef = useRef<'gps' | 'network'>('gps');

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
                return prev;
            });
        };

        const onError = () => {
            if (phaseRef.current === 'gps') {
                phaseRef.current = 'network';
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }
                watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                    enableHighAccuracy: false,
                    maximumAge: 0,
                    timeout: 15000,
                });
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
        });

        const fallbackTimer = setTimeout(() => {
            if (phaseRef.current === 'gps') {
                phaseRef.current = 'network';
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }
                watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                    enableHighAccuracy: false,
                    maximumAge: 0,
                    timeout: 15000,
                });
            }
        }, 5000);

        return () => {
            clearTimeout(fallbackTimer);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return position;
}

function getAccuratePosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation tidak didukung browser Anda.'));
            return;
        }

        let bestPos: GeolocationPosition | null = null;
        let watchId: number | null = null;
        let finished = false;
        let phase: 'gps' | 'network' = 'gps';

        const finish = () => {
            if (finished) return;
            finished = true;
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (bestPos) {
                resolve(bestPos);
            } else {
                reject(new Error('Gagal mendapatkan lokasi. Pastikan GPS/lokasi aktif di perangkat Anda.'));
            }
        };

        const onSuccess = (pos: GeolocationPosition) => {
            if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
                bestPos = pos;
            }
            if (bestPos.coords.accuracy <= 25) {
                finish();
            }
        };

        const onError = () => {
            if (phase === 'gps' && !finished) {
                phase = 'network';
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                }
                watchId = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                    enableHighAccuracy: false,
                    maximumAge: 0,
                    timeout: 15000,
                });
            }
        };

        watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
        });

        setTimeout(() => {
            if (phase === 'gps' && !finished) {
                phase = 'network';
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                }
                watchId = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                    enableHighAccuracy: false,
                    maximumAge: 0,
                    timeout: 15000,
                });
            }
        }, 5000);

        setTimeout(finish, 12000);
    });
}

function handleCheckin(sessionId: number, setLoading: (v: boolean) => void) {
    setLoading(true);
    getAccuratePosition()
        .then((position) => {
            router.post(route('checkin'), {
                session_id: sessionId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
            }, { preserveState: true, onFinish: () => setLoading(false) });
        })
        .catch(() => {
            setLoading(false);
            alert('Gagal mendapatkan lokasi. Pastikan GPS/lokasi aktif di perangkat Anda, lalu coba lagi.');
        });
}

function handleCheckout(sessionId: number, setLoading: (v: boolean) => void) {
    setLoading(true);
    getAccuratePosition()
        .then((position) => {
            router.post(route('checkout'), {
                session_id: sessionId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
            }, { preserveState: true, onFinish: () => setLoading(false) });
        })
        .catch(() => {
            setLoading(false);
            alert('Gagal mendapatkan lokasi. Pastikan GPS/lokasi aktif di perangkat Anda, lalu coba lagi.');
        });
}

function LocationIndicator({ distance, radius, accuracy }: { distance: number | null; radius: number; accuracy: number | null }) {
    if (distance === null) {
        return (
            <div className="flex items-center gap-1.5 text-slate-500">
                <Icon icon="lucide:map-pin-off" className="text-xs" />
                <span className="text-[11px]">Mendeteksi lokasi...</span>
            </div>
        );
    }

    const effectiveDistance = accuracy ? Math.max(0, distance - accuracy) : distance;
    const effectiveWithinRadius = effectiveDistance <= radius;

    const getAccuracyLabel = (acc: number | null): string => {
        if (acc === null) return '';
        if (acc <= 10) return 'GPS Sangat Akurat';
        if (acc <= 30) return 'GPS Akurat';
        if (acc <= 50) return 'GPS Cukup';
        if (acc <= 100) return 'WiFi/Jaringan';
        return 'Kurang Akurat';
    };

    const getAccuracyColor = (acc: number | null): string => {
        if (acc === null) return 'text-slate-500';
        if (acc <= 20) return 'text-emerald-600';
        if (acc <= 50) return 'text-indigo-600';
        if (acc <= 100) return 'text-amber-500';
        return 'text-rose-500';
    };

    return (
        <div className="space-y-0.5">
            <div className={`flex items-center gap-1.5 ${effectiveWithinRadius ? 'text-emerald-600' : 'text-rose-500'}`}>
                <Icon icon={effectiveWithinRadius ? 'lucide:map-pin-check' : 'lucide:map-pin-x'} className="text-xs" />
                <span className="text-[11px] font-medium">
                    {effectiveWithinRadius
                        ? `~${Math.round(distance)}m dari lokasi`
                        : `~${Math.round(distance)}m — di luar radius`
                    }
                </span>
            </div>
            {accuracy !== null && (
                <div className={`flex items-center gap-1.5 ${getAccuracyColor(accuracy)}`}>
                    <Icon icon={accuracy <= 30 ? 'lucide:crosshair' : accuracy <= 100 ? 'lucide:target' : 'lucide:alert-triangle'} className="text-[10px]" />
                    <span className="text-[10px]">
                        ±{Math.round(accuracy)}m ({getAccuracyLabel(accuracy)})
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
    const [loading, setLoading] = useState(false);

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
    const accuracy = position?.accuracy ?? null;
    const effectiveDistance = (distance !== null && accuracy !== null) ? Math.max(0, distance - accuracy) : distance;
    const locationWithinRadius = distance !== null && distance <= radius;
    const effectiveWithinRadius = effectiveDistance !== null && effectiveDistance <= radius;
    const gpsReady = accuracy !== null && accuracy <= 100;
    const locationValid = effectiveWithinRadius && gpsReady;
    const canCheckin = canCheckinTime && locationValid && !loading;
    const canCheckout = canCheckoutTime && locationValid && !loading;

    let statusBadge = null;
    if (attStatus === 'valid') {
        statusBadge = <Badge variant="success">Selesai</Badge>;
    } else if (attStatus === 'checkin') {
        statusBadge = <Badge variant="warning">Check-in</Badge>;
    } else if (attStatus === 'invalid') {
        statusBadge = <Badge variant="danger">Tidak Valid</Badge>;
    }

    let checkinDisabledReason = '';
    if (!canCheckin && attStatus === 'none' && !loading) {
        if (!canCheckinTime) {
            checkinDisabledReason = 'Belum waktunya';
        } else if (distance === null) {
            checkinDisabledReason = 'Mendeteksi lokasi...';
        } else if (!gpsReady) {
            checkinDisabledReason = `Lokasi ±${Math.round(accuracy ?? 0)}m — perlu ≤100m`;
        } else if (!effectiveWithinRadius) {
            checkinDisabledReason = 'Di luar radius lokasi';
        }
    }

    let checkoutDisabledReason = '';
    if (!canCheckout && attStatus === 'checkin' && !loading) {
        if (!canCheckoutTime) {
            checkoutDisabledReason = 'Menunggu selesai';
        } else if (distance === null) {
            checkoutDisabledReason = 'Mendeteksi lokasi...';
        } else if (!gpsReady) {
            checkoutDisabledReason = `Lokasi ±${Math.round(accuracy ?? 0)}m — perlu ≤100m`;
        } else if (!effectiveWithinRadius) {
            checkoutDisabledReason = 'Di luar radius lokasi';
        }
    }

    return (
        <div className="p-4 bg-white rounded-2xl border border-indigo-100/80 hover:border-indigo-200 hover:shadow-[0_8px_20px_-8px_rgba(99,102,241,0.25)] transition-all duration-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_6px_14px_-6px_rgba(99,102,241,0.8)]">
                        <Icon icon="lucide:book-open" className="text-white text-sm" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">{session.location?.nama_lokasi}</p>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">
                            {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)} &bull; {session.mapel} &bull; {session.jumlah_sesi} sesi
                        </p>
                        {session.transport && (
                            <p className="text-xs text-slate-500 mt-0.5 break-words">
                                Transport: {session.transport.jenis}
                            </p>
                        )}
                        {attStatus !== 'none' && attendance?.checkin_time && (
                            <p className="text-xs text-slate-500 mt-0.5 break-words">
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
                <div className="flex flex-col items-start gap-2 flex-shrink-0 sm:items-end">
                    {statusBadge}
                    {attStatus === 'none' && session.location && (
                        <LocationIndicator distance={distance} radius={session.location.radius} accuracy={accuracy} />
                    )}
                    <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        {attStatus === 'none' && (
                            loading ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 ring-1 ring-indigo-100/80 rounded-lg">
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Mengambil GPS...
                                </span>
                            ) : canCheckin ? (
                                <Button variant="success" size="sm" onClick={() => handleCheckin(session.id, setLoading)}>
                                    <Icon icon="lucide:log-in" /> Masuk
                                </Button>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
                                    <Icon icon="lucide:map-pin" className="text-xs" /> {checkinDisabledReason || 'Belum Waktunya'}
                                </span>
                            )
                        )}
                        {attStatus === 'checkin' && (
                            loading ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 ring-1 ring-indigo-100/80 rounded-lg">
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Mengambil GPS...
                                </span>
                            ) : canCheckout ? (
                                <Button variant="danger" size="sm" onClick={() => handleCheckout(session.id, setLoading)}>
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

function upcomingDateLabel(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(`${dateStr}T00:00:00`);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Hari Ini';
    if (diff === 1) return 'Besok';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}

function UpcomingSessionCard({ session }: { session: any }) {
    return (
        <div className="p-4 bg-white rounded-2xl border border-dashed border-indigo-200/80 hover:border-indigo-300 transition-all duration-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon icon="lucide:calendar-clock" className="text-indigo-500 text-sm" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">{session.location?.nama_lokasi}</p>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">
                            {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)} &bull; {session.mapel} &bull; {session.jumlah_sesi} sesi
                        </p>
                        {session.transport && (
                            <p className="text-xs text-slate-500 mt-0.5 break-words">Transport: {session.transport.jenis}</p>
                        )}
                    </div>
                </div>
                <Badge variant="info" size="sm">{upcomingDateLabel(session.tanggal)}</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Icon icon="lucide:lock" className="text-[11px] shrink-0" /> Check-in dibuka saat jadwal dimulai (H-30 menit) dengan validasi GPS
            </p>
        </div>
    );
}

export default function Dashboard({ stats, recentSessions, recentPenggajian, upcomingSessions, todayAttendances, guru, role }: DashboardProps) {
    const position = useCurrentPosition();

    if (role === 'guru') {
        const hour = new Date().getHours();
        const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
        const initials = (guru?.nama || 'G').split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase();
        return (
            <AuthenticatedLayout>
                <Head title="Dashboard Guru" />

                {/* Hero - Brand */}
                <div className="bg-hero-gradient rounded-2xl p-6 mb-6 text-white shadow-brand-lg relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-14 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-white/15 ring-1 ring-white/25 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-indigo-200 tracking-wide uppercase">{greeting} • Guru KPM Pusat</p>
                                <h1 className="text-xl font-semibold text-white tracking-tight truncate mt-0.5">{guru?.nama}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-xs font-medium backdrop-blur-sm">
                                        <Icon icon="lucide:award" className="w-3.5 h-3.5" /> Grade {guru?.grade?.kode_grade ?? '-'}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-xs font-medium backdrop-blur-sm">
                                        {guru?.mapel ?? '-'} • {guru?.jenjang ?? '-'}
                                    </span>
                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktif
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-right shrink-0 border-l border-white/20 pl-6">
                            <div>
                                <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">Hari ini</p>
                                <p className="text-sm font-medium text-white">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-white">
                                <Icon icon="lucide:calendar" className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Sesi Bulan Ini" value={stats.total_sesi_bulan ?? 0} icon="lucide:book-open" color="blue" description={`${upcomingSessions?.filter((s: any) => s.is_today).length ?? 0} jadwal hari ini`} />
                    <StatCard title="Kehadiran" value={`${stats.total_hadir ?? 0}/${stats.total_sesi_bulan ?? 0}`} icon="lucide:check-circle" color="green" description="Valid & terverifikasi GPS" />
                    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-6 shadow-brand hover:shadow-brand-lg hover:-translate-y-0.5 transition-all duration-300 lg:col-span-1 col-span-2">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative">
                            <p className="text-[11px] font-[700] tracking-[0.08em] uppercase text-indigo-200">Gaji Bulan Ini</p>
                            <p className="text-[20px] sm:text-[22px] font-[800] tracking-[-0.03em] text-white mt-2 leading-none break-words">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                            <div className="mt-3 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm px-3 py-2">
                                <p className="text-[10px] font-[700] tracking-[0.08em] uppercase text-indigo-200">Potensi Gaji Bulan Ini</p>
                                <p className="text-[16px] font-[800] tracking-[-0.02em] text-white mt-0.5 leading-tight break-words">{formatCurrency(stats.potensi_gaji ?? 0)}</p>
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[700] border bg-white/15 text-white border-white/25 backdrop-blur-sm">
                                <Icon icon="lucide:wallet" className="text-[12px]" /> {stats.status_bayar === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}
                                <span className={`w-2 h-2 rounded-full ${stats.status_bayar === 'sudah_dibayar' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <Card
                            title="Jadwal Mengajar Terdekat"
                            description="Jadwal hari ini & mendatang — absensi GPS berlaku untuk jadwal hari ini"
                            headerAction={<span className="text-[11px] font-[700] tracking-[0.06em] uppercase px-2.5 py-1 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">{upcomingSessions?.length ?? 0} sesi</span>}
                        >
                            {upcomingSessions && upcomingSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingSessions.map((session: any) => {
                                        if (!session.is_today) {
                                            return <UpcomingSessionCard key={session.id} session={session} />;
                                        }
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
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto">
                                        <Icon icon="lucide:calendar-off" className="text-[28px] text-indigo-400" />
                                    </div>
                                    <p className="text-[13px] font-[600] text-slate-700 mt-3">Tidak ada jadwal mendatang</p>
                                    <p className="text-[12px] text-slate-500 mt-1">Jadwal mengajar Anda akan muncul di sini</p>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-200/60">
                                <a
                                    href={route('jadwal.bulanan')}
                                    className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl hover:border-indigo-200 hover:from-indigo-100/70 hover:to-violet-100/70 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon icon="lucide:calendar-range" className="text-indigo-600" />
                                        <span className="text-sm font-semibold text-slate-900">Lihat Jadwal Bulanan Lengkap</span>
                                    </div>
                                    <Icon icon="lucide:chevron-right" className="text-indigo-400" />
                                </a>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Ringkasan Pembayaran" description="Status honor bulan berjalan">
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[11px] font-[700] tracking-[0.08em] uppercase text-slate-500">Dibayar</p>
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-[700] border ${stats.status_bayar === 'sudah_dibayar' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {stats.status_bayar === 'sudah_dibayar' ? 'Lunas' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-[22px] sm:text-[26px] font-[800] tracking-[-0.03em] text-slate-900 mt-2 leading-none break-words">{formatCurrency(stats.gaji_bulan ?? 0)}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-[500] text-slate-500">
                                        <Icon icon="lucide:trending-up" className="text-emerald-500" /> Potensi: <span className="font-[700] text-slate-900 break-words">{formatCurrency(stats.potensi_gaji ?? 0)}</span>
                                    </div>
                                    <div className="mt-4 h-2 rounded-full bg-indigo-100/80 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, ((stats.total_hadir ?? 0) / Math.max(1, stats.total_sesi_bulan ?? 1)) * 100)}%` }} />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2">{stats.total_hadir ?? 0} dari {stats.total_sesi_bulan ?? 0} sesi • Kehadiran</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-white border border-indigo-100 hover:border-indigo-200 p-4 transition-colors">
                                        <p className="text-[11px] font-[700] tracking-[0.06em] uppercase text-slate-500">Mapel</p>
                                        <p className="text-[14px] font-[700] text-slate-900 mt-1 break-words">{guru?.mapel ?? '-'}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white border border-indigo-100 hover:border-indigo-200 p-4 transition-colors">
                                        <p className="text-[11px] font-[700] tracking-[0.06em] uppercase text-slate-500">Grade</p>
                                        <p className="text-[14px] font-[700] text-slate-900 mt-1 break-words">Grade {guru?.grade?.kode_grade ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-[0_6px_14px_-6px_rgba(99,102,241,0.8)]">
                                    <Icon icon="lucide:help-circle" className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Butuh bantuan?</h3>
                                    <p className="text-sm text-slate-600 mt-1 leading-5">Hubungi admin jika ada kendala absensi GPS, jadwal, atau slip gaji.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Admin" />
            {/* Hero - Brand */}
            <div className="bg-hero-gradient rounded-2xl p-6 mb-6 text-white shadow-brand-lg relative overflow-hidden">
                <div className="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-[11px] font-[700] tracking-[0.06em] uppercase backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sistem Aktif • TA 2026/27
                        </div>
                        <h1 className="text-[26px] sm:text-[32px] font-[800] tracking-[-0.03em] text-white leading-none mt-3">Dashboard Admin</h1>
                        <p className="text-[13.5px] leading-6 text-indigo-100 mt-2 font-[450] w-full">Pantau guru, sesi mengajar, absensi GPS, dan pengeluaran honor secara real-time. Semua terkonsolidasi dalam satu tampilan.</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 ring-1 ring-white/25 text-[12px] font-[600] text-white backdrop-blur-sm">
                                <Icon icon="lucide:shield-check" className="text-emerald-300" /> Data terverifikasi
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 ring-1 ring-white/25 text-[12px] font-[600] text-white backdrop-blur-sm">
                                <Icon icon="lucide:zap" className="text-amber-300" /> Kalkulasi &lt;1 detik
                            </span>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-3 shrink-0">
                        <div className="text-right">
                            <p className="text-[11px] font-[700] tracking-[0.08em] uppercase text-indigo-200">Hari ini</p>
                            <p className="text-[13px] font-[700] text-white">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-white backdrop-blur-sm">
                            <Icon icon="lucide:calendar-range" className="text-[18px]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Guru" value={stats.total_guru ?? 0} icon="lucide:users" color="blue" description="Terdaftar aktif" />
                <StatCard title="Sesi Bulan Ini" value={stats.total_sesi_bulan ?? 0} icon="lucide:calendar-days" color="green" description="Jadwal terbuat" />
                <StatCard title="Guru Hadir" value={stats.total_guru_hadir ?? 0} icon="lucide:user-check" color="amber" description="Hari ini" />
                <StatCard title="Pengeluaran" value={formatCurrency(stats.total_pengeluaran ?? 0)} icon="lucide:wallet" color="purple" description="Bulan berjalan" className="break-words" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Sesi Mengajar Terbaru" description="Jadwal terbaru yang dibuat admin" headerAction={<span className="text-[11px] font-[700] tracking-[0.06em] uppercase px-2.5 py-1 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">{recentSessions?.length ?? 0} sesi</span>}>
                    {recentSessions && recentSessions.length > 0 ? (
                        <div className="space-y-3">
                            {recentSessions.map((s: any) => (
                                <div key={s.id} className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm hover:-translate-y-px transition-all duration-200">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-[800] text-[12px] shrink-0 shadow-[0_6px_14px_-6px_rgba(99,102,241,0.8)]">
                                            {s.guru?.grade?.kode_grade ?? '-'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13.5px] font-[700] tracking-[-0.01em] text-slate-900 truncate">{s.guru?.nama}</p>
                                            <p className="text-[11.5px] font-[500] text-slate-500 truncate flex items-center gap-1.5"><Icon icon="lucide:map-pin" className="text-[11px] shrink-0" />{s.location?.nama_lokasi} • {s.tanggal}</p>
                                        </div>
                                    </div>
                                    <Badge variant="neutral">{s.jumlah_sesi} sesi</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto">
                                <Icon icon="lucide:calendar-off" className="text-[26px] text-indigo-400" />
                            </div>
                            <p className="text-[13px] font-[600] text-slate-700 mt-3">Belum ada sesi</p>
                            <p className="text-[12px] text-slate-500">Buat sesi mengajar pertama untuk memulai</p>
                        </div>
                    )}
                </Card>

                <Card title="Rekap Penggajian Terbaru" description="Pembayaran honor terkini" headerAction={<span className="text-[11px] font-[700] tracking-[0.06em] uppercase px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Rekap</span>}>
                    {recentPenggajian && recentPenggajian.length > 0 ? (
                        <div className="space-y-3">
                            {recentPenggajian.map((p: any) => (
                                <div key={p.id} className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm hover:-translate-y-px transition-all duration-200">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center font-[800] text-[12px] text-indigo-700 shrink-0">
                                            {p.guru?.grade?.kode_grade ?? '-'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13.5px] font-[700] tracking-[-0.01em] text-slate-900 truncate">{p.guru?.nama}</p>
                                            <p className="text-[11.5px] font-[500] text-slate-500 break-words">{p.periode} • {p.jumlah_sesi} sesi</p>
                                        </div>
                                    </div>
                                    <div className="text-left shrink-0 sm:text-right">
                                        <p className="text-[13px] font-[800] tracking-[-0.01em] text-slate-900 break-words">{formatCurrency(p.total)}</p>
                                        <Badge variant={p.status_bayar === 'sudah_dibayar' ? 'success' : 'danger'} size="sm">
                                            {p.status_bayar === 'sudah_dibayar' ? 'Lunas' : 'Pending'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto">
                                <Icon icon="lucide:wallet" className="text-[26px] text-indigo-400" />
                            </div>
                            <p className="text-[13px] font-[600] text-slate-700 mt-3">Belum ada penggajian</p>
                            <p className="text-[12px] text-slate-500">Hitung gaji untuk periode berjalan</p>
                        </div>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
