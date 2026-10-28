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
import { useState } from 'react';
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

const statusVariant: Record<string, 'info' | 'success' | 'danger'> = {
    dijadwalkan: 'info',
    selesai: 'success',
    dibatalkan: 'danger',
};

const statusLabel: Record<string, string> = {
    dijadwalkan: 'Dijadwalkan',
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

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Sesi Mengajar" />

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Sesi Mengajar</h1>
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
                    <Icon icon={showForm ? 'lucide:x' : 'lucide:plus'} className="text-base" />
                    {showForm ? 'Tutup Formulir' : 'Tambah Sesi Baru'}
                </Button>
            </div>

            <div className="space-y-8">
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
                                    <Icon icon="lucide:save" /> {editId ? 'Simpan Perubahan' : 'Tambah Sesi'}
                                </Button>
                                <Button variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

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
                            label="Status"
                            value={filters.filter_status || ''}
                            onChange={(e) => applyFilters({ filter_status: e.target.value || undefined })}
                            options={[
                                { value: 'dijadwalkan', label: 'Dijadwalkan' },
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
                                <Icon icon="lucide:rotate-ccw" /> Reset Filter
                            </button>
                        </div>
                    )}

                    {sessions.data.length > 0 ? (
                        <>
                            {/* Desktop & Tablet Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">No</TableHead>
                                            <TableHead>Guru</TableHead>
                                            <TableHead>Program</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jam</TableHead>
                                            <TableHead>Sesi</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.data.map((session, index) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium text-slate-500">
                                                    {(sessions.current_page - 1) * sessions.per_page + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
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
                                                    <span className="text-slate-600 text-sm">{session.program?.nama ?? '-'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant[session.status] ?? 'default'} size="sm">
                                                        {statusLabel[session.status] ?? session.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600 text-sm">{formatDate(session.tanggal)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600 text-sm">
                                                        {formatTime(session.jam_mulai)} - {formatTime(session.jam_selesai)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default">{session.jumlah_sesi}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600 text-sm">{session.location?.nama_lokasi ?? '-'}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(session)}
                                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit Sesi"
                                                        >
                                                            <Icon icon="lucide:pencil" className="text-base" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteModal(session)}
                                                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Hapus Sesi"
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
                                {sessions.data.map((session) => (
                                    <div
                                        key={session.id}
                                        className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                    {session.guru?.nama?.substring(0, 2).toUpperCase() ?? '??'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{session.guru?.nama ?? '-'}</p>
                                                    <p className="text-xs text-slate-500">{session.location?.nama_lokasi ?? '-'}</p>
                                                </div>
                                            </div>
                                            <Badge variant={statusVariant[session.status] ?? 'default'} size="sm">
                                                {statusLabel[session.status] ?? session.status}
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

                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(session)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors inline-flex items-center gap-1"
                                            >
                                                <Icon icon="lucide:pencil" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(session)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                                            >
                                                <Icon icon="lucide:trash-2" /> Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Pagination links={sessions.links} from={sessions.from} to={sessions.to} total={sessions.total} />
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]">
                                <Icon icon="lucide:calendar-x" className="text-3xl" />
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
                                        <Icon icon="lucide:rotate-ccw" /> Reset Semua Filter
                                    </button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(true);
                                        }}
                                    >
                                        <Icon icon="lucide:plus" /> Tambah Sesi Sekarang
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
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
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
