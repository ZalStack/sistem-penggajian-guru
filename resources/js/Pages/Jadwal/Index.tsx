import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Card } from '@/Components/ui/card';
import Button from '@/Components/ui/button';
import Select from '@/Components/ui/select';
import EmptyState from '@/Components/ui/empty-state';
import { Program, Guru, SessionStatus } from '@/types';

interface ScheduleSession {
    id: number;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_sesi: number;
    mapel: 'IPA' | 'MTK';
    status: SessionStatus;
    program: string | null;
    lokasi: string;
    transport: string;
    guru: { nama: string; kode_grade: string };
}

interface ScheduleDay {
    tanggal: string;
    hari: string;
    hari_singkat: string;
    tanggal_label: string;
    is_today: boolean;
    is_weekend: boolean;
    total_sesi: number;
    jumlah_guru: number | null;
    kosong: boolean;
    sessions: ScheduleSession[];
}

interface JadwalIndexProps {
    days: ScheduleDay[];
    minggu: { mulai: string; selesai: string; label: string };
    hariIni: string;
    rekapMinggu: { total_sesi: number; total_guru: number | null; hari_aktif: number };
    gurus: Guru[] | null;
    programs: Program[];
    filters: {
        filter_guru?: string;
        filter_program?: string;
    };
    role: 'admin' | 'guru';
}

