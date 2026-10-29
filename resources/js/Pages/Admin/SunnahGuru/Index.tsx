import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import Checkbox from '@/Components/Checkbox';
import EmptyState from '@/Components/ui/empty-state';
import Input from '@/Components/ui/input';
import Modal from '@/Components/ui/modal';
import Pagination from '@/Components/ui/pagination';
import Select from '@/Components/ui/select';
import StatCard from '@/Components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent, useMemo, useState } from 'react';

interface RecordItem {
    id: number;
    tanggal: string;
    tanggal_iso: string;
    total_poin: number;
    status_approval: 'pending' | 'approved' | 'rejected';
    status_label: string;
    catatan: string | null;
    guru: {
        id: number | null;
        nama: string;
        kode_grade: string;
        programs: string[];
    };
}

interface PaginatedRecords {
    data: RecordItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    periode: string;
    start_date: string;
    end_date: string;
    filter_guru: string | number;
    filter_program: string | number;
    status: string;
}

interface Statistik {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    total_poin: number;
}

interface AdminSunnahGuruIndexProps {
    records: PaginatedRecords;
    gurus: Array<{ id: number; nama: string; kode_grade?: string | null }>;
    programs: Array<{ id: number; nama: string }>;
    statistik: Statistik;
    filters: Filters;
    periodeDefault: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
};

const statusLabel: Record<string, string> = {
    approved: 'Disetujui',
    pending: 'Menunggu',
    rejected: 'Ditolak',
};

