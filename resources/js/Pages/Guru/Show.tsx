import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Badge from '@/Components/ui/badge';
import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Guru } from '@/types';

interface GuruShowProps {
    guru: Guru;
}

export default function GuruShow({ guru }: GuruShowProps) {
    return (
        <AuthenticatedLayout>
            <Head title={`Detail Guru - ${guru.nama}`} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                        <Icon icon="lucide:arrow-left" className="text-lg" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Detail Profil Guru</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Informasi penugasan dan riwayat penggajian guru</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('guru.edit', guru.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:pencil" /> Edit Data Guru
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information Card */}
                <Card className="lg:col-span-1">
                    <div className="text-center pb-2">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-md">
                            {guru.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{guru.nama}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <Badge variant="purple">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                            <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>{guru.mapel}</Badge>
                        </div>

                        <div className="mt-6 space-y-2.5 text-left">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:book-open" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Mata Pelajaran</p>
                                    <p className="text-sm font-semibold text-slate-900">{guru.mapel}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:layers" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Jenjang Penugasan</p>
                                    <p className="text-sm font-semibold text-slate-900">{guru.jenjang ?? '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:banknote" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Honor per Sesi</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {formatCurrency(guru.grade?.honor_per_sesi ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Salary History */}
                <div className="lg:col-span-2">
                    <Card
                        title="Riwayat Penggajian Guru"
                        description="Daftar seluruh sesi dan honor yang telah disalurkan"
                        headerAction={
                            <Link
                                href={route('penggajian.create')}
                                className="text-xs font-semibold text-slate-900 hover:underline inline-flex items-center gap-1"
                            >
                                <Icon icon="lucide:plus" /> Input Gaji
                            </Link>
                        }
                    >
                        {guru.penggajians && guru.penggajians.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead>Transport</TableHead>
                                        <TableHead>Honor</TableHead>
                                        <TableHead>Total Diterima</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {guru.penggajians.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <Badge>{p.periode}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-700">
                                                {p.jumlah_sesi} sesi
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {p.transport?.jenis ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {formatCurrency(p.honor)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-slate-900">
                                                    {formatCurrency(p.total)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={route('penggajian.show', p.id)}
                                                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                                                    title="Lihat Slip"
                                                >
                                                    <Icon icon="lucide:eye" className="text-base" />
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <Icon icon="lucide:file-text" className="text-2xl" />
                                </div>
                                <p className="text-sm font-semibold text-slate-800">Belum Ada Riwayat Penggajian</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Guru ini belum memiliki catatan penggajian di periode manapun.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
