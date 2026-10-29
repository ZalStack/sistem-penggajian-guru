import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChecklistGrid, { PoinConfigItem } from '@/Components/sunnah/ChecklistGrid';
import JourneyProgressBar, { Milestone } from '@/Components/sunnah/JourneyProgressBar';
import MilestoneModal from '@/Components/sunnah/MilestoneModal';
import MonthlyHistoryGrid, { HistoryDay } from '@/Components/sunnah/MonthlyHistoryGrid';
import PoinRing from '@/Components/sunnah/PoinRing';
import Toast, { ToastType } from '@/Components/sunnah/Toast';
import { useCountUp } from '@/Components/sunnah/use-count-up';
import { Head, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface GuruProfile {
    id: number;
    nama: string;
    kode_grade: string | null;
    programs: string[];
}

interface SelectedData {
    id: number;
    tanggal: string;
    total_poin: number;
    poin_sholat_wajib: number;
    jumlah_sholat_dikerjakan: number;
    jumlah_sholat_berjamaah: number;
    status_approval: 'pending' | 'approved' | 'rejected';
    status_label: string;
    catatan: string | null;
    approved_by: string | null;
    approved_at: string | null;
    [key: string]: unknown;
}

interface CatatanItem {
    id: number;
    tanggal: string;
    status: string;
    status_approval: 'pending' | 'approved' | 'rejected';
    catatan: string;
}

interface Statistik {
    total_hari: number;
    total_poin: number;
    rata_rata: number;
    tertinggi: number;
}

interface SunnahGuruIndexProps {
    guru: GuruProfile | null;
    poinConfig: Record<string, PoinConfigItem>;
    sholatWajibKeys: string[];
    selectedDate: string;
    today: string;
    yesterday: string;
    selectedData: SelectedData | null;
    statistik: Statistik;
    riwayat: HistoryDay[];
    catatanTerbaru: CatatanItem[];
    monthLabel: string;
}

const milestones: Milestone[] = [
    { point: 40, icon: '🔥', title: '40 Poin Tercapai!', text: 'Ayo Semangat Lagi Ibadahnya', color: '#f59e0b' },
    { point: 75, icon: '🎉', title: '75 Poin Tercapai!', text: 'Alhamdulillah yaa, luar biasa!', color: '#10b981' },
    { point: 90, icon: '🌟', title: '90 Poin Tercapai!', text: 'Masyaallah Semangat Yaaa Ibadahnya', color: '#0284c7' },
    { point: 100, icon: '🏆', title: '100 Poin Tercapai!', text: 'Wahh Kamu Hebat! Pertahankan Semangatnya Setiap Hari', color: '#7c3aed' },
];

const statusStyles: Record<string, { label: string; className: string; icon: string }> = {
    approved: {
        label: 'Disetujui',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: 'mdi:check-circle',
    },
    pending: {
        label: 'Menunggu Persetujuan',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        icon: 'mdi:progress-clock',
    },
    rejected: {
        label: 'Ditolak',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: 'mdi:close-circle',
    },
    empty: {
        label: 'Belum Mengisi',
        className: 'border-slate-200 bg-slate-100 text-slate-600',
        icon: 'mdi:progress-clock',
    },
};

function hitungPoinLokal(fields: Record<string, boolean>, config: Record<string, PoinConfigItem>, wajibKeys: string[]): number {
    let wajib = 0;
    wajibKeys.forEach((key) => {
        if (fields[key]) {
            wajib += 1;
        }
    });

    let total = wajib >= 5 ? 20 : wajib >= 1 ? wajib : 0;

    Object.entries(config).forEach(([key, item]) => {
        if (wajibKeys.includes(key)) {
            return;
        }

        if (fields[key]) {
            total += item.poin;
        }
    });

    return total;
}

function formatTanggalPanjang(iso: string): string {
    if (!iso) {
        return '-';
    }

    const date = new Date(`${iso}T00:00:00`);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function SunnahGuruIndex({
    guru,
    poinConfig,
    sholatWajibKeys,
    selectedDate,
    today,
    yesterday,
    selectedData,
    statistik,
    riwayat,
    catatanTerbaru,
    monthLabel,
}: SunnahGuruIndexProps) {
    const allFields = useMemo(() => {
        const keys = [...Object.keys(poinConfig), ...Object.keys(poinConfig).filter((key) => poinConfig[key].has_jamaah).map((key) => `${key}_berjamaah`)];
        return keys;
    }, [poinConfig]);

    const buildFields = (data: SelectedData | null): Record<string, boolean> => {
        const result: Record<string, boolean> = {};
        allFields.forEach((key) => {
            result[key] = Boolean(data?.[key]);
        });

        return result;
    };

    const [fields, setFields] = useState<Record<string, boolean>>(() => buildFields(selectedData));
    const fieldsRef = useRef(fields);
    const [totalPoin, setTotalPoin] = useState<number>(selectedData?.total_poin ?? 0);
    const [statusApproval, setStatusApproval] = useState<string>(selectedData?.status_approval ?? 'empty');
    const [catatan, setCatatan] = useState<string | null>(selectedData?.catatan ?? null);
    const [approvedBy, setApprovedBy] = useState<string | null>(selectedData?.approved_by ?? null);
    const [approvedAt, setApprovedAt] = useState<string | null>(selectedData?.approved_at ?? null);
    const [saving, setSaving] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);

    const saveSequence = useRef(0);
    const shownMilestones = useRef<Set<number>>(new Set());
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const displayPoin = useCountUp(totalPoin);
    const isApproved = statusApproval === 'approved';
    const isRejected = statusApproval === 'rejected';
    const isPending = statusApproval === 'pending';
    const statusInfo = statusStyles[statusApproval] ?? statusStyles.empty;

    const showToast = (type: ToastType, message: string) => {
        setToast({ type, message });

        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }

        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        return () => {
            if (toastTimer.current) {
                clearTimeout(toastTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        const nextFields = buildFields(selectedData);
        fieldsRef.current = nextFields;
        setFields(nextFields);
        setTotalPoin(selectedData?.total_poin ?? 0);
        setStatusApproval(selectedData?.status_approval ?? 'empty');
        setCatatan(selectedData?.catatan ?? null);
        setApprovedBy(selectedData?.approved_by ?? null);
        setApprovedAt(selectedData?.approved_at ?? null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedData]);

    useEffect(() => {
        fieldsRef.current = fields;
    }, [fields]);

    const poinWajib = useMemo(() => {
        const wajibTerpilih = sholatWajibKeys.filter((key) => fields[key]).length;
        return wajibTerpilih >= 5 ? 20 : wajibTerpilih;
    }, [fields, sholatWajibKeys]);

    const jumlahBerjamaah = useMemo(
        () => sholatWajibKeys.filter((key) => fields[`${key}_berjamaah`]).length,
        [fields, sholatWajibKeys],
    );

    const checkedCount = useMemo(
        () => Object.keys(poinConfig).filter((key) => fields[key]).length,
        [fields, poinConfig],
    );

    const progressPercent = Math.max(0, Math.min(100, Math.round(totalPoin)));

    const checkMilestones = (newPoin: number, oldPoin: number) => {
        if (newPoin <= oldPoin) {
            return;
        }

        const sorted = [...milestones].sort((a, b) => a.point - b.point);
        for (const milestone of sorted) {
            if (oldPoin < milestone.point && newPoin >= milestone.point && !shownMilestones.current.has(milestone.point)) {
                shownMilestones.current.add(milestone.point);
                setActiveMilestone(milestone);
                setShowMilestoneModal(true);
                break;
            }
        }
    };

    const reconcileMilestone = (poin: number) => {
        if (activeMilestone && poin < activeMilestone.point) {
            setShowMilestoneModal(false);
            setActiveMilestone(null);
        }
    };

    const persist = (nextFields: Record<string, boolean>, rollbackKey?: string, rollbackValue?: boolean) => {
        const sequence = ++saveSequence.current;
        setSaving(true);

        fetch(route('my-sunnah.save'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({
                tanggal: selectedDate,
                fields: nextFields,
            }),
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);

                if (sequence !== saveSequence.current) {
                    return;
                }

                if (response.ok && data?.success) {
                    const serverPoin = Number(data.data?.total_poin ?? 0);
                    checkMilestones(serverPoin, totalPoin);
                    setTotalPoin(serverPoin);
                    setStatusApproval(data.data?.status_approval ?? 'pending');
                    reconcileMilestone(serverPoin);
                    showToast('success', data.message ?? 'Checklist 7SPS berhasil disimpan.');
                } else {
                    rollback(rollbackKey, rollbackValue);
                    showToast('error', data?.message ?? 'Gagal menyimpan checklist 7SPS.');
                }
            })
            .catch(() => {
                if (sequence !== saveSequence.current) {
                    return;
                }

                rollback(rollbackKey, rollbackValue);
                showToast('error', 'Gagal menyimpan checklist 7SPS. Periksa koneksi Anda.');
            })
            .finally(() => {
                if (sequence === saveSequence.current) {
                    setSaving(false);
                }
            });
    };

    const rollback = (key?: string, value?: boolean) => {
        if (!key) {
            return;
        }

        const next = { ...fieldsRef.current, [key]: value ?? false };

        if (poinConfig[key]?.has_jamaah) {
            next[`${key}_berjamaah`] = value ?? false;
        }

        fieldsRef.current = next;
        setFields(next);
        setTotalPoin(hitungPoinLokal(next, poinConfig, sholatWajibKeys));
    };

    const toggleItem = (key: string) => {
        if (isApproved || !guru) {
            return;
        }

        const previousValue = Boolean(fields[key]);
        const previousPoin = totalPoin;
        const nextValue = !previousValue;
        const nextFields = { ...fields, [key]: nextValue };

        if (poinConfig[key]?.has_jamaah) {
            nextFields[`${key}_berjamaah`] = nextValue;
        }

        fieldsRef.current = nextFields;
        setFields(nextFields);
        setStatusApproval('pending');

        const localPoin = hitungPoinLokal(nextFields, poinConfig, sholatWajibKeys);
        setTotalPoin(localPoin);
        checkMilestones(localPoin, previousPoin);

        persist(nextFields, key, previousValue);
    };

    const selectTab = (date: string) => {
        if (date === selectedDate || switching) {
            return;
        }

        router.get(
            route('my-sunnah.index'),
            { tanggal: date },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['selectedDate', 'selectedData', 'statistik', 'riwayat', 'catatanTerbaru', 'monthLabel'],
                onStart: () => setSwitching(true),
                onFinish: () => setSwitching(false),
            },
        );
    };

    const handleHistorySelect = (iso: string) => {
        if (iso === today || iso === yesterday) {
            selectTab(iso);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Amalan 7SPS" />

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
                {/* Hero guru */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white shadow-brand-lg sm:p-6">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-base font-extrabold ring-1 ring-white/25 backdrop-blur-sm sm:h-14 sm:w-14 sm:text-lg">
                                {(guru?.nama ?? 'G')
                                    .split(' ')
                                    .map((name) => name[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/90 sm:text-[11px]">
                                    <Icon icon="mdi:mosque" className="text-sm" /> Amalan 7SPS
                                </p>
                                <h1 className="mt-1 truncate text-lg font-extrabold tracking-tight sm:text-xl">
                                    {guru?.nama ?? 'Profil Guru Belum Terhubung'}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {guru?.kode_grade && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold ring-1 ring-white/25 backdrop-blur-sm sm:text-[11px]">
                                            <Icon icon="mdi:medal-outline" className="text-xs" /> Grade {guru.kode_grade}
                                        </span>
                                    )}
                                    {guru?.programs?.map((program) => (
                                        <span
                                            key={program}
                                            className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold ring-1 ring-white/25 backdrop-blur-sm sm:text-[11px]"
                                        >
                                            {program}
                                        </span>
                                    ))}
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold ring-1 ring-white/25 backdrop-blur-sm sm:text-[11px]">
                                        <Icon icon="mdi:calendar-today" className="text-xs" /> {formatTanggalPanjang(today)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold shadow-sm ${statusInfo.className}`}>
                                <Icon icon={statusInfo.icon} className="text-sm" />
                                {statusInfo.label}
                            </span>
                            <div className="text-right text-[11px] font-medium text-emerald-100/90">
                                {isPending
                                    ? 'Checklist menunggu ditinjau admin'
                                    : isApproved
                                      ? 'Checklist sudah dikunci admin'
                                      : isRejected
                                        ? 'Silakan perbaiki checklist Anda'
                                        : 'Belum ada checklist hari ini'}
                            </div>
                        </div>
                    </div>
                </div>

                {!guru ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-100">
                            <Icon icon="mdi:account-off-outline" className="text-3xl text-emerald-500" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 sm:text-base">Akun belum terhubung dengan data guru</h2>
                        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                            Hubungi admin untuk menghubungkan akun Anda dengan profil guru agar dapat mengisi checklist Amalan 7SPS.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 4 kartu statistik */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                            <StatMiniCard
                                label="Total Hari"
                                value={String(statistik.total_hari)}
                                icon="mdi:calendar-check"
                                bodyClass="from-blue-50 to-indigo-50 border-blue-200"
                                iconClass="bg-blue-100 text-blue-600"
                                valueClass="text-blue-800"
                                footerClass="bg-[#284988]"
                            />
                            <StatMiniCard
                                label="Total Poin"
                                value={String(statistik.total_poin)}
                                icon="mdi:star-circle"
                                bodyClass="from-emerald-50 to-green-50 border-emerald-200"
                                iconClass="bg-emerald-100 text-emerald-600"
                                valueClass="text-emerald-800"
                                footerClass="bg-[#2e7d32]"
                            />
                            <StatMiniCard
                                label="Rata-rata Poin"
                                value={String(statistik.rata_rata)}
                                icon="mdi:chart-line"
                                bodyClass="from-amber-50 to-orange-50 border-amber-200"
                                iconClass="bg-amber-100 text-amber-600"
                                valueClass="text-amber-800"
                                footerClass="bg-[#f59e0b]"
                            />
                            <StatMiniCard
                                label="Poin Tertinggi"
                                value={String(statistik.tertinggi)}
                                icon="mdi:trophy"
                                bodyClass="from-sky-50 to-cyan-50 border-sky-200"
                                iconClass="bg-sky-100 text-sky-600"
                                valueClass="text-sky-800"
                                footerClass="bg-[#0284c7]"
                            />
                        </div>

                        {/* Kartu tanggal & tab */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 sm:text-base">
                                        <span className="text-base sm:text-lg">📅</span>
                                        <span>{formatTanggalPanjang(selectedDate)}</span>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => selectTab(today)}
                                            disabled={switching}
                                            className={`rounded-lg px-5 py-1.5 text-xs font-bold transition-all duration-200 ${
                                                selectedDate === today
                                                    ? 'bg-[#1a237e] text-white shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            Hari Ini
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => selectTab(yesterday)}
                                            disabled={switching}
                                            className={`rounded-lg px-5 py-1.5 text-xs font-bold transition-all duration-200 ${
                                                selectedDate === yesterday
                                                    ? 'bg-[#1a237e] text-white shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            Kemarin
                                        </button>
                                        {switching && <Icon icon="mdi:loading" className="animate-spin text-sm text-slate-400" />}
                                    </div>

                                    <p className="mt-2 text-[11px] font-normal text-blue-600/90">
                                        Checklist hanya dapat diisi untuk hari ini atau kemarin.
                                    </p>
                                </div>

                                <div className="self-start sm:self-center">
                                    {isApproved ? (
                                        <StatusPill icon="mdi:check-circle" className="border-emerald-200 bg-emerald-100 text-emerald-800" label="Disetujui" />
                                    ) : totalPoin > 0 ? (
                                        <StatusPill icon="mdi:check-bold" className="border-emerald-200 bg-emerald-100 text-emerald-700" label="Sudah Mengisi" />
                                    ) : (
                                        <StatusPill icon="mdi:progress-clock" className="border-amber-200/80 bg-amber-100/90 text-amber-700" label="Belum Mengisi" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress poin hari ini */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-slate-200 hover:shadow-md sm:p-6">
                            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/70 p-3 transition-all duration-700 sm:flex-row sm:items-center sm:p-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-600 text-white shadow-lg shadow-amber-500/30 sm:h-12 sm:w-12">
                                        <Icon icon="mdi:compass-rose" className="text-xl sm:text-2xl" />
                                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-800 sm:text-base">
                                            Progress Poin {selectedDate === today ? 'Hari Ini' : 'Kemarin'}
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                            {checkedCount} dari 12 amalan · {jumlahBerjamaah}/5 berjamaah
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 border-t border-slate-200/70 pt-3 sm:gap-5 sm:border-t-0 sm:pt-0">
                                    <PoinRing poin={displayPoin} size={84} />

                                    <div className="min-w-0">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="bg-gradient-to-br from-amber-600 via-orange-600 to-emerald-600 bg-clip-text text-4xl font-black tabular-nums tracking-tight text-transparent sm:text-5xl">
                                                {displayPoin}
                                            </span>
                                            <span className="text-sm font-bold text-slate-500">poin</span>
                                        </div>
                                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                            Poin wajib: {poinWajib} · Maksimal 100
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <JourneyProgressBar className="mt-4" progress={progressPercent} totalPoin={totalPoin} milestones={milestones} />
                        </div>

                        {/* Checklist */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex flex-col justify-between gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2">
                                    <Icon icon="mdi:mosque" className="text-lg text-amber-500 sm:text-xl" />
                                    <h2 className="text-xs font-bold text-slate-800 sm:text-sm">Amalan 7 Sunnah Suprarasional</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-600 sm:text-xs">
                                    <span>
                                        Berjamaah: <span className="font-bold text-slate-800">{jumlahBerjamaah}/5</span>
                                    </span>
                                    <span className="text-slate-300">·</span>
                                    <span>
                                        Poin Kelompok: <span className="font-bold text-slate-800">{poinWajib}</span>
                                    </span>
                                    {saving && (
                                        <span className="inline-flex items-center gap-1 text-indigo-600">
                                            <Icon icon="mdi:loading" className="animate-spin" /> Menyimpan...
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ChecklistGrid config={poinConfig} state={fields} disabled={isApproved} onToggle={toggleItem} />

                            {isApproved && (
                                <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                                    <Icon icon="mdi:lock" className="text-sm" />
                                    Checklist sudah disetujui admin dan terkunci. Hubungi admin bila perlu perubahan.
                                </p>
                            )}
                            {isRejected && (
                                <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-200/70 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                                    <Icon icon="mdi:alert-circle" className="text-sm" />
                                    Checklist ditolak admin. Perbaiki lalu simpan kembali untuk diajukan ulang.
                                </p>
                            )}
                        </div>

                        {/* Status approval & catatan admin */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                                        <Icon icon="mdi:shield-check-outline" className="text-base" />
                                    </span>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-800 sm:text-sm">Status Approval &amp; Catatan Admin</h3>
                                        <p className="text-[10px] font-medium text-slate-500">Pemantauan checklist oleh admin</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold ${statusInfo.className}`}>
                                    <Icon icon={statusInfo.icon} className="text-xs" />
                                    {statusInfo.label}
                                </span>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Catatan Admin</p>
                                    <p className="mt-1.5 whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-700">
                                        {catatan || 'Belum ada catatan dari admin untuk checklist tanggal ini.'}
                                    </p>
                                    {(approvedBy || approvedAt) && (
                                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-slate-400">
                                            {approvedBy && <span>Oleh {approvedBy}</span>}
                                            {approvedAt && <span>• {approvedAt}</span>}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Catatan Terbaru</p>
                                    {catatanTerbaru.length === 0 ? (
                                        <p className="mt-1.5 text-xs font-medium text-slate-500">Belum ada catatan admin pada bulan ini.</p>
                                    ) : (
                                        <ul className="mt-2 space-y-2">
                                            {catatanTerbaru.map((item) => (
                                                <li key={item.id} className="flex items-start gap-2 text-[11px] leading-snug">
                                                    <span
                                                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                                                            item.status_approval === 'approved'
                                                                ? 'bg-emerald-500'
                                                                : item.status_approval === 'rejected'
                                                                  ? 'bg-rose-500'
                                                                  : 'bg-amber-400'
                                                        }`}
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-slate-600">{item.tanggal}</span>{' '}
                                                        <span className="text-slate-500">{item.catatan}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Riwayat poin bulan ini */}
                        <MonthlyHistoryGrid days={riwayat} monthLabel={monthLabel} onSelect={handleHistorySelect} />
                    </>
                )}
            </div>

            <MilestoneModal
                show={showMilestoneModal}
                milestone={activeMilestone}
                totalPoin={totalPoin}
                onClose={() => {
                    setShowMilestoneModal(false);
                    setActiveMilestone(null);
                }}
            />
        </AuthenticatedLayout>
    );
}

function StatMiniCard({
    label,
    value,
    icon,
    bodyClass,
    iconClass,
    valueClass,
    footerClass,
}: {
    label: string;
    value: string;
    icon: string;
    bodyClass: string;
    iconClass: string;
    valueClass: string;
    footerClass: string;
}) {
    return (
        <div
            className={`flex flex-col justify-between overflow-hidden rounded-2xl border-2 bg-gradient-to-br shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bodyClass}`}
        >
            <div className="px-4 py-4 text-center sm:py-5">
                <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon icon={icon} className="text-base" />
                </div>
                <p className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${valueClass}`}>{value}</p>
            </div>
            <div className={`px-3 py-1.5 text-center text-white ${footerClass}`}>
                <p className="text-[11px] font-bold tracking-wide sm:text-xs">{label}</p>
            </div>
        </div>
    );
}

function StatusPill({ icon, className, label }: { icon: string; className: string; label: string }) {
    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold shadow-sm ${className}`}>
            <Icon icon={icon} className="text-sm" />
            <span>{label}</span>
        </div>
    );
}
