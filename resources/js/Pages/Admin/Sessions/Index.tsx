import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { Guru, Location, Material, Program, TeachingSession, Transport, PaginatedData } from '@/types';

interface SessionIndexProps {
    sessions?: PaginatedData<TeachingSession> | TeachingSession[];
    schedules?: TeachingSession[];
    gurus?: (Guru & { grade?: { kode_grade: string }; name?: string; subject?: string; subject_2?: string; kelas_diajar?: string | null })[];
    teachers?: (Guru & { grade?: { kode_grade: string }; name?: string; subject?: string; subject_2?: string; kelas_diajar?: string | null })[];
    materials?: Material[];
    questions?: Material[];
    locations?: Location[];
    transports?: Transport[];
    programs?: Program[];
    month?: number;
    year?: number;
    currentPekan?: number;
    basePath?: string;
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
    month: initialMonth = new Date().getMonth() + 1,
    year: initialYear = new Date().getFullYear(),
    currentPekan = 1,
    basePath = 'session',
    filters = {},
    questionUploadText = 'Jadwal Materi: Admin menyiapkan & mengunggah materi sebelum hari Rabu. Guru menerima dan dapat mengakses bahan ajar sesuai ploting pekan berjalan mulai hari Rabu.',
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
            'Terdeteksi bentrok jadwal mengajar.'
        );
    }, [pageErrors, pageFlash]);

    const clearConflictError = () => {
        setDismissedConflict(true);
    };

    // Processing indicator
    const [processing, setProcessing] = useState(false);

    // Modals visibility
    const [showTwoWeeksModal, setShowTwoWeeksModal] = useState(false);
    const [showSingleModal, setShowSingleModal] = useState(false);
    const [showCycleModal, setShowCycleModal] = useState(false);
    const [showUploadPdfModal, setShowUploadPdfModal] = useState(false);

    // Direct PDF upload in single modal
    const [showDirectPdfInput, setShowDirectPdfInput] = useState(false);
    const [singleDirectPdfFile, setSingleDirectPdfFile] = useState<File | null>(null);
    const [singleDirectPdfTitle, setSingleDirectPdfTitle] = useState('');

    const toggleDirectPdfUpload = () => {
        const next = !showDirectPdfInput;
        setShowDirectPdfInput(next);
        if (!next) {
            setSingleDirectPdfFile(null);
            setSingleDirectPdfTitle('');
        }
    };

    const onSingleDirectPdfSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSingleDirectPdfFile(file);
            if (!singleDirectPdfTitle) {
                setSingleDirectPdfTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    // Upload PDF standalone modal form
    const [uploadPdfProcessing, setUploadPdfProcessing] = useState(false);
    const [uploadPdfFileName, setUploadPdfFileName] = useState('');
    const [uploadPdfForm, setUploadPdfForm] = useState({
        title: '',
        file: null as File | null,
        subject: 'MTK',
        pekan: '',
        kelas: '',
        level: '',
        description: '',
    });

    const openUploadPdfModal = (defaultBidang = 'MTK', defaultPekan: string | number = '', defaultKelas = '') => {
        setUploadPdfForm({
            title: '',
            file: null,
            subject: defaultBidang || 'MTK',
            pekan: defaultPekan ? `Pekan ${defaultPekan}` : '',
            kelas: defaultKelas || '',
            level: '',
            description: '',
        });
        setUploadPdfFileName('');
        setShowUploadPdfModal(true);
    };

    const onPdfFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadPdfForm(prev => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
            }));
            setUploadPdfFileName(file.name);
        }
    };

    const submitUploadPdf = (e: FormEvent) => {
        e.preventDefault();
        if (!uploadPdfForm.file || !uploadPdfForm.title) return;
        setUploadPdfProcessing(true);

        const formData = new FormData();
        formData.append('title', uploadPdfForm.title);
        formData.append('file', uploadPdfForm.file);
        if (uploadPdfForm.subject) formData.append('subject', uploadPdfForm.subject);
        if (uploadPdfForm.pekan) formData.append('pekan', uploadPdfForm.pekan);
        if (uploadPdfForm.kelas) formData.append('kelas', uploadPdfForm.kelas);
        if (uploadPdfForm.description) formData.append('description', uploadPdfForm.description);

        router.post(`/${basePath}/upload-material`, formData, {
            preserveScroll: true,
            onSuccess: (pageResp: any) => {
                setShowUploadPdfModal(false);
                setUploadPdfProcessing(false);
                const uploadedId = pageResp?.props?.flash?.uploaded_question_id || pageResp?.props?.flash?.uploaded_material_id;
                if (uploadedId && showSingleModal) {
                    setSingleForm(prev => ({ ...prev, question_id: String(uploadedId) }));
                }
            },
            onError: () => {
                setUploadPdfProcessing(false);
            },
        });
    };

    const hasActiveFilter = useMemo(() => {
        return Boolean(teacherSearch || filterKelas || filterBidang || filterPekan || filterStatus);
    }, [teacherSearch, filterKelas, filterBidang, filterPekan, filterStatus]);

    const isTeacherActive = (t: any) => {
        return t?.is_active_this_week !== false;
    };

    const monthName = (m: number) => {
        return MONTH_NAMES[(Number(m) || 1) - 1] || '-';
    };

    const formatDate = (d: string | null | undefined) => {
        if (!d) return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return d;
        }
    };

    // Filter teachers for matrix view
    const filteredTeachers = useMemo(() => {
        return teachersList.filter((t) => {
            // 1. Text search
            const kw = teacherSearch.trim().toLowerCase();
            if (kw) {
                const name = (t.user?.name || t.name || t.nama || '').toLowerCase();
                const subject = (t.subject || t.mapel || '').toLowerCase();
                if (!name.includes(kw) && !subject.includes(kw)) return false;
            }

            // 2. Status filter
            if (filterStatus) {
                const active = isTeacherActive(t);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }

            // 3. Bidang filter
            if (filterBidang) {
                const b = (t.subject || t.mapel || '').toUpperCase();
                const b2 = (t.subject_2 || t.bidang_2 || '').toUpperCase();
                const target = filterBidang.toUpperCase();
                if (!b.includes(target) && !b2.includes(target)) return false;
            }

            // 4. Kelas filter
            if (filterKelas) {
                const teacherSchedules = schedulesList.filter(s => Number(s.teacher_id ?? s.guru_id) === Number(t.id));
                const hasClassInSchedule = teacherSchedules.some(s => s.kelas === filterKelas);
                const hasClassInTeacher = (t.kelas_diajar || t.jenjang || '').includes(filterKelas);
                if (!hasClassInSchedule && !hasClassInTeacher) return false;
            }

            // 5. Pekan filter
            if (filterPekan) {
                const teacherSchedules = schedulesList.filter(s => Number(s.teacher_id ?? s.guru_id) === Number(t.id));
                const hasPekan = teacherSchedules.some(s => Number(s.pekan) === Number(filterPekan));
                if (!hasPekan) return false;
            }

            return true;
        });
    }, [teachersList, schedulesList, teacherSearch, filterStatus, filterBidang, filterKelas, filterPekan]);

    // Filtered schedules for descending list view
    const filteredSchedules = useMemo(() => {
        return schedulesList.filter((s) => {
            if (teacherSearch) {
                const kw = teacherSearch.trim().toLowerCase();
                const tName = (s.teacher?.user?.name || s.teacher?.name || s.guru?.nama || s.guru?.user?.name || '').toLowerCase();
                if (!tName.includes(kw)) return false;
            }
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterBidang && (s.bidang || s.mapel) !== filterBidang) return false;
            if (filterPekan && Number(s.pekan) !== Number(filterPekan)) return false;
            if (filterStatus) {
                const teacherObj = s.teacher || s.guru;
                const active = isTeacherActive(teacherObj);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }
            return true;
        });
    }, [schedulesList, teacherSearch, filterKelas, filterBidang, filterPekan, filterStatus]);

    const getSchedulesFor = (teacherId: number | string, pekan: number | string) => {
        return schedulesList.filter((s) => {
            if (Number(s.teacher_id ?? s.guru_id) !== Number(teacherId) || Number(s.pekan) !== Number(pekan)) return false;
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterBidang && (s.bidang || s.mapel) !== filterBidang) return false;
            return true;
        });
    };

    const applyFilter = () => {
        router.get(`/${basePath}`, {
            month: selectedMonth,
            year: selectedYear,
            kelas: filterKelas || undefined,
            bidang: filterBidang || undefined,
            pekan: filterPekan || undefined,
            status: filterStatus || undefined,
            search: teacherSearch || undefined,
        }, { preserveState: true });
    };

    const resetFilter = () => {
        setTeacherSearch('');
        setFilterKelas('');
        setFilterBidang('');
        setFilterPekan('');
        setFilterStatus('');
        router.get(`/${basePath}`, {
            month: selectedMonth,
            year: selectedYear,
        }, { preserveState: true });
    };

    // Change teacher status via dropdown
    const changeTeacherStatus = (teacher: any, value: string) => {
        const isActive = value === 'aktif';
        teacher.is_active_this_week = isActive;
        router.post(`/${basePath}/teachers/${teacher.id}/toggle-active`, {
            status: value,
            is_active_this_week: isActive,
        }, {
            preserveScroll: true,
        });
    };

    const deletePlot = (schedule: TeachingSession) => {
        if (confirm(`Hapus sesi mengajar Pekan ${schedule.pekan} (${schedule.kelas || 'Semua Kelas'})?`)) {
            router.delete(`/${basePath}/${schedule.id}`, {
                preserveScroll: true,
            });
        }
    };

    // FORM 1: Ploting Sesi 2 Pekan
    const [twoWeeksForm, setTwoWeeksForm] = useState({
        teacher_id: '',
        month: initialMonth,
        year: initialYear,
        weeks: [
            { id: null as number | null, pekan: 1, kelas: '', level: '', bidang: 'MTK', question_id: '', session_date: '', session_time: '', is_active: true, notes: '' },
            { id: null as number | null, pekan: 2, kelas: '', level: '', bidang: 'MTK', question_id: '', session_date: '', session_time: '', is_active: true, notes: '' },
        ],
    });

    const setTwoWeeksPreset = (p1: number, p2: number) => {
        setTwoWeeksForm((prev) => ({
            ...prev,
            weeks: [
                { ...prev.weeks[0], pekan: p1 },
                { ...prev.weeks[1], pekan: p2 },
            ],
        }));
    };

    const openTwoWeeksModal = (teacher: any = null) => {
        setDismissedConflict(false);
        const tId = teacher ? teacher.id : (teachersList[0]?.id || '');
        const targetTeacher = teachersList.find(t => Number(t.id) === Number(tId));
        const defaultBidang = (targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK';
        const defaultKelas = targetTeacher?.kelas_diajar || targetTeacher?.jenjang || '';

        setTwoWeeksForm({
            teacher_id: String(tId),
            month: selectedMonth,
            year: selectedYear,
            weeks: [1, 2].map((p) => {
                const existing = getSchedulesFor(tId, p)[0];
                return {
                    id: existing?.id || null,
                    pekan: p,
                    kelas: existing?.kelas || defaultKelas,
                    level: existing?.level || '',
                    bidang: (existing?.bidang || existing?.mapel || defaultBidang) as string,
                    question_id: existing?.question_id ? String(existing.question_id) : (existing?.material_id ? String(existing.material_id) : ''),
                    session_date: existing?.session_date ? String(existing.session_date).slice(0, 10) : (existing?.tanggal ? String(existing.tanggal).slice(0, 10) : ''),
                    session_time: existing?.session_time || '',
                    is_active: existing ? Boolean(existing.is_active) : true,
                    notes: existing?.notes || existing?.catatan || '',
                };
            }),
        });
        setShowTwoWeeksModal(true);
    };

    const submitTwoWeeks = (e: FormEvent) => {
        e.preventDefault();
        if (!twoWeeksForm.teacher_id) return;
        setDismissedConflict(false);
        setProcessing(true);

        router.post(`/${basePath}`, {
            teacher_id: twoWeeksForm.teacher_id,
            guru_id: twoWeeksForm.teacher_id,
            month: twoWeeksForm.month,
            year: twoWeeksForm.year,
            weeks: twoWeeksForm.weeks,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowTwoWeeksModal(false); },
            onFinish: () => { setProcessing(false); },
        });
    };

    // FORM 2: Tambah / Ubah Sesi Mengajar (Single Session)
    const [singleForm, setSingleForm] = useState({
        id: null as number | null,
        teacher_id: '',
        month: initialMonth,
        year: initialYear,
        pekan: currentPekan || 1,
        kelas: '',
        level: '',
        bidang: 'MTK',
        question_id: '',
        session_date: '',
        session_time: '',
        is_active: true,
        notes: '',
    });

    const openSingleModal = (teacher: any = null, pekan: number | null = null, item: TeachingSession | null = null) => {
        setDismissedConflict(false);
        setShowDirectPdfInput(false);
        setSingleDirectPdfFile(null);
        setSingleDirectPdfTitle('');

        const targetTeacherId = item?.teacher_id || item?.guru_id || teacher?.id || (teachersList[0]?.id || '');
        const targetTeacher = teachersList.find(t => Number(t.id) === Number(targetTeacherId));

        setSingleForm({
            id: item?.id || null,
            teacher_id: String(targetTeacherId),
            month: selectedMonth,
            year: selectedYear,
            pekan: item?.pekan || pekan || currentPekan || 1,
            kelas: item?.kelas || targetTeacher?.kelas_diajar || targetTeacher?.jenjang || '',
            level: item?.level || '',
            bidang: item?.bidang || item?.mapel || ((targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK'),
            question_id: item?.question_id ? String(item.question_id) : (item?.material_id ? String(item.material_id) : ''),
            session_date: item?.session_date ? String(item.session_date).slice(0, 10) : (item?.tanggal ? String(item.tanggal).slice(0, 10) : ''),
            session_time: item?.session_time || '',
            is_active: item ? Boolean(item.is_active) : true,
            notes: item?.notes || item?.catatan || '',
        });
        setShowSingleModal(true);
    };

    const submitSingle = (e: FormEvent) => {
        e.preventDefault();
        if (!singleForm.teacher_id) return;
        setDismissedConflict(false);
        setProcessing(true);

        if (showDirectPdfInput && singleDirectPdfFile) {
            const formData = new FormData();
            if (singleForm.id) formData.append('id', String(singleForm.id));
            formData.append('teacher_id', singleForm.teacher_id);
            formData.append('guru_id', singleForm.teacher_id);
            formData.append('month', String(singleForm.month));
            formData.append('year', String(singleForm.year));
            formData.append('pekan', String(singleForm.pekan));
            if (singleForm.kelas) formData.append('kelas', singleForm.kelas);
            if (singleForm.level) formData.append('level', singleForm.level);
            if (singleForm.bidang) formData.append('bidang', singleForm.bidang);
            if (singleForm.session_date) formData.append('session_date', singleForm.session_date);
            if (singleForm.session_time) formData.append('session_time', singleForm.session_time);
            formData.append('is_active', singleForm.is_active ? '1' : '0');
            if (singleForm.notes) formData.append('notes', singleForm.notes);
            formData.append('material_pdf', singleDirectPdfFile);
            formData.append('material_pdf_title', singleDirectPdfTitle || '');

            router.post(`/${basePath}`, formData, {
                preserveScroll: true,
                onSuccess: () => { setShowSingleModal(false); },
                onFinish: () => { setProcessing(false); },
            });
            return;
        }

        router.post(`/${basePath}`, {
            id: singleForm.id,
            teacher_id: singleForm.teacher_id,
            guru_id: singleForm.teacher_id,
            month: singleForm.month,
            year: singleForm.year,
            pekan: singleForm.pekan,
            kelas: singleForm.kelas || null,
            level: singleForm.level || null,
            bidang: singleForm.bidang || null,
            question_id: singleForm.question_id || null,
            material_id: singleForm.question_id || null,
            session_date: singleForm.session_date || null,
            session_time: singleForm.session_time || null,
            is_active: singleForm.is_active,
            notes: singleForm.notes || null,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowSingleModal(false); },
            onFinish: () => { setProcessing(false); },
        });
    };

    // FORM 3: Ploting Siklus 4 Pekan
    const populateCycleWeeksForTeacher = (teacherId: number | string) => {
        const targetTeacher = teachersList.find(t => Number(t.id) === Number(teacherId));
        const defaultBidang = (targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK';
        const defaultKelas = targetTeacher?.kelas_diajar || targetTeacher?.jenjang || '';

        return [1, 2, 3, 4].map((p) => {
            const existing = getSchedulesFor(teacherId, p)[0];
            return {
                id: existing?.id || null,
                pekan: p,
                kelas: existing?.kelas || defaultKelas,
                level: existing?.level || '',
                bidang: (existing?.bidang || existing?.mapel || defaultBidang) as string,
                question_id: existing?.question_id ? String(existing.question_id) : (existing?.material_id ? String(existing.material_id) : ''),
                session_date: existing?.session_date ? String(existing.session_date).slice(0, 10) : (existing?.tanggal ? String(existing.tanggal).slice(0, 10) : ''),
                session_time: existing?.session_time || '',
                is_active: existing ? Boolean(existing.is_active) : true,
                notes: existing?.notes || existing?.catatan || '',
            };
        });
    };

    const [cycleForm, setCycleForm] = useState({
        teacher_id: '',
        month: initialMonth,
        year: initialYear,
        weeks: [1, 2, 3, 4].map(p => ({
            id: null as number | null,
            pekan: p,
            kelas: '',
            level: '',
            bidang: 'MTK',
            question_id: '',
            session_date: '',
            session_time: '',
            is_active: true,
            notes: '',
        })),
    });

    const onCycleTeacherChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setCycleForm(prev => ({
            ...prev,
            teacher_id: newId,
            weeks: populateCycleWeeksForTeacher(newId),
        }));
    };

    const openCycleModal = (teacher: any = null) => {
        setDismissedConflict(false);
        const tId = teacher ? teacher.id : (teachersList[0]?.id || '');
        setCycleForm({
            teacher_id: String(tId),
            month: selectedMonth,
            year: selectedYear,
            weeks: populateCycleWeeksForTeacher(tId),
        });
        setShowCycleModal(true);
    };

    const submitCycle = (e: FormEvent) => {
        e.preventDefault();
        if (!cycleForm.teacher_id) return;
        setDismissedConflict(false);
        setProcessing(true);

        router.post(`/${basePath}`, {
            teacher_id: cycleForm.teacher_id,
            guru_id: cycleForm.teacher_id,
            month: cycleForm.month,
            year: cycleForm.year,
            weeks: cycleForm.weeks,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowCycleModal(false); },
            onFinish: () => { setProcessing(false); },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ploting Guru (Sesi Mengajar)" />

            <div className="space-y-5">
                {/* Title & Subtitle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-deep-twilight">Ploting Guru (Sesi Mengajar)</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
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
                                    viewMode === 'matrix' ? 'bg-white text-deep-twilight font-bold shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span>Matriks 4 Pekan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    viewMode === 'list' ? 'bg-white text-deep-twilight font-bold shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                <span>Daftar Sesi (Terbaru)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alarm Anti-Bentrok Jadwal Alert Box */}
                {hasConflictError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="text-xs text-red-900 flex-1">
                            <p className="font-bold text-sm uppercase tracking-wider text-red-700">🚨 Peringatan Sistem Alarm Anti-Bentrok Jadwal!</p>
                            <p className="mt-1 leading-relaxed font-semibold">{conflictErrorMessage}</p>
                            <p className="text-[11px] text-red-700 mt-1">
                                Sistem mencegah jadwal ganda pada guru/kelas di jam yang sama. Harap sesuaikan jam sesi atau batalkan sesi lama terlebih dahulu.
                            </p>
                        </div>
                        <button type="button" onClick={clearConflictError} className="text-red-400 hover:text-red-600 text-base font-bold cursor-pointer">
                            &times;
                        </button>
                    </div>
                )}

                {/* Informasi Siklus & Jadwal Materi */}
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-french-blue shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-slate-700 leading-relaxed">
                        <p className="font-bold text-deep-twilight mb-0.5">
                            Pekan Berjalan: Pekan {currentPekan} ({monthName(selectedMonth)} {selectedYear})
                        </p>
                        <p>{questionUploadText}</p>
                    </div>
                </div>

                {/* Filter Bar yang Bagus & Relevan */}
                <div className="bg-white rounded-2xl border border-light-cyan p-4 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Cari Guru */}
                        <div className="w-full sm:w-52">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    placeholder="Cari guru..."
                                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all"
                                />
                                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Filter Kelas */}
                        <div className="w-32">
                            <select
                                value={filterKelas}
                                onChange={(e) => setFilterKelas(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Kelas</option>
                                {KELAS_OPTIONS.map((k) => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Bidang */}
                        <div className="w-28">
                            <select
                                value={filterBidang}
                                onChange={(e) => setFilterBidang(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
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
                                className="w-full px-2.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
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
                                className="w-full px-2.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
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
                                className="w-full px-2.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{monthName(m)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full px-2.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                {[2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <button
                            type="button"
                            onClick={applyFilter}
                            className="px-3.5 py-2 bg-bright-teal text-white text-xs font-semibold rounded-xl hover:bg-blue-green transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293-.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>Terapkan</span>
                        </button>

                        {hasActiveFilter && (
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Reset
                            </button>
                        )}

                        <div className="flex-1"></div>

                        {/* Tombol Aksi: Upload PDF & Tambah Sesi */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Tombol Langsung Upload PDF Materi */}
                            <button
                                type="button"
                                onClick={() => openUploadPdfModal()}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all shadow-2xs cursor-pointer"
                                title="Upload file PDF materi bahan ajar langsung"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span>+ Upload Materi PDF</span>
                            </button>

                            {/* Tombol Tambah Sesi */}
                            <button
                                type="button"
                                onClick={() => openSingleModal(null, currentPekan)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-french-blue text-white text-xs font-bold rounded-xl hover:bg-deep-twilight transition-all shadow-2xs cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>+ Tambah Sesi</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openTwoWeeksModal()}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-bright-teal text-white text-xs font-semibold rounded-xl hover:bg-blue-green transition-all shadow-2xs cursor-pointer"
                            >
                                <span>Siklus 2 Pekan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => openCycleModal()}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                <span>Siklus 4 Pekan</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TAMPILAN 1: Matriks Ploting 4 Pekan (Mendukung Multi-Sesi Per Pekan) */}
                {viewMode === 'matrix' ? (
                    <div className="bg-white rounded-2xl border border-light-cyan overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-light-cyan text-[11px] uppercase tracking-wider text-gray-500">
                                        <th className="py-3.5 px-4 font-semibold min-w-[200px]">Guru Pengajar</th>
                                        <th className="py-3.5 px-3 font-semibold text-center w-36">Status Pekan Ini</th>
                                        {[1, 2, 3, 4].map((p) => (
                                            <th
                                                key={p}
                                                className={`py-3.5 px-3.5 font-semibold min-w-[230px] ${
                                                    p === currentPekan ? 'bg-sky-50/70 text-deep-twilight' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Pekan {p}</span>
                                                    {p === currentPekan && (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold">
                                                            Berjalan
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="py-3.5 px-3 font-semibold text-center w-28">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-cyan/60 text-xs">
                                    {filteredTeachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-400">
                                                Tidak ada data guru ditemukan sesuai filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTeachers.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/60 align-top">
                                                <td className="py-3.5 px-4">
                                                    <p className="font-bold text-deep-twilight truncate max-w-[190px]">
                                                        {t.user?.name || t.name || t.nama || `Guru #${t.id}`}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        Bidang: {t.subject || t.mapel || '-'}{t.subject_2 || t.bidang_2 ? ` / ${t.subject_2 || t.bidang_2}` : ''}
                                                    </p>
                                                    {(t.kelas_diajar || t.jenjang) && (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            Kelas: {t.kelas_diajar || t.jenjang}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Status Pekan Ini: DROPDOWN (Aktif / Nonaktif) */}
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

                                                {/* Kolom Pekan: Menampilkan Semua Sesi yang Diploting pada Pekan Ini */}
                                                {[1, 2, 3, 4].map((p) => {
                                                    const sessionsForWeek = getSchedulesFor(t.id, p);
                                                    return (
                                                        <td
                                                            key={p}
                                                            className={`py-3 px-3 ${p === currentPekan ? 'bg-sky-50/30' : ''}`}
                                                        >
                                                            <div className="space-y-2">
                                                                {/* Kartu-kartu Sesi (Bisa lebih dari 1 sesi dalam 1 pekan) */}
                                                                {sessionsForWeek.map((item, sIdx) => {
                                                                    const qObj = item.question || item.material;
                                                                    return (
                                                                        <div
                                                                            key={item.id}
                                                                            className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs hover:border-bright-teal/60 transition-all"
                                                                        >
                                                                            <div className="flex items-center justify-between gap-1">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-french-blue/15 text-french-blue border border-french-blue/20">
                                                                                        Sesi {sIdx + 1}
                                                                                    </span>
                                                                                    <span className="text-[11px] font-bold text-deep-twilight">
                                                                                        {item.kelas || 'Semua Kelas'}
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
                                                                                    <span className="text-gray-300">|</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => deletePlot(item)}
                                                                                        className="text-[10px] text-red-500 hover:underline cursor-pointer font-medium"
                                                                                    >
                                                                                        Hapus
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            <div className="text-[10px] text-gray-500 flex items-center justify-between">
                                                                                <span>
                                                                                    Mapel: <strong className="text-slate-700">{item.bidang || item.mapel || t.subject || t.mapel || '-'}</strong>
                                                                                </span>
                                                                                {item.level && <span className="text-gray-400">{item.level}</span>}
                                                                            </div>

                                                                            {/* Bahan Ajar / Materi */}
                                                                            <div className="pt-0.5">
                                                                                {qObj ? (
                                                                                    <p
                                                                                        className="text-[10px] text-slate-700 truncate font-medium flex items-center gap-1"
                                                                                        title={qObj.title}
                                                                                    >
                                                                                        <span className="text-rose-500 font-bold shrink-0">PDF:</span>
                                                                                        <span className="truncate">{qObj.title}</span>
                                                                                    </p>
                                                                                ) : (
                                                                                    <p className="text-[10px] text-gray-400 italic">Belum ada bahan ajar</p>
                                                                                )}
                                                                            </div>

                                                                            {/* Tanggal & Jam Sesi */}
                                                                            <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-slate-100">
                                                                                {(item.session_date || item.tanggal) && (
                                                                                    <span>📅 {formatDate(item.session_date || item.tanggal)}</span>
                                                                                )}
                                                                                {item.session_time && (
                                                                                    <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                                                                        ⏰ {item.session_time}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* Tombol Tambah Sesi di Pekan Ini */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSingleModal(t, p)}
                                                                    className="w-full py-1.5 px-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-semibold text-gray-500 hover:border-bright-teal hover:text-bright-teal hover:bg-bright-teal/5 transition-all cursor-pointer flex items-center justify-center gap-1"
                                                                    title="Tambah sesi baru untuk pekan ini"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                    <span>+ Tambah Sesi Pekan {p}</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}

                                                <td className="py-3.5 px-3 text-center">
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => openSingleModal(t, currentPekan)}
                                                            className="w-full px-2.5 py-1.5 rounded-xl bg-french-blue/10 hover:bg-french-blue/20 text-french-blue text-[10px] font-bold transition-colors cursor-pointer"
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
                    <div className="bg-white rounded-2xl border border-light-cyan overflow-hidden shadow-xs">
                        <div className="p-3.5 border-b border-light-cyan/60 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-bold text-deep-twilight">Daftar Sesi Mengajar (Urutan Terbaru / Descending)</h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">Data sesi diurutkan otomatis berdasarkan tanggal sesi terbaru dan pekan terkini</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    Total {filteredSchedules.length} Sesi Terjadwal
                                </span>
                                <button
                                    type="button"
                                    onClick={() => openSingleModal(null, currentPekan)}
                                    className="px-3 py-1 bg-bright-teal text-white text-xs font-semibold rounded-lg hover:bg-blue-green transition-all cursor-pointer"
                                >
                                    + Tambah Sesi Baru
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-light-cyan text-[11px] uppercase tracking-wider text-gray-500">
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
                                <tbody className="divide-y divide-light-cyan/60 text-xs">
                                    {filteredSchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-gray-400">
                                                Tidak ada data sesi mengajar ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchedules.map((s) => {
                                            const teacherObj = s.teacher || s.guru;
                                            const qObj = s.question || s.material;
                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50/60">
                                                    <td className="py-3 px-4 font-medium text-deep-twilight">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">
                                                                {s.session_date || s.tanggal ? formatDate(s.session_date || s.tanggal) : 'Belum diatur'}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500">
                                                                {s.session_time || 'Waktu fleksibel'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                s.is_current_pekan || Number(s.pekan) === currentPekan
                                                                    ? 'bg-sky-100 text-french-blue'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            Pekan {s.pekan}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5">
                                                        <p className="font-bold text-deep-twilight">
                                                            {teacherObj?.user?.name || teacherObj?.name || teacherObj?.nama || `Guru #${s.teacher_id || s.guru_id}`}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {teacherObj?.subject || teacherObj?.mapel || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <p className="font-semibold text-deep-twilight">
                                                            {s.kelas || 'Semua Kelas'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {s.level || 'Semua Level'}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md text-[10px] ${
                                                                (s.bidang || s.mapel) === 'IPA'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-blue-50 text-french-blue'
                                                            }`}
                                                        >
                                                            {s.bidang || s.mapel || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5 max-w-[220px]">
                                                        {qObj ? (
                                                            <p
                                                                className="truncate font-medium text-slate-800 flex items-center gap-1"
                                                                title={qObj.title}
                                                            >
                                                                <span className="text-rose-500 font-bold shrink-0">PDF:</span>
                                                                <span className="truncate">{qObj.title}</span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-gray-400 italic text-[11px]">Belum ada bahan ajar</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        {teacherObj ? (
                                                            <select
                                                                value={isTeacherActive(teacherObj) ? 'aktif' : 'nonaktif'}
                                                                onChange={(e) => changeTeacherStatus(teacherObj, e.target.value)}
                                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-all shadow-2xs ${
                                                                    isTeacherActive(teacherObj)
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                                        : 'bg-red-50 text-red-700 border-red-300'
                                                                }`}
                                                            >
                                                                <option value="aktif">Aktif</option>
                                                                <option value="nonaktif">Nonaktif</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openSingleModal(teacherObj, s.pekan, s)}
                                                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                                            >
                                                                Ubah
                                                            </button>
                                                            <span className="text-gray-300">•</span>
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
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL KHUSUS: Upload Materi PDF Langsung */}
            {showUploadPdfModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowUploadPdfModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-light-cyan max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-light-cyan/60 pb-3.5 mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                                    PDF
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-deep-twilight">Upload Materi PDF Langsung</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Unggah bahan ajar format PDF langsung ke database</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowUploadPdfModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitUploadPdf} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Judul Materi Bahan Ajar *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={uploadPdfForm.title}
                                    onChange={(e) => setUploadPdfForm({ ...uploadPdfForm, title: e.target.value })}
                                    placeholder="Contoh: Modul Matematika Sesi 1 - Pekan 1"
                                    className="w-full px-3.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Pilih Berkas PDF * (Maks. 10 MB)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    required
                                    onChange={onPdfFileSelect}
                                    className="w-full px-3 py-2 rounded-xl border border-dashed border-rose-300 bg-rose-50/40 text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer outline-none"
                                />
                                {uploadPdfFileName && (
                                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                                        ✓ File terpilih: {uploadPdfFileName}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Bidang / Mapel
                                    </label>
                                    <select
                                        value={uploadPdfForm.subject}
                                        onChange={(e) => setUploadPdfForm({ ...uploadPdfForm, subject: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="MTK">MTK</option>
                                        <option value="IPA">IPA</option>
                                        <option value="Umum">Umum</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Pekan
                                    </label>
                                    <select
                                        value={uploadPdfForm.pekan}
                                        onChange={(e) => setUploadPdfForm({ ...uploadPdfForm, pekan: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="">Semua Pekan</option>
                                        <option value="Pekan 1">Pekan 1</option>
                                        <option value="Pekan 2">Pekan 2</option>
                                        <option value="Pekan 3">Pekan 3</option>
                                        <option value="Pekan 4">Pekan 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Kelas
                                    </label>
                                    <select
                                        value={uploadPdfForm.kelas}
                                        onChange={(e) => setUploadPdfForm({ ...uploadPdfForm, kelas: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {KELAS_OPTIONS.map((k) => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Keterangan / Catatan Materi
                                </label>
                                <textarea
                                    rows={2}
                                    value={uploadPdfForm.description}
                                    onChange={(e) => setUploadPdfForm({ ...uploadPdfForm, description: e.target.value })}
                                    placeholder="Petunjuk penggunaan bahan ajar untuk guru..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-cyan/60">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadPdfModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadPdfProcessing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    {uploadPdfProcessing && (
                                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    <span>{uploadPdfProcessing ? 'Mengunggah...' : 'Unggah PDF Sekarang'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 1: Ploting Sesi 2 Pekan (Pekan - Tgl - Jam - Bahan Ajar) */}
            {showTwoWeeksModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowTwoWeeksModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-light-cyan max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-light-cyan/60 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-deep-twilight">Ploting Sesi Mengajar 2 Pekan</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Atur jadwal sesi per 2 pekan (pekan, tanggal, jam sesi, kelas, bahan ajar)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTwoWeeksModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitTwoWeeks} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Guru Pengajar *
                                    </label>
                                    <select
                                        required
                                        value={twoWeeksForm.teacher_id}
                                        onChange={(e) => setTwoWeeksForm({ ...twoWeeksForm, teacher_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachersList.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.user?.name || t.name || t.nama || `Guru #${t.id}`} ({t.subject || t.mapel || 'Umum'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Bulan
                                    </label>
                                    <select
                                        value={twoWeeksForm.month}
                                        onChange={(e) => setTwoWeeksForm({ ...twoWeeksForm, month: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <option key={m} value={m}>{monthName(m)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Tahun
                                    </label>
                                    <select
                                        value={twoWeeksForm.year}
                                        onChange={(e) => setTwoWeeksForm({ ...twoWeeksForm, year: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        {[2025, 2026, 2027].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Preset Siklus 2 Pekan */}
                            <div className="flex items-center gap-2 pt-1 pb-1">
                                <span className="text-xs text-gray-500 font-semibold">Pilihan Siklus:</span>
                                <button
                                    type="button"
                                    onClick={() => setTwoWeeksPreset(1, 2)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition-all ${
                                        twoWeeksForm.weeks[0].pekan === 1 && twoWeeksForm.weeks[1].pekan === 2
                                            ? 'bg-bright-teal text-white border-bright-teal font-bold'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-bright-teal'
                                    }`}
                                >
                                    Pekan 1 & 2
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTwoWeeksPreset(3, 4)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition-all ${
                                        twoWeeksForm.weeks[0].pekan === 3 && twoWeeksForm.weeks[1].pekan === 4
                                            ? 'bg-bright-teal text-white border-bright-teal font-bold'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-bright-teal'
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
                                                <span className="text-xs font-bold text-deep-twilight">Sesi ke-{idx + 1}:</span>
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

                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Tanggal Sesi</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Jam Sesi</label>
                                                <input
                                                    type="text"
                                                    placeholder="08:00 - 09:30"
                                                    value={w.session_time}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], session_time: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Kelas</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="">Semua Kelas</option>
                                                    {KELAS_OPTIONS.map((k) => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Bidang</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="MTK">MTK</option>
                                                    <option value="IPA">IPA</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[10px] font-medium text-gray-500 uppercase">Bahan Ajar (Materi)</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => openUploadPdfModal(w.bidang, w.pekan, w.kelas)}
                                                        className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                                                    >
                                                        + Upload PDF
                                                    </button>
                                                </div>
                                                <select
                                                    value={w.question_id}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTwoWeeksForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], question_id: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="">-- Pilih Bahan Ajar --</option>
                                                    {materialsList.map((q) => (
                                                        <option key={q.id} value={q.id}>
                                                            {q.title} ({q.subject || 'Umum'} - {q.pekan || 'Semua Pekan'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Catatan</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-cyan/60">
                                <button
                                    type="button"
                                    onClick={() => setShowTwoWeeksModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-bright-teal hover:bg-blue-green text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Ploting 2 Pekan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Tambah / Ubah Sesi Mengajar (Mendukung Multi-Sesi & Upload PDF Langsung) */}
            {showSingleModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowSingleModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-light-cyan max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-light-cyan/60 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-deep-twilight">
                                    {singleForm.id ? 'Ubah Sesi Mengajar' : 'Tambah Sesi Mengajar Baru'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Guru dapat mengajar di lebih dari satu sesi pada pekan yang sama
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSingleModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitSingle} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Guru Pengajar *
                                </label>
                                <select
                                    required
                                    value={singleForm.teacher_id}
                                    onChange={(e) => {
                                        const tId = e.target.value;
                                        const tg = teachersList.find(t => Number(t.id) === Number(tId));
                                        setSingleForm({
                                            ...singleForm,
                                            teacher_id: tId,
                                            bidang: (tg?.subject || tg?.mapel) === 'IPA' ? 'IPA' : 'MTK',
                                        });
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                >
                                    <option value="">-- Pilih Guru --</option>
                                    {teachersList.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.user?.name || t.name || t.nama || `Guru #${t.id}`} ({t.subject || t.mapel || 'Umum'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Pekan *
                                    </label>
                                    <select
                                        required
                                        value={singleForm.pekan}
                                        onChange={(e) => setSingleForm({ ...singleForm, pekan: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value={1}>Pekan 1</option>
                                        <option value={2}>Pekan 2</option>
                                        <option value={3}>Pekan 3</option>
                                        <option value={4}>Pekan 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Kelas
                                    </label>
                                    <select
                                        value={singleForm.kelas}
                                        onChange={(e) => setSingleForm({ ...singleForm, kelas: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {KELAS_OPTIONS.map((k) => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Level
                                    </label>
                                    <select
                                        value={singleForm.level}
                                        onChange={(e) => setSingleForm({ ...singleForm, level: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="">Semua Level</option>
                                        <option value="Level 1">Level 1</option>
                                        <option value="Level 2">Level 2</option>
                                        <option value="Level 3">Level 3</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Bidang / Mapel
                                    </label>
                                    <select
                                        value={singleForm.bidang}
                                        onChange={(e) => setSingleForm({ ...singleForm, bidang: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="MTK">MTK</option>
                                        <option value="IPA">IPA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Tanggal Sesi
                                    </label>
                                    <input
                                        type="date"
                                        value={singleForm.session_date}
                                        onChange={(e) => setSingleForm({ ...singleForm, session_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Jam Sesi
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="08:00 - 09:30"
                                        value={singleForm.session_time}
                                        onChange={(e) => setSingleForm({ ...singleForm, session_time: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    />
                                </div>
                            </div>

                            {/* Bagian Bahan Ajar (Pilih yang sudah ada atau Langsung Upload PDF Baru) */}
                            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-deep-twilight uppercase tracking-wider">
                                        Bahan Ajar (Materi Sesi)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={toggleDirectPdfUpload}
                                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <span>{showDirectPdfInput ? '← Pilih dari Daftar Materi' : '+ Langsung Upload PDF Baru'}</span>
                                    </button>
                                </div>

                                {!showDirectPdfInput ? (
                                    <div>
                                        <select
                                            value={singleForm.question_id}
                                            onChange={(e) => setSingleForm({ ...singleForm, question_id: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                        >
                                            <option value="">-- Pilih Materi Bahan Ajar --</option>
                                            {materialsList.map((q) => (
                                                <option key={q.id} value={q.id}>
                                                    {q.title} ({q.subject || 'Umum'} - {q.pekan || 'Semua Pekan'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2 bg-white p-3 rounded-xl border border-rose-200">
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">
                                                Judul Materi PDF Baru
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Judul materi PDF..."
                                                value={singleDirectPdfTitle}
                                                onChange={(e) => setSingleDirectPdfTitle(e.target.value)}
                                                className="w-full px-3 py-1.5 rounded-lg border border-light-cyan text-xs text-deep-twilight outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-0.5">
                                                Pilih Berkas PDF
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={onSingleDirectPdfSelect}
                                                className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Catatan Sesi
                                </label>
                                <input
                                    type="text"
                                    placeholder="Catatan tambahan sesi mengajar..."
                                    value={singleForm.notes}
                                    onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-cyan/60">
                                <button
                                    type="button"
                                    onClick={() => setShowSingleModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-bright-teal hover:bg-blue-green text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : (singleForm.id ? 'Perbarui Sesi' : 'Simpan Sesi Ini')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Ploting Siklus 4 Pekan */}
            {showCycleModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowCycleModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-light-cyan max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-light-cyan/60 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-deep-twilight">Ploting Jadwal Mengajar Siklus 4 Pekan</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Atur jadwal mengajar dan bahan ajar Pekan 1 s/d Pekan 4 sekaligus</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCycleModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitCycle} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Guru Pengajar *
                                    </label>
                                    <select
                                        required
                                        value={cycleForm.teacher_id}
                                        onChange={onCycleTeacherChange}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachersList.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.user?.name || t.name || t.nama || `Guru #${t.id}`} ({t.subject || t.mapel || 'Umum'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Bulan
                                    </label>
                                    <select
                                        value={cycleForm.month}
                                        onChange={(e) => setCycleForm({ ...cycleForm, month: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <option key={m} value={m}>{monthName(m)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                        Tahun
                                    </label>
                                    <select
                                        value={cycleForm.year}
                                        onChange={(e) => setCycleForm({ ...cycleForm, year: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        {[2025, 2026, 2027].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cycleForm.weeks.map((w, idx) => (
                                    <div key={w.pekan} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-deep-twilight">Pekan {w.pekan}</span>
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

                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Kelas</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="">Semua Kelas</option>
                                                    {KELAS_OPTIONS.map((k) => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Level</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="">Semua Level</option>
                                                    <option value="Level 1">Level 1</option>
                                                    <option value="Level 2">Level 2</option>
                                                    <option value="Level 3">Level 3</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Bidang</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="MTK">MTK</option>
                                                    <option value="IPA">IPA</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Tanggal Sesi</label>
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
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Jam Sesi</label>
                                                <input
                                                    type="text"
                                                    placeholder="08:00 - 09:30"
                                                    value={w.session_time}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], session_time: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[10px] font-medium text-gray-500 uppercase">
                                                        Bahan Ajar (Materi Pekan {w.pekan})
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => openUploadPdfModal(w.bidang, w.pekan, w.kelas)}
                                                        className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                                                    >
                                                        + Upload PDF
                                                    </button>
                                                </div>
                                                <select
                                                    value={w.question_id}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCycleForm((prev) => {
                                                            const copy = [...prev.weeks];
                                                            copy[idx] = { ...copy[idx], question_id: val };
                                                            return { ...prev, weeks: copy };
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                >
                                                    <option value="">-- Otomatis / Pilih Bahan Ajar --</option>
                                                    {materialsList.map((q) => (
                                                        <option key={q.id} value={q.id}>
                                                            {q.title} ({q.subject || 'Umum'} - {q.pekan || 'Semua Pekan'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">
                                                    Catatan Ploting
                                                </label>
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
                                                    className="w-full px-3 py-2 rounded-xl border border-light-cyan bg-white text-xs text-deep-twilight outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-cyan/60">
                                <button
                                    type="button"
                                    onClick={() => setShowCycleModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-bright-teal hover:bg-blue-green text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