export default function JadwalIndex({ days, minggu, hariIni, rekapMinggu, gurus, programs, filters, role }: JadwalIndexProps) {
    const [filterGuru, setFilterGuru] = useState(filters.filter_guru ?? '');
    const [filterProgram, setFilterProgram] = useState(filters.filter_program ?? '');

    const navigateWeek = (direction: -1 | 0 | 1) => {
        const current = new Date(minggu.mulai + 'T00:00:00');
        if (direction !== 0) {
            current.setDate(current.getDate() + direction * 7);
        }
        const target = direction === 0 ? hariIni : current.toISOString().slice(0, 10);

        router.get(
            route('jadwal.index'),
            { minggu: target, filter_guru: filterGuru, filter_program: filterProgram },
            { preserveState: true, preserveScroll: true }
        );
    };

    const applyFilters = (next: { guru?: string; program?: string }) => {
        const g = next.guru ?? filterGuru;
        const p = next.program ?? filterProgram;
        router.get(
            route('jadwal.index'),
            { minggu: minggu.mulai, filter_guru: g, filter_program: p },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Jadwal Mengajar" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="page-title">Jadwal Mengajar</h1>
                            <p className="page-subtitle mt-1">
                                {role === 'admin'
                                    ? 'Kalender jadwal mengajar seluruh guru minggu ini.'
                                    : 'Kalender jadwal mengajar Anda minggu ini.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)} aria-label="Minggu sebelumnya">
                                <Icon icon="tabler:chevron-left" className="text-[16px]" />
                                <span className="hidden sm:inline">Sebelumnya</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigateWeek(0)}>
                                Minggu Ini
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigateWeek(1)} aria-label="Minggu berikutnya">
                                <span className="hidden sm:inline">Berikutnya</span>
                                <Icon icon="tabler:chevron-right" className="text-[16px]" />
                            </Button>
                        </div>
                    </div>

                    {/* Pintasan / Catatan ke Menu Sesi Mengajar */}
                    {role === 'admin' && (
                        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Icon icon="tabler:calendar-time" className="text-[20px]" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Kalender Penjadwalan Murni</p>
                                    <p className="text-xs text-slate-500">
                                        Untuk mengelola status presensi aktual (Dijadwalkan / Berlangsung / Selesai) atau ubah data sesi →
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('session.index')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto"
                            >
                                <Icon icon="tabler:list-check" className="text-[16px]" />
                                Buka Menu Sesi Mengajar →
                            </Link>
                        </div>
                    )}

                    {/* Ringkasan minggu */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <Card className="p-4">
                            <p className="text-[11.5px] font-[600] uppercase tracking-wider text-slate-400">Periode</p>
                            <p className="text-[14px] font-[700] text-slate-900 mt-1.5 leading-snug">{minggu.label}</p>
                        </Card>
                        <Card className="p-4">
                            <p className="text-[11.5px] font-[600] uppercase tracking-wider text-slate-400">Total Sesi</p>
                            <p className="text-[22px] font-[800] tracking-tight text-slate-900 mt-1">{rekapMinggu.total_sesi}</p>
                        </Card>
                        <Card className="p-4">
                            <p className="text-[11.5px] font-[600] uppercase tracking-wider text-slate-400">
                                {role === 'admin' ? 'Guru Terjadwal' : 'Hari Aktif'}
                            </p>
                            <p className="text-[22px] font-[800] tracking-tight text-slate-900 mt-1">
                                {role === 'admin' ? rekapMinggu.total_guru ?? 0 : rekapMinggu.hari_aktif}
                            </p>
                        </Card>
                    </div>

                    {/* Filter (admin) */}
                    {role === 'admin' && (
                        <Card className="p-4 sm:p-5 mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    id="filter-guru"
                                    label="Guru"
                                    value={filterGuru}
                                    onChange={(e) => {
                                        setFilterGuru(e.target.value);
                                        applyFilters({ guru: e.target.value });
                                    }}
                                    placeholder="Semua guru"
                                    options={(gurus ?? []).map((g) => ({ value: g.id, label: g.nama }))}
                                />
                                <Select
                                    id="filter-program"
                                    label="Program / Kelas"
                                    value={filterProgram}
                                    onChange={(e) => {
                                        setFilterProgram(e.target.value);
                                        applyFilters({ program: e.target.value });
                                    }}
                                    placeholder="Semua program"
                                    options={programs.map((p) => ({ value: p.id, label: p.nama }))}
                                />
                            </div>
                        </Card>
                    )}

                    {/* Grid 7 hari — desktop */}
                    <div className="hidden lg:grid grid-cols-7 gap-3">
                        {days.map((day) => (
                            <div
                                key={day.tanggal}
                                className={`rounded-2xl border flex flex-col min-h-[280px] ${
                                    day.is_today
                                        ? 'border-indigo-300 bg-indigo-50/40 shadow-brand'
                                        : day.is_weekend
                                          ? 'border-slate-200 bg-slate-50/60'
                                          : 'border-slate-200 bg-white'
                                }`}
                            >
                                <div className={`px-3 py-2.5 border-b ${day.is_today ? 'border-indigo-200' : 'border-slate-100'}`}>
                                    <p className={`text-[11px] font-[700] uppercase tracking-wider ${day.is_today ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {day.hari_singkat}
                                    </p>
                                    <p className={`text-[15px] font-[800] tracking-tight ${day.is_today ? 'text-indigo-700' : 'text-slate-900'}`}>
                                        {day.tanggal_label}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10.5px] font-[600] text-slate-500">{day.total_sesi} sesi</span>
                                        {role === 'admin' && day.jumlah_guru !== null && (
                                            <span className="text-[10.5px] font-[600] text-slate-500">· {day.jumlah_guru} guru</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                                    {day.sessions.length === 0 ? (
                                        <p className="text-[11.5px] text-slate-400 font-[500] text-center py-4">Tidak ada sesi</p>
                                    ) : (
                                        day.sessions.map((s) => (
                                            <div
                                                key={s.id}
                                                className={`rounded-xl border p-2.5 space-y-1.5 ${
                                                    s.status === 'dibatalkan'
                                                        ? 'border-slate-200 bg-slate-50 opacity-60'
                                                        : 'border-slate-200 bg-white shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[11px] font-[700] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                                                        {s.jam_mulai}–{s.jam_selesai}
                                                    </span>
                                                    <span className="text-[10.5px] font-[600] text-slate-500">
                                                        {s.jumlah_sesi} sesi
                                                    </span>
                                                </div>
                                                <p className="text-[12px] font-[700] text-slate-900 leading-snug">
                                                    {s.program ?? s.mapel}
                                                </p>
                                                <p className="text-[11px] text-slate-500 leading-snug">{s.lokasi}</p>
                                                {role === 'admin' && (
                                                    <p className="text-[11px] text-slate-600 font-[600] leading-snug">
                                                        {s.guru.nama}
                                                        {s.guru.kode_grade !== '-' && (
                                                            <span className="text-slate-400 font-[500]"> ({s.guru.kode_grade})</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Daftar per hari — tablet & mobile */}
                    <div className="space-y-4 lg:hidden">
                        {days.map((day) => (
                            <Card key={day.tanggal} className={`overflow-hidden ${day.is_today ? 'ring-2 ring-indigo-200' : ''}`}>
                                <div className={`px-4 py-3 flex items-center justify-between border-b ${day.is_today ? 'bg-indigo-50/60 border-indigo-100' : 'border-slate-100'}`}>
                                    <div>
                                        <p className={`text-[12px] font-[700] uppercase tracking-wider ${day.is_today ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {day.hari}{day.is_today && ' · Hari ini'}
                                        </p>
                                        <p className={`text-[15px] font-[800] tracking-tight ${day.is_today ? 'text-indigo-700' : 'text-slate-900'}`}>
                                            {day.tanggal_label}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-[700] text-slate-900">{day.total_sesi} sesi</p>
                                        {role === 'admin' && day.jumlah_guru !== null && (
                                            <p className="text-[11px] font-[600] text-slate-500">{day.jumlah_guru} guru</p>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {day.sessions.length === 0 ? (
                                        <p className="text-[12.5px] text-slate-400 font-[500] text-center py-6">Tidak ada sesi</p>
                                    ) : (
                                        day.sessions.map((s) => (
                                            <div key={s.id} className="p-4 space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[12px] font-[700] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/80">
                                                        {s.jam_mulai}–{s.jam_selesai}
                                                    </span>
                                                    <span className="text-[11.5px] font-[600] text-slate-500">
                                                        {s.jumlah_sesi} sesi
                                                    </span>
                                                </div>
                                                <p className="text-[13.5px] font-[700] text-slate-900">
                                                    {s.program ?? s.mapel}
                                                </p>
                                                <p className="text-[12.5px] text-slate-500">{s.lokasi}</p>
                                                {role === 'admin' && (
                                                    <p className="text-[12.5px] font-[600] text-slate-600">
                                                        {s.guru.nama}
                                                        {s.guru.kode_grade !== '-' && ` (${s.guru.kode_grade})`}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    {days.every((d) => d.sessions.length === 0) && (
                        <Card className="mt-6">
                            <EmptyState
                                icon="tabler:calendar-x"
                                title="Tidak ada jadwal minggu ini"
                                description={
                                    filters.filter_guru || filters.filter_program
                                        ? 'Tidak ada sesi yang cocok dengan filter yang dipilih.'
                                        : 'Belum ada sesi mengajar yang dijadwalkan pada minggu ini.'
                                }
                            />
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
