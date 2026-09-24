import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Grade, Transport, Penggajian } from '@/types';
import { useState } from 'react';

interface LaporanProps {
    penggajians: Penggajian[];
    grandTotal: number;
    totalSesi: number;
    grades: Grade[];
    transports: Transport[];
    filters: { periode?: string; filter_grade?: string; filter_mapel?: string; filter_transport?: string; search?: string };
}

function buildQueryString(filters: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
}

function formatNIP(id: number) {
    return `GUR-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

export default function LaporanIndex({ penggajians, grandTotal, totalSesi, grades, transports, filters }: LaporanProps) {
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
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">Laporan & Rekapitulasi Penggajian</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium">TA 2026/27</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Rekapitulasi dan transparansi realisasi payroll pengajar resmi KPM Pusat.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                            <Icon icon="lucide:printer" className="w-4 h-4 text-slate-500" /> Cetak
                        </button>
                        <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                            <Icon icon="lucide:file-spreadsheet" className="w-4 h-4 text-emerald-600" /> Export Excel
                        </button>
                        <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                            <Icon icon="lucide:file-text" className="w-4 h-4 text-rose-600" /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Stats 3 cards ===== */}
            <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-5 py-4 flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Guru Digaji</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{displayCount} <span className="font-normal text-slate-600">Guru</span></p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Icon icon="lucide:clipboard-list" className="w-4 h-4" />
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-5 py-4 flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Sesi Mengajar</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{displaySesi} <span className="font-normal text-slate-600">Sesi</span></p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Icon icon="lucide:clock-3" className="w-4 h-4" />
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-5 py-4 flex items-start justify-between">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Realisasi Dana</p>
                        <p className="text-lg font-semibold text-sky-600 mt-1 truncate">{formatCurrency(displayTotal)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Icon icon="lucide:wallet" className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* ===== Filter Bar - pill style like reference ===== */}
            <div className="print:hidden bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 mb-4">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Left: dropdowns */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        <div className="relative">
                            <select
                                value={filters.periode || ''}
                                onChange={(e) => updateFilter('periode', e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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

                        <div className="relative">
                            <select
                                value={filters.filter_grade || ''}
                                onChange={(e) => updateFilter('filter_grade', e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="">Semua Grade</option>
                                {grades.map(g => <option key={g.id} value={g.id}>Grade {g.kode_grade}</option>)}
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>

                        <div className="relative">
                            <select
                                value={filters.filter_mapel || ''}
                                onChange={(e) => updateFilter('filter_mapel', e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="">Semua Mapel</option>
                                <option value="IPA">IPA</option>
                                <option value="MTK">MTK</option>
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>

                        <div className="relative">
                            <select
                                value={filters.filter_transport || ''}
                                onChange={(e) => updateFilter('filter_transport', e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="">Semua Transport</option>
                                {transports.map(t => <option key={t.id} value={t.id}>{t.jenis}</option>)}
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    {/* Right: search + actions */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-[260px]">
                            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Cari nama / NIP..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>
                        <button onClick={resetFilters} className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 px-2">
                            Reset
                        </button>
                        <button onClick={handleSearch} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-medium shadow-sm transition-colors shrink-0">
                            <Icon icon="lucide:filter" className="w-4 h-4" /> Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Table Card - reference style ===== */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print-report">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-12">No</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nama Guru & NIP</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mapel</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Periode</th>
                                <th className="px-3 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sesi</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transport</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Honor Sesi</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Biaya Transport</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Gaji</th>
                                <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status / Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length > 0 ? (
                                <>
                                    {filtered.map((p, i) => (
                                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-4 text-sm text-slate-500">{i + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-accent-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {(p.guru?.nama ?? '?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 leading-none truncate">{p.guru?.nama ?? '-'}</p>
                                                        <p className="text-xs text-slate-500 font-mono leading-none mt-1">{formatNIP(p.guru?.id ?? p.id)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium">{p.guru?.grade?.kode_grade ?? '-'}</span>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-slate-700">{p.guru?.mapel ?? '-'}</td>
                                            <td className="px-3 py-4 text-sm text-slate-700 whitespace-nowrap">{p.periode}</td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-sm font-semibold text-slate-900">{p.jumlah_sesi}</span>
                                                <span className="text-xs text-slate-500 ml-1">Sesi</span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="text-sm text-slate-900 leading-none">{p.transport?.jenis ?? '-'}</div>
                                                <div className="text-xs text-slate-500 leading-none mt-1">Bogor Timur</div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-slate-700 text-right whitespace-nowrap">{formatCurrency(p.honor)}</td>
                                            <td className="px-3 py-4 text-sm text-slate-700 text-right whitespace-nowrap">{formatCurrency(p.total_transport)}</td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatCurrency(p.total)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="inline-flex px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium whitespace-nowrap">
                                                        {p.status_bayar === 'sudah_dibayar' ? 'Disetujui' : 'Menunggu'}
                                                    </span>
                                                    <button onClick={handlePrint} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                                                        <Icon icon="lucide:printer" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Grand Total */}
                                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                                        <td colSpan={5} className="px-4 py-3.5 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">Grand Total</td>
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
                                            <span className="inline-flex px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">Lunas</span>
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={11} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Icon icon="lucide:inbox" className="w-6 h-6 text-slate-400" />
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
                                <div key={p.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full bg-accent-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            {(p.guru?.nama ?? '?').slice(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{p.guru?.nama ?? '-'}</p>
                                            <p className="text-xs font-mono text-slate-500">{formatNIP(p.guru?.id ?? p.id)} • Grade {p.guru?.grade?.kode_grade} • {p.guru?.mapel}</p>
                                        </div>
                                        <span className="inline-flex px-2 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium shrink-0">{p.jumlah_sesi} Sesi</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-slate-50 rounded-lg p-2.5">
                                            <p className="text-slate-500">Periode</p>
                                            <p className="font-medium text-slate-900">{p.periode}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2.5">
                                            <p className="text-slate-500">Transport</p>
                                            <p className="font-medium text-slate-900">{p.transport?.jenis}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2.5">
                                            <p className="text-slate-500">Honor</p>
                                            <p className="font-medium text-slate-900">{formatCurrency(p.honor)}</p>
                                        </div>
                                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5">
                                            <p className="text-sky-700 font-medium">Total Gaji</p>
                                            <p className="font-bold text-sky-700">{formatCurrency(p.total)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-slate-50 px-4 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Grand Total</p>
                                    <p className="text-xs text-slate-500">{displayCount} Pengajar • {displaySesi} Sesi</p>
                                </div>
                                <p className="text-base font-bold text-slate-900">{formatCurrency(displayTotal)}</p>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-500">Tidak ada data</p>
                        </div>
                    )}
                </div>

                {/* Footer pagination */}
                <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <p className="text-xs sm:text-sm text-slate-500">
                        Menampilkan <span className="font-medium text-slate-900">{filtered.length ? 1 : 0} dari {filtered.length} data rekapitulasi</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <button disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 disabled:opacity-50">Sebelumnya</button>
                        <span className="px-3 py-1.5 rounded-lg bg-accent-600 text-white text-xs font-semibold">1</span>
                        <button disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 disabled:opacity-50">Selanjutnya</button>
                    </div>
                </div>
            </div>

            {/* Print only footer */}
            <div className="hidden print:block mt-4 text-center text-xs text-slate-500 border-t border-slate-200 pt-3">
                Dicetak pada {new Date().toLocaleDateString('id-ID')} — SIGURU Sistem Informasi Penggajian Guru KPM Pusat
            </div>
        </AuthenticatedLayout>
    );
}
