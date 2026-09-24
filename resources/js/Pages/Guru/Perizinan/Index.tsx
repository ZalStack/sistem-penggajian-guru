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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="page-title">Perizinan Saya</h1>
                    <p className="page-subtitle">
                        Ajukan izin, sakit, atau cuti dan pantau status pengajuan Anda
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Icon icon={showForm ? 'lucide:x' : 'lucide:plus'} className="text-base" />
                    {showForm ? 'Tutup' : 'Ajukan Perizinan'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Icon icon="lucide:clock" className="text-lg" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-slate-900">{pendingCount}</p>
                            <p className="text-xs text-slate-500">Menunggu</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Icon icon="lucide:check-circle" className="text-lg" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-slate-900">{approvedCount}</p>
                            <p className="text-xs text-slate-500">Disetujui</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                            <Icon icon="lucide:x-circle" className="text-lg" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-slate-900">{rejectedCount}</p>
                            <p className="text-xs text-slate-500">Ditolak</p>
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
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(jenisConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setData('jenis', key)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                                data.jenis === key
                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors duration-200 shadow-sm resize-none"
                                placeholder="Tuliskan alasan pengajuan perizinan..."
                                required
                            />
                            {errors.alasan && <p className="text-xs text-rose-500">{errors.alasan}</p>}
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <Button type="submit" processing={processing}>
                                <Icon icon="lucide:send" className="text-base" />
                                Kirim Pengajuan
                            </Button>
                            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
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
                                            <TableCell className="font-medium text-slate-400">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        p.jenis === 'izin' ? 'bg-sky-50 text-sky-600' :
                                                        p.jenis === 'sakit' ? 'bg-rose-50 text-rose-600' :
                                                        'bg-sky-50 text-sky-600'
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
                                                        <Icon icon="lucide:message-square" className="text-slate-400 text-xs mt-0.5 flex-shrink-0" />
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
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Icon icon="lucide:shield-check" className="text-3xl" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Belum ada pengajuan perizinan</h3>
                                <p className="text-sm text-slate-500 mt-1">Klik tombol "Ajukan Perizinan" untuk membuat pengajuan baru</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {perizinan.length > 0 ? (
                            perizinan.map((p, index) => (
                                <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                p.jenis === 'izin' ? 'bg-sky-50 text-sky-600' :
                                                p.jenis === 'sakit' ? 'bg-rose-50 text-rose-600' :
                                                'bg-sky-50 text-sky-600'
                                            }`}>
                                                <Icon icon={jenisConfig[p.jenis]?.icon ?? 'lucide:help-circle'} className="text-lg" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{jenisConfig[p.jenis]?.label ?? p.jenis}</p>
                                                <p className="text-xs text-slate-400">{formatDate(p.tanggal_mulai)}{p.tanggal_mulai !== p.tanggal_selesai ? ` s/d ${formatDate(p.tanggal_selesai)}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                                            <Badge variant={statusConfig[p.status]?.variant ?? 'default'}>
                                                {statusConfig[p.status]?.label ?? p.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Alasan</p>
                                        <p className="text-sm text-slate-700">{p.alasan}</p>
                                    </div>
                                    {p.catatan_admin && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon icon="lucide:message-square" className="text-slate-400 text-xs" />
                                                <p className="text-xs font-medium text-slate-500">Catatan Admin</p>
                                            </div>
                                            <p className="text-sm text-slate-700">{p.catatan_admin}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Icon icon="lucide:shield-check" className="text-4xl text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Belum ada pengajuan perizinan</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
