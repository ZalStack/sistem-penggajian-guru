import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Pagination from '@/Components/ui/pagination';
import Modal from '@/Components/ui/modal';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Perizinan, Guru, Grade, PaginatedData } from '@/types';

interface PerizinanIndexProps {
    perizinan: PaginatedData<Perizinan>;
    gurus: (Guru & { grade?: Grade })[];
    filters: {
        status?: string;
        filter_guru?: string;
        filter_jenis?: string;
    };
    ringkasan: {
        pending: number;
        disetujui: number;
        ditolak: number;
    };
}

const jenisConfig: Record<string, { label: string; icon: string; color: string }> = {
    izin: { label: 'Izin', icon: 'lucide:calendar-minus', color: 'blue' },
    sakit: { label: 'Sakit', icon: 'lucide:thermometer', color: 'red' },
    cuti: { label: 'Cuti', icon: 'lucide:tree-palm', color: 'purple' },
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
    pending: { label: 'Menunggu', variant: 'warning' },
    disetujui: { label: 'Disetujui', variant: 'success' },
    ditolak: { label: 'Ditolak', variant: 'danger' },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PerizinanIndex({ perizinan, gurus, filters, ringkasan }: PerizinanIndexProps) {
    const [actionModal, setActionModal] = useState<{ type: 'disetujui' | 'ditolak'; item: Perizinan } | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        status: '',
        catatan_admin: '',
    });

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('perizinan.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const openActionModal = (type: 'disetujui' | 'ditolak', item: Perizinan) => {
        setActionModal({ type, item });
        setData({ status: type, catatan_admin: '' });
    };

    const handleSubmitAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionModal) return;

        router.put(route('perizinan.update', actionModal.item.id), {
            status: data.status,
            catatan_admin: data.catatan_admin,
        }, {
            preserveState: true,
            onSuccess: () => {
                setActionModal(null);
                reset();
            },
        });
    };

    const closeModal = () => {
        setActionModal(null);
        reset();
    };

    const pendingCount = ringkasan.pending;
    const approvedCount = ringkasan.disetujui;
    const rejectedCount = ringkasan.ditolak;

    return (
        <AuthenticatedLayout>
            <Head title="Perizinan Guru" />

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Perizinan Guru</h1>
                    <p className="page-subtitle">
                        Kelola pengajuan perizinan dari seluruh guru
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 animate-fade-in mb-8">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-indigo-200 hover:shadow-brand transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(245,158,11,0.7)]">
                            <Icon icon="lucide:clock" className="text-xl" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 break-words">{pendingCount}</p>
                            <p className="text-xs text-slate-500">Menunggu Review</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-indigo-200 hover:shadow-brand transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(16,185,129,0.7)]">
                            <Icon icon="lucide:check-circle" className="text-xl" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 break-words">{approvedCount}</p>
                            <p className="text-xs text-slate-500">Disetujui</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-indigo-200 hover:shadow-brand transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(244,63,94,0.7)]">
                            <Icon icon="lucide:x-circle" className="text-xl" />
                        </div>
                        <div>
                            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 break-words">{rejectedCount}</p>
                            <p className="text-xs text-slate-500">Ditolak</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card title="Filter" description="Gunakan filter untuk mencari data perizinan">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={filters.status ?? ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors duration-200 shadow-sm cursor-pointer"
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Jenis</label>
                        <select
                            value={filters.filter_jenis ?? ''}
                            onChange={(e) => handleFilterChange('filter_jenis', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors duration-200 shadow-sm cursor-pointer"
                        >
                            <option value="">Semua Jenis</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                            <option value="cuti">Cuti</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">Guru</label>
                        <select
                            value={filters.filter_guru ?? ''}
                            onChange={(e) => handleFilterChange('filter_guru', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors duration-200 shadow-sm cursor-pointer"
                        >
                            <option value="">Semua Guru</option>
                            {gurus.map((g) => (
                                <option key={g.id} value={g.id}>{g.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            onClick={() => router.get(route('perizinan.index'), {}, { preserveState: true, replace: true })}
                        >
                            <Icon icon="lucide:rotate-ccw" className="text-base" />
                            Reset Filter
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <div className="mt-8">
                <Card title="Daftar Perizinan" description={`${perizinan.total} total pengajuan`}>
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        {perizinan.data.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>Guru</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Alasan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Catatan Admin</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {perizinan.data.map((p, index) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium text-slate-400">
                                                {(perizinan.current_page - 1) * perizinan.per_page + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                        <Icon icon="lucide:user" className="text-base" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-slate-900">{p.guru?.nama ?? '-'}</span>
                                                        {p.guru?.grade && (
                                                            <p className="text-xs text-slate-500">{p.guru.grade.kode_grade}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        p.jenis === 'izin' ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100' :
                                                        p.jenis === 'sakit' ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' :
                                                        'bg-violet-50 text-violet-600 ring-1 ring-violet-100'
                                                    }`}>
                                                        <Icon icon={jenisConfig[p.jenis]?.icon ?? 'lucide:help-circle'} className="text-sm" />
                                                    </div>
                                                    <span className="font-medium text-slate-900 text-sm">{jenisConfig[p.jenis]?.label ?? p.jenis}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p className="text-slate-900">{formatDate(p.tanggal_mulai)}</p>
                                                    {p.tanggal_mulai !== p.tanggal_selesai && (
                                                        <p className="text-slate-500 text-xs">s/d {formatDate(p.tanggal_selesai)}</p>
                                                    )}
                                                    {p.session && (
                                                        <p className="text-[11px] text-indigo-500 mt-0.5 flex items-center gap-1">
                                                            <Icon icon="lucide:book-open" className="text-[10px]" />
                                                            Sesi {p.session.jam_mulai?.substring(0, 5)}–{p.session.jam_selesai?.substring(0, 5)}
                                                        </p>
                                                    )}
                                                    {(p.jumlah_sesi_terdampak ?? 0) > 0 && (
                                                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1" title="Sesi mengajar yang jatuh pada rentang tanggal perizinan">
                                                            <Icon icon="lucide:calendar-clock" className="text-[10px]" />
                                                            {p.jumlah_sesi_terdampak} sesi terdampak
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-600 max-w-[180px] truncate" title={p.alasan}>{p.alasan}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[p.status]?.variant ?? 'default'}>
                                                    {statusConfig[p.status]?.label ?? p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {p.catatan_admin ? (
                                                    <div className="flex items-start gap-2 max-w-[200px]">
                                                        <Icon icon="lucide:message-square" className="text-indigo-400 text-xs mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-slate-600" title={p.catatan_admin}>{p.catatan_admin}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {p.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openActionModal('disetujui', p)}
                                                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                                                            title="Setujui"
                                                        >
                                                            <Icon icon="lucide:check" className="text-base" />
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal('ditolak', p)}
                                                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                                                            title="Tolak"
                                                        >
                                                            <Icon icon="lucide:x" className="text-base" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Selesai</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-500 shadow-soft">
                                    <Icon icon="lucide:shield-check" className="text-3xl" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Tidak ada data perizinan</h3>
                                <p className="text-sm text-slate-500 mt-1">Belum ada pengajuan perizinan dari guru</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {perizinan.data.length > 0 ? (
                            perizinan.data.map((p, index) => (
                                <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                <Icon icon="lucide:user" className="text-base" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{p.guru?.nama ?? '-'}</p>
                                                <p className="text-xs text-slate-500 break-words">
                                                    {jenisConfig[p.jenis]?.label ?? p.jenis} &bull; {formatDate(p.tanggal_mulai)}
                                                    {p.tanggal_mulai !== p.tanggal_selesai ? ` s/d ${formatDate(p.tanggal_selesai)}` : ''}
                                                </p>
                                                {(p.jumlah_sesi_terdampak ?? 0) > 0 && (
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Icon icon="lucide:calendar-clock" className="text-[11px]" />
                                                        {p.jumlah_sesi_terdampak} sesi mengajar terdampak
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-semibold text-slate-400">#{(perizinan.current_page - 1) * perizinan.per_page + index + 1}</span>
                                            <Badge variant={statusConfig[p.status]?.variant ?? 'default'}>
                                                {statusConfig[p.status]?.label ?? p.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500">Alasan</p>
                                        <p className="text-sm text-slate-700 break-words">{p.alasan}</p>
                                    </div>

                                    {p.catatan_admin && (
                                        <div className="p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon icon="lucide:message-square" className="text-indigo-500 text-xs" />
                                                <p className="text-xs font-medium text-slate-600">Catatan Admin</p>
                                            </div>
                                            <p className="text-sm text-slate-700 break-words">{p.catatan_admin}</p>
                                        </div>
                                    )}

                                    {p.status === 'pending' && (
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => openActionModal('disetujui', p)}
                                            >
                                                <Icon icon="lucide:check" /> Setujui
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => openActionModal('ditolak', p)}
                                            >
                                                <Icon icon="lucide:x" /> Tolak
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-500 shadow-soft">
                                    <Icon icon="lucide:shield-check" className="text-3xl" />
                                </div>
                                <p className="text-sm text-slate-500">Tidak ada data perizinan</p>
                            </div>
                        )}
                    </div>

                    {perizinan.links && <Pagination links={perizinan.links} />}
                </Card>
            </div>

            {/* Action Modal */}
            <Modal show={actionModal !== null} onClose={closeModal}>
                {actionModal && (
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                actionModal.type === 'disetujui'
                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,0.7)]'
                                    : 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-[0_6px_16px_-6px_rgba(244,63,94,0.7)]'
                            }`}>
                                <Icon icon={actionModal.type === 'disetujui' ? 'lucide:check-circle' : 'lucide:x-circle'} className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {actionModal.type === 'disetujui' ? 'Setujui Perizinan' : 'Tolak Perizinan'}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {actionModal.item.guru?.nama} &bull; {jenisConfig[actionModal.item.jenis]?.label}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 mb-4">
                            <p className="text-xs text-slate-500 mb-1">Alasan Pengajuan</p>
                            <p className="text-sm text-slate-700 break-words">{actionModal.item.alasan}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Periode: {formatDate(actionModal.item.tanggal_mulai)}
                                {actionModal.item.tanggal_mulai !== actionModal.item.tanggal_selesai
                                    ? ` s/d ${formatDate(actionModal.item.tanggal_selesai)}`
                                    : ''}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Sesi terdampak:{' '}
                                <span className="font-semibold text-slate-700">
                                    {actionModal.item.jumlah_sesi_terdampak ?? 0} sesi mengajar
                                </span>
                                {' '}pada rentang tanggal tersebut
                            </p>
                            {actionModal.type === 'disetujui' && (
                                <p className="text-xs text-indigo-600 mt-1">
                                    Bila disetujui, sesi tersebut tercatat sebagai Izin di rekap presensi dan check-in guru dinonaktifkan.
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmitAction}>
                            <div className="space-y-1.5 mb-4">
                                <label className="block text-sm font-medium text-slate-700">
                                    Catatan Admin <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.catatan_admin}
                                    onChange={(e) => setData('catatan_admin', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-colors duration-200 shadow-sm resize-none"
                                    placeholder={actionModal.type === 'disetujui'
                                        ? 'Tulis catatan persetujuan (contoh: Disetujui, silakan izin sesuai jadwal)'
                                        : 'Tulis alasan penolakan (contoh: Berkas tidak lengkap)'}
                                    required
                                />
                                {errors.catatan_admin && <p className="text-xs text-rose-500">{errors.catatan_admin}</p>}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <Button
                                    type="submit"
                                    variant={actionModal.type === 'disetujui' ? 'success' : 'danger'}
                                    processing={processing}
                                >
                                    <Icon icon={actionModal.type === 'disetujui' ? 'lucide:check' : 'lucide:x'} className="text-base" />
                                    {actionModal.type === 'disetujui' ? 'Setujui' : 'Tolak'}
                                </Button>
                                <Button variant="secondary" type="button" onClick={closeModal}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
