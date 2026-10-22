import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import Pagination from '@/Components/ui/pagination';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent, useState } from 'react';
import { PaginatedData } from '@/types';

interface BahanAjar {
    id: number;
    judul: string;
    deskripsi: string | null;
    mapel: 'IPA' | 'MTK' | 'umum';
    file_name: string;
    file_mime: string | null;
    file_size: number;
    created_at: string;
    uploader?: { id: number; name: string } | null;
}

interface BahanAjarGuruProps {
    bahanAjar: PaginatedData<BahanAjar>;
    filters?: { search?: string; filter_mapel?: string };
}

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

export default function BahanAjarGuruIndex({ bahanAjar, filters }: BahanAjarGuruProps) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [filterMapel, setFilterMapel] = useState(filters?.filter_mapel ?? '');

    const applyFilters = (nextSearch: string, nextMapel: string) => {
        router.get(
            route('my-bahan-ajar.index'),
            { search: nextSearch || undefined, filter_mapel: nextMapel || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters(search, filterMapel);
    };

    const mapelBadge = (mapel: string): 'info' | 'success' | 'warning' =>
        mapel === 'umum' ? 'info' : mapel === 'IPA' ? 'success' : 'warning';

    return (
        <AuthenticatedLayout>
            <Head title="Bahan Ajar" />

            <div className="animate-fade-in page-header">
                <div className="min-w-0">
                    <h1 className="page-title">Bahan Ajar</h1>
                    <p className="page-subtitle">
                        Materi ajar dari admin — silakan unduh untuk membantu kegiatan mengajar Anda
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Toolbar filter */}
                <Card noPadding>
                    <form
                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap p-5 sm:p-6 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40"
                        onSubmit={handleSubmit}
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

                    <div className="p-5 sm:p-6 pt-0 sm:pt-0">
                        {bahanAjar.data.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {bahanAjar.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group flex flex-col p-5 bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-300 hover:shadow-[0_12px_28px_-14px_rgba(99,102,241,0.45)] shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                                <Icon icon={fileIcon(item.file_mime)} className="text-lg" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-900 text-sm leading-5 break-words">{item.judul}</p>
                                                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mt-1">
                                                    {fileExtension(item.file_name)} • {formatBytes(item.file_size)}
                                                </p>
                                            </div>
                                        </div>

                                        {item.deskripsi && (
                                            <p className="text-xs text-slate-500 leading-5 mt-3 line-clamp-3 break-words">{item.deskripsi}</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <Badge variant={mapelBadge(item.mapel)}>
                                                {item.mapel === 'umum' ? 'Umum' : item.mapel}
                                            </Badge>
                                            <span className="text-[11px] text-slate-400">
                                                {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="mt-auto pt-4">
                                            <Button
                                                as="a"
                                                href={route('my-bahan-ajar.download', item.id)}
                                                variant="success"
                                                size="sm"
                                                className="w-full"
                                            >
                                                <Icon icon="lucide:download" /> Unduh Materi
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-14 px-4">
                                <div className="empty-state-icon">
                                    <Icon icon="lucide:book-open" className="text-2xl" />
                                </div>
                                <p className="text-[14px] font-bold text-slate-900">Belum ada bahan ajar</p>
                                <p className="text-[12.5px] text-slate-500 mt-1">
                                    {search || filterMapel
                                        ? 'Tidak ada materi yang cocok dengan pencarian Anda.'
                                        : 'Admin belum mengunggah materi apa pun. Silakan cek kembali nanti.'}
                                </p>
                            </div>
                        )}

                        {bahanAjar.links && <Pagination links={bahanAjar.links} from={bahanAjar.from} to={bahanAjar.to} total={bahanAjar.total} />}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
