import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Transport } from '@/types';

interface TransportIndexProps {
    transports: (Transport & { penggajians_count: number })[];
}

const transportIcons: Record<string, string> = {
    'Online': 'lucide:wifi',
    'Dalam Kota': 'lucide:map-pin',
    'Luar Kota': 'lucide:map-pin-off',
};

export default function TransportIndex({ transports }: TransportIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [transportToDelete, setTransportToDelete] = useState<(Transport & { penggajians_count: number }) | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        jenis: '',
        biaya: 0,
    });

    const handleEdit = (transport: Transport) => {
        setEditId(transport.id);
        setData({ jenis: transport.jenis, biaya: transport.biaya });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            put(route('transport.update', editId), { onSuccess: () => resetForm() });
        } else {
            post(route('transport.store'), { onSuccess: () => resetForm() });
        }
    };

    const resetForm = () => {
        setEditId(null);
        reset();
        setShowForm(false);
    };

    const openDeleteModal = (transport: Transport & { penggajians_count: number }) => {
        setTransportToDelete(transport);
    };

    const handleDelete = () => {
        if (transportToDelete) {
            setDeleting(true);
            router.delete(route('transport.destroy', transportToDelete.id), {
                onFinish: () => setDeleting(false),
                onSuccess: () => setTransportToDelete(null),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kategori Transport" />

            <div className="animate-fade-in page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Biaya Transport</h1>
                    <p className="page-subtitle">
                        Kelola komponen biaya transport kehadiran per sesi (Online, Dalam Kota, Luar Kota)
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
                    {showForm ? 'Tutup Formulir' : 'Tambah Transport Baru'}
                </Button>
            </div>

            <div className="space-y-6">
                {showForm && (
                    <Card
                        title={editId ? 'Edit Biaya Transport' : 'Tambah Kategori Transport Baru'}
                        description="Atur nama jenis transport dan tarif per sesi kehadiran guru"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Input
                                    label="Jenis Transport"
                                    value={data.jenis}
                                    onChange={(e) => setData('jenis', e.target.value)}
                                    error={errors.jenis}
                                    placeholder="Contoh: Hybrid, Khusus Lab, dll"
                                    required
                                />
                                <Input
                                    label="Biaya per Sesi (Rp)"
                                    type="number"
                                    value={data.biaya}
                                    onChange={(e) => setData('biaya', Number(e.target.value))}
                                    error={errors.biaya}
                                    placeholder="0"
                                    min={0}
                                    required
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                                <Button type="submit" processing={processing}>
                                    <Icon icon="lucide:save" /> {editId ? 'Simpan Perubahan' : 'Tambah Transport'}
                                </Button>
                                <Button variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card
                    title="Daftar Kategori Transport"
                    description={`Tersedia ${transports.length} skema transport pada penggajian`}
                >
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Jenis Transport</TableHead>
                                    <TableHead>Tarif per Sesi</TableHead>
                                    <TableHead>Penggunaan Data</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transports.map((transport, index) => (
                                    <TableRow key={transport.id}>
                                        <TableCell className="font-medium text-slate-400">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center text-lg shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                    <Icon icon={transportIcons[transport.jenis] || 'lucide:car'} />
                                                </div>
                                                <span className="font-bold text-slate-900">{transport.jenis}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-extrabold text-slate-900 text-base">
                                                {formatCurrency(transport.biaya)}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-1">/ sesi</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={transport.penggajians_count > 0 ? 'info' : 'default'}>
                                                {transport.penggajians_count} riwayat gaji
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(transport)}
                                                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                                                    title="Edit Transport"
                                                >
                                                    <Icon icon="lucide:pencil" className="text-base" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(transport)}
                                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                                                    title="Hapus Transport"
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

                    <div className="md:hidden space-y-3">
                        {transports.map((transport, index) => (
                            <div
                                key={transport.id}
                                className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                            <Icon icon={transportIcons[transport.jenis] || 'lucide:car'} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">{transport.jenis}</p>
                                            <p className="text-xs text-slate-500 break-words">
                                                {formatCurrency(transport.biaya)} / sesi
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={transport.penggajians_count > 0 ? 'info' : 'default'}>
                                        {transport.penggajians_count} data
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(transport)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1"
                                    >
                                        <Icon icon="lucide:pencil" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(transport)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                                    >
                                        <Icon icon="lucide:trash-2" /> Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Modal show={transportToDelete !== null} onClose={() => setTransportToDelete(null)}>
                <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_6px_16px_-6px_rgba(244,63,94,0.7)]">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 break-words">
                        Hapus Transport {transportToDelete?.jenis}?
                    </h3>
                    {transportToDelete && transportToDelete.penggajians_count > 0 ? (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-6 text-left flex gap-2.5">
                            <Icon icon="lucide:alert-circle" className="text-base text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Perhatian:</strong> Transport ini telah digunakan pada <strong>{transportToDelete.penggajians_count} riwayat penggajian</strong>. Sistem akan menolak penghapusan untuk melindungi integritas rekap penggajian.
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menghapus kategori transport ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setTransportToDelete(null)}>
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