export default function AdminSunnahGuruIndex({ records, gurus, programs, statistik, filters, periodeDefault }: AdminSunnahGuruIndexProps) {
    const [form, setForm] = useState<Filters>({
        periode: filters.periode ?? periodeDefault,
        start_date: filters.start_date ?? '',
        end_date: filters.end_date ?? '',
        filter_guru: filters.filter_guru ?? '',
        filter_program: filters.filter_program ?? '',
        status: filters.status ?? '',
    });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState<'approved' | 'rejected' | 'pending'>('approved');
    const [bulkCatatan, setBulkCatatan] = useState('');
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const rows = records.data ?? [];
    const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
    const selectedCount = selectedIds.length;

    const guruOptions = useMemo(
        () => gurus.map((guru) => ({ value: guru.id, label: `${guru.nama}${guru.kode_grade ? ` — Grade ${guru.kode_grade}` : ''}` })),
        [gurus],
    );

    const programOptions = useMemo(() => programs.map((program) => ({ value: program.id, label: program.nama })), [programs]);

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds((current) => current.filter((id) => !rows.some((row) => row.id === id)));
        } else {
            setSelectedIds((current) => Array.from(new Set([...current, ...rows.map((row) => row.id)])));
        }
    };

    const toggleRow = (id: number) => {
        setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
    };

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            route('sunnah-guru.index'),
            {
                periode: form.periode || undefined,
                start_date: form.start_date || undefined,
                end_date: form.end_date || undefined,
                filter_guru: form.filter_guru || undefined,
                filter_program: form.filter_program || undefined,
                status: form.status || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const resetFilters = () => {
        router.get(route('sunnah-guru.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const openBulkModal = (status: 'approved' | 'rejected' | 'pending') => {
        if (selectedCount === 0) {
            return;
        }

        setBulkStatus(status);
        setBulkCatatan('');
        setBulkModalOpen(true);
    };

    const submitBulk = () => {
        setBulkProcessing(true);

        router.post(
            route('sunnah-guru.bulk-approve'),
            {
                ids: selectedIds,
                target_status: bulkStatus,
                catatan: bulkCatatan || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    setBulkModalOpen(false);
                    setBulkCatatan('');
                },
                onFinish: () => setBulkProcessing(false),
            },
        );
    };

    const quickDecision = (record: RecordItem, status: 'approved' | 'rejected' | 'pending') => {
        router.put(
            route('sunnah-guru.approve', record.id),
            { status, catatan: record.catatan },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="7SPS Guru" />

            <div className="mx-auto w-full space-y-5">
                <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="page-title flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-brand">
                                <Icon icon="mdi:mosque" className="text-lg" />
                            </span>
                            Monitoring 7SPS Guru
                        </h1>
                        <p className="page-subtitle">Pantau, setujui, dan beri catatan checklist Amalan 7 Sunnah Suprarasional guru.</p>
                    </div>
                    {statistik.pending > 0 && (
                        <Link href={route('sunnah-guru.index', { status: 'pending', periode: form.periode })}>
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-[12px] font-bold text-amber-700 shadow-sm transition-colors hover:bg-amber-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                                </span>
                                {statistik.pending} menunggu approval
                            </span>
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                    <StatCard title="Total Checklist" value={statistik.total} icon="mdi:clipboard-text-clock-outline" color="accent" />
                    <StatCard title="Menunggu" value={statistik.pending} icon="mdi:progress-clock" color="warning" />
                    <StatCard title="Disetujui" value={statistik.approved} icon="mdi:check-decagram" color="success" />
                    <StatCard title="Ditolak" value={statistik.rejected} icon="mdi:close-octagon-outline" color="danger" />
                    <StatCard title="Total Poin" value={statistik.total_poin} icon="mdi:star-circle" color="sky" className="col-span-2 lg:col-span-1" />
                </div>

                <form onSubmit={applyFilters} className="card-modern p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                        <Icon icon="mdi:filter-variant" className="text-lg text-indigo-500" />
                        <h2 className="text-[13px] font-bold text-slate-800">Filter Data</h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Input
                            label="Periode"
                            type="month"
                            value={form.periode}
                            onChange={(event) => setForm({ ...form, periode: event.target.value })}
                        />
                        <Select
                            label="Status"
                            value={form.status}
                            onChange={(event) => setForm({ ...form, status: event.target.value })}
                            options={[
                                { value: 'pending', label: 'Menunggu' },
                                { value: 'approved', label: 'Disetujui' },
                                { value: 'rejected', label: 'Ditolak' },
                            ]}
                            placeholder="Semua status"
                        />
                        <Select
                            label="Guru"
                            value={form.filter_guru}
                            onChange={(event) => setForm({ ...form, filter_guru: event.target.value })}
                            options={guruOptions}
                            placeholder="Semua guru"
                        />
                        <Select
                            label="Program"
                            value={form.filter_program}
                            onChange={(event) => setForm({ ...form, filter_program: event.target.value })}
                            options={programOptions}
                            placeholder="Semua program"
                        />
                        <Input
                            label="Dari Tanggal"
                            type="date"
                            value={form.start_date}
                            onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                        />
                        <Input
                            label="Sampai Tanggal"
                            type="date"
                            value={form.end_date}
                            onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button type="submit" size="sm">
                            <Icon icon="mdi:magnify" className="text-base" /> Terapkan Filter
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
                            <Icon icon="mdi:refresh" className="text-base" /> Reset
                        </Button>
                        <span className="text-[11px] font-medium text-slate-500">
                            {filters.start_date} s.d. {filters.end_date}
                        </span>
                    </div>
                </form>

                {selectedCount > 0 && (
                    <div className="animate-slide-down flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-indigo-800">
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-600 px-2 text-[11px] font-bold text-white">
                                {selectedCount}
                            </span>
                            data dipilih
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm" variant="success" onClick={() => openBulkModal('approved')}>
                                <Icon icon="mdi:check" className="text-base" /> Setujui
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => openBulkModal('rejected')}>
                                <Icon icon="mdi:close" className="text-base" /> Tolak
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openBulkModal('pending')}>
                                <Icon icon="mdi:lock-open-variant-outline" className="text-base" /> Buka Kunci
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                                Batal
                            </Button>
                        </div>
                    </div>
                )}

                <div className="card-modern overflow-hidden">
                    <div className="flex flex-col gap-1 border-b border-indigo-100/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <div>
                            <h2 className="text-[14px] font-bold text-slate-900">Daftar Checklist 7SPS</h2>
                            <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                                {records.total} data ditemukan pada periode ini
                            </p>
                        </div>
                        <Badge variant="info" size="sm">
                            {filters.periode || periodeDefault}
                        </Badge>
                    </div>

                    {rows.length === 0 ? (
                        <EmptyState
                            icon="mdi:mosque"
                            title="Belum ada checklist 7SPS"
                            description="Data akan muncul setelah guru mengisi checklist Amalan 7S Sunnah Suprarasional."
                        />
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Pilih semua data" />
                                        </TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Poin</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Catatan</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(record.id)}
                                                    onChange={() => toggleRow(record.id)}
                                                    aria-label={`Pilih checklist ${record.guru.nama}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-extrabold text-white shadow-sm">
                                                        {record.guru.nama.split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[13px] font-bold text-slate-900">{record.guru.nama}</p>
                                                        <p className="text-[11px] font-medium text-slate-500">
                                                            Grade {record.guru.kode_grade}
                                                            {record.guru.programs.length > 0 ? ` · ${record.guru.programs.join(' · ')}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[12.5px] font-semibold text-slate-700">{record.tanggal}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[12px] font-extrabold text-amber-700 ring-1 ring-amber-200">
                                                    <Icon icon="mdi:star" className="text-xs" /> {record.total_poin}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant[record.status_approval] ?? 'default'} size="sm" dot>
                                                    {statusLabel[record.status_approval] ?? record.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[220px] whitespace-normal">
                                                <p className="line-clamp-2 text-[12px] leading-snug text-slate-500">{record.catatan || '—'}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {record.status_approval !== 'approved' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => quickDecision(record, 'approved')}
                                                            className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
                                                            title="Setujui"
                                                        >
                                                            <Icon icon="mdi:check" className="text-sm" />
                                                        </button>
                                                    )}
                                                    {record.status_approval !== 'rejected' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => quickDecision(record, 'rejected')}
                                                            className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100"
                                                            title="Tolak"
                                                        >
                                                            <Icon icon="mdi:close" className="text-sm" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('sunnah-guru.show', record.id)}
                                                        className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100"
                                                        title="Lihat detail"
                                                    >
                                                        <Icon icon="mdi:eye-outline" className="text-sm" />
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="px-5 sm:px-7">
                                <Pagination links={records.links} from={records.from ?? undefined} to={records.to ?? undefined} total={records.total} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Modal show={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="md">
                <div className="p-6 sm:p-7">
                    <div className="mb-4 flex items-start gap-3">
                        <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                                bulkStatus === 'approved'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : bulkStatus === 'rejected'
                                      ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}
                        >
                            <Icon
                                icon={
                                    bulkStatus === 'approved'
                                        ? 'mdi:check-decagram'
                                        : bulkStatus === 'rejected'
                                          ? 'mdi:close-octagon'
                                          : 'mdi:lock-open-variant'
                                }
                                className="text-lg"
                            />
                        </span>
                        <div>
                            <h3 className="text-[15px] font-bold text-slate-900">Approval Massal</h3>
                            <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                                {selectedCount} data akan diubah menjadi{' '}
                                <span className="font-bold text-slate-700">{statusLabel[bulkStatus]}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Select
                            label="Status Tujuan"
                            value={bulkStatus}
                            onChange={(event) => setBulkStatus(event.target.value as 'approved' | 'rejected' | 'pending')}
                            options={[
                                { value: 'approved', label: 'Disetujui' },
                                { value: 'rejected', label: 'Ditolak' },
                                { value: 'pending', label: 'Menunggu (buka kunci)' },
                            ]}
                        />

                        <div>
                            <label htmlFor="bulk-catatan" className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">
                                Catatan untuk Guru <span className="font-medium text-slate-400">(opsional)</span>
                            </label>
                            <textarea
                                id="bulk-catatan"
                                value={bulkCatatan}
                                onChange={(event) => setBulkCatatan(event.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder="Tambahkan catatan agar guru tahu bagian yang perlu diperbaiki..."
                                className="input-modern resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setBulkModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            variant={bulkStatus === 'approved' ? 'success' : bulkStatus === 'rejected' ? 'danger' : 'default'}
                            processing={bulkProcessing}
                            onClick={submitBulk}
                        >
                            <Icon icon="mdi:check-all" className="text-base" /> Simpan {statusLabel[bulkStatus]}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
