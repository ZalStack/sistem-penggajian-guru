import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Modal from '@/Components/ui/modal';
import Pagination from '@/Components/ui/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent, useState } from 'react';
import { PaginatedData } from '@/types';

interface BahanAjar {
    id: number;
    judul: string;
    deskripsi: string | null;
    mapel: 'IPA' | 'MTK' | 'umum';
    file_path: string;
    file_name: string;
    file_mime: string | null;
    file_size: number;
    created_at: string;
    uploader?: { id: number; name: string } | null;
}

interface BahanAjarIndexProps {
    bahanAjar: PaginatedData<BahanAjar>;
    filters?: { search?: string; filter_mapel?: string };
}

const mapelOptions = [
    { value: 'umum', label: 'Umum — semua mapel' },
    { value: 'IPA', label: 'IPA' },
    { value: 'MTK', label: 'MTK' },
];

const fileIcons: Record<string, string> = {
    'application/pdf': 'lucide:file-text',
    'image/jpeg': 'lucide:image',
    'image/png': 'lucide:image',
    'image/webp': 'lucide:image',
};

function formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string | null): string {
    if (mime && fileIcons[mime]) return fileIcons[mime];
    if (mime?.includes('word')) return 'lucide:file-type-2';
    if (mime?.includes('sheet') || mime?.includes('excel')) return 'lucide:sheet';
    if (mime?.includes('presentation') || mime?.includes('powerpoint')) return 'lucide:presentation';
    if (mime === 'application/zip') return 'lucide:file-archive';
    return 'lucide:file';
}

function fileExtension(name: string): string {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
}

