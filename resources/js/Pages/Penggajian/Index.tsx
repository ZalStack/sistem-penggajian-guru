import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import Pagination from '@/Components/ui/pagination';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Penggajian, Grade, Transport, PaginatedData } from '@/types';

interface PenggajianIndexProps {
    penggajians: PaginatedData<Penggajian>;
    grades: Grade[];
    transports: Transport[];
    filters: { periode?: string; filter_grade?: string; filter_transport?: string };
}

export default function PenggajianIndex({ penggajians, grades, transports, filters }: PenggajianIndexProps) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const updateFilter = (key: string, value: string) => {
        router.get(route('penggajian.index'), { ...filters, [key]: value }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        router.get(route('penggajian.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Boolean(filters.periode || filters.filter_grade || filters.filter_transport);

    const handleDelete = () => {
        if (deleteId) {
            setDeleting(true);
            router.delete(route('penggajian.destroy', deleteId), {
                onFinish: () => setDeleting(false),
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Penggajian" />

            <div className="animate-fade-in page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="min-w-0">
                    <h1 className="page-title">Data Penggajian</h1>
                    <p className="page-subtitle">Kelola data honor dan penggajian guru per periode</p>
                </div>
                <Link
                    href={route('penggajian.create')}
                    className="btn-primary w-full sm:w-auto"
                >
                    <Icon icon="lucide:plus" className="text-base" />
                    <span>Input Penggajian</span>
                </Link>
            </div>

            <Card className="mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 min-w-0">
                        <label className="block text-[11px] sm:text-[12px] font-semibold text-slate-600 mb-2">Periode (Bulan/Tahun)</label>
                        <input
                            type="month"
                            value={filters.periode || ''}
                            onChange={(e) => updateFilter('periode', e.target.value)}
                            className="input-modern py-2.5"
                        />
                    </div>
                    <div className="w-full sm:w-52">
                        <label className="block text-[11px] sm:text-[12px] font-semibold text-slate-600 mb-2">Filter Grade</label>
                        <select
                            value={filters.filter_grade || ''}
                            onChange={(e) => updateFilter('filter_grade', e.target.value)}
                            className="select-modern py-2.5"
                        >
                            <option value="">Semua Grade</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.kode_grade} ({formatCurrency(g.honor_per_sesi)}/sesi)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-52">
                        <label className="block text-[11px] sm:text-[12px] font-semibold text-slate-600 mb-2">Filter Transport</label>
                        <select
                            value={filters.filter_transport || ''}
                            onChange={(e) => updateFilter('filter_transport', e.target.value)}
                            className="select-modern py-2.5"
                        >
                            <option value="">Semua Transport</option>
                            {transports.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.jenis} ({formatCurrency(t.biaya)})
                                </option>
                            ))}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <div className="w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="btn-secondary w-full sm:w-auto py-2.5"
                            >
                                <Icon icon="lucide:rotate-ccw" className="text-slate-400" />
                                <span>Reset</span>
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                {penggajians.data.length > 0 ? (
                    <>
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead>Transport</TableHead>
                                        <TableHead>Honor</TableHead>
                                        <TableHead>Total Gaji</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {penggajians.data.map((p, index) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="text-slate-400 font-mono text-xs">{penggajians.from + index}</TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-slate-900">{p.guru?.nama ?? '-'}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{p.guru?.mapel ?? '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="purple">{p.guru?.grade?.kode_grade ?? '-'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="default">{p.periode}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-extrabold text-slate-700">{p.jumlah_sesi}</span> <span className="text-xs text-slate-500">sesi</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">{p.transport?.jenis ?? '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{formatCurrency(p.honor)}</TableCell>
                                            <TableCell>
                                                <span className="font-extrabold text-slate-900">{formatCurrency(p.total)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('penggajian.show', p.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Lihat Detail Slip"
                                                    >
                                                        <Icon icon="lucide:eye" className="text-lg" />
                                                    </Link>
                                                    <Link
                                                        href={route('penggajian.edit', p.id)}
                                                        className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Penggajian"
                                                    >
                                                        <Icon icon="lucide:pencil" className="text-lg" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteId(p.id)}
                                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Hapus Data"
                                                    >
                                                        <Icon icon="lucide:trash-2" className="text-lg" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="lg:hidden space-y-3 p-4">
                            {penggajians.data.map((p) => (
                                <div key={p.id} className="p-4 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-900 break-words">{p.guru?.nama ?? '-'}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 break-words">{p.guru?.mapel} &bull; Periode: <span className="font-medium text-slate-800">{p.periode}</span></div>
                                        </div>
                                        <Badge variant="purple">{p.guru?.grade?.kode_grade ?? '-'}</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gradient-to-br from-indigo-50 to-violet-50 p-3 rounded-lg border border-indigo-100 break-words">
                                        <div>
                                            <span className="text-slate-400">Jumlah Sesi:</span>{' '}
                                            <span className="font-extrabold text-slate-800">{p.jumlah_sesi} sesi</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Transport:</span>{' '}
                                            <span className="font-medium text-slate-800">{p.transport?.jenis ?? '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Honor:</span>{' '}
                                            <span className="font-medium text-slate-800">{formatCurrency(p.honor)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Total Gaji:</span>{' '}
                                            <span className="font-extrabold text-slate-900">{formatCurrency(p.total)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                        <Link
                                            href={route('penggajian.show', p.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:eye" /> Detail
                                        </Link>
                                        <Link
                                            href={route('penggajian.edit', p.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:pencil" /> Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteId(p.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:trash-2" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 px-4 pb-4">
                            <Pagination links={penggajians.links} />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 px-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
                            <Icon icon="lucide:calculator" className="text-2xl text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">Belum ada data penggajian</h3>
                        <p className="text-xs text-slate-500 mt-1.5 w-full mx-auto leading-relaxed break-words">
                            {hasActiveFilters ? 'Tidak ada data penggajian yang cocok dengan filter yang dipilih.' : 'Mulai dengan menginput data penggajian guru untuk periode ini.'}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                                >
                                    Reset Filter
                                </button>
                            )}
                            <Link
                                href={route('penggajian.create')}
                                className="btn-primary"
                            >
                                <Icon icon="lucide:plus" /> Input Penggajian
                            </Link>
                        </div>
                    </div>
                )}
            </Card>

            <Modal show={deleteId !== null} onClose={() => setDeleteId(null)}>
                <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Icon icon="lucide:alert-triangle" className="text-rose-600 text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Data Penggajian?</h3>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        Data penggajian yang dihapus tidak dapat dipulihkan kembali.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="danger" processing={deleting} onClick={handleDelete}>
                            Hapus
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
