import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import Select from '@/Components/ui/select';
import Pagination from '@/Components/ui/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import React, { useState, useMemo } from 'react';
import { Location, TeachingSession, Guru, Transport, Program, PaginatedData } from '@/types';

interface SessionIndexProps {
    sessions: PaginatedData<TeachingSession>;
    gurus: (Guru & { grade?: { kode_grade: string } })[];
    locations: Location[];
    transports: Transport[];
    programs: Program[];
    filters: {
        periode?: string;
        filter_guru?: string;
        filter_program?: string;
        filter_status?: string;
        search?: string;
    };
}

const statusVariant: Record<string, 'info' | 'success' | 'danger' | 'warning' | 'default'> = {
    dijadwalkan: 'info',
    berlangsung: 'warning',
    selesai: 'success',
    dibatalkan: 'danger',
};

const statusLabel: Record<string, string> = {
    dijadwalkan: 'Dijadwalkan',
    berlangsung: 'Berlangsung',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
};

export default function SessionIndex({ sessions, gurus, locations, transports, programs, filters }: SessionIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<TeachingSession | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        guru_id: '',
        location_id: '',
        transport_id: '',
        program_id: '',
        mapel: 'IPA' as 'IPA' | 'MTK',
        status: 'dijadwalkan',
        catatan: '',
        tanggal: '',
        jam_mulai: '',
        jam_selesai: '',
        jumlah_sesi: 1,
    });

    const handleEdit = (session: TeachingSession) => {
        setEditId(session.id);
        setData('guru_id', String(session.guru_id));
        setData('location_id', String(session.location_id));
        setData('transport_id', String(session.transport_id));
        setData('program_id', session.program_id ? String(session.program_id) : '');
        setData('mapel', session.mapel);
        setData('status', session.status);
        setData('catatan', session.catatan ?? '');
        setData('tanggal', session.tanggal.substring(0, 10));
        setData('jam_mulai', session.jam_mulai.substring(0, 5));
        setData('jam_selesai', session.jam_selesai.substring(0, 5));
        setData('jumlah_sesi', session.jumlah_sesi);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            put(route('session.update', editId), { onSuccess: () => resetForm() });
        } else {
            post(route('session.store'), { onSuccess: () => resetForm() });
        }
    };

    const resetForm = () => {
        setEditId(null);
        reset();
        setShowForm(false);
    };

    const openDeleteModal = (session: TeachingSession) => {
        setSessionToDelete(session);
    };

    const handleDelete = () => {
        if (sessionToDelete) {
            setDeleting(true);
            router.delete(route('session.destroy', sessionToDelete.id), {
                onFinish: () => setDeleting(false),
                onSuccess: () => setSessionToDelete(null),
            });
        }
    };

    const applyFilters = (patch: Record<string, string | undefined>) => {
        router.get(
            route('session.index'),
            { ...filters, ...patch },
            { preserveState: true, replace: true }
        );
    };

    const resetFilters = () => {
        router.get(route('session.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Boolean(filters.periode || filters.filter_guru || filters.filter_program || filters.filter_status || filters.search);

    const guruOptions = gurus.map((g) => ({
        value: g.id,
        label: `${g.nama}${g.grade ? ` (Grade ${g.grade.kode_grade})` : ''}`,
    }));

    const locationOptions = locations.map((l) => ({
        value: l.id,
        label: l.nama_lokasi,
    }));

    const transportOptions = transports.map((t) => ({
        value: t.id,
        label: t.jenis,
    }));

    const programOptions = programs.map((p) => ({
        value: p.id,
        label: p.nama,
    }));

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => timeStr.substring(0, 5);

    const groupedSessions = useMemo(() => {
        const map = new Map<string, { date: string; dateLabel: string; dayName: string; isToday: boolean; items: TeachingSession[] }>();
        const todayStr = new Date().toISOString().substring(0, 10);
        sessions.data.forEach((s) => {
            const rawDate = s.tanggal ? s.tanggal.substring(0, 10) : '';
            if (!map.has(rawDate)) {
                const d = new Date(rawDate + 'T00:00:00');
                const dayName = isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', { weekday: 'long' });
                const dateLabel = isNaN(d.getTime()) ? rawDate : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                map.set(rawDate, {
                    date: rawDate,
                    dateLabel,
                    dayName,
                    isToday: rawDate === todayStr,
                    items: [],
                });
            }
            map.get(rawDate)!.items.push(s);
        });
        return Array.from(map.values());
    }, [sessions.data]);

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Sesi Mengajar" />

            {/* Page Header */}
            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                            <Icon icon="tabler:calendar-event" className="text-[18px]" />
                        </div>
                        <h1 className="page-title">Sesi Mengajar</h1>
                    </div>
                    <p className="page-subtitle">
                        Kelola jadwal sesi mengajar guru: program kelas, status, dan lokasi.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="shrink-0"
                >
                    <Icon icon={showForm ? 'tabler:x' : 'tabler:plus'} className="text-[18px]" />
                    {showForm ? 'Tutup Formulir' : 'Tambah Sesi Baru'}
                </Button>
            </div>

            <div className="space-y-8">
                {/* Add/Edit Form */}
                {showForm && (
                    <Card
                        title={editId ? 'Edit Sesi Mengajar' : 'Tambah Sesi Mengajar Baru'}
                        description="Lengkapi data jadwal sesi mengajar termasuk program, status, dan lokasi"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Guru"
                                    value={data.guru_id}
                                    onChange={(e) => setData('guru_id', e.target.value)}
                                    options={guruOptions}
                                    placeholder="Pilih Guru"
                                    error={errors.guru_id}
                                    required
                                />
                                <Select
                                    label="Program / Kelas"
                                    value={data.program_id}
                                    onChange={(e) => setData('program_id', e.target.value)}
                                    options={programOptions}
                                    placeholder="Tanpa program"
                                    error={errors.program_id}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Lokasi"
                                    value={data.location_id}
                                    onChange={(e) => setData('location_id', e.target.value)}
                                    options={locationOptions}
                                    placeholder="Pilih Lokasi"
                                    error={errors.location_id}
                                    required
                                />
                                <Select
                                    label="Transport"
                                    value={data.transport_id}
                                    onChange={(e) => setData('transport_id', e.target.value)}
                                    options={transportOptions}
                                    placeholder="Pilih Transport"
                                    error={errors.transport_id}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Mata Pelajaran"
                                    value={data.mapel}
                                    onChange={(e) => setData('mapel', e.target.value as 'IPA' | 'MTK')}
                                    options={[
                                        { value: 'IPA', label: 'IPA' },
                                        { value: 'MTK', label: 'MTK' },
                                    ]}
                                    placeholder="Pilih Mapel"
                                    error={errors.mapel}
                                    required
                                />
                                <Select
                                    label="Status Sesi"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    options={[
                                        { value: 'dijadwalkan', label: 'Dijadwalkan' },
                                        { value: 'selesai', label: 'Selesai' },
                                        { value: 'dibatalkan', label: 'Dibatalkan' },
                                    ]}
                                    error={errors.status}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Input
                                    label="Tanggal"
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData('tanggal', e.target.value)}
                                    error={errors.tanggal}
                                    required
                                />
                                <Input
                                    label="Jam Mulai"
                                    type="time"
                                    value={data.jam_mulai}
                                    onChange={(e) => setData('jam_mulai', e.target.value)}
                                    error={errors.jam_mulai}
                                    required
                                />
                                <Input
                                    label="Jam Selesai"
                                    type="time"
                                    value={data.jam_selesai}
                                    onChange={(e) => setData('jam_selesai', e.target.value)}
                                    error={errors.jam_selesai}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Jumlah Sesi"
                                    type="number"
                                    value={data.jumlah_sesi}
                                    onChange={(e) => setData('jumlah_sesi', Number(e.target.value))}
                                    error={errors.jumlah_sesi}
                                    min={1}
                                    required
                                />
                                <Input
                                    label="Catatan"
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    error={errors.catatan}
                                    placeholder="Opsional: alasan pembatalan / catatan admin"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Button type="submit" processing={processing}>
                                    <Icon icon="tabler:device-floppy" className="text-[18px]" /> {editId ? 'Simpan Perubahan' : 'Tambah Sesi'}
                                </Button>
                                <Button variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Sessions List Card */}
                <Card>
                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <Input
                            label="Cari"
                            value={filters.search || ''}
                            onChange={(e) => applyFilters({ search: e.target.value || undefined })}
                            placeholder="Nama guru / lokasi"
                        />
                        <Input
                            label="Periode"
                            type="month"
                            value={filters.periode || ''}
                            onChange={(e) => applyFilters({ periode: e.target.value || undefined })}
                        />
                        <Select
                            label="Filter Guru"
                            value={filters.filter_guru || ''}
                            onChange={(e) => applyFilters({ filter_guru: e.target.value || undefined })}
                            options={guruOptions}
                            placeholder="Semua Guru"
                        />
                        <Select
                            label="Program"
                            value={filters.filter_program || ''}
                            onChange={(e) => applyFilters({ filter_program: e.target.value || undefined })}
                            options={programOptions}
                            placeholder="Semua Program"
                        />
                        <Select
                            label="Status Presensi"
                            value={filters.filter_status || ''}
                            onChange={(e) => applyFilters({ filter_status: e.target.value || undefined })}
                            options={[
                                { value: 'dijadwalkan', label: 'Dijadwalkan' },
                                { value: 'berlangsung', label: 'Berlangsung' },
                                { value: 'selesai', label: 'Selesai' },
                                { value: 'dibatalkan', label: 'Dibatalkan' },
                            ]}
                            placeholder="Semua Status"
                        />
                    </div>
                    {hasActiveFilters && (
                        <div className="flex justify-end -mt-6 mb-6">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                            >
                                <Icon icon="tabler:refresh" className="text-[14px]" /> Reset Filter
                            </button>
                        </div>
                    )}

                    {sessions.data.length > 0 ? (
                        <>
                            {/* Desktop & Tablet Table - Dikelompokkan per tanggal */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">No</TableHead>
                                            <TableHead>Guru</TableHead>
                                            <TableHead>Program</TableHead>
                                            <TableHead>Status Presensi</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jam</TableHead>
                                            <TableHead>Sesi</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedSessions.map((group) => (
                                            <React.Fragment key={group.date}>
                                                <TableRow className="bg-slate-50/90 hover:bg-slate-100/80 border-t-2 border-slate-200">
                                                    <TableCell colSpan={9} className="py-2.5 px-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${group.isToday ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`} />
                                                                <span className="text-slate-900 text-sm font-extrabold tracking-tight">
                                                                    {group.dayName}, {group.dateLabel}
                                                                </span>
                                                                {group.isToday && (
                                                                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                                                                        Hari Ini
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-500">
                                                                {group.items.length} sesi mengajar
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {group.items.map((session) => {
                                                    const displayStatus = session.effective_status ?? session.status;
                                                    const rowNumber = (sessions.current_page - 1) * sessions.per_page + sessions.data.indexOf(session) + 1;
                                                    return (
                                                        <TableRow key={session.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <TableCell className="font-medium text-slate-400 text-sm">
                                                                {rowNumber}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                        {session.guru?.nama?.substring(0, 2).toUpperCase() ?? '??'}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="font-semibold text-slate-900 text-sm block truncate">
                                                                            {session.guru?.nama ?? '-'}
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-400">
                                                                            Grade {session.guru?.grade?.kode_grade ?? '-'} · {session.mapel}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-slate-600 text-sm font-medium">{session.program?.nama ?? '-'}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={statusVariant[displayStatus] ?? 'default'} size="sm">
                                                                    {statusLabel[displayStatus] ?? displayStatus}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Icon icon="tabler:calendar-event" className="text-[14px] text-slate-400 flex-shrink-0" />
                                                                    <span className="text-slate-600 text-sm">{formatDate(session.tanggal)}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Icon icon="tabler:clock" className="text-[14px] text-slate-400 flex-shrink-0" />
                                                                    <span className="text-slate-600 text-sm font-medium">
                                                                        {formatTime(session.jam_mulai)} - {formatTime(session.jam_selesai)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="default">{session.jumlah_sesi} sesi</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Icon icon="tabler:map-pin" className="text-[14px] text-slate-400 flex-shrink-0" />
                                                                    <span className="text-slate-600 text-sm">{session.location?.nama_lokasi ?? '-'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEdit(session)}
                                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                        title="Edit Sesi"
                                                                    >
                                                                        <Icon icon="tabler:edit" className="text-[18px]" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openDeleteModal(session)}
                                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                        title="Hapus Sesi"
                                                                    >
                                                                        <Icon icon="tabler:trash" className="text-[18px]" />
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards View - Dikelompokkan per tanggal */}
                            <div className="md:hidden space-y-6">
                                {groupedSessions.map((group) => (
                                    <div key={group.date} className="space-y-3">
                                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200/80">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${group.isToday ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`} />
                                                <span className="font-extrabold text-xs text-slate-900">{group.dayName}, {group.dateLabel}</span>
                                                {group.isToday && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700 rounded-full">
                                                        Hari Ini
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500">{group.items.length} sesi</span>
                                        </div>

                                        {group.items.map((session) => {
                                            const displayStatus = session.effective_status ?? session.status;
                                            return (
                                                <div
                                                    key={session.id}
                                                    className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                {session.guru?.nama?.substring(0, 2).toUpperCase() ?? '??'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{session.guru?.nama ?? '-'}</p>
                                                                <p className="text-xs text-slate-500">{session.location?.nama_lokasi ?? '-'}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={statusVariant[displayStatus] ?? 'default'} size="sm">
                                                            {statusLabel[displayStatus] ?? displayStatus}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-slate-500">Tanggal</span>
                                                            <p className="font-medium text-slate-700">{formatDate(session.tanggal)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Jam</span>
                                                            <p className="font-medium text-slate-700">
                                                                {formatTime(session.jam_mulai)} - {formatTime(session.jam_selesai)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="info">{session.program?.nama ?? session.mapel}</Badge>
                                                        <Badge variant="default">{session.jumlah_sesi} sesi</Badge>
                                                        <Badge variant="default">Grade {session.guru?.grade?.kode_grade ?? '-'}</Badge>
                                                    </div>

                                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(session)}
                                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors inline-flex items-center gap-1.5"
                                                        >
                                                            <Icon icon="tabler:edit" className="text-[14px]" /> Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteModal(session)}
                                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5"
                                                        >
                                                            <Icon icon="tabler:trash" className="text-[14px]" /> Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            <Pagination links={sessions.links} from={sessions.from} to={sessions.to} total={sessions.total} />
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-violet-50 text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-100">
                                <Icon icon="tabler:calendar-off" className="text-[32px]" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                {hasActiveFilters ? 'Tidak ada sesi yang sesuai' : 'Belum ada data sesi mengajar'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 w-full mx-auto">
                                {hasActiveFilters
                                    ? 'Coba ubah atau reset filter yang dipilih.'
                                    : 'Mulai dengan menambahkan sesi mengajar baru untuk memulai penjadwalan.'}
                            </p>
                            <div className="mt-6">
                                {hasActiveFilters ? (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl transition-colors"
                                    >
                                        <Icon icon="tabler:refresh" className="text-[14px]" /> Reset Semua Filter
                                    </button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(true);
                                        }}
                                    >
                                        <Icon icon="tabler:plus" className="text-[18px]" /> Tambah Sesi Sekarang
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={sessionToDelete !== null} onClose={() => setSessionToDelete(null)}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                        <Icon icon="tabler:alert-triangle" className="text-[28px]" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Sesi Mengajar?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Apakah Anda yakin ingin menghapus sesi mengajar{' '}
                        <strong className="text-slate-800">{sessionToDelete?.guru?.nama ?? ''}</strong>{' '}
                        pada tanggal {sessionToDelete ? formatDate(sessionToDelete.tanggal) : ''}?
                        Data presensi terkait juga akan ikut terhapus.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setSessionToDelete(null)}>
                            Batal
                        </Button>
                        <Button variant="danger" processing={deleting} onClick={handleDelete}>
                            Ya, Hapus
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
