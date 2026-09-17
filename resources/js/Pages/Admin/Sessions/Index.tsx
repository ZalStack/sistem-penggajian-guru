import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import Select from '@/Components/ui/select';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Location, TeachingSession, Guru, Transport } from '@/types';

interface SessionIndexProps {
    sessions: TeachingSession[];
    gurus: (Guru & { grade?: { kode_grade: string } })[];
    locations: Location[];
    transports: Transport[];
    filters: {
        periode?: string;
        filter_guru?: string;
    };
}

export default function SessionIndex({ sessions, gurus, locations, transports, filters }: SessionIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<TeachingSession | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        guru_id: '',
        location_id: '',
        transport_id: '',
        mapel: 'IPA' as 'IPA' | 'MTK',
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
        setData('mapel', session.mapel);
        setData('tanggal', session.tanggal);
        setData('jam_mulai', session.jam_mulai);
        setData('jam_selesai', session.jam_selesai);
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

    const handleFilterPeriode = (value: string) => {
        router.get(
            route('session.index'),
            { ...filters, periode: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterGuru = (value: string) => {
        router.get(
            route('session.index'),
            { ...filters, filter_guru: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const resetFilters = () => {
        router.get(route('session.index'), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = Boolean(filters.periode || filters.filter_guru);

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

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        return timeStr.substring(0, 5);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Sesi Mengajar" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sesi Mengajar</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola jadwal sesi mengajar guru beserta lokasi dan transport
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="shadow-sm"
                >
                    <Icon icon={showForm ? 'lucide:x' : 'lucide:plus'} className="text-base" />
                    {showForm ? 'Tutup Formulir' : 'Tambah Sesi Baru'}
                </Button>
            </div>

            <div className="space-y-6">
                {showForm && (
                    <Card
                        title={editId ? 'Edit Sesi Mengajar' : 'Tambah Sesi Mengajar Baru'}
                        description="Lengkapi data jadwal sesi mengajar termasuk guru, lokasi, dan transport"
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
                                    label="Lokasi"
                                    value={data.location_id}
                                    onChange={(e) => setData('location_id', e.target.value)}
                                    options={locationOptions}
                                    placeholder="Pilih Lokasi"
                                    error={errors.location_id}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Transport"
                                    value={data.transport_id}
                                    onChange={(e) => setData('transport_id', e.target.value)}
                                    options={transportOptions}
                                    placeholder="Pilih Transport"
                                    error={errors.transport_id}
                                    required
                                />
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
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <Button type="submit" processing={processing} className="shadow-sm">
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
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        <div className="flex-1">
                            <Input
                                label="Periode"
                                type="month"
                                value={filters.periode || ''}
                                onChange={(e) => handleFilterPeriode(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Select
                                label="Filter Guru"
                                value={filters.filter_guru || ''}
                                onChange={(e) => handleFilterGuru(e.target.value)}
                                options={guruOptions}
                                placeholder="Semua Guru"
                            />
                        </div>
                        {hasActiveFilters && (
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                                >
                                    <Icon icon="lucide:rotate-ccw" /> Reset
                                </button>
                            </div>
                        )}
                    </div>

                    {sessions.length > 0 ? (
                        <>
                            {/* Desktop & Tablet Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">No</TableHead>
                                            <TableHead>Guru</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Mapel</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jam</TableHead>
                                            <TableHead>Sesi</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead>Transport</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((session, index) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium text-slate-400">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-900/5 text-slate-800 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                            {session.guru?.nama?.substring(0, 2).toUpperCase() ?? '??'}
                                                        </div>
                                                        <span className="font-semibold text-slate-900 text-sm">
                                                            {session.guru?.nama ?? '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="purple">
                                                        Grade {session.guru?.grade?.kode_grade ?? '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={session.mapel === 'IPA' ? 'success' : 'info'}>
                                                        {session.mapel}
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
                                                <TableCell>
                                                    <span className="text-slate-600 text-sm">{session.transport?.jenis ?? '-'}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(session)}
                                                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
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
                                {sessions.map((session, index) => (
                                    <div
                                        key={session.id}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    {session.guru?.nama?.substring(0, 2).toUpperCase() ?? '??'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{session.guru?.nama ?? '-'}</p>
                                                    <p className="text-xs text-slate-400">{session.location?.nama_lokasi ?? '-'}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-400">
                                                #{index + 1}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-400">Tanggal</span>
                                                <p className="font-medium text-slate-700">{formatDate(session.tanggal)}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Jam</span>
                                                <p className="font-medium text-slate-700">
                                                    {formatTime(session.jam_mulai)} - {formatTime(session.jam_selesai)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="purple">Grade {session.guru?.grade?.kode_grade ?? '-'}</Badge>
                                            <Badge variant={session.mapel === 'IPA' ? 'success' : 'info'}>{session.mapel}</Badge>
                                            <Badge variant="default">{session.jumlah_sesi} sesi</Badge>
                                            <Badge variant="default">{session.transport?.jenis ?? '-'}</Badge>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(session)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
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
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Icon icon="lucide:calendar-x" className="text-3xl" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                {hasActiveFilters ? 'Tidak ada sesi yang sesuai' : 'Belum ada data sesi mengajar'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                {hasActiveFilters
                                    ? 'Coba ubah atau reset filter periode dan guru yang dipilih.'
                                    : 'Mulai dengan menambahkan sesi mengajar baru untuk memulai penjadwalan.'}
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
