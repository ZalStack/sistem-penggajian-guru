import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import React, { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { Guru, Location, Material, Program, TeachingSession, Transport, PaginatedData } from '@/types';

interface SessionIndexProps {
    sessions?: PaginatedData<TeachingSession> | TeachingSession[];
    schedules?: TeachingSession[];
    gurus?: (Guru & { grade?: { kode_grade: string } })[];
    teachers?: (Guru & { grade?: { kode_grade: string } })[];
    materials?: Material[];
    questions?: Material[];
    locations?: Location[];
    transports?: Transport[];
    programs?: Program[];
    month?: number;
    year?: number;
    currentPekan?: number;
    filters?: {
        month?: number;
        year?: number;
        kelas?: string;
        level?: string;
        bidang?: string;
        pekan?: string | number;
        status?: string;
        filter_guru?: string | number;
        teacher_id?: string | number;
        filter_program?: string | number;
        search?: string;
        periode?: string;
    };
    questionUploadText?: string;
}

const KELAS_OPTIONS = [
    'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6',
    'Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12',
];

const LEVEL_OPTIONS = [
    'Kelas Khusus',
    'Reguler Bogor',
    'Reguler Lainnya',
    'Kelas Online',
];

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function SessionIndex({
    schedules: initialSchedules = [],
    teachers: initialTeachers = [],
    gurus: initialGurus = [],
    materials: initialMaterials = [],
    questions: initialQuestions = [],
    programs = [],
    month: initialMonth = new Date().getMonth() + 1,
    year: initialYear = new Date().getFullYear(),
    currentPekan = 1,
    filters = {},
    questionUploadText = 'Admin menyiapkan & mengunggah materi sebelum hari Minggu (maksimal Minggu pukul 23:59 WIB). Guru menerima dan dapat mengakses materi mulai hari Minggu pada pekan berjalan.',
}: SessionIndexProps) {
    const page = usePage();
    const teachersList = initialTeachers.length > 0 ? initialTeachers : initialGurus;
    const materialsList = initialMaterials.length > 0 ? initialMaterials : initialQuestions;
    const schedulesList = initialSchedules;

    // View mode: 'matrix' (Matriks 4 Pekan) or 'list' (Daftar Sesi Terbaru)
    const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

    // Filter states
    const [teacherSearch, setTeacherSearch] = useState<string>(filters?.search || '');
    const [filterKelas, setFilterKelas] = useState<string>(filters?.kelas || '');
    const [filterLevel, setFilterLevel] = useState<string>(filters?.level || '');
    const [filterBidang, setFilterBidang] = useState<string>(filters?.bidang || '');
    const [filterPekan, setFilterPekan] = useState<string>(filters?.pekan ? String(filters.pekan) : '');
    const [filterStatus, setFilterStatus] = useState<string>(filters?.status || '');
    const [selectedMonth, setSelectedMonth] = useState<number>(filters?.month || initialMonth);
    const [selectedYear, setSelectedYear] = useState<number>(filters?.year || initialYear);

    // Conflict error state & dismissal
    const [dismissedConflict, setDismissedConflict] = useState(false);

    const pageErrors = (page.props?.errors as Record<string, string>) || {};
    const pageFlash = (page.props?.flash as Record<string, any>) || {};

    const hasConflictError = useMemo(() => {
        if (dismissedConflict) return false;
        return Boolean(
            pageErrors.conflict ||
            pageErrors.bentrok ||
            (pageFlash.error && String(pageFlash.error).toLowerCase().includes('bentrok')) ||
            (pageErrors.program_id && String(pageErrors.program_id).toLowerCase().includes('bentrok')) ||
            (pageErrors.jam_mulai && String(pageErrors.jam_mulai).toLowerCase().includes('sama'))
        );
    }, [dismissedConflict, pageErrors, pageFlash]);

    const conflictErrorMessage = useMemo(() => {
        return (
            pageErrors.conflict ||
            pageErrors.bentrok ||
            pageErrors.program_id ||
            pageErrors.jam_mulai ||
            pageFlash.error ||
            'Terdeteksi bentrok jadwal mengajar pada guru, kelas, atau jam yang sama.'
        );
    }, [pageErrors, pageFlash]);

    const clearConflictError = () => {
        setDismissedConflict(true);
    };

    // Modals state
    const [showSingleModal, setShowSingleModal] = useState(false);
    const [showTwoWeeksModal, setShowTwoWeeksModal] = useState(false);
    const [showCycleModal, setShowCycleModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Direct PDF upload in single modal
    const [singlePdfFile, setSinglePdfFile] = useState<File | null>(null);
    const [singlePdfTitle, setSinglePdfTitle] = useState('');

    // Form 1: Single Session Modal state
    const [singleForm, setSingleForm] = useState({
        id: null as number | null,
        teacher_id: '',
        pekan: currentPekan || 1,
        kelas: '',
        level: '',
        bidang: 'MTK',
        material_id: '',
        session_date: '',
        jam_mulai: '',
        jam_selesai: '',
        session_time: '',
        is_active: true,
        notes: '',
        existing_material_title: '',
        existing_material_file: '',
    });

    // Form 2: 2 Weeks Cycle Modal state
    const [twoWeeksForm, setTwoWeeksForm] = useState({
        teacher_id: '',
        month: selectedMonth,
        year: selectedYear,
        weeks: [
            { id: null as number | null, pekan: 1, kelas: '', level: '', bidang: 'MTK', material_id: '', session_date: '', jam_mulai: '', jam_selesai: '', session_time: '', is_active: true, notes: '' },
            { id: null as number | null, pekan: 2, kelas: '', level: '', bidang: 'MTK', material_id: '', session_date: '', jam_mulai: '', jam_selesai: '', session_time: '', is_active: true, notes: '' },
        ],
    });

    // Form 3: 4 Weeks Cycle Modal state
    const [cycleForm, setCycleForm] = useState({
        teacher_id: '',
        month: selectedMonth,
        year: selectedYear,
        weeks: [1, 2, 3, 4].map((p) => ({
            id: null as number | null,
            pekan: p,
            kelas: '',
            level: '',
            bidang: 'MTK',
            material_id: '',
            session_date: '',
            jam_mulai: '',
            jam_selesai: '',
            session_time: '',
            is_active: true,
            notes: '',
        })),
    });

    // Check if any filter is active
    const hasActiveFilter = useMemo(() => {
        return Boolean(teacherSearch || filterKelas || filterLevel || filterBidang || filterPekan || filterStatus);
    }, [teacherSearch, filterKelas, filterLevel, filterBidang, filterPekan, filterStatus]);

    const isTeacherActive = (t: Guru) => {
        return t.is_active_this_week !== false;
    };

    const formatDate = (d: string | null | undefined) => {
        if (!d) return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return d;
        }
    };

    // Filtered teachers for matrix view
    const filteredTeachers = useMemo(() => {
        return teachersList.filter((t) => {
            const kw = teacherSearch.trim().toLowerCase();
            if (kw) {
                const name = (t.nama || t.user?.name || '').toLowerCase();
                const subject = (t.mapel || t.subject || '').toLowerCase();
                if (!name.includes(kw) && !subject.includes(kw)) return false;
            }

            if (filterStatus) {
                const active = isTeacherActive(t);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }

            if (filterBidang) {
                const b = (t.mapel || t.subject || '').toUpperCase();
                const b2 = (t.bidang_2 || '').toUpperCase();
                const target = filterBidang.toUpperCase();
                if (!b.includes(target) && !b2.includes(target)) return false;
            }

            if (filterKelas) {
                const teacherSchedules = schedulesList.filter((s) => Number(s.guru_id ?? s.teacher_id) === Number(t.id));
                const hasClassInSchedule = teacherSchedules.some((s) => s.kelas === filterKelas);
                if (!hasClassInSchedule) return false;
            }

            if (filterLevel) {
                const teacherSchedules = schedulesList.filter((s) => Number(s.guru_id ?? s.teacher_id) === Number(t.id));
                const hasLevelInSchedule = teacherSchedules.some((s) => s.level === filterLevel || s.program?.nama === filterLevel);
                const hasLevelInTeacher = (t.program_names || []).includes(filterLevel) || (t.programs || []).some(p => p.nama === filterLevel);
                if (!hasLevelInSchedule && !hasLevelInTeacher) return false;
            }

            if (filterPekan) {
                const teacherSchedules = schedulesList.filter((s) => Number(s.guru_id ?? s.teacher_id) === Number(t.id));
                const hasPekan = teacherSchedules.some((s) => Number(s.pekan) === Number(filterPekan));
                if (!hasPekan) return false;
            }

            return true;
        });
    }, [teachersList, schedulesList, teacherSearch, filterStatus, filterBidang, filterKelas, filterLevel, filterPekan]);

    // Filtered schedules for descending list view
    const filteredSchedules = useMemo(() => {
        return schedulesList.filter((s) => {
            if (teacherSearch) {
                const kw = teacherSearch.trim().toLowerCase();
                const tName = (s.guru?.nama || s.guru?.user?.name || s.teacher?.nama || '').toLowerCase();
                if (!tName.includes(kw)) return false;
            }
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterLevel && s.level !== filterLevel && s.program?.nama !== filterLevel) return false;
            if (filterBidang && (s.mapel || s.bidang) !== filterBidang) return false;
            if (filterPekan && Number(s.pekan) !== Number(filterPekan)) return false;
            if (filterStatus && s.guru) {
                const active = isTeacherActive(s.guru);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }
            return true;
        });
    }, [schedulesList, teacherSearch, filterKelas, filterLevel, filterBidang, filterPekan, filterStatus]);

    const getSchedulesFor = (teacherId: number, pekan: number) => {
        return schedulesList.filter((s) => {
            if (Number(s.guru_id ?? s.teacher_id) !== Number(teacherId) || Number(s.pekan) !== Number(pekan)) return false;
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterLevel && s.level !== filterLevel && s.program?.nama !== filterLevel) return false;
            if (filterBidang && (s.mapel || s.bidang) !== filterBidang) return false;
            return true;
        });
    };

    const applyFilter = () => {
        router.get('/session', {
            month: selectedMonth,
            year: selectedYear,
            kelas: filterKelas || undefined,
            level: filterLevel || undefined,
            bidang: filterBidang || undefined,
            pekan: filterPekan || undefined,
            status: filterStatus || undefined,
            search: teacherSearch || undefined,
        }, { preserveState: true });
    };

    const resetFilter = () => {
        setTeacherSearch('');
        setFilterKelas('');
        setFilterLevel('');
        setFilterBidang('');
        setFilterPekan('');
        setFilterStatus('');
        router.get('/session', {
            month: selectedMonth,
            year: selectedYear,
        }, { preserveState: true });
    };

    const changeTeacherStatus = (teacher: Guru, value: string) => {
        const isActive = value === 'aktif';
        teacher.is_active_this_week = isActive;
        router.post(`/session/teachers/${teacher.id}/toggle-active`, {
            status: value,
            is_active_this_week: isActive,
        }, {
            preserveScroll: true,
        });
    };

    const deletePlot = (schedule: TeachingSession) => {
        if (confirm(`Hapus sesi mengajar Pekan ${schedule.pekan} (${schedule.kelas || schedule.program?.nama || 'Sesi'})?`)) {
            router.delete(`/session/${schedule.id}`, {
                preserveScroll: true,
            });
        }
    };

    // Open Single Modal
    const openSingleModal = (teacher: Guru | null = null, pekan: number | null = null, item: TeachingSession | null = null) => {
        setDismissedConflict(false);
        setSinglePdfFile(null);
        setSinglePdfTitle('');

        const targetTeacherId = item?.guru_id || item?.teacher_id || teacher?.id || (teachersList[0]?.id || '');
        const targetTeacher = teachersList.find(t => t.id === Number(targetTeacherId));

        const itemLevel = item?.level || (LEVEL_OPTIONS.includes(item?.program?.nama || '') ? (item?.program?.nama || '') : '');
        const itemKelas = KELAS_OPTIONS.includes(item?.kelas || '') ? item?.kelas : (LEVEL_OPTIONS.includes(item?.kelas || '') ? '' : (item?.kelas || ''));

        const rawMulai = item?.jam_mulai ? String(item.jam_mulai).slice(0, 5) : (item?.session_time?.split('-')[0]?.trim() || '');
        const rawSelesai = item?.jam_selesai ? String(item.jam_selesai).slice(0, 5) : (item?.session_time?.split('-')[1]?.trim() || '');
        const sTime = rawMulai && rawSelesai ? `${rawMulai} - ${rawSelesai}` : (item?.session_time || '');

        setSingleForm({
            id: item?.id || null,
            teacher_id: String(targetTeacherId),
            pekan: item?.pekan || pekan || currentPekan || 1,
            kelas: itemKelas || '',
            level: itemLevel || '',
            bidang: (item?.mapel || item?.bidang || targetTeacher?.mapel || 'MTK') as 'IPA' | 'MTK',
            material_id: item?.material_id ? String(item.material_id) : (item?.material?.id ? String(item.material.id) : ''),
            session_date: item?.tanggal ? String(item.tanggal).slice(0, 10) : (item?.session_date ? String(item.session_date).slice(0, 10) : ''),
            jam_mulai: rawMulai,
            jam_selesai: rawSelesai,
            session_time: sTime,
            is_active: item ? Boolean(item.is_active ?? true) : true,
            notes: item?.notes || item?.catatan || '',
            existing_material_title: item?.material?.title || item?.material?.file_name || '',
            existing_material_file: item?.material?.file_path || '',
        });
        setShowSingleModal(true);
    };

    const onSinglePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSinglePdfFile(file);
            if (!singlePdfTitle) {
                setSinglePdfTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    const submitSingle = (e: FormEvent) => {
        e.preventDefault();
        if (!singleForm.teacher_id) return;
        setDismissedConflict(false);
        setProcessing(true);

        const computedSessionTime = singleForm.jam_mulai && singleForm.jam_selesai
            ? `${singleForm.jam_mulai} - ${singleForm.jam_selesai}`
            : (singleForm.session_time || '');

        if (singlePdfFile) {
            const formData = new FormData();
            if (singleForm.id) formData.append('id', String(singleForm.id));
            formData.append('guru_id', singleForm.teacher_id);
            formData.append('teacher_id', singleForm.teacher_id);
            formData.append('month', String(selectedMonth));
            formData.append('year', String(selectedYear));
            formData.append('pekan', String(singleForm.pekan));
            if (singleForm.kelas) formData.append('kelas', singleForm.kelas);
            if (singleForm.level) formData.append('level', singleForm.level);
            if (singleForm.bidang) {
                formData.append('bidang', singleForm.bidang);
                formData.append('mapel', singleForm.bidang);
            }
            if (singleForm.session_date) {
                formData.append('session_date', singleForm.session_date);
                formData.append('tanggal', singleForm.session_date);
            }
            if (singleForm.jam_mulai) formData.append('jam_mulai', singleForm.jam_mulai);
            if (singleForm.jam_selesai) formData.append('jam_selesai', singleForm.jam_selesai);
            if (computedSessionTime) formData.append('session_time', computedSessionTime);
            formData.append('is_active', singleForm.is_active ? '1' : '0');
            if (singleForm.notes) {
                formData.append('notes', singleForm.notes);
                formData.append('catatan', singleForm.notes);
            }
            formData.append('material_pdf', singlePdfFile);
            formData.append('material_pdf_title', singlePdfTitle || '');

            const endpoint = singleForm.id ? `/session/${singleForm.id}` : '/session';
            if (singleForm.id) {
                formData.append('_method', 'PUT');
            }

            router.post(endpoint, formData, {
                preserveScroll: true,
                onSuccess: () => setShowSingleModal(false),
                onFinish: () => setProcessing(false),
            });
            return;
        }

        const payload: Record<string, any> = {
            id: singleForm.id,
            guru_id: singleForm.teacher_id,
            teacher_id: singleForm.teacher_id,
            month: selectedMonth,
            year: selectedYear,
            pekan: singleForm.pekan,
            kelas: singleForm.kelas || null,
            level: singleForm.level || null,
            bidang: singleForm.bidang,
            mapel: singleForm.bidang,
            material_id: singleForm.material_id || null,
            question_id: singleForm.material_id || null,
            session_date: singleForm.session_date || null,
            tanggal: singleForm.session_date || null,
            jam_mulai: singleForm.jam_mulai || null,
            jam_selesai: singleForm.jam_selesai || null,
            session_time: computedSessionTime || null,
            is_active: singleForm.is_active,
            notes: singleForm.notes || null,
            catatan: singleForm.notes || null,
        };

        if (singleForm.id) {
            router.put(`/session/${singleForm.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => setShowSingleModal(false),
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post('/session', payload, {
                preserveScroll: true,
                onSuccess: () => setShowSingleModal(false),
                onFinish: () => setProcessing(false),
            });
        }
    };

    // Open Two Weeks Modal
    const openTwoWeeksModal = (teacher: Guru | null = null) => {
        setDismissedConflict(false);
        const tId = teacher ? teacher.id : (teachersList[0]?.id || '');
        const targetTeacher = teachersList.find(t => t.id === Number(tId));
        const defaultBidang = targetTeacher?.mapel === 'IPA' ? 'IPA' : 'MTK';

        setTwoWeeksForm({
            teacher_id: String(tId),
            month: selectedMonth,
            year: selectedYear,
            weeks: [1, 2].map((p) => {
                const existing = getSchedulesFor(Number(tId), p)[0];
                const jMulai = existing?.jam_mulai ? String(existing.jam_mulai).slice(0, 5) : (existing?.session_time?.split('-')[0]?.trim() || '');
                const jSelesai = existing?.jam_selesai ? String(existing.jam_selesai).slice(0, 5) : (existing?.session_time?.split('-')[1]?.trim() || '');
                const sTime = jMulai && jSelesai ? `${jMulai} - ${jSelesai}` : (existing?.session_time || '');
                return {
                    id: existing?.id || null,
                    pekan: p,
                    kelas: existing?.kelas || existing?.program?.nama || '',
                    level: existing?.level || '',
                    bidang: (existing?.mapel || existing?.bidang || defaultBidang) as string,
                    material_id: existing?.material_id ? String(existing.material_id) : (existing?.material?.id ? String(existing.material.id) : ''),
                    session_date: existing?.tanggal ? String(existing.tanggal).slice(0, 10) : (existing?.session_date ? String(existing.session_date).slice(0, 10) : ''),
                    jam_mulai: jMulai,
                    jam_selesai: jSelesai,
                    session_time: sTime,
                    is_active: existing ? Boolean(existing.is_active ?? true) : true,
                    notes: existing?.notes || existing?.catatan || '',
                };
            }),
        });
        setShowTwoWeeksModal(true);
    };

    const setTwoWeeksPreset = (p1: number, p2: number) => {
        setTwoWeeksForm((prev) => ({
            ...prev,
            weeks: [
                { ...prev.weeks[0], pekan: p1 },
                { ...prev.weeks[1], pekan: p2 },
            ],
        }));
    };

    const submitTwoWeeks = (e: FormEvent) => {
        e.preventDefault();
        if (!twoWeeksForm.teacher_id) return;
        setDismissedConflict(false);
        setProcessing(true);

        router.post('/session', {
            guru_id: twoWeeksForm.teacher_id,
            teacher_id: twoWeeksForm.teacher_id,
            month: twoWeeksForm.month,
            year: twoWeeksForm.year,
            weeks: twoWeeksForm.weeks,
        }, {
            preserveScroll: true,
            onSuccess: () => setShowTwoWeeksModal(false),
            onFinish: () => setProcessing(false),
        });
    };

    // Open Cycle 4 Weeks Modal
    const populateCycleWeeks = (teacherId: number | string) => {
        const targetTeacher = teachersList.find(t => t.id === Number(teacherId));
        const defaultBidang = targetTeacher?.mapel === 'IPA' ? 'IPA' : 'MTK';

        return [1, 2, 3, 4].map((p) => {
            const existing = getSchedulesFor(Number(teacherId), p)[0];
            const jMulai = existing?.jam_mulai ? String(existing.jam_mulai).slice(0, 5) : (existing?.session_time?.split('-')[0]?.trim() || '');
            const jSelesai = existing?.jam_selesai ? String(existing.jam_selesai).slice(0, 5) : (existing?.session_time?.split('-')[1]?.trim() || '');
            const sTime = jMulai && jSelesai ? `${jMulai} - ${jSelesai}` : (existing?.session_time || '');
            return {
                id: existing?.id || null,
                pekan: p,
                kelas: existing?.kelas || existing?.program?.nama || '',
                level: existing?.level || '',
                bidang: (existing?.mapel || existing?.bidang || defaultBidang) as string,
                material_id: existing?.material_id ? String(existing.material_id) : (existing?.material?.id ? String(existing.material.id) : ''),
                session_date: existing?.tanggal ? String(existing.tanggal).slice(0, 10) : (existing?.session_date ? String(existing.session_date).slice(0, 10) : ''),
                jam_mulai: jMulai,
                jam_selesai: jSelesai,
                session_time: sTime,
                is_active: existing ? Boolean(existing.is_active ?? true) : true,
                notes: existing?.notes || existing?.catatan || '',
            };
        });
    };

    const openCycleModal = (teacher: Guru | null = null) => {
        setDismissedConflict(false);
        const tId = teacher ? teacher.id : (teachersList[0]?.id || '');
        setCycleForm({
            teacher_id: String(tId),
            month: selectedMonth,
            year: selectedYear,
            weeks: populateCycleWeeks(tId),
        });
        setShowCycleModal(true);
    };

    const onCycleTeacherChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setCycleForm((prev) => ({
            ...prev,
            teacher_id: newId,
            weeks: populateCycleWeeks(newId),
        }));
    };

    const submitCycle = (e: FormEvent) => {
        e.preventDefault();
        if (!cycleForm.teacher_id) return;
        setDismissedConflict(false);
        setProcessing(true);

        router.post('/session', {
            guru_id: cycleForm.teacher_id,
            teacher_id: cycleForm.teacher_id,
            month: cycleForm.month,
            year: cycleForm.year,
            weeks: cycleForm.weeks,
        }, {
            preserveScroll: true,
            onSuccess: () => setShowCycleModal(false),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ploting Guru (Sesi Mengajar)" />

            <div className="space-y-5">
                {/* Header Title & Subtitle + View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Ploting Guru (Sesi Mengajar)</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kelola penugasan guru, tambah sesi per pekan, upload materi PDF langsung, anti-bentrok, dan status aktif akun guru
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Toggle View Mode */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('matrix')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    viewMode === 'matrix' ? 'bg-white text-slate-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon icon="tabler:layout-grid" className="w-4 h-4" />
                                <span>Matriks 4 Pekan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    viewMode === 'list' ? 'bg-white text-slate-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon icon="tabler:list-details" className="w-4 h-4" />
                                <span>Daftar Sesi (Terbaru)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alarm Anti-Bentrok Jadwal Alert Box */}
                {hasConflictError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon icon="tabler:alert-triangle" className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="text-xs text-red-900 flex-1">
                            <p className="font-bold text-sm uppercase tracking-wider text-red-700">🚨 Peringatan Sistem Alarm Anti-Bentrok Jadwal!</p>
                            <p className="mt-1 leading-relaxed font-semibold">{conflictErrorMessage}</p>
                            <p className="text-[11px] text-red-700 mt-1">
                                Sistem mencegah jadwal ganda pada guru/kelas di jam yang sama. Harap sesuaikan jam sesi atau batalkan sesi lama terlebih dahulu.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={clearConflictError}
                            className="text-red-400 hover:text-red-600 text-base font-bold cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Informasi Siklus & Jadwal Materi */}
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                    <Icon icon="tabler:clock" className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 leading-relaxed">
                        <p className="font-bold text-slate-900 mb-0.5">
                            Pekan Berjalan: Pekan {currentPekan} ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
                        </p>
                        <p>{questionUploadText}</p>
                    </div>
                </div>

                {/* Filter Bar & Action Buttons */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Cari Guru */}
                        <div className="w-full sm:w-52">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    placeholder="Cari guru..."
                                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all"
                                />
                                <Icon icon="tabler:search" className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Filter Kelas */}
                        <div className="w-32">
                            <select
                                value={filterKelas}
                                onChange={(e) => setFilterKelas(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Kelas</option>
                                {KELAS_OPTIONS.map((k) => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Level / Program */}
                        <div className="w-36">
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Level</option>
                                {LEVEL_OPTIONS.map((lvl) => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Bidang / Mapel */}
                        <div className="w-28">
                            <select
                                value={filterBidang}
                                onChange={(e) => setFilterBidang(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Mapel</option>
                                <option value="MTK">MTK</option>
                                <option value="IPA">IPA</option>
                            </select>
                        </div>

                        {/* Filter Pekan */}
                        <div className="w-28">
                            <select
                                value={filterPekan}
                                onChange={(e) => setFilterPekan(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Pekan</option>
                                <option value="1">Pekan 1</option>
                                <option value="2">Pekan 2</option>
                                <option value="3">Pekan 3</option>
                                <option value="4">Pekan 4</option>
                            </select>
                        </div>

                        {/* Filter Status Guru */}
                        <div className="w-32">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </div>

                        {/* Bulan & Tahun */}
                        <div className="w-32">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                {MONTH_NAMES.map((m, idx) => (
                                    <option key={idx + 1} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                            >
                                {[2025, 2026, 2027, 2028].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Actions */}
                        <button
                            type="button"
                            onClick={applyFilter}
                            className="px-3.5 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        >
                            <Icon icon="tabler:filter" className="w-3.5 h-3.5" />
                            <span>Terapkan</span>
                        </button>

                        {hasActiveFilter && (
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Reset
                            </button>
                        )}

                        <div className="flex-1"></div>

                        {/* Action Buttons: Tambah Sesi & Siklus */}
                        <div className="flex flex-wrap items-center gap-2">

                            <button
                                type="button"
                                onClick={() => openSingleModal(null, currentPekan)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-2xs cursor-pointer"
                            >
                                <Icon icon="tabler:plus" className="w-3.5 h-3.5" />
                                <span>+ Tambah Sesi</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openTwoWeeksModal()}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-2xs cursor-pointer"
                            >
                                <span>Siklus 2 Pekan</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openCycleModal()}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
                            >
                                <span>Siklus 4 Pekan</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TAMPILAN 1: Matriks Ploting 4 Pekan (Mendukung Multi-Sesi Per Pekan) */}
                {viewMode === 'matrix' ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                        <th className="py-3.5 px-4 font-semibold min-w-[200px]">Guru Pengajar</th>
                                        <th className="py-3.5 px-3 font-semibold text-center w-36">Status Pekan Ini</th>
                                        {[1, 2, 3, 4].map((p) => (
                                            <th
                                                key={p}
                                                className={`py-3.5 px-3.5 font-semibold min-w-[230px] ${
                                                    p === currentPekan ? 'bg-sky-50/70 text-slate-900 border-x border-sky-100' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Pekan {p}</span>
                                                    {p === currentPekan && (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold uppercase tracking-wider">
                                                            Berjalan
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="py-3.5 px-3 font-semibold text-center w-32">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredTeachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center text-slate-400">
                                                Tidak ada data guru ditemukan sesuai filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTeachers.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/70 align-top transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <p className="font-bold text-slate-800 truncate max-w-[190px]">
                                                        {t.nama || t.user?.name || `Guru #${t.id}`}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Bidang: {t.mapel || t.subject || '-'}{t.bidang_2 ? ` / ${t.bidang_2}` : ''}
                                                    </p>
                                                    {(t.program_names?.length || t.programs?.length) ? (
                                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[190px]">
                                                            Program: {t.program_names?.join(', ') || t.programs?.map(p => p.nama).join(', ')}
                                                        </p>
                                                    ) : null}
                                                </td>

                                                {/* Status Pekan Ini: Dropdown Selector Aktif / Nonaktif */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <select
                                                        value={isTeacherActive(t) ? 'aktif' : 'nonaktif'}
                                                        onChange={(e) => changeTeacherStatus(t, e.target.value)}
                                                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border outline-none cursor-pointer transition-all shadow-2xs ${
                                                            isTeacherActive(t)
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                                        }`}
                                                        title="Ubah status akun guru (Aktif / Nonaktif)"
                                                    >
                                                        <option value="aktif">Aktif</option>
                                                        <option value="nonaktif">Nonaktif</option>
                                                    </select>
                                                </td>

                                                {/* Kolom Pekan 1 s/d 4: Menampilkan Kartu Sesi */}
                                                {[1, 2, 3, 4].map((p) => {
                                                    const sessionsForWeek = getSchedulesFor(t.id, p);
                                                    return (
                                                        <td
                                                            key={p}
                                                            className={`py-3 px-3 ${
                                                                p === currentPekan ? 'bg-sky-50/30 border-x border-sky-100/50' : ''
                                                            }`}
                                                        >
                                                            <div className="space-y-2">
                                                                {sessionsForWeek.map((item, sIdx) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs hover:border-teal-500/60 transition-all"
                                                                    >
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                                                                                    Sesi {sIdx + 1}
                                                                                </span>
                                                                                <span className="text-[11px] font-bold text-slate-800">
                                                                                    {item.kelas || item.program?.nama || 'Semua Kelas'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => openSingleModal(t, p, item)}
                                                                                    className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium"
                                                                                >
                                                                                    Ubah
                                                                                </button>
                                                                                <span className="text-slate-300">|</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => deletePlot(item)}
                                                                                    className="text-[10px] text-red-500 hover:underline cursor-pointer font-medium"
                                                                                >
                                                                                    Hapus
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                                                            <span>
                                                                                Mapel: <strong className="text-slate-700">{item.mapel || item.bidang || t.mapel || '-'}</strong>
                                                                            </span>
                                                                            {item.level && <span className="text-slate-400">{item.level}</span>}
                                                                        </div>

                                                                        {/* Bahan Ajar / Materi PDF */}
                                                                        <div className="pt-0.5">
                                                                            {(item.material || item.question) ? (
                                                                                <p
                                                                                    className="text-[10px] text-slate-700 truncate font-medium flex items-center gap-1"
                                                                                    title={(item.material || item.question)?.title}
                                                                                >
                                                                                    <span className="text-rose-600 font-bold shrink-0">PDF:</span>
                                                                                    <span className="truncate">{(item.material || item.question)?.title}</span>
                                                                                </p>
                                                                            ) : item.bahan_ajar ? (
                                                                                <p className="text-[10px] text-slate-600 truncate">
                                                                                    <span className="text-slate-400">Materi:</span> {item.bahan_ajar}
                                                                                </p>
                                                                            ) : (
                                                                                <p className="text-[10px] text-slate-400 italic">Belum ada bahan ajar</p>
                                                                            )}
                                                                        </div>

                                                                        {/* Tanggal & Jam Sesi */}
                                                                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                                                            {(item.tanggal || item.session_date) && (
                                                                                <span>📅 {formatDate(item.tanggal || item.session_date)}</span>
                                                                            )}
                                                                            {(item.session_time || (item.jam_mulai && item.jam_selesai)) && (
                                                                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                    ⏰ {item.session_time || `${String(item.jam_mulai).slice(0, 5)} - ${String(item.jam_selesai).slice(0, 5)}`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* Tombol Tambah Sesi di Pekan Ini */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSingleModal(t, p)}
                                                                    className="w-full py-1.5 px-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-center gap-1"
                                                                    title="Tambah sesi baru untuk pekan ini"
                                                                >
                                                                    <Icon icon="tabler:plus" className="w-3 h-3" />
                                                                    <span>+ Tambah Sesi Pekan {p}</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}

                                                {/* Kolom Aksi */}
                                                <td className="py-3.5 px-3 text-center">
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => openSingleModal(t, currentPekan)}
                                                            className="w-full px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer"
                                                        >
                                                            + Tambah Sesi
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openTwoWeeksModal(t)}
                                                            className="w-full px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-semibold transition-colors cursor-pointer"
                                                        >
                                                            Plot 2 Pekan
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openCycleModal(t)}
                                                            className="w-full px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                                                        >
                                                            Atur 4 Pekan
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* TAMPILAN 2: Daftar Sesi Mengajar (Urutan Terbaru / Descending) */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-bold text-slate-800">Daftar Sesi Mengajar (Urutan Terbaru / Descending)</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Data sesi diurutkan otomatis berdasarkan tanggal sesi terbaru dan pekan terkini</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    Total {filteredSchedules.length} Sesi Terjadwal
                                </span>
                                <button
                                    type="button"
                                    onClick={() => openSingleModal(null, currentPekan)}
                                    className="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-all cursor-pointer"
                                >
                                    + Tambah Sesi Baru
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-4 font-semibold">Tanggal & Jam Sesi</th>
                                        <th className="py-3 px-3 font-semibold text-center">Pekan</th>
                                        <th className="py-3 px-3.5 font-semibold">Guru Pengajar</th>
                                        <th className="py-3 px-3 font-semibold">Kelas & Level</th>
                                        <th className="py-3 px-3 font-semibold">Bidang</th>
                                        <th className="py-3 px-3.5 font-semibold">Bahan Ajar (Materi)</th>
                                        <th className="py-3 px-3 font-semibold text-center">Status Guru</th>
                                        <th className="py-3 px-3 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredSchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-10 text-center text-slate-400">
                                                Tidak ada data sesi mengajar ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchedules.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-800">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">
                                                            {formatDate(s.tanggal || s.session_date)}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            {s.session_time || (s.jam_mulai && s.jam_selesai ? `${String(s.jam_mulai).slice(0, 5)} - ${String(s.jam_selesai).slice(0, 5)}` : 'Waktu fleksibel')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            s.pekan === currentPekan ? 'bg-sky-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        Pekan {s.pekan}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3.5">
                                                    <p className="font-bold text-slate-800">
                                                        {s.guru?.nama || s.guru?.user?.name || s.teacher?.nama || `Guru #${s.guru_id}`}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {s.guru?.mapel || s.teacher?.mapel || '-'}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <p className="font-semibold text-slate-800">
                                                        {s.kelas || s.program?.nama || 'Semua Kelas'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {s.level || 'Semua Level'}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-3 font-semibold">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-[10px] ${
                                                            (s.mapel || s.bidang) === 'IPA'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-blue-50 text-blue-700'
                                                        }`}
                                                    >
                                                        {s.mapel || s.bidang || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3.5 max-w-[220px]">
                                                    {(s.material || s.question) ? (
                                                        <p
                                                            className="truncate font-medium text-slate-800 flex items-center gap-1"
                                                            title={(s.material || s.question)?.title}
                                                        >
                                                            <span className="text-rose-500 font-bold shrink-0">PDF:</span>
                                                            <span className="truncate">{(s.material || s.question)?.title}</span>
                                                        </p>
                                                    ) : s.bahan_ajar ? (
                                                        <p className="text-slate-600 truncate text-[11px]">{s.bahan_ajar}</p>
                                                    ) : (
                                                        <p className="text-slate-400 italic text-[11px]">Belum ada bahan ajar</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {s.guru ? (
                                                        <select
                                                            value={isTeacherActive(s.guru) ? 'aktif' : 'nonaktif'}
                                                            onChange={(e) => changeTeacherStatus(s.guru!, e.target.value)}
                                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-all shadow-2xs ${
                                                                isTeacherActive(s.guru)
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                                    : 'bg-red-50 text-red-700 border-red-300'
                                                            }`}
                                                        >
                                                            <option value="aktif">Aktif</option>
                                                            <option value="nonaktif">Nonaktif</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openSingleModal(s.guru || null, s.pekan, s)}
                                                            className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                                        >
                                                            Ubah
                                                        </button>
                                                        <span className="text-slate-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => deletePlot(s)}
                                                            className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>



            {/* MODAL 2: Tambah / Ubah Sesi Mengajar (Single Session) */}
            {showSingleModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowSingleModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">
                                    {singleForm.id ? 'Ubah Sesi Mengajar' : 'Tambah Sesi Mengajar Baru'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Guru dapat mengajar di lebih dari satu sesi pada pekan yang sama
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSingleModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitSingle} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Guru Pengajar *</label>
                                <select
                                    required
                                    value={singleForm.teacher_id}
                                    onChange={(e) => {
                                        const tId = e.target.value;
                                        const tg = teachersList.find(t => t.id === Number(tId));
                                        setSingleForm({
                                            ...singleForm,
                                            teacher_id: tId,
                                            bidang: tg?.mapel === 'IPA' ? 'IPA' : 'MTK',
                                        });
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                >
                                    <option value="">-- Pilih Guru --</option>
                                    {teachersList.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nama || t.user?.name || `Guru #${t.id}`} ({t.mapel || t.subject || 'Umum'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Pekan *</label>
                                    <select
                                        required
                                        value={singleForm.pekan}
                                        onChange={(e) => setSingleForm({ ...singleForm, pekan: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        <option value={1}>Pekan 1</option>
                                        <option value={2}>Pekan 2</option>
                                        <option value={3}>Pekan 3</option>
                                        <option value={4}>Pekan 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Kelas</label>
                                    <select
                                        value={singleForm.kelas}
                                        onChange={(e) => setSingleForm({ ...singleForm, kelas: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {KELAS_OPTIONS.map((k) => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Level *</label>
                                    <select
                                        value={singleForm.level}
                                        onChange={(e) => setSingleForm({ ...singleForm, level: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                    >
                                        <option value="">Semua Level</option>
                                        {LEVEL_OPTIONS.map((lvl) => (
                                            <option key={lvl} value={lvl}>{lvl}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Bidang / Mapel</label>
                                    <select
                                        value={singleForm.bidang}
                                        onChange={(e) => setSingleForm({ ...singleForm, bidang: e.target.value as 'IPA' | 'MTK' })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                    >
                                        <option value="MTK">MTK</option>
                                        <option value="IPA">IPA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Tanggal Sesi</label>
                                    <input
                                        type="date"
                                        value={singleForm.session_date}
                                        onChange={(e) => setSingleForm({ ...singleForm, session_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Jam Mulai</label>
                                    <input
                                        type="time"
                                        value={singleForm.jam_mulai}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSingleForm(prev => ({
                                                ...prev,
                                                jam_mulai: val,
                                                session_time: val && prev.jam_selesai ? `${val} - ${prev.jam_selesai}` : (val || prev.session_time),
                                            }));
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Jam Selesai</label>
                                    <input
                                        type="time"
                                        value={singleForm.jam_selesai}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSingleForm(prev => ({
                                                ...prev,
                                                jam_selesai: val,
                                                session_time: prev.jam_mulai && val ? `${prev.jam_mulai} - ${val}` : (val || prev.session_time),
                                            }));
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Bagian Bahan Ajar: Langsung Upload Materi PDF di Modal Tambah Sesi */}
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Icon icon="tabler:file-type-pdf" className="w-4 h-4 text-rose-600" />
                                        <span>Bahan Ajar / Materi PDF</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400">Format .pdf (Maks. 10 MB)</span>
                                </div>

                                {/* Jika sesi sudah memiliki materi terpasang */}
                                {singleForm.existing_material_title && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                                <Icon icon="tabler:file-check" className="w-4 h-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 truncate text-xs">
                                                    {singleForm.existing_material_title}
                                                </p>
                                                <p className="text-[10px] text-emerald-600 font-medium">
                                                    ✓ Materi saat ini terpasang pada sesi ini
                                                </p>
                                            </div>
                                        </div>
                                        {singleForm.existing_material_file && (
                                            <a
                                                href={`/storage/${singleForm.existing_material_file}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] text-teal-600 hover:text-teal-700 font-bold shrink-0 ml-2 hover:underline inline-flex items-center gap-1"
                                            >
                                                <Icon icon="tabler:external-link" className="w-3.5 h-3.5" />
                                                <span>Lihat PDF</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* File Input */}
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                                        {singleForm.existing_material_title ? 'Ganti File PDF Materi (Opsional)' : 'Unggah File PDF Materi (Opsional)'}
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={onSinglePdfChange}
                                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer border border-dashed border-rose-300 rounded-xl bg-white p-2"
                                    />
                                    {singlePdfFile && (
                                        <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                                            <Icon icon="tabler:check" className="w-3.5 h-3.5" />
                                            <span>File terpilih: {singlePdfFile.name} ({(singlePdfFile.size / 1024).toFixed(0)} KB)</span>
                                        </p>
                                    )}
                                </div>

                                {/* Judul Materi Input */}
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                                        Judul Materi (Bahan Ajar)
                                    </label>
                                    <input
                                        type="text"
                                        value={singlePdfTitle}
                                        onChange={(e) => setSinglePdfTitle(e.target.value)}
                                        placeholder={singleForm.existing_material_title || "Contoh: Modul Matematika Sesi 1"}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Catatan Sesi</label>
                                <input
                                    type="text"
                                    value={singleForm.notes}
                                    onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                                    placeholder="Catatan tambahan sesi mengajar..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowSingleModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : (singleForm.id ? 'Perbarui Sesi' : 'Simpan Sesi Ini')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Ploting Sesi Mengajar 2 Pekan */}
            {showTwoWeeksModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowTwoWeeksModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Ploting Sesi Mengajar 2 Pekan</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Atur jadwal sesi per 2 pekan (pekan, tanggal, jam sesi, kelas, bahan ajar)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTwoWeeksModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitTwoWeeks} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Guru Pengajar *</label>
                                    <select
                                        required
                                        value={twoWeeksForm.teacher_id}
                                        onChange={(e) => setTwoWeeksForm({ ...twoWeeksForm, teacher_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachersList.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.nama || t.user?.name || `Guru #${t.id}`} ({t.mapel || t.subject || 'Umum'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Bulan</label>
                                    <select
                                        value={twoWeeksForm.month}
                                        onChange={(e) => setTwoWeeksForm({ ...twoWeeksForm, month: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        {MONTH_NAMES.map((m, idx) => (
                                            <option key={idx + 1} value={idx + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
                                    <select
                                        value={twoWeeksForm.year}
                                        onChange={(e) => setTwoWeeksForm({ ...twoWeeksForm, year: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        {[2025, 2026, 2027, 2028].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Preset Siklus 2 Pekan */}
                            <div className="flex items-center gap-2 pt-1 pb-1">
                                <span className="text-xs text-slate-500 font-semibold">Pilihan Siklus:</span>
                                <button
                                    type="button"
                                    onClick={() => setTwoWeeksPreset(1, 2)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition-all ${
                                        twoWeeksForm.weeks[0].pekan === 1 && twoWeeksForm.weeks[1].pekan === 2
                                            ? 'bg-teal-600 text-white border-teal-600 font-bold'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-500'
                                    }`}
                                >
                                    Pekan 1 & 2
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTwoWeeksPreset(3, 4)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition-all ${
                                        twoWeeksForm.weeks[0].pekan === 3 && twoWeeksForm.weeks[1].pekan === 4
                                            ? 'bg-teal-600 text-white border-teal-600 font-bold'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-500'
                                    }`}
                                >
                                    Pekan 3 & 4
                                </button>
                            </div>

                            <div className="space-y-3">
                                {twoWeeksForm.weeks.map((w, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-800">Sesi ke-{idx + 1}:</span>
                                                <select
                                                    value={w.pekan}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], pekan: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white outline-none"
                                                >
                                                    <option value={1}>Pekan 1</option>
                                                    <option value={2}>Pekan 2</option>
                                                    <option value={3}>Pekan 3</option>
                                                    <option value={4}>Pekan 4</option>
                                                </select>
                                            </div>
                                            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={w.is_active}
                                                    onChange={(e) => {
                                                        const val = e.target.checked;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], is_active: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="rounded border-slate-300"
                                                />
                                                <span>Aktif</span>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Tanggal Sesi</label>
                                                <input
                                                    type="date"
                                                    value={w.session_date}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], session_date: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Jam Mulai</label>
                                                <input
                                                    type="time"
                                                    value={w.jam_mulai}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            const jSelesai = copy[idx].jam_selesai;
                                                            copy[idx] = {
                                                                ...copy[idx],
                                                                jam_mulai: val,
                                                                session_time: val && jSelesai ? `${val} - ${jSelesai}` : (val || copy[idx].session_time),
                                                            };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Jam Selesai</label>
                                                <input
                                                    type="time"
                                                    value={w.jam_selesai}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            const jMulai = copy[idx].jam_mulai;
                                                            copy[idx] = {
                                                                ...copy[idx],
                                                                jam_selesai: val,
                                                                session_time: jMulai && val ? `${jMulai} - ${val}` : (val || copy[idx].session_time),
                                                            };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Kelas</label>
                                                <select
                                                    value={w.kelas}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], kelas: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="">Semua Kelas</option>
                                                    {KELAS_OPTIONS.map((k) => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Level</label>
                                                <select
                                                    value={w.level}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], level: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="">Semua Level</option>
                                                    {LEVEL_OPTIONS.map((lvl) => (
                                                        <option key={lvl} value={lvl}>{lvl}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Bidang</label>
                                                <select
                                                    value={w.bidang}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], bidang: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="MTK">MTK</option>
                                                    <option value="IPA">IPA</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Bahan Ajar (Materi)</label>
                                                <select
                                                    value={w.material_id}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], material_id: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="">-- Pilih Bahan Ajar --</option>
                                                    {materialsList.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.title} ({m.subject || 'Umum'} - {m.pekan || 'Semua Pekan'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Catatan</label>
                                                <input
                                                    type="text"
                                                    placeholder="Catatan sesi..."
                                                    value={w.notes}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], notes: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowTwoWeeksModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Ploting 2 Pekan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: Ploting Siklus 4 Pekan */}
            {showCycleModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowCycleModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Ploting Jadwal Mengajar Siklus 4 Pekan</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Atur jadwal mengajar dan bahan ajar Pekan 1 s/d Pekan 4 sekaligus</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCycleModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitCycle} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Guru Pengajar *</label>
                                    <select
                                        required
                                        value={cycleForm.teacher_id}
                                        onChange={onCycleTeacherChange}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachersList.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.nama || t.user?.name || `Guru #${t.id}`} ({t.mapel || t.subject || 'Umum'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Bulan</label>
                                    <select
                                        value={cycleForm.month}
                                        onChange={(e) => setCycleForm({ ...cycleForm, month: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        {MONTH_NAMES.map((m, idx) => (
                                            <option key={idx + 1} value={idx + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
                                    <select
                                        value={cycleForm.year}
                                        onChange={(e) => setCycleForm({ ...cycleForm, year: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
                                    >
                                        {[2025, 2026, 2027, 2028].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cycleForm.weeks.map((w, idx) => (
                                    <div key={w.pekan} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800">Pekan {w.pekan}</span>
                                            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={w.is_active}
                                                    onChange={(e) => {
                                                        const val = e.target.checked;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], is_active: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="rounded border-slate-300"
                                                />
                                                <span>Aktif Mengajar di Pekan {w.pekan}</span>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Kelas</label>
                                                <select
                                                    value={w.kelas}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], kelas: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="">Semua Kelas</option>
                                                    {KELAS_OPTIONS.map((k) => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Level</label>
                                                <select
                                                    value={w.level}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], level: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="">Semua Level</option>
                                                    {LEVEL_OPTIONS.map((lvl) => (
                                                        <option key={lvl} value={lvl}>{lvl}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Bidang</label>
                                                <select
                                                    value={w.bidang}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], bidang: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="MTK">MTK</option>
                                                    <option value="IPA">IPA</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Tanggal Sesi</label>
                                                <input
                                                    type="date"
                                                    value={w.session_date}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], session_date: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Jam Mulai</label>
                                                <input
                                                    type="time"
                                                    value={w.jam_mulai}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            const jSelesai = copy[idx].jam_selesai;
                                                            copy[idx] = {
                                                                ...copy[idx],
                                                                jam_mulai: val,
                                                                session_time: val && jSelesai ? `${val} - ${jSelesai}` : (val || copy[idx].session_time),
                                                            };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Jam Selesai</label>
                                                <input
                                                    type="time"
                                                    value={w.jam_selesai}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            const jMulai = copy[idx].jam_mulai;
                                                            copy[idx] = {
                                                                ...copy[idx],
                                                                jam_selesai: val,
                                                                session_time: jMulai && val ? `${jMulai} - ${val}` : (val || copy[idx].session_time),
                                                            };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Bahan Ajar (Materi Pekan {w.pekan})</label>
                                                <select
                                                    value={w.material_id}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], material_id: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                >
                                                    <option value="">-- Otomatis / Pilih Bahan Ajar --</option>
                                                    {materialsList.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.title} ({m.subject || 'Umum'} - {m.pekan || 'Semua Pekan'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Catatan Ploting</label>
                                                <input
                                                    type="text"
                                                    placeholder="Catatan sesi mengajar..."
                                                    value={w.notes}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], notes: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCycleModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Siklus 4 Pekan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
