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
import { formatCurrency } from '@/lib/utils';

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
    }, [searchTerm, filters]);

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

            <div className="page-header animate-fade-in mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="page-title">Data Guru</h1>
                    <p className="page-subtitle">Kelola data guru, domisili, kontak, rekening & tunjangan khusus</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <a
                        href={route('guru.exportCredentialsPdf', { search: filters.search, filter_grade: filters.filter_grade, filter_mapel: filters.filter_mapel })}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow active:scale-98 w-full sm:w-auto"
                    >
                        <Icon icon="lucide:file-down" className="text-base text-rose-600" /> Download PDF Login
                    </a>
                    <Link
                        href={route('guru.create')}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-98 w-full sm:w-auto"
                    >
                        <Icon icon="lucide:plus" className="text-base" /> Tambah Guru Baru
                    </Link>
                </div>
            </div>

            <Card>
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6 sm:mb-8 items-stretch lg:items-center">
                    <div className="flex-1 relative min-w-0">
                        <Icon icon="lucide:search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari nama, domisili, atau nomor telepon..."
                            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 lg:flex-nowrap flex-wrap">
                        <div className="relative flex-1 lg:flex-none lg:w-[176px] min-w-0">
                            <select
                                value={filters.filter_grade || ''}
                                onChange={(e) => handleFilterGrade(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm cursor-pointer truncate"
                            >
                                <option value="">Semua Grade</option>
                                {grades.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        Grade {g.kode_grade}
                                    </option>
                                ))}
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        </div>
                        <div className="relative flex-1 lg:flex-none lg:w-[164px] min-w-0">
                            <select
                                value={filters.filter_mapel || ''}
                                onChange={(e) => handleFilterMapel(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm cursor-pointer truncate"
                            >
                                <option value="">Semua Mapel</option>
                                <option value="IPA">IPA</option>
                                <option value="MTK">MTK</option>
                            </select>
                            <Icon icon="lucide:chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                            >
                                <Icon icon="lucide:rotate-ccw" className="text-sm" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                {gurus.data.length > 0 ? (
                    <>
                        <div className="hidden lg:block overflow-x-auto -mx-6 px-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>Nama Guru</TableHead>
                                        <TableHead>Kontak</TableHead>
                                        <TableHead>Domisili</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Mapel</TableHead>
                                        <TableHead>Tunjangan</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gurus.data.map((guru, index) => (
                                        <TableRow key={guru.id}>
                                            <TableCell className="font-medium text-slate-400">{gurus.from + index}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-900/5 text-slate-800 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {guru.nama.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate max-w-[150px]">{guru.nama}</p>
                                                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{guru.user?.email ?? '-'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-700">{guru.nomor_telepon || '-'}</div>
                                                {guru.bank && <div className="text-xs text-slate-400">{guru.bank} • {guru.nomor_rekening ?? '-'}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 flex items-center gap-1">
                                                    <Icon icon="lucide:map-pin" className="text-slate-400 text-xs" /> {guru.domisili || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="purple">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>{guru.mapel}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-bold ${Number(guru.tunjangan_khusus) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {Number(guru.tunjangan_khusus) > 0 ? formatCurrency(Number(guru.tunjangan_khusus)) : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('guru.show', guru.id)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Detail">
                                                        <Icon icon="lucide:eye" className="text-base" />
                                                    </Link>
                                                    <Link href={route('guru.edit', guru.id)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                                                        <Icon icon="lucide:pencil" className="text-base" />
                                                    </Link>
                                                    <button type="button" onClick={() => openDeleteModal(guru)} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                                        <Icon icon="lucide:trash-2" className="text-base" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Tablet compact table */}
                        <div className="hidden md:block lg:hidden">
                            <div className="space-y-3">
                                {gurus.data.map((guru) => (
                                    <div key={guru.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">{guru.nama.substring(0, 2).toUpperCase()}</div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">{guru.nama}</p>
                                                <p className="text-xs text-slate-500 truncate">{guru.domisili || '-'} • {guru.nomor_telepon || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link href={route('guru.show', guru.id)} className="p-2 bg-slate-50 rounded-lg"><Icon icon="lucide:eye" /></Link>
                                            <Link href={route('guru.edit', guru.id)} className="p-2 bg-slate-50 rounded-lg"><Icon icon="lucide:pencil" /></Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {gurus.data.map((guru, index) => (
                                <div key={guru.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {guru.nama.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{guru.nama}</p>
                                                <p className="text-xs text-slate-400 truncate">{guru.user?.email ?? '-'}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Icon icon="lucide:phone" className="text-[11px]" />{guru.nomor_telepon || '-'}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">#{gurus.from + index}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="purple">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                                        <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>{guru.mapel}</Badge>
                                        {Number(guru.tunjangan_khusus) > 0 && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">{formatCurrency(Number(guru.tunjangan_khusus))}</span>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-slate-50 rounded-lg p-2.5">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Domisili</p>
                                            <p className="font-semibold text-slate-700 truncate">{guru.domisili || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2.5">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Rekening</p>
                                            <p className="font-semibold text-slate-700 truncate">{guru.bank ? `${guru.bank} - ${guru.nomor_rekening}` : '-'}</p>
                                        </div>
                                    </div>

                                    {guru.keterangan_mengajar && (
                                        <p className="text-xs text-slate-500 bg-sky-50 border border-sky-100 rounded-xl p-2.5 line-clamp-2">
                                            <Icon icon="lucide:info" className="inline mr-1 text-sky-500" />{guru.keterangan_mengajar}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                        <Link href={route('guru.show', guru.id)} className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1">
                                            <Icon icon="lucide:eye" /> Detail
                                        </Link>
                                        <Link href={route('guru.edit', guru.id)} className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1">
                                            <Icon icon="lucide:pencil" /> Edit
                                        </Link>
                                        <button type="button" onClick={() => openDeleteModal(guru)} className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center gap-1">
                                            <Icon icon="lucide:trash-2" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <Pagination links={gurus.links} />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 sm:py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Icon icon="lucide:users" className="text-3xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{hasActiveFilters ? 'Tidak ada guru yang sesuai' : 'Belum ada data guru'}</h3>
                        <p className="text-sm text-slate-500 mt-1 w-full mx-auto">{hasActiveFilters ? 'Coba ubah atau reset kata kunci pencarian dan filter.' : 'Mulai dengan menambahkan data guru baru.'}</p>
                        <div className="mt-6">
                            {hasActiveFilters ? (
                                <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors">
                                    <Icon icon="lucide:rotate-ccw" /> Reset Semua Filter
                                </button>
                            ) : (
                                <Link href={route('guru.create')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                                    <Icon icon="lucide:plus" /> Tambah Guru Sekarang
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            <Modal show={deleteId !== null} onClose={() => setDeleteId(null)}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Data Guru?</h3>
                    <p className="text-sm text-slate-500 mb-6">Apakah yakin ingin menghapus <strong className="text-slate-800">{guruToDelete?.nama}</strong>? Data terkait juga akan terhapus.</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button variant="danger" processing={deleting} onClick={confirmDelete}>Ya, Hapus Data</Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
