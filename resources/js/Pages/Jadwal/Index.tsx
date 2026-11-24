import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';
import { Card } from '@/Components/ui/card';
import Button from '@/Components/ui/button';
import Select from '@/Components/ui/select';
import EmptyState from '@/Components/ui/empty-state';
import Modal from '@/Components/ui/modal';
import { Program, Guru, SessionStatus } from '@/types';
import { programStyle, ProgramStyle } from '@/lib/program-colors';

interface ScheduleAttendance {
    id: number;
    checkin_time: string | null;
    checkout_time: string | null;
    status: string;
}

interface ScheduleSession {
    id: number;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_sesi: number;
    mapel: 'IPA' | 'MTK';
    pekan?: number | null;
    kelas?: string | null;
    level?: string | null;
    bahan_ajar?: string | null;
    catatan?: string | null;
    status: SessionStatus;
    program: string | null;
    program_id?: number | null;
    program_slug?: string | null;
    lokasi: string;
    lokasi_alamat?: string | null;
    transport: string;
    transport_biaya?: number | null;
    guru: {
        id?: number;
        nama: string;
        kode_grade: string;
        nama_grade?: string;
        no_hp?: string | null;
    };
    attendances?: ScheduleAttendance[];
}

interface ScheduleDay {
    tanggal: string;
    hari: string;
    hari_singkat: string;
    tanggal_label: string;
    tanggal_lengkap?: string;
    is_today: boolean;
    is_selected?: boolean;
    is_weekend: boolean;
    total_sesi: number;
    jumlah_guru: number | null;
    kosong: boolean;
    sessions: ScheduleSession[];
}

interface DayRecap {
    tanggal: string;
    hari: string;
    hari_singkat: string;
    tanggal_label: string;
    label_lengkap: string;
    is_today: boolean;
    total_sesi: number;
    total_jadwal: number;
    total_guru: number;
    total_program: number;
    jam_terawal: string;
    jam_terakhir: string;
}

interface JadwalIndexProps {
    days: ScheduleDay[];
    selectedTanggal: string;
    rekapHari?: DayRecap;
    prevTanggal?: string;
    nextTanggal?: string;
    minggu: { mulai: string; selesai: string; label: string };
    hariIni: string;
    rekapMinggu: { total_sesi: number; total_guru: number | null; hari_aktif: number };
    gurus: Guru[] | null;
    programs: Program[];
    filters: {
        tanggal?: string;
        minggu?: string;
        filter_hari?: string;
        filter_guru?: string;
        filter_program?: string;
        filter_status?: string;
    };
    role: 'admin' | 'guru';
}

