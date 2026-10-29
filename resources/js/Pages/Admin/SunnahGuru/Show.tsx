import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/ui/badge';
import Button from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import Select from '@/Components/ui/select';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';

interface ChecklistItem {
    key: string;
    label: string;
    icon: string;
    poin: number;
    has_jamaah: boolean;
    checked: boolean;
    berjamaah: boolean | null;
}

interface RecordDetail {
    id: number;
    tanggal: string;
    tanggal_iso: string;
    total_poin: number;
    poin_sholat_wajib: number;
    jumlah_sholat_dikerjakan: number;
    jumlah_sholat_berjamaah: number;
    status_approval: 'pending' | 'approved' | 'rejected';
    status_label: string;
    catatan: string | null;
    approved_by: string | null;
    approved_at: string | null;
    guru: {
        id: number | null;
        nama: string;
        kode_grade: string;
        programs: string[];
    };
    checklist: ChecklistItem[];
}

interface AdminSunnahGuruShowProps {
    record: RecordDetail;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
};

const statusOptions = [
    { value: 'approved', label: 'Disetujui — kunci checklist guru' },
    { value: 'rejected', label: 'Ditolak — guru dapat memperbaiki' },
    { value: 'pending', label: 'Menunggu — buka kembali untuk guru' },
];

export default function AdminSunnahGuruShow({ record }: AdminSunnahGuruShowProps) {
    const [status, setStatus] = useState<'approved' | 'rejected' | 'pending'>(record.status_approval);
    const [catatan, setCatatan] = useState(record.catatan ?? '');
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        setProcessing(true);

        router.put(
            route('sunnah-guru.approve', record.id),
            { status, catatan: catatan || null },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Detail 7SPS — ${record.guru.nama}`} />

            <div className="mx-auto w-full max-w-6xl space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('sunnah-guru.index')}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
                            aria-label="Kembali"
                        >
                            <Icon icon="lucide:arrow-left" className="text-base" />
                        </Link>
                        <div>
                            <h1 className="page-title">Detail Checklist 7SPS</h1>
                            <p className="mt-0.5 text-[12.5px] font-medium text-slate-500">{record.tanggal}</p>
                        </div>
                    </div>
                    <Badge variant={statusVariant[record.status_approval] ?? 'default'} size="md" dot>
                        {record.status_label}
                    </Badge>
                </div>

                {/* Profil guru & ringkasan poin */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white shadow-brand-lg sm:p-6">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3.5">
                            <span className="flex items-center justify-center rounded-2xl bg-white/15 text-base font-extrabold ring-1 ring-white/25 backdrop-blur-sm" style={{ height: 52, width: 52 }}>
                                {record.guru.nama.split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-extrabold tracking-tight">{record.guru.nama}</h2>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold ring-1 ring-white/25">
                                        Grade {record.guru.kode_grade}
                                    </span>
                                    {record.guru.programs.map((program) => (
                                        <span key={program} className="rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold ring-1 ring-white/25">
                                            {program}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/20 backdrop-blur-sm">
                            <Icon icon="mdi:star-circle" className="text-2xl text-amber-300" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-100/80">Total Poin</p>
                                <p className="text-2xl font-black leading-none">{record.total_poin} <span className="text-sm font-bold text-emerald-100/80">/ 100</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <SummaryCard label="Sholat Wajib" value={`${record.jumlah_sholat_dikerjakan}/5`} icon="mdi:mosque" color="emerald" />
                    <SummaryCard label="Berjamaah" value={`${record.jumlah_sholat_berjamaah}/5`} icon="mdi:account-group" color="teal" />
                    <SummaryCard label="Poin Kelompok" value={String(record.poin_sholat_wajib)} icon="mdi:star-four-points" color="amber" />
                    <SummaryCard label="Amalan Tercentang" value={`${record.checklist.filter((item) => item.checked).length}/12`} icon="mdi:check-decagram" color="sky" />
                </div>

                <div className="grid gap-5 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <Card title="Checklist Amalan" description="Rincian amalan yang dicentang guru pada tanggal ini">
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {record.checklist.map((item) => (
                                    <div
                                        key={item.key}
                                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                                            item.checked ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/60'
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                    item.checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                <Icon icon={item.icon} className="text-lg" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className={`truncate text-[12px] font-bold ${item.checked ? 'text-emerald-900' : 'text-slate-600'}`}>
                                                    {item.label}
                                                </p>
                                                <p className="text-[10px] font-semibold text-slate-500">
                                                    {item.poin} poin
                                                    {item.has_jamaah && (
                                                        <span className={item.berjamaah ? 'text-amber-600' : 'text-slate-400'}>
                                                            {' '}· {item.berjamaah ? 'berjamaah' : 'sendiri'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                                                item.checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'
                                            }`}
                                        >
                                            <Icon icon="mdi:check-bold" className="text-xs" />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-5 lg:col-span-2">
                        <Card title="Approval & Catatan" description="Perubahan akan dikirim sebagai notifikasi ke guru">
                            <div className="space-y-4">
                                <Select
                                    label="Status"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value as 'approved' | 'rejected' | 'pending')}
                                    options={statusOptions}
                                />

                                <div>
                                    <label htmlFor="catatan" className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">
                                        Catatan Admin <span className="font-medium text-slate-400">(opsional)</span>
                                    </label>
                                    <textarea
                                        id="catatan"
                                        value={catatan}
                                        onChange={(event) => setCatatan(event.target.value)}
                                        rows={4}
                                        maxLength={1000}
                                        placeholder="Contoh: Alhamdulillah amalan sudah lengkap, pertahankan."
                                        className="input-modern resize-none"
                                    />
                                </div>

                                <Button className="w-full" processing={processing} onClick={submit}>
                                    <Icon icon="mdi:content-save-check" className="text-base" /> Simpan Approval
                                </Button>

                                {(record.approved_by || record.approved_at) && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-medium leading-relaxed text-slate-500">
                                        {record.approved_by && <p>Disetujui oleh: <span className="font-bold text-slate-700">{record.approved_by}</span></p>}
                                        {record.approved_at && <p>Waktu: <span className="font-bold text-slate-700">{record.approved_at}</span></p>}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
                            <div className="flex items-start gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                                    <Icon icon="mdi:information-outline" className="text-base" />
                                </span>
                                <p className="text-[11px] font-medium leading-relaxed text-slate-600">
                                    Data yang <span className="font-bold text-slate-800">disetujui</span> akan terkunci dan tidak dapat diubah guru.
                                    Pilih <span className="font-bold text-slate-800">Menunggu</span> untuk membuka kembali.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: 'emerald' | 'teal' | 'amber' | 'sky' }) {
    const styles = {
        emerald: 'from-emerald-50 to-green-50 border-emerald-200 text-emerald-700 bg-emerald-100',
        teal: 'from-teal-50 to-cyan-50 border-teal-200 text-teal-700 bg-teal-100',
        amber: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700 bg-amber-100',
        sky: 'from-sky-50 to-blue-50 border-sky-200 text-sky-700 bg-sky-100',
    }[color];

    return (
        <div className={`rounded-2xl border bg-gradient-to-br p-4 ${styles.split(' ').slice(0, 3).join(' ')}`}>
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${styles.split(' ').slice(3).join(' ')}`}>
                <Icon icon={icon} className="text-base" />
            </div>
            <p className="text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
            <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        </div>
    );
}
