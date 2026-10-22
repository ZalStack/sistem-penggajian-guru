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

            <div className="animate-fade-in page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Grade & Honor Guru</h1>
                    <p className="page-subtitle">
                        Atur tingkatan grade guru dan besaran nominal honorarium per sesi mengajar
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
                    {showForm ? 'Tutup Formulir' : 'Tambah Grade Baru'}
                </Button>
            </div>

            <div className="space-y-6">
                {showForm && (
                    <Card
                        title={editId ? 'Edit Data Grade' : 'Tambah Grade Baru'}
                        description="Pastikan kode grade unik dan nominal honor per sesi telah sesuai"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                                <Button type="submit" processing={processing}>
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
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl flex items-center justify-center font-extrabold text-sm shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]">
                                                    {grade.kode_grade}
                                                </div>
                                                <span className="font-bold text-slate-900">Grade {grade.kode_grade}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-extrabold text-slate-900 text-base">
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
                                                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                                                    title="Edit Grade"
                                                >
                                                    <Icon icon="lucide:pencil" className="text-base" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(grade)}
                                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/25"
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

                    <div className="md:hidden space-y-3">
                        {grades.map((grade, index) => (
                            <div
                                key={grade.id}
                                className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]">
                                            {grade.kode_grade}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">Grade {grade.kode_grade}</p>
                                            <p className="text-xs text-slate-500 break-words">
                                                {formatCurrency(grade.honor_per_sesi)} / sesi
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={grade.gurus_count > 0 ? 'purple' : 'default'}>
                                        {grade.gurus_count} guru
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(grade)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1"
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

            <Modal show={gradeToDelete !== null} onClose={() => setGradeToDelete(null)}>
                <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_6px_16px_-6px_rgba(244,63,94,0.7)]">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 break-words">Hapus Grade {gradeToDelete?.kode_grade}?</h3>
                    {gradeToDelete && gradeToDelete.gurus_count > 0 ? (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-6 text-left flex gap-2.5">
                            <Icon icon="lucide:alert-circle" className="text-base text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Perhatian:</strong> Grade ini saat ini sedang digunakan oleh <strong>{gradeToDelete.gurus_count} orang guru</strong>. Sistem akan menolak penghapusan untuk melindungi integritas data guru.
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menghapus grade ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3 justify-center">
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
