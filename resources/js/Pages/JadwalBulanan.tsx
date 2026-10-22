import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent } from 'react';
import { Guru } from '@/types';

interface JadwalSession {
    id: number;
    jam_mulai: string;
    jam_selesai: string;
    mapel: string;
    jumlah_sesi: number;
    lokasi: string;
    transport: string;
    guru: { nama: string; kode_grade: string; jenjang: string };
}

interface JadwalGroup {
    tanggal: string;
    hari_label: string;
    tanggal_label: string;
    total_sesi: number;
    sessions: JadwalSession[];
}

interface JadwalBulananProps {
    groups: JadwalGroup[];
    bulan: string;
    totalSesiBulan: number;
    availableMonths: string[];
    gurus: Guru[] | null;
    filters?: { filter_guru?: string | number; filter_mapel?: string };
    role: 'admin' | 'guru';
}

const mapelBadge: Record<string, 'info' | 'success' | 'warning'> = {
    IPA: 'success',
    MTK: 'warning',
};

const mapelIcon: Record<string, string> = {
    IPA: 'lucide:flask-conical',
    MTK: 'lucide:calculator',
};

function shiftMonth(key: string, delta: number): string {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export default function JadwalBulanan({ groups, bulan, totalSesiBulan, availableMonths, gurus, filters, role }: JadwalBulananProps) {
    const isAdmin = role === 'admin';
    const todayKey = new Date().toISOString().slice(0, 10);

    const applyParams = (params: { bulan: string; filter_guru?: number | string | undefined; filter_mapel?: string | undefined }) => {
        router.get(route('jadwal.bulanan'), params, { preserveState: true, preserveScroll: true });
    };

    const handleMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        applyParams({ bulan: e.target.value, filter_guru: filters?.filter_guru || undefined, filter_mapel: filters?.filter_mapel || undefined });
    };

    const handleGuruFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyParams({ bulan, filter_guru: e.target.value || undefined, filter_mapel: filters?.filter_mapel || undefined });
    };

    const handleMapelFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyParams({ bulan, filter_guru: filters?.filter_guru || undefined, filter_mapel: e.target.value || undefined });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Jadwal Bulanan" />

            <div className="animate-fade-in page-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Jadwal Bulanan</h1>
                    <p className="page-subtitle">
                        {isAdmin
                            ? 'Jadwal mengajar seluruh guru per bulan — gunakan filter untuk menyaring'
                            : 'Jadwal mengajar Anda pada bulan yang dipilih'}
                    </p>
                </div>

                {/* Navigasi bulan */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button variant="secondary" size="icon" onClick={() => applyParams({ bulan: shiftMonth(bulan, -1), filter_guru: filters?.filter_guru || undefined, filter_mapel: filters?.filter_mapel || undefined })} title="Bulan sebelumnya">
                        <Icon icon="lucide:chevron-left" />
                    </Button>
                    <div className="relative">
                        <Icon icon="lucide:calendar" className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                        <input
                            type="month"
                            value={bulan}
                            onChange={handleMonthInput}
                            className="input-modern pl-10 cursor-pointer min-w-[170px]"
                            aria-label="Pilih bulan"
                        />
                    </div>
                    <Button variant="secondary" size="icon" onClick={() => applyParams({ bulan: shiftMonth(bulan, 1), filter_guru: filters?.filter_guru || undefined, filter_mapel: filters?.filter_mapel || undefined })} title="Bulan berikutnya">
                        <Icon icon="lucide:chevron-right" />
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Ringkasan + filter */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-1 !p-0">
                        <div className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white h-full min-h-[120px] flex flex-col justify-center">
                            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10" />
                            <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-white/5" />
                            <div className="relative">
                                <div className="flex items-center gap-2 text-[12px] font-semibold text-indigo-100 uppercase tracking-wider">
                                    <Icon icon="lucide:calendar-check" className="text-base" />
                                    Total Sesi — {monthLabel(bulan)}
                                </div>
                                <p className="text-3xl font-extrabold mt-2 tracking-tight">{totalSesiBulan}</p>
                                <p className="text-[12.5px] text-indigo-100 mt-1">
                                    {totalSesiBulan > 0 ? `${groups.length} hari mengajar pada bulan ini` : 'Tidak ada jadwal pada bulan ini'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {isAdmin && (
                        <Card className="lg:col-span-2" description="Saring jadwal berdasarkan guru atau mata pelajaran">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="filter_guru" className="block text-[12.5px] font-semibold tracking-[-0.01em] text-slate-700">
                                        Guru
                                    </label>
                                    <select id="filter_guru" value={filters?.filter_guru ?? ''} onChange={handleGuruFilter} className="select-modern cursor-pointer">
                                        <option value="">Semua Guru</option>
                                        {(gurus ?? []).map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="filter_mapel" className="block text-[12.5px] font-semibold tracking-[-0.01em] text-slate-700">
                                        Mata Pelajaran
                                    </label>
                                    <select id="filter_mapel" value={filters?.filter_mapel ?? ''} onChange={handleMapelFilter} className="select-modern cursor-pointer">
                                        <option value="">Semua Mapel</option>
                                        <option value="IPA">IPA</option>
                                        <option value="MTK">MTK</option>
                                    </select>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Bulan-bulan yang memiliki jadwal */}
                {availableMonths.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-500 mr-1">Loncat ke:</span>
                        {availableMonths.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => applyParams({ bulan: m, filter_guru: filters?.filter_guru || undefined, filter_mapel: filters?.filter_mapel || undefined })}
                                className={`px-3 py-1.5 text-[12px] font-semibold rounded-full transition-all ${
                                    m === bulan
                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50'
                                }`}
                            >
                                {monthLabel(m)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grup per tanggal */}
                {groups.length > 0 ? (
                    <div className="space-y-4">
                        {groups.map((group) => {
                            const isToday = group.tanggal === todayKey;
                            return (
                                <Card key={group.tanggal} className={isToday ? 'ring-2 ring-indigo-400/60' : ''}>
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/70">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex flex-col items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                <span className="text-[15px] font-extrabold leading-none">{group.tanggal.slice(8, 10)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-slate-900 text-sm leading-5">{group.tanggal_label}</p>
                                                    {isToday && <Badge variant="neutral" size="sm">Hari Ini</Badge>}
                                                </div>
                                                <p className="text-[12px] text-slate-500 font-medium">{group.hari_label}</p>
                                            </div>
                                        </div>
                                        <Badge variant="info">{group.total_sesi} Sesi</Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {group.sessions.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-200/70 bg-gradient-to-r from-white to-indigo-50/30 hover:border-indigo-200 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 sm:w-56 shrink-0">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                                        <Icon icon="lucide:clock" className="text-base" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-900 leading-4">
                                                            {s.jam_mulai} – {s.jam_selesai}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-semibold">{s.jumlah_sesi} sesi</p>
                                                    </div>
                                                </div>

                                                <div className="hidden sm:block w-px self-stretch bg-slate-200/80 shrink-0" />

                                                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                                    <Badge variant={mapelBadge[s.mapel] ?? 'info'} size="sm">
                                                        <Icon icon={mapelIcon[s.mapel] ?? 'lucide:book'} className="text-[11px]" />
                                                        {s.mapel}
                                                    </Badge>
                                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600 font-medium min-w-0">
                                                        <Icon icon="lucide:map-pin" className="text-indigo-400 shrink-0" />
                                                        <span className="truncate">{s.lokasi}</span>
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500">
                                                        <Icon icon="lucide:car-front" className="text-slate-400 shrink-0" />
                                                        {s.transport}
                                                    </span>
                                                    {isAdmin && (
                                                        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-700 font-semibold min-w-0">
                                                            <Icon icon="lucide:user" className="text-violet-500 shrink-0" />
                                                            <span className="truncate">{s.guru.nama}</span>
                                                            <span className="text-[11px] text-slate-400 font-medium shrink-0">({s.guru.kode_grade})</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <div className="text-center py-14 px-4">
                            <div className="empty-state-icon">
                                <Icon icon="lucide:calendar-x" className="text-2xl" />
                            </div>
                            <p className="text-[14px] font-bold text-slate-900">Tidak ada jadwal mengajar</p>
                            <p className="text-[12.5px] text-slate-500 mt-1">
                                Belum ada sesi mengajar pada {monthLabel(bulan)}
                                {isAdmin && (filters?.filter_guru || filters?.filter_mapel) ? ' dengan filter yang dipilih.' : '.'}
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
