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
import { Grade } from '@/types';

interface GradeIndexProps {
    grades: (Grade & { gurus_count: number })[];
}

export default function GradeIndex({ grades }: GradeIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [gradeToDelete, setGradeToDelete] = useState<(Grade & { gurus_count: number }) | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode_grade: '',
        honor_per_sesi: 0,
    });

    const handleEdit = (grade: Grade) => {
        setEditId(grade.id);
        setData({ kode_grade: grade.kode_grade, honor_per_sesi: grade.honor_per_sesi });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            put(route('grade.update', editId), { onSuccess: () => resetForm() });
        } else {
            post(route('grade.store'), { onSuccess: () => resetForm() });
        }
    };

    const resetForm = () => {
        setEditId(null);
        reset();
        setShowForm(false);
    };

    const openDeleteModal = (grade: Grade & { gurus_count: number }) => {
        setGradeToDelete(grade);
    };

    const handleDelete = () => {
        if (gradeToDelete) {
            setDeleting(true);
            router.delete(route('grade.destroy', gradeToDelete.id), {
                onFinish: () => setDeleting(false),
                onSuccess: () => setGradeToDelete(null),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Grade & Honorarium" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Grade & Honor Guru</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Atur tingkatan grade guru dan besaran nominal honorarium per sesi mengajar
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
                    {showForm ? 'Tutup Formulir' : 'Tambah Grade Baru'}
                </Button>
            </div>

            <div className="space-y-6">
                {showForm && (
                    <Card
                        title={editId ? 'Edit Data Grade' : 'Tambah Grade Baru'}
                        description="Pastikan kode grade unik dan nominal honor per sesi telah sesuai"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Kode Grade"
                                    value={data.kode_grade}
                                    onChange={(e) => setData('kode_grade', e.target.value.toUpperCase())}
                                    error={errors.kode_grade}
                                    placeholder="Contoh: A1, B2, C1"
                                    required
                                />
                                <Input
                                    label="Honor per Sesi (Rp)"
                                    type="number"
                                    value={data.honor_per_sesi}
                                    onChange={(e) => setData('honor_per_sesi', Number(e.target.value))}
                                    error={errors.honor_per_sesi}
                                    placeholder="Contoh: 100000"
                                    min={0}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <Button type="submit" processing={processing} className="shadow-sm">
                                    <Icon icon="lucide:save" /> {editId ? 'Simpan Perubahan' : 'Tambah Grade'}
                                </Button>
                                <Button variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card
                    title="Daftar Grade Guru"
                    description={`Tersedia ${grades.length} kategori grade aktif pada sistem`}
                >
                    {/* Desktop / Tablet Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Kode Grade</TableHead>
                                    <TableHead>Nominal Honor per Sesi</TableHead>
                                    <TableHead>Guru Terdaftar</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.map((grade, index) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium text-slate-400">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
                                                    {grade.kode_grade}
                                                </div>
                                                <span className="font-bold text-slate-900">Grade {grade.kode_grade}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-slate-900 text-base">
                                                {formatCurrency(grade.honor_per_sesi)}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-1">/ sesi</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={grade.gurus_count > 0 ? 'purple' : 'default'}>
                                                {grade.gurus_count} orang guru
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(grade)}
                                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Edit Grade"
                                                >
                                                    <Icon icon="lucide:pencil" className="text-base" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(grade)}
                                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Hapus Grade"
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
                        {grades.map((grade, index) => (
                            <div
                                key={grade.id}
                                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                            {grade.kode_grade}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Grade {grade.kode_grade}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatCurrency(grade.honor_per_sesi)} / sesi
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={grade.gurus_count > 0 ? 'purple' : 'default'}>
                                        {grade.gurus_count} guru
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(grade)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                                    >
                                        <Icon icon="lucide:pencil" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(grade)}
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
            <Modal show={gradeToDelete !== null} onClose={() => setGradeToDelete(null)}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Grade {gradeToDelete?.kode_grade}?</h3>
                    {gradeToDelete && gradeToDelete.gurus_count > 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-5 text-left flex gap-2.5">
                            <Icon icon="lucide:alert-circle" className="text-base text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Perhatian:</strong> Grade ini saat ini sedang digunakan oleh <strong>{gradeToDelete.gurus_count} orang guru</strong>. Sistem akan menolak penghapusan untuk melindungi integritas data guru.
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-6">
                            Apakah Anda yakin ingin menghapus grade ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                    )}
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setGradeToDelete(null)}>
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
