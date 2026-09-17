import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import Pagination from '@/Components/ui/pagination';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler, useEffect, useState } from 'react';
import { Guru, Grade, PaginatedData } from '@/types';

interface GuruIndexProps {
    gurus: PaginatedData<Guru>;
    grades: Grade[];
    filters: { search?: string; filter_grade?: string; filter_mapel?: string };
}

export default function GuruIndex({ gurus, grades, filters }: GuruIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [guruToDelete, setGuruToDelete] = useState<Guru | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                router.get(
                    route('guru.index'),
                    { ...filters, search: searchTerm || undefined },
                    { preserveState: true, replace: true }
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleFilterGrade = (value: string) => {
        router.get(
            route('guru.index'),
            { ...filters, filter_grade: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterMapel = (value: string) => {
        router.get(
            route('guru.index'),
            { ...filters, filter_mapel: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        router.get(route('guru.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Boolean(filters.search || filters.filter_grade || filters.filter_mapel);

    const openDeleteModal = (guru: Guru) => {
        setGuruToDelete(guru);
        setDeleteId(guru.id);
    };

    const confirmDelete: FormEventHandler = () => {
        if (deleteId) {
            setDeleting(true);
            router.delete(route('guru.destroy', deleteId), {
                onFinish: () => setDeleting(false),
                onSuccess: () => {
                    setDeleteId(null);
                    setGuruToDelete(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Data Guru" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data Guru</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola data guru pengajar, grade honorarium, dan mata pelajaran
                    </p>
                </div>
                <Link
                    href={route('guru.create')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-98"
                >
                    <Icon icon="lucide:plus" className="text-base" /> Tambah Guru Baru
                </Link>
            </div>

            <Card>
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <div className="flex-1 relative">
                        <Icon
                            icon="lucide:search"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"
                        />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari berdasarkan nama guru..."
                            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
                        />
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-3">
                        <select
                            value={filters.filter_grade || ''}
                            onChange={(e) => handleFilterGrade(e.target.value)}
                            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
                        >
                            <option value="">Semua Grade</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>
                                    Grade {g.kode_grade}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.filter_mapel || ''}
                            onChange={(e) => handleFilterMapel(e.target.value)}
                            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
                        >
                            <option value="">Semua Mapel</option>
                            <option value="IPA">IPA</option>
                            <option value="MTK">MTK</option>
                        </select>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                            >
                                <Icon icon="lucide:rotate-ccw" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                {gurus.data.length > 0 ? (
                    <>
                        {/* Desktop & Tablet Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">No</TableHead>
                                        <TableHead>Nama Guru</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Mapel</TableHead>
                                        <TableHead>Jenjang</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gurus.data.map((guru, index) => (
                                        <TableRow key={guru.id}>
                                            <TableCell className="font-medium text-slate-400">
                                                {gurus.from + index}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-900/5 text-slate-800 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {guru.nama.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{guru.nama}</p>
                                                        <p className="text-[11px] text-slate-400">ID #{guru.id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="purple">
                                                    Grade {guru.grade?.kode_grade ?? '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>
                                                    {guru.mapel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-600 text-sm">{guru.jenjang || '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('guru.show', guru.id)}
                                                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Lihat Detail Guru"
                                                    >
                                                        <Icon icon="lucide:eye" className="text-base" />
                                                    </Link>
                                                    <Link
                                                        href={route('guru.edit', guru.id)}
                                                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Edit Data Guru"
                                                    >
                                                        <Icon icon="lucide:pencil" className="text-base" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(guru)}
                                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Hapus Guru"
                                                    >
                                                        <Icon icon="lucide:trash-2" className="text-base" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden space-y-3">
                            {gurus.data.map((guru, index) => (
                                <div
                                    key={guru.id}
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {guru.nama.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{guru.nama}</p>
                                                <p className="text-xs text-slate-400">Jenjang: {guru.jenjang || '-'}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">
                                            #{gurus.from + index}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge variant="purple">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                                        <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>{guru.mapel}</Badge>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                        <Link
                                            href={route('guru.show', guru.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                                        >
                                            <Icon icon="lucide:eye" /> Detail
                                        </Link>
                                        <Link
                                            href={route('guru.edit', guru.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                                        >
                                            <Icon icon="lucide:pencil" /> Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(guru)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                                        >
                                            <Icon icon="lucide:trash-2" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <Pagination links={gurus.links} />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Icon icon="lucide:users" className="text-3xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            {hasActiveFilters ? 'Tidak ada guru yang sesuai' : 'Belum ada data guru'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? 'Coba ubah atau reset kata kunci pencarian dan filter yang dipilih.'
                                : 'Mulai dengan menambahkan data guru baru untuk memulai pengelolaan.'}
                        </p>
                        <div className="mt-6">
                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
                                >
                                    <Icon icon="lucide:rotate-ccw" /> Reset Semua Filter
                                </button>
                            ) : (
                                <Link
                                    href={route('guru.create')}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                                >
                                    <Icon icon="lucide:plus" /> Tambah Guru Sekarang
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={deleteId !== null} onClose={() => setDeleteId(null)}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Data Guru?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Apakah Anda yakin ingin menghapus data{' '}
                        <strong className="text-slate-800">{guruToDelete?.nama}</strong>? Data penggajian terkait juga akan ikut terhapus.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setDeleteId(null)}>
                            Batal
                        </Button>
                        <Button variant="danger" processing={deleting} onClick={confirmDelete}>
                            Ya, Hapus Data
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