const HARI_OPTIONS = [
    { value: '', label: 'Semua Hari (Pilih Bebas)' },
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
    { value: 'minggu', label: 'Minggu' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

export default function JadwalIndex({
    days,
    selectedTanggal,
    rekapHari,
    prevTanggal,
    nextTanggal,
    minggu,
    hariIni,
    rekapMinggu,
    gurus,
    programs,
    filters,
    role,
}: JadwalIndexProps) {
    const [activeDate, setActiveDate] = useState<string>(selectedTanggal || filters.tanggal || hariIni);
    const [filterGuru, setFilterGuru] = useState<string>(filters.filter_guru ?? '');
    const [filterProgram, setFilterProgram] = useState<string>(filters.filter_program ?? '');
    const [filterHari, setFilterHari] = useState<string>(filters.filter_hari ?? '');
    const [filterStatus, setFilterStatus] = useState<string>(filters.filter_status ?? '');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);

    // Ambil data hari aktif dari array `days`
    const activeDayData = useMemo(() => {
        return days.find((d) => d.tanggal === activeDate) || days[0];
    }, [days, activeDate]);

    // Cari hari lain di pekan ini yang memiliki jadwal jika hari aktif kosong
    const otherDayWithSessions = useMemo(() => {
        return days.find((d) => d.total_sesi > 0 && d.tanggal !== activeDate);
    }, [days, activeDate]);

    // Urutan sesi per jam di hari tersebut
    const filteredActiveSessions = useMemo(() => {
        if (!activeDayData?.sessions) return [];

        let result = [...activeDayData.sessions];

        if (filterStatus) {
            result = result.filter((s) => s.status === filterStatus);
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (s) =>
                    s.guru.nama.toLowerCase().includes(q) ||
                    s.mapel.toLowerCase().includes(q) ||
                    (s.program && s.program.toLowerCase().includes(q)) ||
                    s.lokasi.toLowerCase().includes(q) ||
                    (s.bahan_ajar && s.bahan_ajar.toLowerCase().includes(q)) ||
                    (s.catatan && s.catatan.toLowerCase().includes(q))
            );
        }

        // Urutkan kronologis per jam_mulai, lalu jam_selesai
        return result.sort((a, b) => {
            const cmp = a.jam_mulai.localeCompare(b.jam_mulai);
            if (cmp !== 0) return cmp;
            return a.jam_selesai.localeCompare(b.jam_selesai);
        });
    }, [activeDayData, filterStatus, searchQuery]);

    // Navigasi Tanggal
    const navigateDate = (targetDate: string) => {
        setActiveDate(targetDate);
        router.get(
            route('jadwal.index'),
            {
                tanggal: targetDate,
                filter_guru: filterGuru,
                filter_program: filterProgram,
                filter_hari: filterHari,
                filter_status: filterStatus,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePrevDay = () => {
        if (prevTanggal) {
            navigateDate(prevTanggal);
        } else {
            const prev = new Date(activeDate + 'T00:00:00');
            prev.setDate(prev.getDate() - 1);
            navigateDate(prev.toISOString().slice(0, 10));
        }
    };

    const handleNextDay = () => {
        if (nextTanggal) {
            navigateDate(nextTanggal);
        } else {
            const next = new Date(activeDate + 'T00:00:00');
            next.setDate(next.getDate() + 1);
            navigateDate(next.toISOString().slice(0, 10));
        }
    };

    const handleToday = () => {
        navigateDate(hariIni);
    };

    // Filter server
    const applyServerFilters = (updated: {
        guru?: string;
        program?: string;
        hari?: string;
        status?: string;
        tanggal?: string;
    }) => {
        const g = updated.guru !== undefined ? updated.guru : filterGuru;
        const p = updated.program !== undefined ? updated.program : filterProgram;
        const h = updated.hari !== undefined ? updated.hari : filterHari;
        const s = updated.status !== undefined ? updated.status : filterStatus;
        const t = updated.tanggal !== undefined ? updated.tanggal : activeDate;

        router.get(
            route('jadwal.index'),
            {
                tanggal: t,
                filter_guru: g,
                filter_program: p,
                filter_hari: h,
                filter_status: s,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const resetFilters = () => {
        setFilterGuru('');
        setFilterProgram('');
        setFilterHari('');
        setFilterStatus('');
        setSearchQuery('');
        router.get(
            route('jadwal.index'),
            { tanggal: activeDate },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Auto-polling realtime setiap 5 detik agar jadwal mengajar selalu sinkron
    useEffect(() => {
        const interval = setInterval(() => {
            if (!selectedSession) {
                router.reload({
                    only: ['days', 'sessions', 'activeDayData', 'otherDayWithSessions', 'rekapPekan'],
                });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedSession]);

    const hasActiveFilters = Boolean(filterGuru || filterProgram || filterHari || filterStatus || searchQuery);

    // Format badge status
    const renderStatusBadge = (status: SessionStatus) => {
        switch (status) {
            case 'berlangsung':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-[700] bg-amber-50 text-amber-800 ring-1 ring-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Berlangsung
                    </span>
                );
            case 'selesai':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-[700] bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300">
                        <Icon icon="tabler:check" className="text-sm text-emerald-600" />
                        Selesai
                    </span>
                );
            case 'dibatalkan':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-[700] bg-rose-50 text-rose-800 ring-1 ring-rose-300">
                        <Icon icon="tabler:x" className="text-sm text-rose-600" />
                        Dibatalkan
                    </span>
                );
            case 'dijadwalkan':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-[700] bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                        <Icon icon="tabler:clock" className="text-sm text-slate-500" />
                        Dijadwalkan
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Jadwal Mengajar Guru" />

            <div className="w-full space-y-6 pb-16">
                {/* 1. Header Halaman */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="page-title text-2xl font-[800] text-slate-900 tracking-tight">
                                Jadwal Mengajar Guru
                            </h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-[700] bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {role === 'admin' ? 'Akses Admin' : 'Jadwal Saya'}
                            </span>
                        </div>
                        <p className="page-subtitle text-xs sm:text-sm text-slate-500 mt-1">
                            {role === 'admin'
                                ? 'Tampilan single card per jadwal guru di hari/tanggal tersebut, diurutkan kronologis per jam.'
                                : 'Jadwal mengajar Anda hari ini.'}
                        </p>
                    </div>

                    {role === 'admin' && (
                        <Link
                            href={route('session.index')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-[700] text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto"
                        >
                            <Icon icon="tabler:list-check" className="text-base" />
                            Menu Ploting Guru →
                        </Link>
                    )}
                </div>

                {/* 2. Hero Date Display & Next/Previous Day Navigation */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
                    {/* Baris Navigasi Tanggal Utama */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevDay}
                                className="px-3.5 py-2 font-[700] text-slate-700 hover:text-indigo-600 rounded-xl"
                                title="Hari Sebelumnya"
                            >
                                <Icon icon="tabler:chevron-left" className="text-lg" />
                                <span>Sebelumnya</span>
                            </Button>

                            <button
                                type="button"
                                onClick={handleToday}
                                className={`px-4 py-2 text-xs font-[700] rounded-xl transition-all ${
                                    activeDate === hariIni
                                        ? 'bg-brand-gradient text-white shadow-brand'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Hari Ini
                            </button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextDay}
                                className="px-3.5 py-2 font-[700] text-slate-700 hover:text-indigo-600 rounded-xl"
                                title="Hari Berikutnya"
                            >
                                <span>Berikutnya</span>
                                <Icon icon="tabler:chevron-right" className="text-lg" />
                            </Button>
                        </div>

                        {/* Judul Besar Hari & Tanggal (Sesuai Konsep Gambar Sketsa User) */}
                        <div className="text-center md:text-right">
                            <div className="flex items-center justify-center md:justify-end gap-2">
                                <h2 className="text-lg sm:text-2xl font-[900] tracking-tight text-slate-900 uppercase">
                                    {activeDayData?.hari ?? ''},{' '}
                                    <span className="text-indigo-600">{activeDayData?.tanggal_label ?? ''}</span>
                                </h2>
                                {activeDayData?.is_today && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-[800] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        HARI INI
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-[500] mt-0.5">
                                {activeDate} · Periode {minggu.label}
                            </p>
                        </div>

                        {/* Date Picker Input */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                            <label className="text-xs font-[700] text-slate-500 shrink-0">Pilih Tanggal:</label>
                            <input
                                type="date"
                                value={activeDate}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        navigateDate(e.target.value);
                                    }
                                }}
                                className="h-[38px] px-3 py-1 text-xs font-[700] text-slate-800 bg-white border border-slate-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                title="Pilih tanggal di kalender"
                            />
                        </div>
                    </div>

                    {/* Quick Day Tabs (Senin – Minggu) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-[700] uppercase tracking-wider text-slate-400">
                                Pilih Cepat Hari dalam Pekan Ini:
                            </span>
                            <span className="text-xs font-[600] text-slate-500">
                                Total {rekapMinggu.total_sesi} sesi terjadwal pekan ini
                            </span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {days.map((day) => {
                                const isSelected = day.tanggal === activeDate;
                                return (
                                    <button
                                        key={day.tanggal}
                                        type="button"
                                        onClick={() => navigateDate(day.tanggal)}
                                        className={`relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-brand ring-2 ring-indigo-500/30'
                                                : day.is_today
                                                  ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100'
                                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        {day.is_today && (
                                            <span
                                                className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                                                    isSelected ? 'bg-amber-300' : 'bg-indigo-600'
                                                }`}
                                                title="Hari Ini"
                                            />
                                        )}
                                        <span
                                            className={`text-[10px] sm:text-xs font-[700] uppercase tracking-wider ${
                                                isSelected ? 'text-indigo-100' : 'text-slate-400'
                                            }`}
                                        >
                                            {day.hari_singkat}
                                        </span>
                                        <span className="text-sm sm:text-base font-[800] mt-0.5 tracking-tight">
                                            {day.tanggal_label.split(' ')[0]}
                                        </span>
                                        <span
                                            className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-[700] ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : day.total_sesi > 0
                                                      ? 'bg-indigo-100 text-indigo-700'
                                                      : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {day.total_sesi > 0 ? `${day.total_sesi} sesi` : '0'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Ringkasan Statistik Hari Terpilih */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="p-4 border-l-4 border-l-indigo-600">
                        <p className="text-xs font-[700] uppercase tracking-wider text-slate-400">Total Jadwal Hari Ini</p>
                        <p className="text-2xl font-[900] tracking-tight text-slate-900 mt-1">
                            {filteredActiveSessions.length}
                            <span className="text-xs font-[600] text-slate-500 ml-1.5">Kartu Jadwal</span>
                        </p>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-violet-600">
                        <p className="text-xs font-[700] uppercase tracking-wider text-slate-400">Total Sesi Mengajar</p>
                        <p className="text-2xl font-[900] tracking-tight text-slate-900 mt-1">
                            {activeDayData?.total_sesi ?? 0}
                            <span className="text-xs font-[600] text-slate-500 ml-1.5">Sesi</span>
                        </p>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-sky-600">
                        <p className="text-xs font-[700] uppercase tracking-wider text-slate-400">Guru Terjadwal</p>
                        <p className="text-2xl font-[900] tracking-tight text-slate-900 mt-1">
                            {role === 'admin' ? activeDayData?.jumlah_guru ?? 0 : '1 Guru'}
                            {role === 'admin' && <span className="text-xs font-[600] text-slate-500 ml-1.5">Guru Aktif</span>}
                        </p>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-amber-500">
                        <p className="text-xs font-[700] uppercase tracking-wider text-slate-400">Rentang Waktu</p>
                        <p className="text-lg font-[800] text-slate-900 mt-1 truncate">
                            {rekapHari && rekapHari.jam_terawal !== '-'
                                ? `${rekapHari.jam_terawal} – ${rekapHari.jam_terakhir} WIB`
                                : '-'}
                        </p>
                    </Card>
                </div>

                {/* 4. Filter Administrasi (Guru, Program, Hari, Status, Search) */}
                <Card className="p-4 sm:p-5">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:filter" className="text-indigo-600 text-lg" />
                            <h2 className="text-sm font-[700] text-slate-900">Filter Jadwal Mengajar</h2>
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs font-[700] text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
                            >
                                <Icon icon="tabler:rotate-2" className="text-sm" />
                                Reset Filter
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {role === 'admin' ? (
                            <Select
                                id="filter-guru"
                                label="Filter Guru"
                                value={filterGuru}
                                onChange={(e) => {
                                    setFilterGuru(e.target.value);
                                    applyServerFilters({ guru: e.target.value });
                                }}
                                placeholder="Semua Guru"
                                options={(gurus ?? []).map((g) => ({ value: g.id, label: g.nama }))}
                            />
                        ) : (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">Akun Pengajar</label>
                                <div className="h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-[600] text-slate-700 flex items-center gap-2">
                                    <Icon icon="tabler:user" className="text-slate-400 text-base" />
                                    <span>Jadwal Anda Sendiri</span>
                                </div>
                            </div>
                        )}

                        <Select
                            id="filter-program"
                            label="Filter Program / Kelas"
                            value={filterProgram}
                            onChange={(e) => {
                                setFilterProgram(e.target.value);
                                applyServerFilters({ program: e.target.value });
                            }}
                            placeholder="Semua Program"
                            options={programs.map((p) => ({ value: p.id, label: p.nama }))}
                        />

                        <Select
                            id="filter-hari"
                            label="Filter Hari"
                            value={filterHari}
                            onChange={(e) => {
                                setFilterHari(e.target.value);
                                applyServerFilters({ hari: e.target.value });
                            }}
                            options={HARI_OPTIONS}
                        />

                        <Select
                            id="filter-status"
                            label="Filter Status"
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                applyServerFilters({ status: e.target.value });
                            }}
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Icon icon="tabler:search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                            <input
                                type="text"
                                placeholder="Pencarian cepat: cari nama guru, bidang, materi ajar, atau lokasi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs font-[500] text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <Icon icon="tabler:x" className="text-sm" />
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1.5">
                            <Icon icon="tabler:info-circle" className="text-indigo-500 text-sm" />
                            <span>Klik kartu jadwal untuk melihat detail lengkap</span>
                        </p>
                    </div>
                </Card>

                {/* 5. Legenda Warna Border Program (Sesuai Permintaan User: Warna Border Beda Tiap Program) */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 sm:px-4 sm:py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <span className="font-[800] text-slate-600 uppercase tracking-wider text-[11px]">
                        Petunjuk Warna Border Program:
                    </span>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-md border-2 border-violet-500 bg-violet-100" />
                            <span className="font-[700] text-slate-800">Kelas Khusus</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-md border-2 border-sky-500 bg-sky-100" />
                            <span className="font-[700] text-slate-800">Reguler Bogor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-md border-2 border-amber-500 bg-amber-100" />
                            <span className="font-[700] text-slate-800">Reguler Lainnya</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-md border-2 border-emerald-500 bg-emerald-100" />
                            <span className="font-[700] text-slate-800">Kelas Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-md border-2 border-rose-500 bg-rose-100" />
                            <span className="font-[700] text-slate-800">Olimpiade</span>
                        </div>
                    </div>
                </div>

                {/* 6. TAMPILAN UTAMA: GRID OF SINGLE CARDS PER JADWAL GURU (DIURUTKAN PER JAM) */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-[800] text-sm border border-indigo-100">
                                <Icon icon="tabler:layout-cards" className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-[900] text-slate-900 tracking-tight uppercase">
                                    {activeDayData?.hari ?? ''}, {activeDayData?.tanggal_label ?? ''}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Urutan kartu kronologis per jam mengajar
                                </p>
                            </div>
                        </div>
                        <div className="text-xs font-[700] text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
                            Menampilkan <span className="text-indigo-600 font-[900]">{filteredActiveSessions.length}</span> jadwal guru
                        </div>
                    </div>

                    {filteredActiveSessions.length === 0 ? (
                        <Card className="p-8 sm:p-12 text-center">
                            <EmptyState
                                icon="tabler:calendar-off"
                                title={`Tidak Ada Jadwal pada ${activeDayData?.hari ?? ''}, ${activeDayData?.tanggal_label ?? ''}`}
                                description={
                                    hasActiveFilters
                                        ? 'Tidak ditemukan jadwal mengajar yang sesuai dengan filter atau kata kunci yang dipilih.'
                                        : 'Belum ada sesi mengajar yang dijadwalkan pada hari ini.'
                                }
                                action={
                                    hasActiveFilters ? (
                                        <Button variant="outline" size="sm" onClick={resetFilters}>
                                            Reset Filter
                                        </Button>
                                    ) : otherDayWithSessions ? (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => navigateDate(otherDayWithSessions.tanggal)}
                                            className="mt-2"
                                        >
                                            <Icon icon="tabler:calendar-check" className="text-base" />
                                            <span>
                                                Buka Jadwal: {otherDayWithSessions.hari}, {otherDayWithSessions.tanggal_label} ({otherDayWithSessions.total_sesi} Sesi) →
                                            </span>
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </Card>
                    ) : (
                        /* GRID KARTU TUNGGAL (SEPERTI GAMBAR SKETSA USER) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {filteredActiveSessions.map((session) => {
                                const style: ProgramStyle = programStyle(session.program);

                                return (
                                    <div
                                        key={session.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedSession(session)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedSession(session);
                                            }
                                        }}
                                        className={`group relative rounded-2xl bg-white ${style.border} ${style.borderHover} p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/20`}
                                    >
                                        {/* Bagian Atas: Waktu & Status */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-[800] bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    <Icon icon="tabler:clock" className="text-sm text-indigo-600" />
                                                    <span>{session.jam_mulai} – {session.jam_selesai} WIB</span>
                                                </div>
                                                <span className="text-[11px] font-[800] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {session.jumlah_sesi} Sesi
                                                </span>
                                            </div>

                                            {/* Status Sesi & Badge Program */}
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-[800] ring-1 ${style.badge}`}>
                                                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                                    {session.program ?? session.mapel}
                                                </span>
                                                {renderStatusBadge(session.status)}
                                            </div>

                                            {/* Data Guru */}
                                            <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-[800] text-sm flex items-center justify-center shrink-0 shadow-sm">
                                                    {session.guru.nama
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .slice(0, 2)
                                                        .join('')}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-[800] text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                        {session.guru.nama}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        {session.guru.kode_grade && session.guru.kode_grade !== '-' && (
                                                            <span className="text-[10px] font-[700] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                Grade {session.guru.kode_grade}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] font-[700] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                            Bidang: {session.mapel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detail Ruang & Transport */}
                                            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Icon icon="tabler:map-pin" className="text-slate-400 shrink-0 text-sm" />
                                                    <span className="truncate font-[600]">{session.lokasi}</span>
                                                </div>

                                                {session.transport && session.transport !== '-' && (
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Icon icon="tabler:car" className="text-slate-400 shrink-0 text-sm" />
                                                        <span>Transport: {session.transport}</span>
                                                    </div>
                                                )}

                                                {session.bahan_ajar && (
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Icon icon="tabler:book" className="text-slate-400 shrink-0 text-sm" />
                                                        <span className="truncate">{session.bahan_ajar}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bagian Bawah: Affordance Klik Detail */}
                                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-[700] text-indigo-600 group-hover:text-indigo-700">
                                            <span className="text-[11px] text-slate-400 font-[500]">
                                                {session.pekan ? `Pekan ke-${session.pekan}` : 'Sesi Terjadwal'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Lihat Detail
                                                <Icon icon="tabler:arrow-right" className="text-sm" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 7. MODAL DETAIL JADWAL MENGAJAR GURU (KETIKA KARTU DI-KLIK) */}
            <Modal
                show={Boolean(selectedSession)}
                onClose={() => setSelectedSession(null)}
                maxWidth="lg"
            >
                {selectedSession && (() => {
                    const style = programStyle(selectedSession.program);
                    return (
                        <div className="p-6 space-y-6">
                            {/* Header Modal */}
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-[800] ring-1 ${style.badge}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                        {selectedSession.program ?? selectedSession.mapel}
                                    </span>
                                    {renderStatusBadge(selectedSession.status)}
                                </div>
                                <h3 className="text-xl font-[900] text-slate-900 tracking-tight">
                                    Detail Jadwal Mengajar Guru
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-[600]">
                                    <Icon icon="tabler:calendar" className="text-indigo-600 text-sm" />
                                    <span>
                                        {activeDayData?.hari ?? ''}, {activeDayData?.tanggal_label ?? ''} ·{' '}
                                        {selectedSession.jam_mulai} – {selectedSession.jam_selesai} WIB
                                    </span>
                                </p>
                            </div>

                            {/* Section 1: Guru Pengajar */}
                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                <p className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 mb-2">
                                    Guru Pengajar
                                </p>
                                <div className="flex items-start gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-white font-[800] text-base flex items-center justify-center shrink-0 shadow-sm">
                                        {selectedSession.guru.nama
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-[800] text-slate-900">
                                            {selectedSession.guru.nama}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {selectedSession.guru.kode_grade && selectedSession.guru.kode_grade !== '-' && (
                                                <span className="text-xs font-[700] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                                    Grade {selectedSession.guru.kode_grade}
                                                    {selectedSession.guru.nama_grade ? ` · ${selectedSession.guru.nama_grade}` : ''}
                                                </span>
                                            )}
                                            <span className="text-xs font-[700] text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                Bidang: {selectedSession.mapel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Waktu, Lokasi & Ruang */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                        <Icon icon="tabler:clock" className="text-base" />
                                        <span className="text-xs font-[700] uppercase tracking-wider text-slate-400">
                                            Waktu & Durasi
                                        </span>
                                    </div>
                                    <p className="text-sm font-[800] text-slate-900">
                                        {selectedSession.jam_mulai} – {selectedSession.jam_selesai} WIB
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-[500]">
                                        Total {selectedSession.jumlah_sesi} Sesi Mengajar
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                        <Icon icon="tabler:map-pin" className="text-base" />
                                        <span className="text-xs font-[700] uppercase tracking-wider text-slate-400">
                                            Lokasi Mengajar
                                        </span>
                                    </div>
                                    <p className="text-sm font-[800] text-slate-900">{selectedSession.lokasi}</p>
                                    {selectedSession.lokasi_alamat && (
                                        <p className="text-xs text-slate-500 mt-0.5 font-[500] line-clamp-2">
                                            {selectedSession.lokasi_alamat}
                                        </p>
                                    )}
                                </div>

                                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                        <Icon icon="tabler:car" className="text-base" />
                                        <span className="text-xs font-[700] uppercase tracking-wider text-slate-400">
                                            Transportasi
                                        </span>
                                    </div>
                                    <p className="text-sm font-[800] text-slate-900">{selectedSession.transport}</p>
                                    {selectedSession.transport_biaya ? (
                                        <p className="text-xs text-slate-500 mt-0.5 font-[500]">
                                            Tarif: Rp {Number(selectedSession.transport_biaya).toLocaleString('id-ID')}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-400 mt-0.5 font-[500]">Standar program</p>
                                    )}
                                </div>

                                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                        <Icon icon="tabler:school" className="text-base" />
                                        <span className="text-xs font-[700] uppercase tracking-wider text-slate-400">
                                            Kelas / Pekan
                                        </span>
                                    </div>
                                    <p className="text-sm font-[800] text-slate-900">
                                        {selectedSession.kelas ? `Kelas ${selectedSession.kelas}` : 'Kelas Reguler'}
                                        {selectedSession.level ? ` (${selectedSession.level})` : ''}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-[500]">
                                        {selectedSession.pekan ? `Pertemuan Pekan ke-${selectedSession.pekan}` : 'Pekan Aktif'}
                                    </p>
                                </div>
                            </div>

                            {/* Section 3: Bahan Ajar & Catatan */}
                            {(selectedSession.bahan_ajar || selectedSession.catatan) && (
                                <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                    {selectedSession.bahan_ajar && (
                                        <div>
                                            <span className="font-[700] text-slate-700 block mb-0.5">
                                                Bahan Ajar / Topik Materi:
                                            </span>
                                            <p className="text-slate-600 leading-relaxed font-[500]">
                                                {selectedSession.bahan_ajar}
                                            </p>
                                        </div>
                                    )}
                                    {selectedSession.catatan && (
                                        <div className="pt-2 border-t border-slate-200">
                                            <span className="font-[700] text-slate-700 block mb-0.5">
                                                Catatan Sesi:
                                            </span>
                                            <p className="text-slate-600 leading-relaxed font-[500]">
                                                {selectedSession.catatan}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Section 4: Log Presensi Aktual */}
                            {selectedSession.attendances && selectedSession.attendances.length > 0 && (
                                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs">
                                    <div className="flex items-center gap-2 text-emerald-800 font-[700] mb-1.5">
                                        <Icon icon="tabler:checkup-list" className="text-base" />
                                        <span>Presensi Guru Terkait</span>
                                    </div>
                                    {selectedSession.attendances.map((att) => (
                                        <div key={att.id} className="flex items-center justify-between text-slate-700 py-1">
                                            <span>
                                                Check-in: <strong>{att.checkin_time ? `${att.checkin_time} WIB` : '-'}</strong> ·{' '}
                                                Check-out: <strong>{att.checkout_time ? `${att.checkout_time} WIB` : '-'}</strong>
                                            </span>
                                            <span className="capitalize font-[600] px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-700 text-[11px]">
                                                {att.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Footer Modal */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                {role === 'admin' && (
                                    <Link
                                        href={route('session.index')}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-[700] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                                    >
                                        <Icon icon="tabler:edit" className="text-sm" />
                                        Kelola di Menu Ploting
                                    </Link>
                                )}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedSession(null)}
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </AuthenticatedLayout>
    );
}
