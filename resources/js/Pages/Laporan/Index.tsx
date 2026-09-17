import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import StatCard from '@/Components/ui/stat-card';
import Badge from '@/Components/ui/badge';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Grade, Transport, Penggajian } from '@/types';

interface LaporanProps {
    penggajians: Penggajian[];
    grandTotal: number;
    totalSesi: number;
    grades: Grade[];
    transports: Transport[];
    filters: { periode?: string; filter_grade?: string; filter_mapel?: string; filter_transport?: string };
}

function buildQueryString(filters: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    return params.toString();
}

export default function LaporanIndex({ penggajians, grandTotal, totalSesi, grades, transports, filters }: LaporanProps) {
    const qs = buildQueryString(filters);

    const updateFilter = (key: string, value: string) => {
        router.get(route('laporan.index'), { ...filters, [key]: value }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        router.get(route('laporan.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Boolean(filters.periode || filters.filter_grade || filters.filter_mapel || filters.filter_transport);

    const handleExportPdf = () => {
        window.location.href = route('laporan.exportPdf') + '?' + qs;
    };

    const handleExportExcel = () => {
        window.location.href = route('laporan.exportExcel') + '?' + qs;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan & Rekap" />

            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan & Rekapitulasi</h1>
                    <p className="text-sm text-gray-500 mt-1">Rekapitulasi penggajian guru per periode dan ekspor dokumen laporan</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                        <Icon icon="lucide:printer" className="text-base text-gray-500" />
                        <span>Cetak</span>
                    </button>
                    <button type="button" onClick={handleExportPdf}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
                        <Icon icon="lucide:file-down" className="text-base" />
                        <span>Export PDF</span>
                    </button>
                    <button type="button" onClick={handleExportExcel}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                        <Icon icon="lucide:table" className="text-base" />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Filter Section (Hidden on Print) */}
            <Card className="print:hidden mb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Periode (Bulan/Tahun)</label>
                        <input type="month" defaultValue={filters.periode || ''} onChange={(e) => updateFilter('periode', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors" />
                    </div>
                    <div className="w-full md:w-44">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filter Grade</label>
                        <select defaultValue={filters.filter_grade || ''} onChange={(e) => updateFilter('filter_grade', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors">
                            <option value="">Semua Grade</option>
                            {grades.map((g) => <option key={g.id} value={g.id}>{g.kode_grade}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-36">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mapel</label>
                        <select defaultValue={filters.filter_mapel || ''} onChange={(e) => updateFilter('filter_mapel', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors">
                            <option value="">Semua</option>
                            <option value="IPA">IPA</option>
                            <option value="MTK">MTK</option>
                        </select>
                    </div>
                    <div className="w-full md:w-44">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transport</label>
                        <select defaultValue={filters.filter_transport || ''} onChange={(e) => updateFilter('filter_transport', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors">
                            <option value="">Semua Transport</option>
                            {transports.map((t) => <option key={t.id} value={t.id}>{t.jenis}</option>)}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <div>
                            <button type="button" onClick={resetFilters}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition-colors">
                                <Icon icon="lucide:rotate-ccw" className="text-gray-400" />
                                <span>Reset</span>
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Stat Summary Cards */}
            <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard title="Total Data Guru Digaji" value={penggajians.length} icon="lucide:users" color="blue" />
                <StatCard title="Total Sesi Mengajar" value={`${totalSesi} Sesi`} icon="lucide:clock" color="green" />
                <StatCard title="Total Realisasi Dana" value={formatCurrency(grandTotal)} icon="lucide:banknote" color="amber" />
            </div>

            {/* Print-only Report Content */}
            <div className="print-report">
                <div className="mb-4 border-b-2 border-gray-900 pb-3">
                    <h1 className="text-xl font-bold text-gray-900">REKAPITULASI PENGGAJIAN GURU KPM PUSAT</h1>
                    <p className="text-xs text-gray-600">
                        Periode: {filters.periode || 'Semua Periode'} &bull; Dicetak pada {new Date().toLocaleDateString('id-ID')}
                    </p>
                </div>

                {/* Summary stats for print */}
                <div className="flex gap-6 mb-4 text-xs">
                    <span><strong>Total Guru:</strong> {penggajians.length}</span>
                    <span><strong>Total Sesi:</strong> {totalSesi}</span>
                    <span><strong>Grand Total:</strong> Rp {new Intl.NumberFormat('id-ID').format(grandTotal)}</span>
                </div>

                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="bg-gray-900 text-white px-3 py-2 text-left text-xs font-bold uppercase">No</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-left text-xs font-bold uppercase">Guru</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-left text-xs font-bold uppercase">Grade</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-left text-xs font-bold uppercase">Mapel</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-left text-xs font-bold uppercase">Periode</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-center text-xs font-bold uppercase">Sesi</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-left text-xs font-bold uppercase">Transport</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-right text-xs font-bold uppercase">Honor</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-right text-xs font-bold uppercase">Biaya Transport</th>
                            <th className="bg-gray-900 text-white px-3 py-2 text-right text-xs font-bold uppercase">Total Gaji</th>
                        </tr>
                    </thead>
                    <tbody>
                        {penggajians.length > 0 ? (
                            <>
                                {penggajians.map((p, i) => (
                                    <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500">{i + 1}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900">{p.guru?.nama ?? '-'}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs">{p.guru?.grade?.kode_grade ?? '-'}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs">{p.guru?.mapel ?? '-'}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs">{p.periode}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs text-center">{p.jumlah_sesi}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs">{p.transport?.jenis ?? '-'}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs text-right">Rp {new Intl.NumberFormat('id-ID').format(p.honor)}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs text-right">Rp {new Intl.NumberFormat('id-ID').format(p.total_transport)}</td>
                                        <td className="border border-gray-200 px-3 py-2 text-xs text-right font-bold">Rp {new Intl.NumberFormat('id-ID').format(p.total)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-900 text-white">
                                    <td colSpan={5} className="border border-gray-700 px-3 py-2 text-xs text-right font-bold">GRAND TOTAL</td>
                                    <td className="border border-gray-700 px-3 py-2 text-xs text-center font-bold">{totalSesi}</td>
                                    <td colSpan={3} className="border border-gray-700 px-3 py-2"></td>
                                    <td className="border border-gray-700 px-3 py-2 text-xs text-right font-bold">Rp {new Intl.NumberFormat('id-ID').format(grandTotal)}</td>
                                </tr>
                            </>
                        ) : (
                            <tr>
                                <td colSpan={10} className="border border-gray-200 px-3 py-8 text-center text-xs text-gray-500">
                                    Tidak ada data penggajian
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-200 pt-3">
                    Dicetak pada {new Date().toLocaleDateString('id-ID')} &mdash; SIGURU Sistem Informasi Penggajian Guru KPM Pusat
                </div>
            </div>

            {/* Screen-only Table Content */}
            <Card title="Rincian Rekap Penggajian" className="print:hidden">
                {penggajians.length > 0 ? (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Mapel</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead>Transport</TableHead>
                                        <TableHead className="text-right">Honor</TableHead>
                                        <TableHead className="text-right">Transport</TableHead>
                                        <TableHead className="text-right">Total Gaji</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {penggajians.map((p, i) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="text-gray-400 font-mono text-xs">{i + 1}</TableCell>
                                            <TableCell><span className="font-semibold text-gray-900">{p.guru?.nama ?? '-'}</span></TableCell>
                                            <TableCell><Badge variant="purple">{p.guru?.grade?.kode_grade ?? '-'}</Badge></TableCell>
                                            <TableCell><Badge variant={p.guru?.mapel === 'IPA' ? 'success' : 'info'}>{p.guru?.mapel ?? '-'}</Badge></TableCell>
                                            <TableCell><Badge>{p.periode}</Badge></TableCell>
                                            <TableCell><span className="font-semibold text-gray-700">{p.jumlah_sesi}</span> sesi</TableCell>
                                            <TableCell><span className="text-sm text-gray-600">{p.transport?.jenis ?? '-'}</span></TableCell>
                                            <TableCell className="text-right font-medium text-gray-700">{formatCurrency(p.honor)}</TableCell>
                                            <TableCell className="text-right font-medium text-gray-700">{formatCurrency(p.total_transport)}</TableCell>
                                            <TableCell className="text-right"><span className="font-bold text-gray-900">{formatCurrency(p.total)}</span></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {penggajians.map((p, i) => (
                                <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-xl space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-xs text-gray-400 font-mono">#{i + 1}</span>
                                            <h4 className="font-semibold text-gray-900">{p.guru?.nama ?? '-'}</h4>
                                            <div className="text-xs text-gray-500">Periode: <strong className="text-gray-700">{p.periode}</strong></div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="purple">{p.guru?.grade?.kode_grade ?? '-'}</Badge>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                                        <div><span className="text-gray-400">Sesi:</span> <span className="font-semibold text-gray-800">{p.jumlah_sesi} sesi</span></div>
                                        <div><span className="text-gray-400">Transport:</span> <span className="font-medium text-gray-800">{p.transport?.jenis ?? '-'}</span></div>
                                        <div><span className="text-gray-400">Honor:</span> <span className="font-medium text-gray-800">{formatCurrency(p.honor)}</span></div>
                                        <div><span className="text-gray-400">Total:</span> <span className="font-bold text-gray-900">{formatCurrency(p.total)}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grand Total Box */}
                        <div className="mt-6 p-4 bg-gray-900 rounded-xl flex items-center justify-between text-white">
                            <div>
                                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block">Grand Total Pengeluaran Gaji</span>
                                <span className="text-xs text-gray-400">Total akumulasi seluruh guru pada laporan ini</span>
                            </div>
                            <span className="text-2xl font-black">{formatCurrency(grandTotal)}</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Icon icon="lucide:file-text" className="text-2xl text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Tidak ada data penggajian</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Tidak ditemukan rekapan penggajian untuk kriteria filter yang Anda tentukan.</p>
                        {hasActiveFilters && (
                            <div className="mt-4">
                                <button type="button" onClick={resetFilters}
                                    className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
