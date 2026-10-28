import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import StatCard from '@/Components/ui/stat-card';
import Select from '@/Components/ui/select';
import Pagination from '@/Components/ui/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Fragment, useState } from 'react';
import { Penggajian, Guru, Grade, PaginatedData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Ringkasan {
    total_guru: number;
    total_honor: number;
    total_transport: number;
    total_tunjangan: number;
    grand_total: number;
    sudah_dibayar: number;
    belum_dibayar: number;
    nominal_belum_dibayar: number;
    total_sesi: number;
    total_hadir: number;
}

interface SalaryIndexProps {
    penggajians: PaginatedData<Penggajian>;
    gurus: (Guru & { grade?: Grade })[];
    filters: {
        periode?: string;
        filter_guru?: string;
        status_bayar?: string;
    };
    periodeDefault: string;
    periodeAktif: string;
    ringkasan: Ringkasan;
}

export default function SalaryIndex({ penggajians, gurus, filters, periodeDefault, periodeAktif, ringkasan }: SalaryIndexProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const calculateForm = useForm({
        periode: filters.periode ?? periodeDefault,
        guru_id: filters.filter_guru ?? '',
    });

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('penggajian.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        calculateForm.post(route('penggajian.calculate'));
    };

    const handlePay = (id: number) => {
        router.post(route('penggajian.pay', id));
    };

    const periodeLabel = new Date(periodeAktif + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <AuthenticatedLayout>
            <Head title="Penggajian Guru" />

            <div className="page-header animate-fade-in mb-8">
                <h1 className="page-title">Penggajian Guru</h1>
                <p className="page-subtitle mt-1">
                    Rekap honor per guru per periode, dihitung otomatis dari sesi mengajar yang tervalidasi lewat presensi.
                </p>
            </div>

            {/* Ringkasan periode aktif */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title={`Total Honor (${periodeLabel})`}
                    value={formatCurrency(ringkasan.grand_total)}
                    icon="lucide:wallet"
                    color="slate"
                    description={`Honor ${formatCurrency(ringkasan.total_honor)} + transport ${formatCurrency(ringkasan.total_transport)}`}
                    className="break-words"
                />
                <StatCard
                    title="Sudah Dibayar"
                    value={formatCurrency(ringkasan.grand_total - ringkasan.nominal_belum_dibayar)}
                    icon="lucide:check-circle"
                    color="success"
                    description={`${ringkasan.sudah_dibayar} dari ${ringkasan.total_guru} guru`}
                    className="break-words"
                />
                <StatCard
                    title="Belum Dibayar"
                    value={formatCurrency(ringkasan.nominal_belum_dibayar)}
                    icon="lucide:clock"
                    color="warning"
                    description={`${ringkasan.belum_dibayar} guru menunggu pembayaran`}
                    className="break-words"
                />
                <StatCard
                    title="Total Sesi / Hadir"
                    value={`${ringkasan.total_sesi} / ${ringkasan.total_hadir}`}
                    icon="lucide:book-open"
                    color="accent"
                    description="Sesi terjadwal & kehadiran valid"
                />
            </div>

            {/* Filter & Hitung Gaji */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
                <Card title="Filter Data" description="Saring rekap honor sesuai kebutuhan" className="xl:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <Input
                            label="Periode"
                            type="month"
                            value={filters.periode ?? ''}
                            onChange={(e) => handleFilterChange('periode', e.target.value)}
                        />
                        <Select
                            label="Guru"
                            value={filters.filter_guru ?? ''}
                            onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                            options={gurus.map((g) => ({ value: g.id, label: g.nama }))}
                            placeholder="Semua Guru"
                        />
                        <Select
                            label="Status Bayar"
                            value={filters.status_bayar ?? ''}
                            onChange={(e) => handleFilterChange('status_bayar', e.target.value)}
                            options={[
                                { value: 'belum_dibayar', label: 'Belum Dibayar' },
                                { value: 'sudah_dibayar', label: 'Sudah Dibayar' },
                            ]}
                            placeholder="Semua Status"
                        />
                    </div>
                </Card>

                <Card title="Hitung Ulang Gaji" description="Perbarui rekap dari data presensi & sesi valid" className="xl:col-span-2">
                    <form onSubmit={handleCalculate} className="space-y-5">
                        <Input
                            label="Periode"
                            type="month"
                            value={calculateForm.data.periode}
                            onChange={(e) => calculateForm.setData('periode', e.target.value)}
                            error={calculateForm.errors.periode}
                            required
                        />
                        <Select
                            label="Guru (opsional)"
                            value={calculateForm.data.guru_id}
                            onChange={(e) => calculateForm.setData('guru_id', e.target.value)}
                            options={gurus.map((g) => ({ value: g.id, label: g.nama }))}
                            placeholder="Semua guru"
                            error={calculateForm.errors.guru_id}
                        />
                        <Button type="submit" processing={calculateForm.processing} className="w-full justify-center py-3">
                            <Icon icon="lucide:calculator" className="w-4 h-4" />
                            Hitung Gaji Sekarang
                        </Button>
                        <p className="text-xs text-center text-slate-500">
                            Perhitungan otomatis dari jumlah sesi hadir × honor grade + transport + tunjangan khusus.
                        </p>
                    </form>
                </Card>
            </div>

            {/* Tabel rekap */}
            <Card
                title="Daftar Rekap Honor"
                description={`Menampilkan ${penggajians.total} rekap honor${filters.periode ? ` periode ${periodeLabel}` : ' seluruh periode'}`}
            >
                {penggajians.data.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]">
                            <Icon icon="lucide:inbox" className="text-2xl" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">Tidak ada data penggajian</p>
                        <p className="text-xs text-slate-500 mt-1">Gunakan filter atau hitung gaji untuk periode baru</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block -mx-8">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14">No</TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead className="text-center">Sesi</TableHead>
                                        <TableHead className="text-center">Hadir</TableHead>
                                        <TableHead>Honor</TableHead>
                                        <TableHead>Transport</TableHead>
                                        <TableHead>Tunjangan</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {penggajians.data.map((p, index) => (
                                        <Fragment key={p.id}>
                                            <TableRow className="hover:bg-indigo-50/40">
                                                <TableCell className="font-medium text-slate-500">
                                                    {(penggajians.current_page - 1) * penggajians.per_page + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                                        className="flex items-center gap-3 text-left group"
                                                        title="Lihat rincian perhitungan"
                                                    >
                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                            {p.guru?.nama?.substring(0, 2).toUpperCase() ?? 'GU'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-semibold text-slate-900 block truncate group-hover:text-indigo-700 transition-colors">
                                                                {p.guru?.nama ?? '-'}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                                                                <Icon icon={expandedId === p.id ? 'lucide:chevron-up' : 'lucide:chevron-down'} className="text-[11px]" />
                                                                Rincian perhitungan
                                                            </span>
                                                        </div>
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-700 font-mono text-xs bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                                                        {p.periode}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">{p.jumlah_sesi}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-slate-700 font-medium">{p.jumlah_hadir}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-slate-900">
                                                        {formatCurrency(p.honor)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600">
                                                        {formatCurrency(p.total_transport)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600">
                                                        {formatCurrency(p.tunjangan_khusus)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-slate-900">
                                                        {formatCurrency(p.total)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {p.status_bayar === 'sudah_dibayar' ? (
                                                        <Badge variant="success">Lunas</Badge>
                                                    ) : (
                                                        <Badge variant="warning">Belum</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={route('penggajian.payslip', p.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl transition-colors shadow-sm"
                                                            title="Unduh Slip Gaji PDF"
                                                        >
                                                            <Icon icon="lucide:download" className="w-3.5 h-3.5" />
                                                            PDF
                                                        </a>
                                                        {p.status_bayar === 'belum_dibayar' && (
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => handlePay(p.id)}
                                                                className="shadow-sm px-4"
                                                            >
                                                                <Icon icon="lucide:credit-card" className="w-4 h-4" />
                                                                Bayar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedId === p.id && (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="bg-indigo-50/40 p-0">
                                                        <div className="px-6 py-4">
                                                            <p className="text-[12px] font-[700] uppercase tracking-wider text-slate-500 mb-3">
                                                                Rincian Per Program &amp; Transport
                                                            </p>
                                                            {p.detail && p.detail.length > 0 ? (
                                                                <div className="rounded-xl border border-indigo-100 bg-white overflow-hidden">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                                                                                <th className="px-4 py-2.5 font-[600]">Program</th>
                                                                                <th className="px-4 py-2.5 font-[600]">Transport</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-center">Sesi</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-center">Hadir</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-right">Honor</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-right">Transport</th>
                                                                                <th className="px-4 py-2.5 font-[600] text-right">Subtotal</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {p.detail.map((d, i) => (
                                                                                <tr key={i}>
                                                                                    <td className="px-4 py-2.5 font-[600] text-slate-800">{d.program}</td>
                                                                                    <td className="px-4 py-2.5 text-slate-600">{d.transport}</td>
                                                                                    <td className="px-4 py-2.5 text-center text-slate-600">{d.jumlah_sesi}</td>
                                                                                    <td className="px-4 py-2.5 text-center text-slate-600">{d.jumlah_hadir}</td>
                                                                                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(d.honor)}</td>
                                                                                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(d.transport_biaya)}</td>
                                                                                    <td className="px-4 py-2.5 text-right font-[700] text-slate-900">{formatCurrency(d.total)}</td>
                                                                                </tr>
                                                                            ))}
                                                                            {Number(p.tunjangan_khusus) > 0 && (
                                                                                <tr>
                                                                                    <td className="px-4 py-2.5 font-[600] text-slate-800" colSpan={6}>
                                                                                        Tunjangan Khusus
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-right font-[700] text-slate-900">
                                                                                        {formatCurrency(p.tunjangan_khusus)}
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[13px] text-slate-500">
                                                                    Tidak ada rincian program — honor dihitung langsung dari total kehadiran.
                                                                </p>
                                                            )}
                                                            <p className="text-[11.5px] text-slate-400 mt-3">
                                                                Data dihitung dari presensi valid pada periode {p.periode}. Baris yang sudah dibayar tidak dihitung ulang.
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4">
                            {penggajians.data.map((p) => (
                                <div
                                    key={p.id}
                                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all space-y-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                {p.guru?.nama?.substring(0, 2).toUpperCase() ?? 'GU'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {p.guru?.nama ?? '-'}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Grade {p.guru?.grade?.kode_grade ?? '-'} • {p.periode} • {p.jumlah_sesi} sesi
                                                </p>
                                            </div>
                                        </div>
                                        {p.status_bayar === 'sudah_dibayar' ? (
                                            <Badge variant="success">Lunas</Badge>
                                        ) : (
                                            <Badge variant="warning">Belum</Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hadir</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1">{p.jumlah_hadir} / {p.jumlah_sesi}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Transport</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1 break-words">{formatCurrency(p.total_transport)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-3 text-white shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Total</p>
                                            <p className="text-sm font-bold mt-1 break-words">{formatCurrency(p.total)}</p>
                                        </div>
                                    </div>

                                    {p.detail && p.detail.length > 0 && (
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 divide-y divide-indigo-100/60">
                                            {p.detail.map((d, i) => (
                                                <div key={i} className="flex items-center justify-between px-3.5 py-2 text-xs gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-[700] text-slate-800 truncate">{d.program}</p>
                                                        <p className="text-slate-500 truncate">{d.transport} · {d.jumlah_hadir} hadir</p>
                                                    </div>
                                                    <p className="font-[700] text-slate-900 shrink-0">{formatCurrency(d.total)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <a
                                            href={route('penggajian.payslip', p.id)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl transition-colors"
                                        >
                                            <Icon icon="lucide:download" className="w-4 h-4" />
                                            Slip PDF
                                        </a>
                                        {p.status_bayar === 'belum_dibayar' && (
                                            <Button
                                                variant="success"
                                                onClick={() => handlePay(p.id)}
                                                className="flex-1 justify-center py-2.5"
                                            >
                                                <Icon icon="lucide:credit-card" className="w-4 h-4" />
                                                Bayar Sekarang
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination links={penggajians.links} from={penggajians.from} to={penggajians.to} total={penggajians.total} />
                    </>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
