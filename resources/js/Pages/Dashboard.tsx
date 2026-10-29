import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import StatCard from '@/Components/ui/stat-card';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface AdminStats {
    total_guru: number;
    total_guru_aktif: number;
    total_kelas_khusus: number;
    total_sesi_bulan: number;
    total_sesi_hari_ini: number;
    guru_hadir_hari_ini: number;
    total_pengeluaran: number;
    total_sudah_dibayar: number;
    pengeluaran_belum_dibayar: number;
    total_guru_bergaji: number;
    izin_pending: number;
    periode: string;
}

interface GuruStats {
    total_sesi_bulan: number;
    total_hadir: number;
    total_jam: number;
    gaji_bulan: number;
    potensi_gaji: number;
    status_bayar: string;
}

interface TodaySession {
    id: number;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_sesi: number;
    mapel: 'IPA' | 'MTK';
    status: 'dijadwalkan' | 'selesai' | 'dibatalkan';
    program: string | null;
    lokasi: string | null;
    guru: { nama: string; kode_grade: string };
    presensi: 'valid' | 'tidak_valid' | 'belum_checkin' | 'belum_checkout' | 'izin';
}

interface RecentSession {
    id: number;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_sesi: number;
    mapel: 'IPA' | 'MTK';
    status: 'dijadwalkan' | 'selesai' | 'dibatalkan';
    lokasi: string;
    program: string | null;
    guru: { nama: string; kode_grade: string };
}

interface PendingPerizinan {
    id: number;
    jenis: 'izin' | 'sakit' | 'cuti';
    tanggal_mulai: string;
    tanggal_selesai: string;
    alasan: string;
    guru: { nama: string; kode_grade?: string } | null;
}

interface SunnahHariIni {
    id: number;
    total_poin: number;
    status_approval: 'pending' | 'approved' | 'rejected';
    status_label: string;
    catatan: string | null;
}

interface SunnahRiwayatItem {
    tanggal: string;
    poin: number;
    status_approval: 'pending' | 'approved' | 'rejected';
}

interface SunnahBulanIni {
    total_poin: number;
    total_hari: number;
    riwayat: SunnahRiwayatItem[];
}

