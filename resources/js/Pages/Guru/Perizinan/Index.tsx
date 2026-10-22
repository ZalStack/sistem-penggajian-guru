import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Perizinan } from '@/types';

interface PerizinanIndexProps {
    perizinan: Perizinan[];
}

const jenisConfig: Record<string, { label: string; icon: string; color: string }> = {
    izin: { label: 'Izin', icon: 'lucide:calendar-minus', color: 'blue' },
    sakit: { label: 'Sakit', icon: 'lucide:thermometer', color: 'red' },
    cuti: { label: 'Cuti', icon: 'lucide:palm-tree', color: 'purple' },
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
    pending: { label: 'Menunggu', variant: 'warning' },
    disetujui: { label: 'Disetujui', variant: 'success' },
    ditolak: { label: 'Ditolak', variant: 'danger' },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PerizinanIndex({ perizinan }: PerizinanIndexProps) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        jenis: 'izin' as string,
        tanggal_mulai: '',
        tanggal_selesai: '',
        alasan: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('my-perizinan.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const pendingCount = perizinan.filter((p) => p.status === 'pending').length;
    const approvedCount = perizinan.filter((p) => p.status === 'disetujui').length;
    const rejectedCount = perizinan.filter((p) => p.status === 'ditolak').length;

    return (
        <AuthenticatedLayout>
            <Head title="Perizinan Saya" />

            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
                <div className="flex items-start gap-3.5 min-w-0">
                    <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(99,102,241,0.7)]">
                        <Icon icon="lucide:shield-check" className="text-xl" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="page-title">Perizinan Saya</h1>
                        <p className="page-subtitle">
                            Ajukan izin, sakit, atau cuti dan pantau status pengajuan Anda
                        </p>
                    </div>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
                    <Icon icon={showForm ? 'lucide:x' : 'lucide:plus'} className="text-base" />
                    {showForm ? 'Tutup' : 'Ajukan Perizinan'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="card-modern hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all p-4 sm:p-5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(245,158,11,0.7)]">
                            <Icon icon="lucide:clock" className="text-lg" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-extrabold text-slate-900 leading-none">{pendingCount}</p>
                            <p className="text-xs text-slate-500 mt-1.5">Menunggu</p>
                        </div>
                    </div>
                </div>
                <div className="card-modern hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all p-4 sm:p-5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(16,185,129,0.7)]">
                            <Icon icon="lucide:check-circle" className="text-lg" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-extrabold text-slate-900 leading-none">{approvedCount}</p>
                            <p className="text-xs text-slate-500 mt-1.5">Disetujui</p>
                        </div>
                    </div>
                </div>
                <div className="card-modern hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all p-4 sm:p-5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 shrink-0 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-xl flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(244,63,94,0.7)]">
                            <Icon icon="lucide:x-circle" className="text-lg" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-extrabold text-slate-900 leading-none">{rejectedCount}</p>
                            <p className="text-xs text-slate-500 mt-1.5">Ditolak</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <Card title="Ajukan Perizinan Baru" description="Isi form di bawah untuk mengajukan perizinan">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Jenis Perizinan</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {Object.entries(jenisConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setData('jenis', key)}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/25 ${
                                                data.jenis === key
                                                    ? 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 active:bg-indigo-100'
                                            }`}
                                        >
                                            <Icon icon={config.icon} className="text-base" />
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                                {errors.jenis && <p className="text-xs text-rose-500">{errors.jenis}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Tanggal Mulai"
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                error={errors.tanggal_mulai}
                                required
                            />
                            <Input
                                label="Tanggal Selesai"
                                type="date"
                                value={data.tanggal_selesai}
                                onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                error={errors.tanggal_selesai}
                                min={data.tanggal_mulai}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">Alasan</label>
                            <textarea
                                value={data.alasan}
                                onChange={(e) => setData('alasan', e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 hover:border-indigo-200 transition-colors duration-200 shadow-sm resize-none break-words"
                                placeholder="Tuliskan alasan pengajuan perizinan..."
                                required
                            />
                            {errors.alasan && <p className="text-xs text-rose-500">{errors.alasan}</p>}
                        </div>
                        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
                            <Button type="submit" processing={processing} className="w-full sm:w-auto">
                                <Icon icon="lucide:send" className="text-base" />
                                Kirim Pengajuan
                            </Button>
                            <Button variant="secondary" type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                                Batal
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Table */}
            <div className={showForm ? 'mt-8' : ''}>
                <Card title="Riwayat Perizinan" description={`${perizinan.length} total pengajuan`}>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        {perizinan.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Alasan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Catatan Admin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {perizinan.map((p, index) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-semibold text-indigo-500">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
                                                        p.jenis === 'izin' ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_6px_14px_-6px_rgba(99,102,241,0.6)]' :
                                                        p.jenis === 'sakit' ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-[0_6px_14px_-6px_rgba(244,63,94,0.5)]' :
                                                        'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_6px_14px_-6px_rgba(139,92,246,0.5)]'
                                                    }`}>
                                                        <Icon icon={jenisConfig[p.jenis]?.icon ?? 'lucide:help-circle'} className="text-sm" />
                                                    </div>
                                                    <span className="font-medium text-slate-900">{jenisConfig[p.jenis]?.label ?? p.jenis}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p className="text-slate-900">{formatDate(p.tanggal_mulai)}</p>
                                                    {p.tanggal_mulai !== p.tanggal_selesai && (
                                                        <p className="text-slate-500 text-xs">s/d {formatDate(p.tanggal_selesai)}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-600 max-w-[200px] truncate" title={p.alasan}>{p.alasan}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[p.status]?.variant ?? 'default'}>
                                                    {statusConfig[p.status]?.label ?? p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {p.catatan_admin ? (
                                                    <div className="flex items-start gap-2 max-w-[250px]">
                                                        <Icon icon="lucide:message-square" className="text-indigo-500 text-xs mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-slate-600" title={p.catatan_admin}>{p.catatan_admin}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-16 sm:py-20 px-2">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto mb-4 shadow-[0_12px_26px_-8px_rgba(99,102,241,0.7)]">
                                    <Icon icon="lucide:shield-check" className="text-3xl" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Belum ada pengajuan perizinan</h3>
                                <p className="text-sm text-slate-500 mt-1 mx-auto max-w-sm break-words">Klik tombol "Ajukan Perizinan" untuk membuat pengajuan baru</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {perizinan.length > 0 ? (
                            perizinan.map((p, index) => (
                                <div key={p.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(79,70,229,0.05)] hover:border-indigo-200 hover:shadow-[0_10px_24px_rgba(79,70,229,0.12)] transition-all space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                                                p.jenis === 'izin' ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_6px_14px_-6px_rgba(99,102,241,0.6)]' :
                                                p.jenis === 'sakit' ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-[0_6px_14px_-6px_rgba(244,63,94,0.5)]' :
                                                'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_6px_14px_-6px_rgba(139,92,246,0.5)]'
                                            }`}>
                                                <Icon icon={jenisConfig[p.jenis]?.icon ?? 'lucide:help-circle'} className="text-lg" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm">{jenisConfig[p.jenis]?.label ?? p.jenis}</p>
                                                <p className="text-xs text-slate-500 break-words">{formatDate(p.tanggal_mulai)}{p.tanggal_mulai !== p.tanggal_selesai ? ` s/d ${formatDate(p.tanggal_selesai)}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">#{index + 1}</span>
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
                                                <p className="text-xs font-medium text-indigo-700">Catatan Admin</p>
                                            </div>
                                            <p className="text-sm text-slate-700 break-words">{p.catatan_admin}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 px-2">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto mb-3 shadow-[0_12px_26px_-8px_rgba(99,102,241,0.6)]">
                                    <Icon icon="lucide:shield-check" className="text-2xl" />
                                </div>
                                <p className="text-sm text-slate-500">Belum ada pengajuan perizinan</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
