import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Location } from '@/types';

interface LocationIndexProps {
    locations: (Location & { sessions_count: number })[];
}

export default function LocationIndex({ locations }: LocationIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [locationToDelete, setLocationToDelete] = useState<(Location & { sessions_count: number }) | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_lokasi: '',
        latitude: 0,
        longitude: 0,
        radius: 100,
    });

    const handleEdit = (location: Location) => {
        setEditId(location.id);
        setData({
            nama_lokasi: location.nama_lokasi,
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            put(route('location.update', editId), { onSuccess: () => resetForm() });
        } else {
            post(route('location.store'), { onSuccess: () => resetForm() });
        }
    };

    const resetForm = () => {
        setEditId(null);
        reset();
        setShowForm(false);
    };

    const openDeleteModal = (location: Location & { sessions_count: number }) => {
        setLocationToDelete(location);
    };

    const handleDelete = () => {
        if (locationToDelete) {
            setDeleting(true);
            router.delete(route('location.destroy', locationToDelete.id), {
                onFinish: () => setDeleting(false),
                onSuccess: () => setLocationToDelete(null),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Lokasi" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lokasi Mengajar</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola daftar lokasi tempat sesi mengajar guru dilaksanakan
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
                    {showForm ? 'Tutup Formulir' : 'Tambah Lokasi Baru'}
                </Button>
            </div>

            <div className="space-y-6">
                {showForm && (
                    <Card
                        title={editId ? 'Edit Data Lokasi' : 'Tambah Lokasi Baru'}
                        description="Isi informasi lokasi termasuk koordinat GPS dan radius absensi"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Nama Lokasi"
                                    value={data.nama_lokasi}
                                    onChange={(e) => setData('nama_lokasi', e.target.value)}
                                    error={errors.nama_lokasi}
                                    placeholder="Contoh: KPM Pusat, Kantor Cabang"
                                    required
                                />
                                <Input
                                    label="Radius (meter)"
                                    type="number"
                                    value={data.radius}
                                    onChange={(e) => setData('radius', Number(e.target.value))}
                                    error={errors.radius}
                                    placeholder="100"
                                    min={1}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Latitude"
                                    type="number"
                                    step="any"
                                    value={data.latitude}
                                    onChange={(e) => setData('latitude', parseFloat(e.target.value) || 0)}
                                    error={errors.latitude}
                                    placeholder="-6.2088"
                                    required
                                />
                                <Input
                                    label="Longitude"
                                    type="number"
                                    step="any"
                                    value={data.longitude}
                                    onChange={(e) => setData('longitude', parseFloat(e.target.value) || 0)}
                                    error={errors.longitude}
                                    placeholder="106.8456"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <Button type="submit" processing={processing} className="shadow-sm">
                                    <Icon icon="lucide:save" /> {editId ? 'Simpan Perubahan' : 'Tambah Lokasi'}
                                </Button>
                                <Button variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card
                    title="Daftar Lokasi Mengajar"
                    description={`Tersedia ${locations.length} lokasi terdaftar pada sistem`}
                >
                    {/* Desktop / Tablet Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Nama Lokasi</TableHead>
                                    <TableHead>Latitude</TableHead>
                                    <TableHead>Longitude</TableHead>
                                    <TableHead>Radius</TableHead>
                                    <TableHead>Jumlah Sesi</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((location, index) => (
                                    <TableRow key={location.id}>
                                        <TableCell className="font-medium text-slate-400">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-2xs">
                                                    <Icon icon="lucide:map-pin" className="text-lg" />
                                                </div>
                                                <span className="font-bold text-slate-900">{location.nama_lokasi}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-600 font-mono text-xs">{Number(location.latitude).toFixed(6)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-600 font-mono text-xs">{Number(location.longitude).toFixed(6)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="info">{location.radius} m</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={location.sessions_count > 0 ? 'purple' : 'default'}>
                                                {location.sessions_count} sesi
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(location)}
                                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Edit Lokasi"
                                                >
                                                    <Icon icon="lucide:pencil" className="text-base" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(location)}
                                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Hapus Lokasi"
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
                        {locations.map((location, index) => (
                            <div
                                key={location.id}
                                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Icon icon="lucide:map-pin" className="text-lg" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{location.nama_lokasi}</p>
                                            <p className="text-xs text-slate-400 font-mono">
                                                {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400">
                                        #{index + 1}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="info">{location.radius} m radius</Badge>
                                    <Badge variant={location.sessions_count > 0 ? 'purple' : 'default'}>
                                        {location.sessions_count} sesi
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(location)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                                    >
                                        <Icon icon="lucide:pencil" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(location)}
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

            {/* Modal Konfirmasi Hapus */}
            <Modal show={locationToDelete !== null} onClose={() => setLocationToDelete(null)}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                        Hapus Lokasi {locationToDelete?.nama_lokasi}?
                    </h3>
                    {locationToDelete && locationToDelete.sessions_count > 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-5 text-left flex gap-2.5">
                            <Icon icon="lucide:alert-circle" className="text-base text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Perhatian:</strong> Lokasi ini saat ini digunakan oleh <strong>{locationToDelete.sessions_count} sesi mengajar</strong>. Sistem akan menolak penghapusan untuk melindungi integritas data sesi.
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-6">
                            Apakah Anda yakin ingin menghapus lokasi ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                    )}
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setLocationToDelete(null)}>
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