interface DashboardProps {
    stats: AdminStats | GuruStats;
    todaySessions?: TodaySession[];
    recentSessions?: RecentSession[];
    recentPenggajian?: any[];
    pendingPerizinan?: PendingPerizinan[];
    upcomingSessions?: any[];
    todayAttendances?: Record<string, any>;
    izinHariIni?: { jenis: string; rentang: string; alasan?: string } | null;
    sunnahHariIni?: SunnahHariIni | null;
    sunnahBulanIni?: SunnahBulanIni | null;
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

/**
 * Mengambil posisi perangkat HANYA saat diaktifkan (enabled).
 *
 * Geolocation tidak diminta otomatis oleh aplikasi: permintaan lokasi hanya
 * terjadi pada halaman dashboard guru yang memiliki sesi hari ini dengan
 * antrean check-in/check-out. Admin tidak pernah memicu permintaan lokasi.
 */
function useCurrentPosition(enabled: boolean): Position | null {
    const [position, setPosition] = useState<Position | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const phaseRef = useRef<'gps' | 'network'>('gps');

    useEffect(() => {
        if (!enabled || !navigator.geolocation) return;

        const startNetworkWatch = () => {
            phaseRef.current = 'network';
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                enableHighAccuracy: false,
                maximumAge: 0,
                timeout: 15000,
            });
        };

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
                startNetworkWatch();
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
        });

        const fallbackTimer = setTimeout(() => {
            if (phaseRef.current === 'gps') {
                startNetworkWatch();
            }
        }, 5000);

        return () => {
            clearTimeout(fallbackTimer);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [enabled]);

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

        const startNetworkWatch = () => {
            phase = 'network';
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            watchId = navigator.geolocation.watchPosition(onSuccess, () => {}, {
                enableHighAccuracy: false,
                maximumAge: 0,
                timeout: 15000,
            });
        };

        const onError = () => {
            if (phase === 'gps' && !finished) {
                startNetworkWatch();
            }
        };

        watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
        });

        setTimeout(() => {
            if (phase === 'gps' && !finished) {
                startNetworkWatch();
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

function SessionCard({ session, attendance, attStatus, position, izinAktif = false }: { session: any; attendance: any; attStatus: string; position: Position | null; izinAktif?: boolean }) {
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
    if (izinAktif && attStatus === 'none') {
        statusBadge = <Badge variant="info">Izin</Badge>;
    } else if (attStatus === 'valid') {
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
                            {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)} &bull; {session.program ?? session.mapel} &bull; {session.jumlah_sesi} sesi
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
                        {attStatus === 'none' && izinAktif && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <Icon icon="lucide:shield-check" className="text-xs" /> Izin disetujui
                            </span>
                        )}
                        {attStatus === 'none' && !izinAktif && (
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
                            {session.jam_mulai?.substring(0, 5)} - {session.jam_selesai?.substring(0, 5)} &bull; {session.program ?? session.mapel} &bull; {session.jumlah_sesi} sesi
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

const presensiBadge: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
    valid: { variant: 'success', label: 'Hadir' },
    belum_checkout: { variant: 'warning', label: 'Belum Check-out' },
    tidak_valid: { variant: 'danger', label: 'Tidak Valid' },
    belum_checkin: { variant: 'default', label: 'Belum Check-in' },
};

const statusSesiBadge: Record<string, { variant: 'info' | 'success' | 'danger'; label: string }> = {
    dijadwalkan: { variant: 'info', label: 'Dijadwalkan' },
    selesai: { variant: 'success', label: 'Selesai' },
    dibatalkan: { variant: 'danger', label: 'Dibatalkan' },
};

function AdminDashboard({ stats, todaySessions, recentSessions, recentPenggajian, pendingPerizinan }: {
    stats: AdminStats;
    todaySessions?: TodaySession[];
    recentSessions?: RecentSession[];
    recentPenggajian?: any[];
    pendingPerizinan?: PendingPerizinan[];
}) {
    const periodeLabel = new Date(stats.periode + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-subtitle mt-1">
                            Ringkasan data operasional Satu Guru KPM per {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
                        </p>
                    </div>

                    {/* Statistik data aktual */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="Total Guru"
                            value={stats.total_guru}
                            icon="lucide:users"
                            color="accent"
                            description={`${stats.total_guru_aktif} terhubung akun · ${stats.total_kelas_khusus} kelas khusus`}
                        />
                        <StatCard
                            title="Sesi Bulan Ini"
                            value={stats.total_sesi_bulan}
                            icon="lucide:calendar-days"
                            color="success"
                            description={`${stats.total_sesi_hari_ini} sesi hari ini`}
                        />
                        <StatCard
                            title="Guru Hadir Hari Ini"
                            value={stats.guru_hadir_hari_ini}
                            icon="lucide:user-check"
                            color="warning"
                            description="Presensi valid & terverifikasi"
                        />
                        <StatCard
                            title="Pengeluaran Bulan Ini"
                            value={formatCurrency(stats.total_pengeluaran)}
                            icon="lucide:wallet"
                            color="slate"
                            description={`${stats.total_guru_bergaji} guru terhitung gajinya`}
                            className="break-words"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <Card className="lg:col-span-1">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate-500">Sudah Dibayar ({periodeLabel})</p>
                                    <p className="text-[20px] font-[800] tracking-tight text-emerald-600 mt-1 break-words">{formatCurrency(stats.total_sudah_dibayar)}</p>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div>
                                    <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate-500">Belum Dibayar ({periodeLabel})</p>
                                    <p className="text-[20px] font-[800] tracking-tight text-amber-600 mt-1 break-words">{formatCurrency(stats.pengeluaran_belum_dibayar)}</p>
                                </div>
                                <Link
                                    href={route('penggajian.index')}
                                    className="inline-flex items-center gap-1.5 text-[12.5px] font-[700] text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    Kelola penggajian <Icon icon="lucide:arrow-right" className="text-[13px]" />
                                </Link>
                            </div>
                        </Card>

                        <Card
                            className="lg:col-span-2"
                            title="Sesi Mengajar Hari Ini"
                            description={`${todaySessions?.length ?? 0} sesi aktif terjadwal hari ini`}
                            headerAction={
                                <Link href={route('jadwal.index')} className="text-[12.5px] font-[700] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                                    Jadwal mingguan <Icon icon="lucide:arrow-right" className="text-[13px]" />
                                </Link>
                            }
                            noPadding
                        >
                            {todaySessions && todaySessions.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                                    {todaySessions.map((s) => {
                                        const presensi = presensiBadge[s.presensi] ?? presensiBadge.belum_checkin;
                                        return (
                                            <div key={s.id} className="flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5">
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-[700] text-slate-900 truncate">{s.guru.nama}</p>
                                                    <p className="text-[11.5px] text-slate-500 truncate">
                                                        {s.jam_mulai}–{s.jam_selesai} · {s.program ?? s.mapel} · {s.lokasi ?? '-'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant={presensi.variant} size="sm">{presensi.label}</Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[13px] text-slate-500 text-center py-8">Tidak ada sesi mengajar hari ini.</p>
                            )}
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card
                            title="Perizinan Menunggu Tinjauan"
                            description="Ajukan persetujuan atau penolakan sesegera mungkin"
                            headerAction={
                                stats.izin_pending > 0 ? (
                                    <Link href={route('perizinan.index')} className="text-[12.5px] font-[700] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                                        Tinjau semua <Icon icon="lucide:arrow-right" className="text-[13px]" />
                                    </Link>
                                ) : undefined
                            }
                        >
                            {pendingPerizinan && pendingPerizinan.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingPerizinan.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-[700] text-slate-900 truncate">{p.guru?.nama ?? '-'}</p>
                                                <p className="text-[11.5px] text-slate-500 truncate">
                                                    {p.jenis} · {p.tanggal_mulai} s/d {p.tanggal_selesai}
                                                </p>
                                            </div>
                                            <Badge variant="warning" size="sm">Menunggu</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[13px] text-slate-500 text-center py-6">Tidak ada perizinan yang menunggu tinjauan.</p>
                            )}
                        </Card>

                        <Card
                            title="Rekap Penggajian Bulan Ini"
                            description={`Periode ${periodeLabel}`}
                            headerAction={
                                <Link href={route('laporan.index')} className="text-[12.5px] font-[700] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                                    Laporan <Icon icon="lucide:arrow-right" className="text-[13px]" />
                                </Link>
                            }
                        >
                            {recentPenggajian && recentPenggajian.length > 0 ? (
                                <div className="space-y-3">
                                    {recentPenggajian.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-[700] text-slate-900 truncate">{p.guru?.nama ?? '-'}</p>
                                                <p className="text-[11.5px] text-slate-500 truncate">{p.jumlah_sesi} sesi · {p.jumlah_hadir} hadir</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[13px] font-[800] text-slate-900 break-words">{formatCurrency(p.total)}</p>
                                                <Badge variant={p.status_bayar === 'sudah_dibayar' ? 'success' : 'warning'} size="sm">
                                                    {p.status_bayar === 'sudah_dibayar' ? 'Lunas' : 'Belum Dibayar'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[13px] text-slate-500 text-center py-6">
                                    Belum ada data penggajian bulan ini. Hitung gaji dari halaman Penggajian.
                                </p>
                            )}
                        </Card>
                    </div>

                    {recentSessions && recentSessions.length > 0 && (
                        <Card
                            className="mt-6"
                            title="Sesi Mengajar Terbaru"
                            description="Sesi yang baru saja dibuat atau diperbarui"
                            headerAction={
                                <Link href={route('session.index')} className="text-[12.5px] font-[700] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                                    Kelola sesi <Icon icon="lucide:arrow-right" className="text-[13px]" />
                                </Link>
                            }
                            noPadding
                        >
                            <div className="divide-y divide-slate-100">
                                {recentSessions.map((s) => {
                                    const status = statusSesiBadge[s.status] ?? statusSesiBadge.dijadwalkan;
                                    return (
                                        <div key={s.id} className="flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-[700] text-slate-900 truncate">
                                                    {s.guru.nama}
                                                    {s.guru.kode_grade !== '-' && <span className="text-slate-400 font-[500]"> ({s.guru.kode_grade})</span>}
                                                </p>
                                                <p className="text-[11.5px] text-slate-500 truncate">
                                                    {s.tanggal} · {s.jam_mulai}–{s.jam_selesai} · {s.program ?? s.mapel} · {s.lokasi}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant={status.variant} size="sm">{status.label}</Badge>
                                                <Badge variant="neutral" size="sm">{s.jumlah_sesi} sesi</Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default function Dashboard(props: DashboardProps) {
    const { stats, role } = props;

    if (role === 'admin') {
        return (
            <AdminDashboard
                stats={stats as AdminStats}
                todaySessions={props.todaySessions}
                recentSessions={props.recentSessions}
                recentPenggajian={props.recentPenggajian}
                pendingPerizinan={props.pendingPerizinan}
            />
        );
    }

    return <GuruDashboard {...props} stats={stats as GuruStats} />;
}

function GuruDashboard({ stats, upcomingSessions, todayAttendances, guru, izinHariIni = null, sunnahHariIni = null, sunnahBulanIni = null }: {
    stats: GuruStats;
    upcomingSessions?: any[];
    todayAttendances?: Record<string, any>;
    izinHariIni?: { jenis: string; rentang: string; alasan?: string } | null;
    sunnahHariIni?: SunnahHariIni | null;
    sunnahBulanIni?: SunnahBulanIni | null;
    guru?: any;
}) {
    const izinAktif = Boolean(izinHariIni);
    // Geolocation HANYA diminta untuk role guru yang punya sesi hari ini
    // dengan antrean check-in/check-out — bukan otomatis setiap kunjungan.
    const needsGps = !izinAktif && (upcomingSessions ?? []).some(
        (s: any) => s.is_today && ['none', 'checkin'].includes(getGuruAttendanceStatus(todayAttendances?.[String(s.id)]))
    );
    const position = useCurrentPosition(needsGps);

    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
    const initials = (guru?.nama || 'G').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            {/* Hero - Profil singkat */}
            <div className="bg-hero-gradient rounded-2xl p-6 mb-6 text-white shadow-brand-lg relative overflow-hidden">
                <div className="pointer-events-none absolute -top-14 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white/15 ring-1 ring-white/25 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-indigo-200 tracking-wide uppercase">{greeting} • Satu Guru KPM</p>
                            <h1 className="text-xl font-semibold text-white tracking-tight truncate mt-0.5">{guru?.nama}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-xs font-medium backdrop-blur-sm">
                                    <Icon icon="lucide:award" className="w-3.5 h-3.5" /> Grade {guru?.grade?.kode_grade ?? '-'}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-xs font-medium backdrop-blur-sm">
                                    {guru?.mapel ?? '-'}{guru?.jenjang ? ` • ${guru.jenjang}` : ''}
                                </span>
                                {Array.isArray(guru?.programs) && guru.programs.length > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-xs font-medium backdrop-blur-sm">
                                        {guru.programs.map((p: any) => p.nama).join(' · ')}
                                    </span>
                                )}
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

            {izinHariIni && (
                <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 sm:p-5 flex items-start gap-3">
                    <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:shield-check" className="text-base" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                            {izinHariIni.jenis} disetujui &mdash; check-in tidak diperlukan
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5 break-words">
                            Periode {izinHariIni.rentang}. Sesi mengajar pada rentang ini tercatat sebagai Izin di rekap presensi.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard title="Sesi Bulan Ini" value={stats.total_sesi_bulan ?? 0} icon="lucide:book-open" color="accent" description={`${upcomingSessions?.filter((s: any) => s.is_today).length ?? 0} jadwal hari ini`} />
                <StatCard title="Kehadiran" value={`${stats.total_hadir ?? 0}/${stats.total_sesi_bulan ?? 0}`} icon="lucide:check-circle" color="success" description="Valid & terverifikasi GPS" />
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

            <SunnahSummaryCard hariIni={sunnahHariIni} bulanIni={sunnahBulanIni} />

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
                                            izinAktif={izinAktif}
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
                                href={route('jadwal.index')}
                                className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl hover:border-indigo-200 hover:from-indigo-100/70 hover:to-violet-100/70 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:calendar-range" className="text-indigo-600" />
                                    <span className="text-sm font-semibold text-slate-900">Lihat Jadwal Mingguan Lengkap</span>
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

/* Kartu ringkas Amalan 7SPS pada dashboard guru. */
function SunnahSummaryCard({ hariIni, bulanIni }: {
    hariIni: SunnahHariIni | null;
    bulanIni: SunnahBulanIni | null;
}) {
    const poin = Math.max(0, Math.min(100, hariIni?.total_poin ?? 0));
    const status = hariIni?.status_approval;
    const statusMeta = status === 'approved'
        ? { label: 'Disetujui', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: 'lucide:check-circle-2' }
        : status === 'rejected'
            ? { label: 'Ditolak — perlu diperbaiki', className: 'border-rose-200 bg-rose-50 text-rose-700', icon: 'lucide:x-circle' }
            : status === 'pending'
                ? { label: 'Menunggu approval', className: 'border-amber-200 bg-amber-50 text-amber-700', icon: 'lucide:hourglass' }
                : { label: 'Belum mengisi hari ini', className: 'border-slate-200 bg-slate-50 text-slate-600', icon: 'lucide:moon' };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-6 shadow-sm mb-6">
            <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-600 text-white shadow-lg shadow-amber-500/25">
                        <Icon icon="lucide:moon-star" className="text-xl" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15px] sm:text-base font-[800] tracking-[-0.015em] text-slate-900">Amalan 7SPS Hari Ini</h3>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${statusMeta.className}`}>
                                <Icon icon={statusMeta.icon} className="text-[11px]" /> {statusMeta.label}
                            </span>
                        </div>
                        <p className="mt-1 text-[12px] sm:text-[13px] text-slate-600">
                            {hariIni
                                ? `Poin hari ini ${hariIni.total_poin}/100. ${hariIni.catatan ? `Catatan admin: ${hariIni.catatan}` : 'Lengkapi checklist agar poin bertambah.'}`
                                : 'Belum ada checklist hari ini. Isi 12 amalan sunnah untuk mengumpulkan hingga 100 poin.'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1"><Icon icon="lucide:star" className="text-amber-500" /> {bulanIni?.total_poin ?? 0} poin bulan ini</span>
                            <span className="inline-flex items-center gap-1"><Icon icon="lucide:calendar-check" className="text-emerald-500" /> {bulanIni?.total_hari ?? 0} hari terisi</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:shrink-0">
                    <div className="min-w-[140px] flex-1 lg:w-48">
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500">
                            <span>Progress</span>
                            <span className="tabular-nums">{poin}%</span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-emerald-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500 transition-all duration-700" style={{ width: `${poin}%` }} />
                        </div>
                    </div>
                    <Link
                        href={route('my-sunnah.index')}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(16,185,129,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        Isi Checklist <Icon icon="lucide:arrow-right" className="text-sm" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