export default function BahanAjarIndex({ bahanAjar, filters }: BahanAjarIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [itemToDelete, setItemToDelete] = useState<BahanAjar | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [filterMapel, setFilterMapel] = useState(filters?.filter_mapel ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        judul: '',
        deskripsi: '',
        mapel: 'umum' as 'umum' | 'IPA' | 'MTK',
        file: null as File | null,
    });

    const applyFilters = (nextSearch: string, nextMapel: string) => {
        router.get(
            route('bahan-ajar.index'),
            { search: nextSearch || undefined, filter_mapel: nextMapel || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleEdit = (item: BahanAjar) => {
        setEditId(item.id);
        setData({ judul: item.judul, deskripsi: item.deskripsi ?? '', mapel: item.mapel, file: null });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditId(null);
        reset();
        setShowForm(false);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            forceFormData: true,
            onSuccess: () => resetForm(),
        };

        if (editId) {
            put(route('bahan-ajar.update', editId), options);
        } else {
            post(route('bahan-ajar.store'), options);
        }
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        setDeleting(true);
        router.delete(route('bahan-ajar.destroy', itemToDelete.id), {
            onFinish: () => setDeleting(false),
            onSuccess: () => setItemToDelete(null),
        });
    };

    const mapelBadge = (mapel: string) =>
        mapel === 'umum' ? 'info' : mapel === 'IPA' ? 'success' : 'warning';

    return (
        <AuthenticatedLayout>
            <Head title="Bahan Ajar" />

            <div className="animate-fade-in page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="page-title">Bahan Ajar</h1>
                    <p className="page-subtitle">
                        Upload materi ajar (PDF, DOC, PPT, gambar, atau ZIP) — otomatis dinotifikasi ke seluruh guru
                    </p>
                </div>
                <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="shrink-0 w-full sm:w-auto">
                    <Icon icon={showForm ? 'lucide:x' : 'lucide:upload'} className="text-base" />
                    {showForm ? 'Tutup Formulir' : 'Upload Materi Baru'}
                </Button>
            </div>

            <div className="space-y-6">
                {showForm && (
                    <Card
                        title={editId ? 'Edit Bahan Ajar' : 'Upload Materi Baru'}
                        description="Materi tersimpan privat dan hanya bisa diunduh oleh akun admin & guru yang login"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Input
                                    label="Judul Materi"
                                    value={data.judul}
                                    onChange={(e) => setData('judul', e.target.value)}
                                    error={errors.judul}
                                    placeholder="Contoh: Modul IPA Fase D — Sistem Ekskresi"
                                    required
                                />
                                <div className="space-y-1.5">
                                    <label htmlFor="mapel" className="block text-[12.5px] font-semibold tracking-[-0.01em] text-slate-700">
                                        Mapel <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <select
                                        id="mapel"
                                        value={data.mapel}
                                        onChange={(e) => setData('mapel', e.target.value as 'umum' | 'IPA' | 'MTK')}
                                        className="select-modern"
                                    >
                                        {mapelOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.mapel && <p className="text-[11px] leading-4 text-rose-600 font-semibold">{errors.mapel}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="deskripsi" className="block text-[12.5px] font-semibold tracking-[-0.01em] text-slate-700">
                                    Deskripsi
                                </label>
                                <textarea
                                    id="deskripsi"
                                    value={data.deskripsi}
                                    onChange={(e) => setData('deskripsi', e.target.value)}
                                    rows={3}
                                    className="input-modern resize-y leading-6"
                                    placeholder="Deskripsi singkat materi (opsional)"
                                />
                                {errors.deskripsi && <p className="text-[11px] leading-4 text-rose-600 font-semibold">{errors.deskripsi}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="file" className="block text-[12.5px] font-semibold tracking-[-0.01em] text-slate-700">
                                    File Materi {!editId && <span className="text-rose-500 font-bold">*</span>}
                                </label>
                                <label
                                    htmlFor="file"
                                    className={`flex flex-col items-center justify-center gap-2 w-full min-h-[140px] px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
                                        errors.file
                                            ? 'border-rose-300 bg-rose-50/40'
                                            : 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-50'
                                    }`}
                                >
                                    <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.8)]">
                                        <Icon icon="lucide:cloud-upload" className="text-xl" />
                                    </span>
                                    {data.file ? (
                                        <span className="text-[13px] font-bold text-indigo-700 break-all flex items-center gap-2">
                                            <Icon icon="lucide:file-check" className="text-base shrink-0" />
                                            {data.file.name}
                                        </span>
                                    ) : (
                                        <span className="text-[13px] font-semibold text-slate-600">
                                            Klik untuk memilih file materi
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-500">
                                        PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, WEBP, ZIP — maks 10 MB
                                    </span>
                                    <input
                                        id="file"
                                        type="file"
                                        className="sr-only"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {editId && !data.file && (
                                    <p className="text-[11px] text-slate-500">Kosongkan jika file tidak diganti.</p>
                                )}
                                {errors.file && <p className="text-[11px] leading-4 text-rose-600 font-semibold">{errors.file}</p>}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                                <Button type="submit" processing={processing}>
                                    <Icon icon="lucide:save" /> {editId ? 'Simpan Perubahan' : 'Upload Materi'}
                                </Button>
                                <Button variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Toolbar filter */}
                <Card noPadding>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center p-5 sm:p-6 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40">
                        <form
                            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap w-full"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters(search, filterMapel);
                            }}
                        >
                            <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
                                <Icon icon="lucide:search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari judul atau deskripsi materi..."
                                    className="input-modern pl-10"
                                    aria-label="Cari bahan ajar"
                                />
                            </div>
                            <select
                                value={filterMapel}
                                onChange={(e) => {
                                    setFilterMapel(e.target.value);
                                    applyFilters(search, e.target.value);
                                }}
                                className="select-modern sm:w-auto w-full cursor-pointer"
                                aria-label="Filter mapel"
                            >
                                <option value="">Semua Mapel</option>
                                <option value="umum">Umum</option>
                                <option value="IPA">IPA</option>
                                <option value="MTK">MTK</option>
                            </select>
                            <Button type="submit" size="sm" className="shrink-0">
                                <Icon icon="lucide:search" /> Cari
                            </Button>
                        </form>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">No</TableHead>
                                        <TableHead>Bahan Ajar</TableHead>
                                        <TableHead>Mapel</TableHead>
                                        <TableHead>File</TableHead>
                                        <TableHead>Diunggah</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bahanAjar.data.length > 0 ? (
                                        bahanAjar.data.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium text-slate-400">
                                                    {(bahanAjar.from ?? 1) + index}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                            <Icon icon={fileIcon(item.file_mime)} className="text-lg" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 break-words">{item.judul}</p>
                                                            {item.deskripsi && (
                                                                <p className="text-xs text-slate-500 line-clamp-2 break-words max-w-md">{item.deskripsi}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={mapelBadge(item.mapel) as 'info' | 'success' | 'warning'}>
                                                        {item.mapel === 'umum' ? 'Umum' : item.mapel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-xs font-bold text-slate-700 uppercase break-all">{fileExtension(item.file_name)}</p>
                                                    <p className="text-[11px] text-slate-400">{formatBytes(item.file_size)}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-[13px] text-slate-600">
                                                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{item.uploader?.name ?? '—'}</p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <a
                                                            href={route('bahan-ajar.download', item.id)}
                                                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                                                            title="Unduh File"
                                                        >
                                                            <Icon icon="lucide:download" className="text-base" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                                                            title="Edit Bahan Ajar"
                                                        >
                                                            <Icon icon="lucide:pencil" className="text-base" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setItemToDelete(item)}
                                                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                                                            title="Hapus Bahan Ajar"
                                                        >
                                                            <Icon icon="lucide:trash-2" className="text-base" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <div className="text-center py-14">
                                                    <div className="empty-state-icon">
                                                        <Icon icon="lucide:book-open" className="text-2xl" />
                                                    </div>
                                                    <p className="text-[14px] font-bold text-slate-900">Belum ada bahan ajar</p>
                                                    <p className="text-[12.5px] text-slate-500 mt-1">
                                                        {search || filterMapel ? 'Tidak ada materi yang cocok dengan pencarian.' : 'Klik "Upload Materi Baru" untuk mengunggah materi pertama.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {bahanAjar.data.length > 0 ? (
                                bahanAjar.data.map((item) => (
                                    <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200 shadow-sm transition-colors space-y-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                <Icon icon={fileIcon(item.file_mime)} className="text-lg" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-900 text-sm break-words">{item.judul}</p>
                                                {item.deskripsi && (
                                                    <p className="text-xs text-slate-500 mt-0.5 break-words line-clamp-2">{item.deskripsi}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <Badge variant={mapelBadge(item.mapel) as 'info' | 'success' | 'warning'}>
                                                        {item.mapel === 'umum' ? 'Umum' : item.mapel}
                                                    </Badge>
                                                    <span className="text-[11px] text-slate-400 uppercase font-bold">{fileExtension(item.file_name)} • {formatBytes(item.file_size)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/60">
                                            <a
                                                href={route('bahan-ajar.download', item.id)}
                                                className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_4px_10px_-4px_rgba(5,150,105,0.7)]"
                                            >
                                                <Icon icon="lucide:download" /> Unduh
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                                            >
                                                <Icon icon="lucide:pencil" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setItemToDelete(item)}
                                                className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                            >
                                                <Icon icon="lucide:trash-2" /> Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 px-4">
                                    <div className="empty-state-icon">
                                        <Icon icon="lucide:book-open" className="text-2xl" />
                                    </div>
                                    <p className="text-[14px] font-bold text-slate-900">Belum ada bahan ajar</p>
                                    <p className="text-[12.5px] text-slate-500 mt-1">
                                        {search || filterMapel ? 'Tidak ada materi yang cocok.' : 'Upload materi pertama Anda.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {bahanAjar.links && <Pagination links={bahanAjar.links} from={bahanAjar.from} to={bahanAjar.to} total={bahanAjar.total} />}
                    </div>
                </Card>
            </div>

            {/* Modal hapus */}
            <Modal show={itemToDelete !== null} onClose={() => setItemToDelete(null)}>
                <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_6px_16px_-6px_rgba(244,63,94,0.7)]">
                        <Icon icon="lucide:alert-triangle" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 break-words">
                        Hapus Bahan Ajar?
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed break-words">
                        Anda akan menghapus <strong className="text-slate-700">"{itemToDelete?.judul}"</strong> beserta file-nya. Guru tidak akan bisa mengunduh materi ini lagi. Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setItemToDelete(null)}>
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
