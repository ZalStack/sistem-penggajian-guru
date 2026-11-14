import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { programStyle } from '@/lib/program-colors';
import { Grade, Program, Penggajian } from '@/types';
import type { RiwayatMengajarMap } from '@/types';
import { useState } from 'react';

interface LaporanProps {
    penggajians: Penggajian[];
    grandTotal: number;
    totalSesi: number;
    grades: Grade[];
    programs: Program[];
    riwayatMengajar: RiwayatMengajarMap;
    filters: {
        periode?: string;
        filter_grade?: string;
        filter_mapel?: string;
        filter_program?: string;
        search?: string;
    };
}

function buildQueryString(filters: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
    });
    return params.toString();
}

function formatNIP(id: number) {
    return `GUR-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

function terbilang(n: number): string {
    const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    const nominal = Math.round(Number(n) || 0);
    if (nominal <= 0) return 'Nol Rupiah';

    function convert(x: number): string {
        if (x < 12) return ' ' + bilangan[x];
        if (x < 20) return convert(x - 10) + ' Belas';
        if (x < 100) return convert(Math.floor(x / 10)) + ' Puluh' + convert(x % 10);
        if (x < 200) return ' Seratus' + convert(x - 100);
        if (x < 1000) return convert(Math.floor(x / 100)) + ' Ratus' + convert(x % 100);
        if (x < 2000) return ' Seribu' + convert(x - 1000);
        if (x < 1000000) return convert(Math.floor(x / 1000)) + ' Ribu' + convert(x % 1000);
        if (x < 1000000000) return convert(Math.floor(x / 1000000)) + ' Juta' + convert(x % 1000000);
        if (x < 1000000000000) return convert(Math.floor(x / 1000000000)) + ' Miliar' + convert(x % 1000000000);
        return convert(Math.floor(x / 1000000000000)) + ' Triliun' + convert(x % 1000000000000);
    }

    return convert(nominal).trim() + ' Rupiah';
}

const sessionStatusBadge: Record<string, { className: string; label: string }> = {
    dijadwalkan: { className: 'bg-blue-50 border border-blue-200 text-blue-700', label: 'Dijadwalkan' },
    berlangsung: { className: 'bg-amber-50 border border-amber-200 text-amber-700', label: 'Berlangsung' },
    selesai: { className: 'bg-emerald-50 border border-emerald-200 text-emerald-700', label: 'Selesai' },
    dibatalkan: { className: 'bg-rose-50 border border-rose-200 text-rose-700', label: 'Dibatalkan' },
};

export default function LaporanIndex({
    penggajians,
    grandTotal,
    totalSesi,
    grades,
    programs,
    riwayatMengajar,
    filters,
}: LaporanProps) {
    const qs = buildQueryString(filters as Record<string, string | undefined>);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedDetail, setSelectedDetail] = useState<Penggajian | null>(null);
    const riwayat = selectedDetail ? riwayatMengajar[selectedDetail.guru_id] : undefined;

    const updateFilter = (key: string, value: string) => {
        router.get(
            route('laporan.index'),
            { ...filters, [key]: value || undefined, search: search || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleSearch = () => {
        router.get(
            route('laporan.index'),
            { ...filters, search: search || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const resetFilters = () => {
        setSearch('');
        router.get(route('laporan.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilter = (key: string) => {
        const next = { ...filters };
        delete next[key as keyof typeof filters];
        if (key === 'search') setSearch('');
        router.get(route('laporan.index'), next, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleExportPdf = () => {
        window.location.href = route('laporan.exportPdf') + '?' + qs;
    };

    const handleExportExcel = () => {
        window.location.href = route('laporan.exportExcel') + '?' + qs;
    };

    const handlePrint = () => {
        window.print();
    };

    // Client-side search filter (fallback or refined UX)
    const filtered = search
        ? penggajians.filter((p) => {
              const q = search.toLowerCase();
              return (
                  p.guru?.nama?.toLowerCase().includes(q) ||
                  String(p.guru?.id).includes(q) ||
                  formatNIP(p.guru?.id ?? 0).toLowerCase().includes(q)
              );
          })
        : penggajians;

    const displayTotal = search ? filtered.reduce((s, p) => s + Number(p.total), 0) : grandTotal;
    const displaySesi = search ? filtered.reduce((s, p) => s + Number(p.jumlah_sesi), 0) : totalSesi;
    const displayHadir = filtered.reduce((s, p) => s + Number(p.jumlah_hadir || 0), 0);
    const displayJam = filtered.reduce((s, p) => s + Number(p.total_jam || 0), 0);
    const displayCount = filtered.length;

    const totalHonor = filtered.reduce((s, p) => s + Number(p.honor || 0), 0);
    const totalTunjangan = filtered.reduce((s, p) => s + Number(p.tunjangan_khusus || 0), 0);

    const avgHonor = displayCount > 0 ? Math.round(displayTotal / displayCount) : 0;
    const hadirPercentage = displaySesi > 0 ? Math.round((displayHadir / displaySesi) * 100) : 0;

    const currentPeriodLabel = filters.periode
        ? new Date(filters.periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : 'Semua Periode';

    const selectedGrade = grades.find((g) => String(g.id) === filters.filter_grade);
    const selectedProgram = programs.find((p) => String(p.id) === filters.filter_program);

    const hasActiveFilters = Boolean(
        filters.periode || filters.filter_grade || filters.filter_mapel || filters.filter_program || search
    );

    return (
        <AuthenticatedLayout>
            <Head title="Laporan & Rekapitulasi Realisasi Penggajian - SATU GURU KPM" />

            {/* ============================================================== */}
            {/* SCREEN VIEW ONLY (Hidden during window.print)                   */}
            {/* ============================================================== */}
            <div className="print:hidden space-y-5">
                {/* Header Section */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                                <Icon icon="tabler:shield-check" className="w-3.5 h-3.5" />
                                Divisi Keuangan & Payroll KPM
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                TA 2026/2027
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            Laporan & Rekapitulasi Penggajian
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Rekapitulasi resmi realisasi honor pengajar, tunjangan transport, dan transparansi distribusi anggaran KPM Pusat.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-sm transition-all"
                            title="Cetak Laporan Format Resmi"
                        >
                            <Icon icon="tabler:printer" className="w-4 h-4 text-slate-600" />
                            <span>Cetak</span>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200/60 shadow-sm transition-all"
                            title="Unduh Lembar Kerja Excel (.xlsx)"
                        >
                            <Icon icon="tabler:file-spreadsheet" className="w-4 h-4 text-emerald-600" />
                            <span>Export Excel</span>
                        </button>
                        <button
                            onClick={handleExportPdf}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 transition-all"
                            title="Unduh Dokumen Rekapitulasi PDF Resmi"
                        >
                            <Icon icon="tabler:file-type-pdf" className="w-4 h-4 text-rose-200" />
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>

                {/* Financial KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Realisasi Dana */}
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 text-white shadow-md shadow-indigo-950/10 relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold tracking-wider text-indigo-200 uppercase">
                                Realisasi Dana Payroll
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300">
                                <Icon icon="tabler:wallet" className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black tracking-tight text-white font-mono">
                            {formatCurrency(displayTotal)}
                        </div>
                        <p className="text-xs text-indigo-200/80 mt-2 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Total gaji bersih {displayCount} tenaga pengajar
                        </p>
                    </div>

                    {/* Card 2: Total Pengajar */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Pengajar Terverifikasi
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <Icon icon="tabler:users" className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                            {displayCount} <span className="text-sm font-normal text-slate-500">Guru</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Rata-rata honor: <strong className="text-slate-700 font-mono">{formatCurrency(avgHonor)}</strong>
                        </p>
                    </div>

                    {/* Card 3: Beban Sesi Mengajar */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Beban & Realisasi Sesi
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                                <Icon icon="tabler:calendar-time" className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                            {displayHadir} <span className="text-sm font-normal text-slate-500">/ {displaySesi} Sesi</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(hadirPercentage, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600">{hadirPercentage}%</span>
                        </div>
                    </div>

                    {/* Card 4: Total Jam Mengajar */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Total Jam Mengajar
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                <Icon icon="tabler:clock-hour-4" className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                            {displayJam.toFixed(1)} <span className="text-sm font-normal text-slate-500">Jam Efektif</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Presensi tervalidasi sistem GPS & waktu
                        </p>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        {/* Filters Group */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                            {/* Periode Dropdown */}
                            <div className="relative">
                                <select
                                    value={filters.periode || ''}
                                    onChange={(e) => updateFilter('periode', e.target.value)}
                                    aria-label="Pilih Periode Penggajian"
                                    className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="">Semua Periode</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() - i);
                                        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                        const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                        return (
                                            <option key={val} value={val}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                <Icon
                                    icon="tabler:chevron-down"
                                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                />
                            </div>

                            {/* Grade Dropdown */}
                            <div className="relative">
                                <select
                                    value={filters.filter_grade || ''}
                                    onChange={(e) => updateFilter('filter_grade', e.target.value)}
                                    aria-label="Pilih Grade Guru"
                                    className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="">Semua Grade</option>
                                    {grades.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            Grade {g.kode_grade}
                                        </option>
                                    ))}
                                </select>
                                <Icon
                                    icon="tabler:chevron-down"
                                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                />
                            </div>

                            {/* Mapel Dropdown */}
                            <div className="relative">
                                <select
                                    value={filters.filter_mapel || ''}
                                    onChange={(e) => updateFilter('filter_mapel', e.target.value)}
                                    aria-label="Pilih Mata Pelajaran"
                                    className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="">Semua Mapel</option>
                                    <option value="IPA">IPA (Sains)</option>
                                    <option value="MTK">MTK (Matematika)</option>
                                </select>
                                <Icon
                                    icon="tabler:chevron-down"
                                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                />
                            </div>

                            {/* Program Dropdown */}
                            <div className="relative">
                                <select
                                    value={filters.filter_program || ''}
                                    onChange={(e) => updateFilter('filter_program', e.target.value)}
                                    aria-label="Pilih Program Kelas"
                                    className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="">Semua Program</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nama}
                                        </option>
                                    ))}
                                </select>
                                <Icon
                                    icon="tabler:chevron-down"
                                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Search & Action Controls */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 lg:w-64">
                                <Icon
                                    icon="tabler:search"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Cari nama guru / NIP..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 transition-colors shrink-0"
                            >
                                Cari
                            </button>

                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
                                    title="Hapus Semua Filter"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filter Badges */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-medium text-slate-500">Filter Aktif:</span>
                            {filters.periode && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                    Periode: {currentPeriodLabel}
                                    <button
                                        onClick={() => clearFilter('periode')}
                                        className="hover:text-indigo-900 ml-0.5"
                                        aria-label="Hapus filter periode"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {selectedGrade && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                    Grade: {selectedGrade.kode_grade}
                                    <button
                                        onClick={() => clearFilter('filter_grade')}
                                        className="hover:text-indigo-900 ml-0.5"
                                        aria-label="Hapus filter grade"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {filters.filter_mapel && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                    Mapel: {filters.filter_mapel}
                                    <button
                                        onClick={() => clearFilter('filter_mapel')}
                                        className="hover:text-indigo-900 ml-0.5"
                                        aria-label="Hapus filter mapel"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {selectedProgram && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                    Program: {selectedProgram.nama}
                                    <button
                                        onClick={() => clearFilter('filter_program')}
                                        className="hover:text-indigo-900 ml-0.5"
                                        aria-label="Hapus filter program"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                    Pencarian: &ldquo;{search}&rdquo;
                                    <button
                                        onClick={() => clearFilter('search')}
                                        className="hover:text-indigo-900 ml-0.5"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Table Container */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    {/* Desktop Accounting Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700">
                                    <th className="py-3.5 px-4 font-bold text-center w-12 text-slate-500 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                                        Tenaga Pengajar & NIP
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-center uppercase tracking-wider">
                                        Grade
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-center uppercase tracking-wider">
                                        Mapel
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-center uppercase tracking-wider">
                                        Periode
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-center uppercase tracking-wider">
                                        Beban Sesi
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-right uppercase tracking-wider">
                                        Honor (Rp)
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-right uppercase tracking-wider">
                                        Tunjangan (Rp)
                                    </th>
                                    <th className="py-3.5 px-4 font-bold text-right uppercase tracking-wider">
                                        Total Gaji (Rp)
                                    </th>
                                    <th className="py-3.5 px-3 font-bold text-center uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="py-3.5 px-4 font-bold text-center uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filtered.length > 0 ? (
                                    <>
                                        {filtered.map((p, i) => {
                                            const nip = formatNIP(p.guru?.id ?? p.id);
                                            const initials = (p.guru?.nama ?? '?')
                                                .split(' ')
                                                .map((w) => w[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase();

                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="hover:bg-slate-50/80 transition-colors group"
                                                >
                                                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                                                        {i + 1}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                                {initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                                    {p.guru?.nama ?? '-'}
                                                                </p>
                                                                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                                                    {nip}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                                                            {p.guru?.grade?.kode_grade ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span
                                                            className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                                p.guru?.mapel === 'IPA'
                                                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                                                            }`}
                                                        >
                                                            {p.guru?.mapel ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                                                        {p.periode}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                        <span className="font-bold text-slate-900 font-mono">
                                                            {p.jumlah_hadir}
                                                        </span>
                                                        <span className="text-slate-400 mx-1">/</span>
                                                        <span className="text-slate-500 font-mono">
                                                            {p.jumlah_sesi} sesi
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                                                        {formatCurrency(p.honor)}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                                                        {Number(p.tunjangan_khusus) > 0 ? (
                                                            formatCurrency(p.tunjangan_khusus)
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700 whitespace-nowrap text-sm">
                                                        {formatCurrency(p.total)}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                                p.status_bayar === 'sudah_dibayar'
                                                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                                                            }`}
                                                        >
                                                            {p.status_bayar === 'sudah_dibayar' ? 'Lunas' : 'Menunggu'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => setSelectedDetail(p)}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                                title="Lihat Rincian Detail"
                                                            >
                                                                <Icon icon="tabler:eye" className="w-4 h-4" />
                                                            </button>
                                                            <a
                                                                href={route('penggajian.payslip', p.id)}
                                                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                                                title="Unduh Slip Gaji PDF"
                                                            >
                                                                <Icon icon="tabler:file-download" className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Grand Total Summary Row */}
                                        <tr className="bg-slate-900 text-white font-semibold">
                                            <td colSpan={5} className="py-4 px-4 text-right text-xs uppercase tracking-wider text-slate-300">
                                                Grand Total Realisasi Dana:
                                            </td>
                                            <td className="py-4 px-3 text-center font-mono font-bold text-white text-xs whitespace-nowrap">
                                                {displayHadir} / {displaySesi} Sesi
                                            </td>
                                            <td className="py-4 px-3 text-right font-mono text-white text-xs whitespace-nowrap">
                                                {formatCurrency(totalHonor)}
                                            </td>
                                            <td className="py-4 px-3 text-right font-mono text-white text-xs whitespace-nowrap">
                                                {formatCurrency(totalTunjangan)}
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono text-emerald-400 font-extrabold text-sm whitespace-nowrap">
                                                {formatCurrency(displayTotal)}
                                            </td>
                                            <td colSpan={2} className="py-4 px-4 text-center">
                                                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                                                    Terverifikasi
                                                </span>
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="py-14 text-center">
                                            <div className="flex flex-col items-center max-w-sm mx-auto">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                                    <Icon icon="tabler:database-search" className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800">
                                                    Tidak ada data rekapitulasi penggajian
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Silakan sesuaikan filter periode, grade, mapel, atau kata kunci pencarian.
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={resetFilters}
                                                        className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                                    >
                                                        Reset Semua Filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {filtered.length > 0 ? (
                            filtered.map((p, i) => {
                                const nip = formatNIP(p.guru?.id ?? p.id);
                                return (
                                    <div key={p.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <span className="text-[10px] font-mono text-slate-400">#{i + 1}</span>
                                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                                    {p.guru?.nama ?? '-'}
                                                </h4>
                                                <p className="text-[11px] font-mono text-slate-500">{nip}</p>
                                            </div>
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                                    p.status_bayar === 'sudah_dibayar'
                                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                        : 'bg-amber-50 border border-amber-200 text-amber-700'
                                                }`}
                                            >
                                                {p.status_bayar === 'sudah_dibayar' ? 'Lunas' : 'Menunggu'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-slate-400 text-[10px] uppercase font-semibold">
                                                    Grade & Mapel
                                                </p>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    Grade {p.guru?.grade?.kode_grade ?? '-'} &bull; {p.guru?.mapel ?? '-'}
                                                </p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-slate-400 text-[10px] uppercase font-semibold">
                                                    Realisasi Sesi
                                                </p>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    {p.jumlah_hadir} / {p.jumlah_sesi} Sesi
                                                </p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-slate-400 text-[10px] uppercase font-semibold">
                                                    Honor
                                                </p>
                                                <p className="font-medium text-slate-800 mt-0.5 font-mono text-[11px]">
                                                    {formatCurrency(p.honor)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                                <p className="text-indigo-600 text-[10px] uppercase font-semibold">
                                                    Total Gaji Bersih
                                                </p>
                                                <p className="font-bold text-indigo-700 mt-0.5 font-mono text-xs">
                                                    {formatCurrency(p.total)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => setSelectedDetail(p)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                            >
                                                <Icon icon="tabler:eye" className="w-3.5 h-3.5" />
                                                <span>Detail</span>
                                            </button>
                                            <a
                                                href={route('penggajian.payslip', p.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                                            >
                                                <Icon icon="tabler:file-download" className="w-3.5 h-3.5" />
                                                <span>Slip Gaji PDF</span>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center px-4">
                                <p className="text-sm font-semibold text-slate-700">Tidak ada data rekapitulasi</p>
                                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter pencarian.</p>
                            </div>
                        )}

                        {/* Mobile Grand Total Summary */}
                        {filtered.length > 0 && (
                            <div className="bg-slate-900 text-white p-4 space-y-1">
                                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    Grand Total Realisasi Dana:
                                </p>
                                <p className="text-xl font-black text-emerald-400 font-mono">
                                    {formatCurrency(displayTotal)}
                                </p>
                                <p className="text-[11px] text-slate-300">
                                    Total {displayCount} Guru &bull; {displayHadir} / {displaySesi} Sesi
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Table Footer */}
                    <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>
                            Menampilkan <strong className="text-slate-800">{filtered.length}</strong> data penggajian
                            terdaftar
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px]">
                            <span>Status:</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                <Icon icon="tabler:circle-check" className="w-3.5 h-3.5" /> Siap Diproses Payroll
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* DETAIL MODAL (Quick View)                                       */}
            {/* ============================================================== */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Rincian Payroll & Beban Mengajar
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedDetail.guru?.nama} &bull; {formatNIP(selectedDetail.guru?.id ?? selectedDetail.id)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                                aria-label="Tutup Modal"
                            >
                                <Icon icon="tabler:x" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Teacher Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>
                                <span className="text-slate-400">Grade & Tarif:</span>
                                <p className="font-semibold text-slate-800">
                                    Grade {selectedDetail.guru?.grade?.kode_grade ?? '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-400">Mata Pelajaran:</span>
                                <p className="font-semibold text-slate-800">
                                    {selectedDetail.guru?.mapel ?? '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-400">Rekening Bank:</span>
                                <p className="font-semibold text-slate-800 font-mono">
                                    {selectedDetail.guru?.bank && selectedDetail.guru?.nomor_rekening
                                        ? `${selectedDetail.guru.bank} - ${selectedDetail.guru.nomor_rekening}`
                                        : 'Transfer Kas / Tunai'}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-400">Total Sesi & Jam:</span>
                                <p className="font-semibold text-slate-800">
                                    {selectedDetail.jumlah_hadir} / {selectedDetail.jumlah_sesi} Sesi ({selectedDetail.total_jam} Jam)
                                </p>
                            </div>
                        </div>

                        {/* Complete Teaching History */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-slate-600 mb-2">
                                Riwayat Mengajar Lengkap
                            </h4>

                            {riwayat && riwayat.sessions.length > 0 ? (
                                <>
                                    {/* Summary Strip */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                            <p className="text-slate-400 text-[10px] uppercase font-semibold">
                                                Total Sesi
                                            </p>
                                            <p className="font-bold text-slate-800 mt-0.5 text-sm">
                                                {riwayat.total_sesi}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 text-center">
                                            <p className="text-violet-600 text-[10px] uppercase font-semibold">
                                                Kelas Khusus
                                            </p>
                                            <p className="font-bold text-violet-700 mt-0.5 text-sm">
                                                {riwayat.sesi_khusus}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                                            <p className="text-blue-600 text-[10px] uppercase font-semibold">
                                                Kelas Reguler
                                            </p>
                                            <p className="font-bold text-blue-700 mt-0.5 text-sm">
                                                {riwayat.sesi_reguler}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                                            <p className="text-emerald-600 text-[10px] uppercase font-semibold">
                                                Potensi Gaji
                                            </p>
                                            <p className="font-bold text-emerald-700 mt-0.5 font-mono text-[11px]">
                                                {formatCurrency(riwayat.potensi_gaji)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-100 text-slate-700 text-[11px]">
                                                    <tr>
                                                        <th className="p-2">Tanggal</th>
                                                        <th className="p-2 text-center">Pekan</th>
                                                        <th className="p-2">Jam</th>
                                                        <th className="p-2">Program/Kelas</th>
                                                        <th className="p-2">Bahan Ajar</th>
                                                        <th className="p-2">Lokasi</th>
                                                        <th className="p-2 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {riwayat.sessions.map((s) => {
                                                        const badge =
                                                            sessionStatusBadge[s.status] ??
                                                            ({
                                                                className:
                                                                    'bg-slate-50 border border-slate-200 text-slate-600',
                                                                label: s.status,
                                                            });

                                                        return (
                                                            <tr key={s.id}>
                                                                <td className="p-2 whitespace-nowrap">
                                                                    <p className="font-medium text-slate-800">
                                                                        {s.tanggal_label}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {s.hari}
                                                                    </p>
                                                                </td>
                                                                <td className="p-2 text-center font-mono text-slate-600">
                                                                    P{s.pekan}
                                                                </td>
                                                                <td className="p-2 font-mono text-slate-600 whitespace-nowrap">
                                                                    {s.jam_mulai} - {s.jam_selesai}
                                                                </td>
                                                                <td className="p-2">
                                                                    <p className="font-medium text-slate-800">
                                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${programStyle(s.program).badge}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${programStyle(s.program).dot}`} />
                                                                            {s.program ?? '-'}
                                                                        </span>
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {s.mapel} &bull; {s.jumlah_sesi} sesi
                                                                    </p>
                                                                </td>
                                                                <td className="p-2 text-slate-600">
                                                                    {s.bahan_ajar ?? '-'}
                                                                </td>
                                                                <td className="p-2 text-slate-600">{s.lokasi}</td>
                                                                <td className="p-2 text-center whitespace-nowrap">
                                                                    <span
                                                                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}
                                                                    >
                                                                        {badge.label}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="border border-slate-200 rounded-xl p-6 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                                        <Icon icon="tabler:calendar-off" className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600">
                                        Belum ada riwayat mengajar pada periode ini.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Total Highlight */}
                        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-300 uppercase font-semibold">Total Gaji Diterima</p>
                                <p className="text-[11px] text-slate-400">Periode: {selectedDetail.periode}</p>
                            </div>
                            <div className="text-xl font-bold font-mono text-emerald-400">
                                {formatCurrency(selectedDetail.total)}
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Tutup
                            </button>
                            <a
                                href={route('penggajian.payslip', selectedDetail.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                            >
                                <Icon icon="tabler:file-download" className="w-4 h-4" />
                                <span>Unduh Slip Gaji PDF</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* PRINT-ONLY OFFICIAL DOCUMENT VIEW (Strictly shown on Ctrl+P)   */}
            {/* ============================================================== */}
            <div className="hidden print:block text-black bg-white p-4 font-sans text-[10px] leading-tight">
                {/* Official Kop Lembaga */}
                <div className="border-b-2 border-black pb-3 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/assets/images/LOGO%20KPM%20PUSAT.png"
                            alt="Logo KPM"
                            className="h-14 w-auto object-contain"
                        />
                        <div>
                            <h2 className="text-sm font-extrabold tracking-wide uppercase text-black">
                                Klinik Pendidikan MIPA (KPM) Pusat
                            </h2>
                            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                                Satu Guru &mdash; Sistem Informasi Administrasi & Payroll Pengajar
                            </p>
                            <p className="text-xs font-black uppercase tracking-wider mt-0.5 text-black">
                                Rekapitulasi Realisasi Penggajian Pengajar Resmi
                            </p>
                            <p className="text-[8px] text-slate-600">
                                Ruko Graha Niaga No. 209, Jl. Raya Laladon, Ciomas, Bogor 16610 &bull; Telp: (0251) 7522612 &bull; kpmacademic.io
                            </p>
                        </div>
                    </div>
                    <div className="border border-black p-2 rounded text-[8px] min-w-[170px] text-left">
                        <p><strong>Periode:</strong> {currentPeriodLabel}</p>
                        <p><strong>Total Pengajar:</strong> {displayCount} Guru</p>
                        <p><strong>Total Sesi:</strong> {displaySesi} Sesi ({displayHadir} Hadir)</p>
                        <p><strong>Waktu Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
                    </div>
                </div>

                {/* Accounting Print Table */}
                <table className="w-full border-collapse border border-black text-[9px] mb-3">
                    <thead>
                        <tr className="bg-slate-100 border-b border-black text-black">
                            <th className="border border-black p-1.5 text-center w-8">No</th>
                            <th className="border border-black p-1.5 text-left">Nama Pengajar & NIP</th>
                            <th className="border border-black p-1.5 text-center w-12">Grade</th>
                            <th className="border border-black p-1.5 text-center w-12">Mapel</th>
                            <th className="border border-black p-1.5 text-center w-12">Sesi</th>
                            <th className="border border-black p-1.5 text-center w-12">Hadir</th>
                            <th className="border border-black p-1.5 text-right w-20">Honor (Rp)</th>
                            <th className="border border-black p-1.5 text-right w-20">Tunjangan (Rp)</th>
                            <th className="border border-black p-1.5 text-right w-24">Total Gaji (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p, i) => (
                            <tr key={p.id} className="border-b border-slate-300">
                                <td className="border border-black p-1 text-center font-mono">{i + 1}</td>
                                <td className="border border-black p-1">
                                    <strong className="block text-black">{p.guru?.nama}</strong>
                                    <span className="font-mono text-[8px] text-slate-700">
                                        {formatNIP(p.guru?.id ?? p.id)}
                                    </span>
                                </td>
                                <td className="border border-black p-1 text-center font-bold">
                                    {p.guru?.grade?.kode_grade ?? '-'}
                                </td>
                                <td className="border border-black p-1 text-center font-bold">
                                    {p.guru?.mapel ?? '-'}
                                </td>
                                <td className="border border-black p-1 text-center font-mono">{p.jumlah_sesi}</td>
                                <td className="border border-black p-1 text-center font-mono font-bold">
                                    {p.jumlah_hadir}
                                </td>
                                <td className="border border-black p-1 text-right font-mono">
                                    {formatCurrency(p.honor)}
                                </td>
                                <td className="border border-black p-1 text-right font-mono">
                                    {formatCurrency(p.tunjangan_khusus)}
                                </td>
                                <td className="border border-black p-1 text-right font-mono font-bold">
                                    {formatCurrency(p.total)}
                                </td>
                            </tr>
                        ))}

                        {/* Print Grand Total Row */}
                        <tr className="bg-slate-200 font-bold border-t-2 border-black">
                            <td colSpan={4} className="border border-black p-1.5 text-right uppercase">
                                Grand Total Realisasi Dana:
                            </td>
                            <td className="border border-black p-1.5 text-center font-mono">{displaySesi}</td>
                            <td className="border border-black p-1.5 text-center font-mono">{displayHadir}</td>
                            <td className="border border-black p-1.5 text-right font-mono">
                                {formatCurrency(totalHonor)}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                                {formatCurrency(totalTunjangan)}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono font-black text-[10px]">
                                {formatCurrency(displayTotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Terbilang Box */}
                <div className="border border-black p-2 rounded mb-6 text-[9px]">
                    <strong>Terbilang:</strong> <em># {terbilang(displayTotal)} #</em>
                </div>

                {/* Official Signatures Section (3 columns) */}
                <div className="grid grid-cols-3 text-center text-[9px] gap-4 mb-4 page-break-inside-avoid">
                    <div>
                        <p className="font-bold">Dibuat Oleh,</p>
                        <p className="text-slate-600 text-[8px]">Staf Administrasi & Payroll</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</p>
                        <p className="text-[8px] text-slate-600">Divisi Administrasi KPM</p>
                    </div>
                    <div>
                        <p className="font-bold">Diperiksa & Diverifikasi,</p>
                        <p className="text-slate-600 text-[8px]">Bagian Keuangan / Finance</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</p>
                        <p className="text-[8px] text-slate-600">Departemen Keuangan KPM</p>
                    </div>
                    <div>
                        <p className="font-bold">Bogor, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        <p className="text-slate-600 text-[8px]">Disetujui Oleh, Pimpinan KPM</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</p>
                        <p className="text-[8px] text-slate-600">Kepala Divisi Pendidikan KPM</p>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="border-t border-slate-300 pt-2 text-[8px] text-slate-600 flex justify-between">
                    <span>
                        Dokumen rekapitulasi penggajian resmi SATU GURU KPM &bull; Bersifat RAHASIA (Confidential) untuk arsip keuangan.
                    </span>
                    <span>
                        Dicetak pada {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
