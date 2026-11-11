import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import Pagination from '@/Components/ui/pagination';
import EmptyState from '@/Components/ui/empty-state';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler, useEffect, useState } from 'react';
import { Guru, Grade, Program, PaginatedData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GuruIndexProps {
    gurus: PaginatedData<Guru>;
    grades: Grade[];
    programs: Program[];
    filters: { search?: string; filter_grade?: string; filter_mapel?: string; filter_program?: string };
}

export default function GuruIndex({ gurus, grades, programs, filters }: GuruIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isSearching, setIsSearching] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [guruToDelete, setGuruToDelete] = useState<Guru | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (searchTerm !== (filters.search || '')) {
            setIsSearching(true);
        }
        const timer = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                router.get(
                    route('guru.index'),
                    { ...filters, search: searchTerm || undefined },
                    {
                        preserveState: true,
                        replace: true,
                        onFinish: () => setIsSearching(false),
                    }
                );
            } else {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const handleFilterGrade = (value: string) => {
        setIsSearching(true);
        router.get(
            route('guru.index'),
            { ...filters, filter_grade: value || undefined },
            { preserveState: true, replace: true, onFinish: () => setIsSearching(false) }
        );
    };

    const handleFilterMapel = (value: string) => {
        setIsSearching(true);
        router.get(
            route('guru.index'),
            { ...filters, filter_mapel: value || undefined },
            { preserveState: true, replace: true, onFinish: () => setIsSearching(false) }
        );
    };

    const handleFilterProgram = (value: string) => {
        setIsSearching(true);
        router.get(
            route('guru.index'),
            { ...filters, filter_program: value || undefined },
            { preserveState: true, replace: true, onFinish: () => setIsSearching(false) }
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        setIsSearching(true);
        router.get(route('guru.index'), {}, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const hasActiveFilters = Boolean(filters.search || filters.filter_grade || filters.filter_mapel || filters.filter_program);

    const formatTanggalBergabung = (tanggal: string | null): string =>
        tanggal
            ? new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';

    const openDeleteModal = (guru: Guru) => {
        setGuruToDelete(guru);
        setDeleteId(guru.id);
    };

    const confirmDelete: FormEventHandler = () => {
        if (deleteId) {
            setDeleting(true);
            router.delete(route('guru.destroy', deleteId), {
                preserveScroll: true,
                onFinish: () => setDeleting(false),
                onSuccess: () => {
                    setDeleteId(null);
                    setGuruToDelete(null);
                    router.reload({ preserveScroll: true });
                },
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Data Guru" />

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Data Guru</h1>
                    <p className="page-subtitle">Kelola data guru, domisili, kontak, rekening & tunjangan khusus</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                    <Button
                        as="a"
                        href={route('guru.exportCredentialsPdf', { search: filters.search, filter_grade: filters.filter_grade, filter_mapel: filters.filter_mapel })}
                        variant="secondary"
                        onClick={() => {
                            setIsExporting(true);
                            setTimeout(() => setIsExporting(false), 2500);
                        }}
                        processing={isExporting}
                        className="w-full sm:w-auto"
                        aria-label="Unduh data login guru format PDF"
                    >
                        <Icon icon="tabler:file-download" className="text-base text-rose-500" />
                        {isExporting ? 'Menyiapkan PDF...' : 'Download PDF Login'}
                    </Button>
                    <Link href={route('guru.create')} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto" aria-label="Tambah guru baru">
                            <Icon icon="tabler:plus" className="text-base" /> Tambah Guru Baru
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap mb-6 sm:mb-8">
                    <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                            {isSearching ? (
                                <Icon icon="tabler:loader-2" className="animate-spin text-indigo-600 text-base" />
                            ) : (
                                <Icon icon="tabler:search" className="text-slate-400 text-base" />
                            )}
                        </div>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari nama, domisili, atau nomor telepon..."
                            aria-label="Cari nama guru, domisili, atau nomor telepon"
                            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-[176px] min-w-0">
                            <select
                                value={filters.filter_grade || ''}
                                onChange={(e) => handleFilterGrade(e.target.value)}
                                aria-label="Filter berdasarkan grade"
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm cursor-pointer truncate"
                            >
                                <option value="">Semua Grade</option>
                                {grades.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        Grade {g.kode_grade}
                                    </option>
                                ))}
                            </select>
                            <Icon icon="tabler:chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        </div>
                        <div className="relative flex-1 sm:flex-none sm:w-[164px] min-w-0">
                            <select
                                value={filters.filter_mapel || ''}
                                onChange={(e) => handleFilterMapel(e.target.value)}
                                aria-label="Filter berdasarkan mata pelajaran"
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm cursor-pointer truncate"
                            >
                                <option value="">Semua Mapel</option>
                                <option value="IPA">IPA</option>
                                <option value="MTK">MTK</option>
                            </select>
                            <Icon icon="tabler:chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        </div>
                        <div className="relative flex-1 sm:flex-none sm:w-[176px] min-w-0">
                            <select
                                value={filters.filter_program || ''}
                                onChange={(e) => handleFilterProgram(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm cursor-pointer truncate"
                            >
                                <option value="">Semua Program</option>
                                {programs.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama}
                                    </option>
                                ))}
                            </select>
                            <Icon icon="tabler:chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                            >
                                <Icon icon="tabler:rotate-clockwise" className="text-sm" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                {gurus.data.length > 0 ? (
                    <>
                        <div className="hidden lg:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>Nama Guru</TableHead>
                                        <TableHead>Kontak</TableHead>
                                        <TableHead>Kota Domisili</TableHead>
                                        <TableHead>Tanggal Bergabung</TableHead>
                                        <TableHead>Pelatihan Suprarasional</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Mapel</TableHead>
                                        <TableHead>Program</TableHead>
                                        <TableHead>Tunjangan</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gurus.data.map((guru, index) => (
                                        <TableRow key={guru.id}>
                                            <TableCell className="font-medium text-slate-500">{gurus.from + index}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                        {guru.nama.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate max-w-[150px]">{guru.nama}</p>
                                                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{guru.user?.email ?? '-'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-700">{guru.nomor_telepon || '-'}</div>
                                                {guru.bank && <div className="text-xs text-slate-500">{guru.bank} • {guru.nomor_rekening ?? '-'}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 flex items-center gap-1">
                                                    <Icon icon="tabler:map-pin" className="text-slate-400 text-xs" /> {guru.domisili || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 flex items-center gap-1 whitespace-nowrap">
                                                    <Icon icon="tabler:calendar-event" className="text-slate-400 text-xs" /> {formatTanggalBergabung(guru.tanggal_bergabung)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {guru.pelatihan_suprarasional == null ? (
                                                    <span className="text-xs text-slate-500">Belum diisi</span>
                                                ) : (
                                                    <Badge variant={guru.pelatihan_suprarasional ? 'success' : 'default'} size="sm">
                                                        {guru.pelatihan_suprarasional ? 'IYA' : 'TIDAK'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="purple" size="sm">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'} size="sm">{guru.mapel}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {guru.programs && guru.programs.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {guru.programs.map((p) => (
                                                            <Badge key={p.id} variant="outline" size="sm">{p.nama}</Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-bold ${Number(guru.tunjangan_khusus) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    {Number(guru.tunjangan_khusus) > 0 ? formatCurrency(Number(guru.tunjangan_khusus)) : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('guru.show', guru.id)}
                                                        className="min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                        title="Detail"
                                                        aria-label={`Lihat detail guru ${guru.nama}`}
                                                    >
                                                        <Icon icon="tabler:eye" className="text-lg" />
                                                    </Link>
                                                    <Link
                                                        href={route('guru.edit', guru.id)}
                                                        className="min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                        title="Edit"
                                                        aria-label={`Edit data guru ${guru.nama}`}
                                                    >
                                                        <Icon icon="tabler:pencil" className="text-lg" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(guru)}
                                                        className="min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                        title="Hapus"
                                                        aria-label={`Hapus data guru ${guru.nama}`}
                                                    >
                                                        <Icon icon="tabler:trash" className="text-lg" />
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
                                    <div key={guru.id} className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 flex items-center justify-between gap-3 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)] shrink-0">{guru.nama.substring(0, 2).toUpperCase()}</div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">{guru.nama}</p>
                                                <p className="text-xs text-slate-500 truncate">{guru.domisili || '-'} • {guru.nomor_telepon || '-'}</p>
                                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <Icon icon="tabler:calendar-event" className="text-xs shrink-0" />
                                                    Bergabung {formatTanggalBergabung(guru.tanggal_bergabung)}
                                                    {guru.pelatihan_suprarasional != null && (
                                                        <span className={`font-bold ${guru.pelatihan_suprarasional ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                            • Suprarasional: {guru.pelatihan_suprarasional ? 'IYA' : 'TIDAK'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Link
                                                href={route('guru.show', guru.id)}
                                                className="min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                                                aria-label={`Detail guru ${guru.nama}`}
                                            >
                                                <Icon icon="tabler:eye" className="text-lg" />
                                            </Link>
                                            <Link
                                                href={route('guru.edit', guru.id)}
                                                className="min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                                                aria-label={`Edit data guru ${guru.nama}`}
                                            >
                                                <Icon icon="tabler:pencil" className="text-lg" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(guru)}
                                                className="min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                                                aria-label={`Hapus data guru ${guru.nama}`}
                                            >
                                                <Icon icon="tabler:trash" className="text-lg" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {gurus.data.map((guru, index) => (
                                <div key={guru.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                {guru.nama.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{guru.nama}</p>
                                                <p className="text-xs text-slate-500 truncate">{guru.user?.email ?? '-'}</p>
                                                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1"><Icon icon="tabler:phone" className="text-xs" />{guru.nomor_telepon || '-'}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">#{gurus.from + index}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="purple" size="sm">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                                        <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'} size="sm">{guru.mapel}</Badge>
                                        {guru.programs?.map((p) => (
                                            <Badge key={p.id} variant="outline" size="sm">{p.nama}</Badge>
                                        ))}
                                        {Number(guru.tunjangan_khusus) > 0 && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">{formatCurrency(Number(guru.tunjangan_khusus))}</span>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 rounded-xl p-2.5">
                                            <p className="text-slate-500 text-xs font-bold uppercase">Kota Domisili</p>
                                            <p className="font-semibold text-slate-800 truncate mt-0.5">{guru.domisili || '-'}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 rounded-xl p-2.5">
                                            <p className="text-slate-500 text-xs font-bold uppercase">Rekening</p>
                                            <p className="font-semibold text-slate-800 truncate mt-0.5">{guru.bank ? `${guru.bank} - ${guru.nomor_rekening}` : '-'}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 rounded-xl p-2.5">
                                            <p className="text-slate-500 text-xs font-bold uppercase">Bergabung di KPM</p>
                                            <p className="font-semibold text-slate-800 truncate mt-0.5">{formatTanggalBergabung(guru.tanggal_bergabung)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/50 rounded-xl p-2.5">
                                            <p className="text-slate-500 text-xs font-bold uppercase">Pelatihan Suprarasional</p>
                                            {guru.pelatihan_suprarasional == null ? (
                                                <p className="font-semibold text-slate-500 mt-0.5">Belum diisi</p>
                                            ) : (
                                                <p className={`font-bold mt-0.5 ${guru.pelatihan_suprarasional ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                    {guru.pelatihan_suprarasional ? 'IYA' : 'TIDAK'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {guru.keterangan_mengajar && (
                                        <p className="text-xs text-slate-600 bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 line-clamp-2">
                                            <Icon icon="tabler:info-circle" className="inline mr-1 text-indigo-500 text-sm" />{guru.keterangan_mengajar}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                        <Link
                                            href={route('guru.show', guru.id)}
                                            className="min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 inline-flex items-center gap-1.5 transition-colors"
                                            aria-label={`Detail guru ${guru.nama}`}
                                        >
                                            <Icon icon="tabler:eye" className="text-base" /> Detail
                                        </Link>
                                        <Link
                                            href={route('guru.edit', guru.id)}
                                            className="min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 inline-flex items-center gap-1.5 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)] transition-all"
                                            aria-label={`Edit data guru ${guru.nama}`}
                                        >
                                            <Icon icon="tabler:pencil" className="text-base" /> Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(guru)}
                                            className="min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                            aria-label={`Hapus data guru ${guru.nama}`}
                                        >
                                            <Icon icon="tabler:trash" className="text-base" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <Pagination
                                links={gurus.links}
                                from={gurus.from}
                                to={gurus.to}
                                total={gurus.total}
                            />
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon="tabler:users"
                        title={hasActiveFilters ? 'Tidak ada guru yang sesuai' : 'Belum ada data guru'}
                        description={hasActiveFilters ? 'Coba ubah atau reset kata kunci pencarian dan filter.' : 'Mulai dengan menambahkan data guru baru.'}
                    >
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                            {hasActiveFilters ? (
                                <Button variant="secondary" onClick={resetFilters}>
                                    <Icon icon="tabler:rotate-clockwise" className="text-sm" /> Reset Semua Filter
                                </Button>
                            ) : (
                                <Link href={route('guru.create')}>
                                    <Button>
                                        <Icon icon="tabler:plus" className="text-base" /> Tambah Guru Sekarang
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </EmptyState>
                )}
            </Card>

            <Modal show={deleteId !== null} onClose={() => setDeleteId(null)} showCloseButton={true}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-rose-100">
                        <Icon icon="tabler:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Data Guru?</h3>
                    <p className="text-sm text-slate-500 mb-6">Apakah yakin ingin menghapus <strong className="text-slate-800">{guruToDelete?.nama}</strong>? Data terkait juga akan terhapus.</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button variant="danger" processing={deleting} onClick={confirmDelete}>Ya, Hapus Data</Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
