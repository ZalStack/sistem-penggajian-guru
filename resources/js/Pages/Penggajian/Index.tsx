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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Penggajian</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola data honor dan penggajian guru per periode</p>
                </div>
                <Link
                    href={route('penggajian.create')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Icon icon="lucide:plus" className="text-base" />
                    <span>Input Penggajian</span>
                </Link>
            </div>

            <Card className="mb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Periode (Bulan/Tahun)</label>
                        <input
                            type="month"
                            defaultValue={filters.periode || ''}
                            onChange={(e) => updateFilter('periode', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
                        />
                    </div>
                    <div className="w-full md:w-52">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filter Grade</label>
                        <select
                            defaultValue={filters.filter_grade || ''}
                            onChange={(e) => updateFilter('filter_grade', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
                        >
                            <option value="">Semua Grade</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.kode_grade} ({formatCurrency(g.honor_per_sesi)}/sesi)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-52">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filter Transport</label>
                        <select
                            defaultValue={filters.filter_transport || ''}
                            onChange={(e) => updateFilter('filter_transport', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
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
                        <div>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <Icon icon="lucide:rotate-ccw" className="text-gray-400" />
                                <span>Reset</span>
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                {penggajians.data.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
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
                                            <TableCell className="text-gray-400 font-mono text-xs">{penggajians.from + index}</TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">{p.guru?.nama ?? '-'}</div>
                                                <div className="text-xs text-gray-400">{p.guru?.mapel ?? '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="purple">{p.guru?.grade?.kode_grade ?? '-'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="default">{p.periode}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-gray-700">{p.jumlah_sesi}</span> sesi
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">{p.transport?.jenis ?? '-'}</span>
                                            </TableCell>
                                            <TableCell>{formatCurrency(p.honor)}</TableCell>
                                            <TableCell>
                                                <span className="font-bold text-gray-900">{formatCurrency(p.total)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('penggajian.show', p.id)}
                                                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Lihat Detail Slip"
                                                    >
                                                        <Icon icon="lucide:eye" className="text-lg" />
                                                    </Link>
                                                    <Link
                                                        href={route('penggajian.edit', p.id)}
                                                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Penggajian"
                                                    >
                                                        <Icon icon="lucide:pencil" className="text-lg" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteId(p.id)}
                                                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden space-y-3">
                            {penggajians.data.map((p) => (
                                <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-xl space-y-3 hover:border-gray-300 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900">{p.guru?.nama ?? '-'}</div>
                                            <div className="text-xs text-gray-500">{p.guru?.mapel} &bull; Periode: <span className="font-medium text-gray-800">{p.periode}</span></div>
                                        </div>
                                        <Badge variant="purple">{p.guru?.grade?.kode_grade ?? '-'}</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                                        <div>
                                            <span className="text-gray-400">Jumlah Sesi:</span>{' '}
                                            <span className="font-semibold text-gray-800">{p.jumlah_sesi} sesi</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Transport:</span>{' '}
                                            <span className="font-medium text-gray-800">{p.transport?.jenis ?? '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Honor:</span>{' '}
                                            <span className="font-medium text-gray-800">{formatCurrency(p.honor)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Total Gaji:</span>{' '}
                                            <span className="font-bold text-gray-900">{formatCurrency(p.total)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                                        <Link
                                            href={route('penggajian.show', p.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:eye" /> Detail
                                        </Link>
                                        <Link
                                            href={route('penggajian.edit', p.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:pencil" /> Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteId(p.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Icon icon="lucide:trash-2" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <Pagination links={penggajians.links} />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Icon icon="lucide:calculator" className="text-2xl text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Belum ada data penggajian</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            {hasActiveFilters ? 'Tidak ada data penggajian yang cocok dengan filter yang dipilih.' : 'Mulai dengan menginput data penggajian guru untuk periode ini.'}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                >
                                    Reset Filter
                                </button>
                            )}
                            <Link
                                href={route('penggajian.create')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
                            >
                                <Icon icon="lucide:plus" /> Input Penggajian
                            </Link>
                        </div>
                    </div>
                )}
            </Card>

            <Modal show={deleteId !== null} onClose={() => setDeleteId(null)}>
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:alert-triangle" className="text-red-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Hapus Data Penggajian?</h3>
                    <p className="text-sm text-gray-500 mb-6">
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
