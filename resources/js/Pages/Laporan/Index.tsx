import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Grade, Program, Penggajian } from '@/types';
import { useState } from 'react';

interface LaporanProps {
    penggajians: Penggajian[];
    grandTotal: number;
    totalSesi: number;
    grades: Grade[];
    programs: Program[];
    filters: { periode?: string; filter_grade?: string; filter_mapel?: string; filter_program?: string; search?: string };
}

function buildQueryString(filters: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
}

function formatNIP(id: number) {
    return `GUR-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

export default function LaporanIndex({ penggajians, grandTotal, totalSesi, grades, programs, filters }: LaporanProps) {
    const qs = buildQueryString(filters as Record<string, string | undefined>);
    const [search, setSearch] = useState(filters.search || '');

    const updateFilter = (key: string, value: string) => {
        router.get(route('laporan.index'), { ...filters, [key]: value || undefined, search: search || undefined }, { preserveState: true, replace: true });
    };

    const handleSearch = () => {
        router.get(route('laporan.index'), { ...filters, search: search || undefined }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearch('');
        router.get(route('laporan.index'), {}, { preserveState: true, replace: true });
    };

    const handleExportPdf = () => { window.location.href = route('laporan.exportPdf') + '?' + qs; };
    const handleExportExcel = () => { window.location.href = route('laporan.exportExcel') + '?' + qs; };
    const handlePrint = () => window.print();

    // Format periode for display like "Sep 2026"
    const periodeDisplay = filters.periode
        ? new Date(filters.periode + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
        : 'Sep 2026';

    // Client-side search filter (if backend not yet supports search, filter locally for UX)
    const filtered = search
        ? penggajians.filter(p => {
            const q = search.toLowerCase();
            return p.guru?.nama?.toLowerCase().includes(q) || String(p.guru?.id).includes(q) || formatNIP(p.guru?.id ?? 0).toLowerCase().includes(q);
          })
        : penggajians;

    const displayTotal = search ? filtered.reduce((s, p) => s + Number(p.total), 0) : grandTotal;
    const displaySesi = search ? filtered.reduce((s, p) => s + Number(p.jumlah_sesi), 0) : totalSesi;
    const displayCount = filtered.length;

    return (
        <AuthenticatedLayout>
            <Head title="Laporan & Rekapitulasi Penggajian" />

            {/* ===== Header ===== */}
            <div className="print:hidden mb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="page-title">Laporan & Rekapitulasi Penggajian</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">TA 2026/27</span>
                        </div>
                        <p className="page-subtitle">Rekapitulasi dan transparansi realisasi payroll pengajar resmi KPM Pusat.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button onClick={handlePrint} className="btn-secondary">
                            <Icon icon="lucide:printer" className="w-4 h-4" /> Cetak
                        </button>
                        <button onClick={handleExportExcel} className="btn-secondary">
                            <Icon icon="lucide:file-spreadsheet" className="w-4 h-4 text-emerald-600" /> Export Excel
                        </button>
                        <button onClick={handleExportPdf} className="btn-secondary">
                            <Icon icon="lucide:file-text" className="w-4 h-4 text-rose-600" /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Stats 3 cards ===== */}
            <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="card-modern hover:border-indigo-200 px-4 sm:px-5 py-4 flex items-start justify-between gap-3 transition-colors">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Guru Digaji</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1 break-words">{displayCount} <span className="font-normal text-slate-600">Guru</span></p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:clipboard-list" className="w-4 h-4" />
                    </div>
                </div>
                <div className="card-modern hover:border-indigo-200 px-4 sm:px-5 py-4 flex items-start justify-between gap-3 transition-colors">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Sesi Mengajar</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1 break-words">{displaySesi} <span className="font-normal text-slate-600">Sesi</span></p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:clock-3" className="w-4 h-4" />
                    </div>
                </div>
                <div className="card-modern hover:border-indigo-200 px-4 sm:px-5 py-4 flex items-start justify-between gap-3 transition-colors">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Realisasi Dana</p>
                        <p className="text-lg font-semibold text-indigo-600 mt-1 break-words">{formatCurrency(displayTotal)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:wallet" className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* ===== Filter Bar - pill style like reference ===== */}
            <div className="print:hidden card-modern p-3 sm:p-3.5 mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Left: dropdowns */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filters.periode || ''}
                                onChange={(e) => updateFilter('periode', e.target.value)}
                                className="appearance-none w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors"
                            >
                                <option value="">{periodeDisplay}</option>
                                {/* Generate last 12 months */}
                                {Array.from({ length: 12 }, (_, i) => {
                                    const d = new Date();
                                    d.setMonth(d.getMonth() - i);
                                    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                                    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                                    return <option key={val} value={val}>{label}</option>;
                                })}
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filters.filter_grade || ''}
                                onChange={(e) => updateFilter('filter_grade', e.target.value)}
                                className="appearance-none w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors"
                            >
                                <option value="">Semua Grade</option>
                                {grades.map(g => <option key={g.id} value={g.id}>Grade {g.kode_grade}</option>)}
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filters.filter_mapel || ''}
                                onChange={(e) => updateFilter('filter_mapel', e.target.value)}
                                className="appearance-none w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors"
                            >
                                <option value="">Semua Mapel</option>
                                <option value="IPA">IPA</option>
                                <option value="MTK">MTK</option>
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <select
                                value={filters.filter_program || ''}
                                onChange={(e) => updateFilter('filter_program', e.target.value)}
                                className="appearance-none w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors"
                            >
                                <option value="">Semua Program</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    {/* Right: search + actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-[260px]">
                            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Cari nama / NIP..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 hover:border-indigo-200 transition-colors"
                            />
                        </div>
                        <button onClick={resetFilters} className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-700 px-2 transition-colors">
                            Reset
                        </button>
                        <button onClick={handleSearch} className="btn-primary rounded-full shrink-0">
                            <Icon icon="lucide:filter" className="w-4 h-4" /> Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Table Card - reference style ===== */}
            <div className="card-modern overflow-hidden print-report">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="bg-gradient-to-r from-indigo-50/70 to-violet-50/50 border-b border-indigo-100">
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider w-12">No</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Nama Guru & NIP</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Grade</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Mapel</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Periode</th>
                                <th className="px-3 py-3 text-center text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Sesi</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Transport</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Honor Sesi</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Biaya Transport</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Total Gaji</th>
                                <th className="px-4 py-3 text-center text-[11px] font-semibold text-indigo-900/70 uppercase tracking-wider">Status / Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length > 0 ? (
                                <>
                                    {filtered.map((p, i) => (
                                        <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="px-4 py-4 text-sm text-slate-500">{i + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {(p.guru?.nama ?? '?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 leading-none truncate">{p.guru?.nama ?? '-'}</p>
                                                        <p className="text-xs text-slate-500 font-mono leading-none mt-1">{formatNIP(p.guru?.id ?? p.id)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">{p.guru?.grade?.kode_grade ?? '-'}</span>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-slate-700">{p.guru?.mapel ?? '-'}</td>
                                            <td className="px-3 py-4 text-sm text-slate-700 whitespace-nowrap">{p.periode}</td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-sm font-semibold text-slate-900">{p.jumlah_sesi}</span>
                                                <span className="text-xs text-slate-500 ml-1">Sesi</span>
                                            </td>
                                            <td className="px-3 py-4">
                                                {p.detail && p.detail.length > 0 ? (
                                                    <div className="text-xs text-slate-600 space-y-0.5">
                                                        {p.detail.slice(0, 2).map((d, di) => (
                                                            <div key={di}>{d.program} · {d.transport}</div>
                                                        ))}
                                                        {p.detail.length > 2 && <div className="text-slate-400">+{p.detail.length - 2} lainnya</div>}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-900">{p.transport?.jenis ?? '-'}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-sm text-slate-700 text-right whitespace-nowrap">{formatCurrency(p.honor)}</td>
                                            <td className="px-3 py-4 text-sm text-slate-700 text-right whitespace-nowrap">{formatCurrency(p.total_transport)}</td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatCurrency(p.total)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                                        p.status_bayar === 'sudah_dibayar'
                                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                            : 'bg-amber-50 border border-amber-200 text-amber-700'
                                                    }`}>
                                                        {p.status_bayar === 'sudah_dibayar' ? 'Disetujui' : 'Menunggu'}
                                                    </span>
                                                    <button onClick={handlePrint} className="w-7 h-7 rounded-full hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-700 transition-colors">
                                                        <Icon icon="lucide:printer" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Grand Total */}
                                    <tr className="bg-gradient-to-r from-indigo-50 to-violet-50 border-t-2 border-indigo-200 font-semibold">
                                        <td colSpan={5} className="px-4 py-3.5 text-right text-xs font-semibold tracking-wide text-indigo-700 uppercase">Grand Total</td>
                                        <td className="px-3 py-3.5 text-center">
                                            <div className="text-sm font-bold text-slate-900 leading-none">{displaySesi}</div>
                                            <div className="text-xs text-slate-500 leading-none">Sesi</div>
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            <div className="text-sm font-semibold text-slate-900 leading-none">{displayCount}</div>
                                            <div className="text-xs text-slate-500 leading-none">Pengajar</div>
                                        </td>
                                        <td className="px-3 py-3.5 text-right text-sm font-bold text-slate-900">{formatCurrency(filtered.reduce((s,p)=>s+Number(p.honor),0))}</td>
                                        <td className="px-3 py-3.5 text-right text-sm font-bold text-slate-900">{formatCurrency(filtered.reduce((s,p)=>s+Number(p.total_transport),0))}</td>
                                        <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-900">{formatCurrency(displayTotal)}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">Lunas</span>
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={11} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-brand">
                                                <Icon icon="lucide:inbox" className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 mt-3">Tidak ada data rekapitulasi</p>
                                            <p className="text-xs text-slate-500 mt-1">Coba ubah filter atau periode untuk menampilkan data</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filtered.length > 0 ? (
                        <>
                            {filtered.map((p, i) => (
                                <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            {(p.guru?.nama ?? '?').slice(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900 break-words">{p.guru?.nama ?? '-'}</p>
                                            <p className="text-xs font-mono text-slate-500 break-words">{formatNIP(p.guru?.id ?? p.id)} • Grade {p.guru?.grade?.kode_grade} • {p.guru?.mapel}</p>
                                        </div>
                                        <span className="inline-flex px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium shrink-0">{p.jumlah_sesi} Sesi</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 border border-indigo-100/70 rounded-lg p-2.5">
                                            <p className="text-slate-500">Periode</p>
                                            <p className="font-medium text-slate-900">{p.periode}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 border border-indigo-100/70 rounded-lg p-2.5">
                                            <p className="text-slate-500">Transport</p>
                                            <p className="font-medium text-slate-900 break-words">{p.transport?.jenis}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 border border-indigo-100/70 rounded-lg p-2.5">
                                            <p className="text-slate-500">Honor</p>
                                            <p className="font-medium text-slate-900 break-words">{formatCurrency(p.honor)}</p>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                                            <p className="text-indigo-700 font-medium">Total Gaji</p>
                                            <p className="font-bold text-indigo-700 break-words">{formatCurrency(p.total)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-4 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100">
                                <div>
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Grand Total</p>
                                    <p className="text-xs text-slate-500">{displayCount} Pengajar • {displaySesi} Sesi</p>
                                </div>
                                <p className="text-base font-bold text-slate-900 break-words">{formatCurrency(displayTotal)}</p>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center px-4">
                            <div className="empty-state-icon">
                                <Icon icon="lucide:inbox" className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">Tidak ada data</p>
                            <p className="text-xs text-slate-500 mt-1">Coba ubah filter atau periode untuk menampilkan data</p>
                        </div>
                    )}
                </div>

                {/* Footer pagination */}
                <div className="px-4 sm:px-6 py-3 bg-white border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <p className="text-xs sm:text-sm text-slate-500">
                        Menampilkan <span className="font-medium text-slate-900">{filtered.length ? 1 : 0} dari {filtered.length} data rekapitulasi</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        <button disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors">Sebelumnya</button>
                        <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">1</span>
                        <button disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors">Selanjutnya</button>
                    </div>
                </div>
            </div>

            {/* Print only footer */}
            <div className="hidden print:block mt-4 text-center text-xs text-slate-500 border-t border-slate-200 pt-3">
                Dicetak pada {new Date().toLocaleDateString('id-ID')} — Satu Guru KPM · Sistem Administrasi Guru KPM
            </div>
        </AuthenticatedLayout>
    );
}
