import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
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
    'Semua Kelas',
    'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6',
    'Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12',
];

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface SessionSlot {
    id: number | null;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    kelas: string;
    bidang: string;
    question_id: string;
    pdf_file: File | null;
    notes: string;
}

interface PekanGroup {
    pekan: number;
    sessions: SessionSlot[];
}

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
}: SessionIndexProps) {
    const page = usePage();
    const teachersList = initialTeachers.length > 0 ? initialTeachers : initialGurus;
    const materialsList = initialMaterials.length > 0 ? initialMaterials : initialQuestions;
    const schedulesList = initialSchedules;

    // View mode: 'matrix' (Matriks 4 Pekan) or 'list' (Daftar Sesi)
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

    // Modal state
    const [showPlotModal, setShowPlotModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form state untuk Modal "Tambah Sesi Mengajar" (Persis Gambar 3 & 4)
    const [modalTeacherId, setModalTeacherId] = useState<string>('');
    const [modalMonth, setModalMonth] = useState<number>(initialMonth);
    const [modalYear, setModalYear] = useState<number>(initialYear);
    const [modalPekans, setModalPekans] = useState<PekanGroup[]>([]);

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

    // Get schedules for specific teacher & pekan
    const getSchedulesFor = (teacherId: number | string, pekan: number | string) => {
        return schedulesList.filter((s) => {
            if (Number(s.teacher_id ?? s.guru_id) !== Number(teacherId) || Number(s.pekan) !== Number(pekan)) return false;
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterBidang && (s.bidang || s.mapel) !== filterBidang) return false;
            return true;
        });
    };

    // Filter teachers for matrix view
    const filteredTeachers = useMemo(() => {
        return teachersList.filter((t) => {
            const kw = teacherSearch.trim().toLowerCase();
            if (kw) {
                const name = (t.user?.name || t.name || t.nama || '').toLowerCase();
                const subject = (t.subject || t.mapel || '').toLowerCase();
                if (!name.includes(kw) && !subject.includes(kw)) return false;
            }

            if (filterStatus) {
                const active = isTeacherActive(t);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }

            if (filterBidang) {
                const b = (t.subject || t.mapel || '').toUpperCase();
                const b2 = (t.subject_2 || t.bidang_2 || '').toUpperCase();
                const target = filterBidang.toUpperCase();
                if (!b.includes(target) && !b2.includes(target)) return false;
            }

            if (filterKelas) {
                const teacherSchedules = schedulesList.filter(s => Number(s.teacher_id ?? s.guru_id) === Number(t.id));
                const hasClassInSchedule = teacherSchedules.some(s => s.kelas === filterKelas);
                const hasClassInTeacher = (t.kelas_diajar || t.jenjang || '').includes(filterKelas);
                if (!hasClassInSchedule && !hasClassInTeacher) return false;
            }

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

    const hasActiveFilter = useMemo(() => {
        return Boolean(teacherSearch || filterKelas || filterBidang || filterPekan || filterStatus);
    }, [teacherSearch, filterKelas, filterBidang, filterPekan, filterStatus]);

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

    // Open Unified Modal "Tambah Sesi Mengajar" (Persis Gambar 3 & 4)
    const openPlottingModal = (teacher: any = null, targetPekan: number | null = null) => {
        setDismissedConflict(false);
        const tId = teacher ? String(teacher.id) : (teachersList[0] ? String(teachersList[0].id) : '');
        const targetTeacher = teachersList.find(t => String(t.id) === tId);
        const defaultBidang = (targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK';

        setModalTeacherId(tId);
        setModalMonth(selectedMonth);
        setModalYear(selectedYear);

        // Jika user mengklik pekan tertentu, buka pekan tersebut
        const initialPekanNum = targetPekan || 1;
        const existingSchedules = tId ? getSchedulesFor(tId, initialPekanNum) : [];

        let initialSessions: SessionSlot[] = [];
        if (existingSchedules.length > 0) {
            initialSessions = existingSchedules.map(s => {
                let start = '08:00';
                let end = '09:30';
                if (s.session_time && s.session_time.includes('-')) {
                    const parts = s.session_time.split('-').map(p => p.trim());
                    if (parts[0]) start = parts[0];
                    if (parts[1]) end = parts[1];
                }
                return {
                    id: s.id,
                    tanggal: s.session_date ? String(s.session_date).slice(0, 10) : (s.tanggal ? String(s.tanggal).slice(0, 10) : ''),
                    jam_mulai: start,
                    jam_selesai: end,
                    kelas: s.kelas || 'Semua Kelas',
                    bidang: s.bidang || s.mapel || defaultBidang,
                    question_id: s.question_id ? String(s.question_id) : (s.material_id ? String(s.material_id) : ''),
                    pdf_file: null,
                    notes: s.notes || s.catatan || '',
                };
            });
        } else {
            initialSessions = [{
                id: null,
                tanggal: '',
                jam_mulai: '08:00',
                jam_selesai: '09:30',
                kelas: 'Semua Kelas',
                bidang: defaultBidang,
                question_id: '',
                pdf_file: null,
                notes: '',
            }];
        }

        setModalPekans([
            {
                pekan: initialPekanNum,
                sessions: initialSessions,
            }
        ]);

        setShowPlotModal(true);
    };

    // Tambah slot sesi baru pada pekan tertentu
    const addSessionToPekan = (pekanIdx: number) => {
        setModalPekans(prev => {
            const next = [...prev];
            const pGroup = next[pekanIdx];
            const targetTeacher = teachersList.find(t => String(t.id) === modalTeacherId);
            const defaultBidang = (targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK';

            pGroup.sessions.push({
                id: null,
                tanggal: pGroup.sessions[0]?.tanggal || '',
                jam_mulai: '10:00',
                jam_selesai: '11:30',
                kelas: 'Semua Kelas',
                bidang: defaultBidang,
                question_id: '',
                pdf_file: null,
                notes: '',
            });
            return next;
        });
    };

    // Hapus slot sesi dari pekan
    const removeSessionFromPekan = (pekanIdx: number, sessionIdx: number) => {
        setModalPekans(prev => {
            const next = [...prev];
            next[pekanIdx].sessions.splice(sessionIdx, 1);
            if (next[pekanIdx].sessions.length === 0) {
                next[pekanIdx].sessions.push({
                    id: null,
                    tanggal: '',
                    jam_mulai: '08:00',
                    jam_selesai: '09:30',
                    kelas: 'Semua Kelas',
                    bidang: 'MTK',
                    question_id: '',
                    pdf_file: null,
                    notes: '',
                });
            }
            return next;
        });
    };

    // Tambah pekan berikutnya ke modal
    const addNextPekan = () => {
        const existingPekans = modalPekans.map(p => p.pekan);
        const nextPekanNum = [1, 2, 3, 4].find(p => !existingPekans.includes(p));
        if (!nextPekanNum) return;

        const targetTeacher = teachersList.find(t => String(t.id) === modalTeacherId);
        const defaultBidang = (targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK';

        // Check if existing schedules for next pekan
        const existingSchedules = modalTeacherId ? getSchedulesFor(modalTeacherId, nextPekanNum) : [];
        let sessions: SessionSlot[] = [];

        if (existingSchedules.length > 0) {
            sessions = existingSchedules.map(s => {
                let start = '08:00';
                let end = '09:30';
                if (s.session_time && s.session_time.includes('-')) {
                    const parts = s.session_time.split('-').map(p => p.trim());
                    if (parts[0]) start = parts[0];
                    if (parts[1]) end = parts[1];
                }
                return {
                    id: s.id,
                    tanggal: s.session_date ? String(s.session_date).slice(0, 10) : '',
                    jam_mulai: start,
                    jam_selesai: end,
                    kelas: s.kelas || 'Semua Kelas',
                    bidang: s.bidang || s.mapel || defaultBidang,
                    question_id: s.question_id ? String(s.question_id) : '',
                    pdf_file: null,
                    notes: s.notes || '',
                };
            });
        } else {
            sessions = [{
                id: null,
                tanggal: '',
                jam_mulai: '08:00',
                jam_selesai: '09:30',
                kelas: 'Semua Kelas',
                bidang: defaultBidang,
                question_id: '',
                pdf_file: null,
                notes: '',
            }];
        }

        setModalPekans(prev => [
            ...prev,
            { pekan: nextPekanNum, sessions }
        ]);
    };

    // Update form session field
    const updateSessionField = (pekanIdx: number, sessionIdx: number, field: keyof SessionSlot, val: any) => {
        setModalPekans(prev => {
            const next = [...prev];
            next[pekanIdx].sessions[sessionIdx] = {
                ...next[pekanIdx].sessions[sessionIdx],
                [field]: val,
            };
            return next;
        });
    };

    // Submit form ploting
    const submitPlottingModal = (e: FormEvent) => {
        e.preventDefault();
        if (!modalTeacherId) return;

        setDismissedConflict(false);
        setProcessing(true);

        const formData = new FormData();
        formData.append('teacher_id', modalTeacherId);
        formData.append('guru_id', modalTeacherId);
        formData.append('month', String(modalMonth));
        formData.append('year', String(modalYear));

        let weekIndex = 0;
        modalPekans.forEach((pGroup) => {
            pGroup.sessions.forEach((s) => {
                formData.append(`weeks[${weekIndex}][pekan]`, String(pGroup.pekan));
                if (s.id) formData.append(`weeks[${weekIndex}][id]`, String(s.id));
                if (s.tanggal) formData.append(`weeks[${weekIndex}][session_date]`, s.tanggal);
                if (s.jam_mulai && s.jam_selesai) {
                    formData.append(`weeks[${weekIndex}][session_time]`, `${s.jam_mulai} - ${s.jam_selesai}`);
                }
                formData.append(`weeks[${weekIndex}][kelas]`, s.kelas === 'Semua Kelas' ? '' : s.kelas);
                formData.append(`weeks[${weekIndex}][bidang]`, s.bidang);
                if (s.question_id) formData.append(`weeks[${weekIndex}][question_id]`, s.question_id);
                if (s.notes) formData.append(`weeks[${weekIndex}][notes]`, s.notes);
                if (s.pdf_file) {
                    formData.append(`weeks[${weekIndex}][material_pdf]`, s.pdf_file);
                    formData.append(`weeks[${weekIndex}][material_pdf_title]`, s.pdf_file.name.replace(/\.[^/.]+$/, ''));
                }
                weekIndex++;
            });
        });

        router.post(`/${basePath}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowPlotModal(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    // Next pekan available to add
    const nextAvailablePekan = useMemo(() => {
        const existing = modalPekans.map(p => p.pekan);
        return [1, 2, 3, 4].find(p => !existing.includes(p));
    }, [modalPekans]);

    return (
        <AuthenticatedLayout>
            <Head title="Ploting Guru" />

            <div className="space-y-4">
                {/* 1. Header (Persis Screenshot Gambar 2) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Ploting Guru</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Kelola penugasan guru, tambah multi-sesi per pekan, dan aktivasi akun guru kelas khusus.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {/* Toggle View Mode */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setViewMode('matrix')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    viewMode === 'matrix' ? 'bg-white text-slate-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon icon="tabler:layout-grid" className="w-3.5 h-3.5" />
                                <span>Matriks 4 Pekan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    viewMode === 'list' ? 'bg-white text-slate-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon icon="tabler:list" className="w-3.5 h-3.5" />
                                <span>Daftar Sesi</span>
                            </button>
                        </div>

                        {/* Tombol + Ploting (Persis Screenshot Gambar 2) */}
                        <button
                            type="button"
                            onClick={() => openPlottingModal()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#004e89] hover:bg-[#003d6d] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <span>+ Ploting</span>
                        </button>
                    </div>
                </div>

                {/* Alarm Anti-Bentrok Jadwal Alert Box (Bila Ada Bentrok) */}
                {hasConflictError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon icon="tabler:alert-triangle" className="w-5 h-5" />
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

                {/* 2. Filter Bar (Persis Screenshot Gambar 2) */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="w-full sm:w-48">
                            <div className="relative">
                                <Icon icon="tabler:search" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    placeholder="Cari guru..."
                                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Dropdown Kelas */}
                        <select
                            value={filterKelas}
                            onChange={(e) => setFilterKelas(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white outline-none cursor-pointer"
                        >
                            <option value="">semua kelas</option>
                            {KELAS_OPTIONS.filter(k => k !== 'Semua Kelas').map((k) => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>

                        {/* Dropdown Mapel */}
                        <select
                            value={filterBidang}
                            onChange={(e) => setFilterBidang(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white outline-none cursor-pointer"
                        >
                            <option value="">mapel</option>
                            <option value="MTK">MTK</option>
                            <option value="IPA">IPA</option>
                        </select>

                        {/* Dropdown Pekan */}
                        <select
                            value={filterPekan}
                            onChange={(e) => setFilterPekan(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white outline-none cursor-pointer"
                        >
                            <option value="">semua pekan</option>
                            <option value="1">Pekan 1</option>
                            <option value="2">Pekan 2</option>
                            <option value="3">Pekan 3</option>
                            <option value="4">Pekan 4</option>
                        </select>

                        {/* Dropdown Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white outline-none cursor-pointer"
                        >
                            <option value="">status</option>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>

                        {/* Dropdown Bulan */}
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white outline-none cursor-pointer capitalize"
                        >
                            {MONTH_NAMES.map((m, idx) => (
                                <option key={idx + 1} value={idx + 1}>{m.toLowerCase()}</option>
                            ))}
                        </select>

                        {/* Dropdown Tahun */}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:bg-white outline-none cursor-pointer"
                        >
                            {[2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {/* Tombol Terapkan */}
                        <button
                            type="button"
                            onClick={applyFilter}
                            className="px-4 py-1.5 bg-[#004e89] hover:bg-[#003d6d] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                            <Icon icon="tabler:filter" className="w-3.5 h-3.5" />
                            <span>Terapkan</span>
                        </button>

                        {/* Tombol Reset */}
                        {hasActiveFilter && (
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. TAMPILAN 1: Matriks 4 Pekan (Persis Screenshot Gambar 2) */}
                {viewMode === 'matrix' ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-3 w-12 text-center">NO</th>
                                        <th className="py-3 px-4 min-w-[200px]">GURU PENGAJAR</th>
                                        <th className="py-3 px-3 w-32 text-center">STATUS</th>
                                        {[1, 2, 3, 4].map((p) => {
                                            const isCurrent = p === currentPekan;
                                            return (
                                                <th
                                                    key={p}
                                                    className={`py-3 px-3 text-center min-w-[170px] ${
                                                        isCurrent ? 'bg-blue-50/70 text-blue-700 font-extrabold' : ''
                                                    }`}
                                                >
                                                    <span className="inline-flex items-center justify-center gap-1.5">
                                                        <span>PEKAN {p}</span>
                                                        {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>}
                                                    </span>
                                                </th>
                                            );
                                        })}
                                        <th className="py-3 px-4 w-32 text-center">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredTeachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-400">
                                                Tidak ada data guru ditemukan sesuai filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTeachers.map((t, index) => {
                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                    {/* NO */}
                                                    <td className="py-3 px-3 text-center text-slate-400 font-medium">
                                                        {index + 1}
                                                    </td>

                                                    {/* GURU PENGAJAR */}
                                                    <td className="py-3 px-4">
                                                        <p className="font-bold text-slate-800 text-xs">
                                                            {t.user?.name || t.name || t.nama || `Guru #${t.id}`}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            Bidang: {t.subject || t.mapel || '-'}
                                                        </p>
                                                    </td>

                                                    {/* STATUS (Dropdown Pill Persis Gambar 2) */}
                                                    <td className="py-3 px-3 text-center">
                                                        <select
                                                            value={isTeacherActive(t) ? 'aktif' : 'nonaktif'}
                                                            onChange={(e) => changeTeacherStatus(t, e.target.value)}
                                                            className={`px-3 py-1 rounded-full text-[11px] font-bold border outline-none cursor-pointer transition-all ${
                                                                isTeacherActive(t)
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                                                                    : 'bg-red-50 text-red-600 border-red-300'
                                                            }`}
                                                        >
                                                            <option value="aktif">Aktif</option>
                                                            <option value="nonaktif">Nonaktif</option>
                                                        </select>
                                                    </td>

                                                    {/* PEKAN 1 - 4 (Persis Gambar 2) */}
                                                    {[1, 2, 3, 4].map((p) => {
                                                        const sessions = getSchedulesFor(t.id, p);
                                                        const isCurrent = p === currentPekan;
                                                        return (
                                                            <td
                                                                key={p}
                                                                className={`py-3 px-2 text-center ${isCurrent ? 'bg-blue-50/30' : ''}`}
                                                            >
                                                                {sessions.length === 0 ? (
                                                                    /* Kotak Rounded Tipis "Tidak ada jadwal" */
                                                                    <div
                                                                        onClick={() => openPlottingModal(t, p)}
                                                                        className="mx-auto max-w-[140px] py-1.5 px-3 rounded-full border border-slate-200 text-slate-300 italic text-[11px] hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors"
                                                                        title="Klik untuk tambah jadwal"
                                                                    >
                                                                        Tidak ada jadwal
                                                                    </div>
                                                                ) : (
                                                                    /* Kotak Rounded Biru "Sesi-1 | Sesi-2 👁" */
                                                                    <div
                                                                        onClick={() => openPlottingModal(t, p)}
                                                                        className="mx-auto max-w-[160px] py-1.5 px-2.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                                                                        title="Klik untuk melihat atau mengubah sesi"
                                                                    >
                                                                        <span>{sessions.map((_, sIdx) => `Sesi-${sIdx + 1}`).join(' | ')}</span>
                                                                        <Icon icon="tabler:eye" className="w-3.5 h-3.5 text-blue-500 ml-0.5 shrink-0" />
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* AKSI: Tombol "+ Atur Sesi" (Persis Gambar 2) */}
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => openPlottingModal(t)}
                                                            className="px-3.5 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-[#004e89] hover:text-white hover:border-[#004e89] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                                                        >
                                                            + Atur Sesi
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* TAMPILAN 2: Daftar Sesi Mengajar */
                    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-bold text-slate-800">Daftar Sesi Mengajar</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Data sesi diurutkan otomatis berdasarkan tanggal sesi terbaru dan pekan terkini</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    Total {filteredSchedules.length} Sesi Terjadwal
                                </span>
                                <button
                                    type="button"
                                    onClick={() => openPlottingModal()}
                                    className="px-3 py-1 bg-[#004e89] text-white text-xs font-semibold rounded-lg hover:bg-[#003d6d] transition-all cursor-pointer"
                                >
                                    + Tambah Sesi Baru
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="py-3 px-4 font-semibold">Tanggal & Jam Sesi</th>
                                        <th className="py-3 px-3 font-semibold text-center">Pekan</th>
                                        <th className="py-3 px-3.5 font-semibold">Guru Pengajar</th>
                                        <th className="py-3 px-3 font-semibold">Kelas</th>
                                        <th className="py-3 px-3 font-semibold">Bidang</th>
                                        <th className="py-3 px-3.5 font-semibold">Bahan Ajar (Materi)</th>
                                        <th className="py-3 px-3 font-semibold text-center">Status Guru</th>
                                        <th className="py-3 px-3 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredSchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-400">
                                                Tidak ada data sesi mengajar ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchedules.map((s) => {
                                            const teacherObj = s.teacher || s.guru;
                                            const qObj = s.question || s.material;
                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50/60">
                                                    <td className="py-3 px-4 font-medium text-slate-800">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">
                                                                {s.session_date || s.tanggal ? formatDate(s.session_date || s.tanggal) : 'Belum diatur'}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500">
                                                                {s.session_time || 'Waktu fleksibel'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                s.is_current_pekan || Number(s.pekan) === currentPekan
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            Pekan {s.pekan}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5">
                                                        <p className="font-bold text-slate-800">
                                                            {teacherObj?.user?.name || teacherObj?.name || teacherObj?.nama || `Guru #${s.teacher_id || s.guru_id}`}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {teacherObj?.subject || teacherObj?.mapel || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-3 font-medium text-slate-700">
                                                        {s.kelas || 'Semua Kelas'}
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md text-[10px] ${
                                                                (s.bidang || s.mapel) === 'IPA'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-blue-50 text-blue-700'
                                                            }`}
                                                        >
                                                            {s.bidang || s.mapel || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5 max-w-[220px]">
                                                        {qObj ? (
                                                            <p className="truncate font-medium text-slate-800 flex items-center gap-1" title={qObj.title}>
                                                                <span className="text-rose-500 font-bold shrink-0">PDF:</span>
                                                                <span className="truncate">{qObj.title}</span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-slate-400 italic text-[11px]">Belum ada bahan ajar</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        {teacherObj ? (
                                                            <select
                                                                value={isTeacherActive(teacherObj) ? 'aktif' : 'nonaktif'}
                                                                onChange={(e) => changeTeacherStatus(teacherObj, e.target.value)}
                                                                className={`px-2 py-1 rounded-full text-[10px] font-bold border outline-none cursor-pointer transition-all ${
                                                                    isTeacherActive(teacherObj)
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
                                                                onClick={() => openPlottingModal(teacherObj, s.pekan)}
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
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. MODAL TERPADU: "Tambah Sesi Mengajar" (PERSIS SCREENSHOT GAMBAR 3 & 4) */}
            {showPlotModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowPlotModal(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto">
                        {/* Header Modal */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Tambah Sesi Mengajar</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Atur jadwal per pekan dan tambah sesi mengajar secara bertahap atau fleksibel.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPlotModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xl font-bold cursor-pointer transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitPlottingModal} className="space-y-4">
                            {/* Baris 1: Guru Pengajar, Bulan, Tahun (Persis Gambar 3 & 4) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                        GURU PENGAJAR *
                                    </label>
                                    <select
                                        required
                                        value={modalTeacherId}
                                        onChange={(e) => {
                                            const newId = e.target.value;
                                            setModalTeacherId(newId);
                                            const targetTeacher = teachersList.find(t => String(t.id) === newId);
                                            const defaultBidang = (targetTeacher?.subject || targetTeacher?.mapel) === 'IPA' ? 'IPA' : 'MTK';

                                            // Auto-update default bidang di modal pekans
                                            setModalPekans(prev => prev.map(p => ({
                                                ...p,
                                                sessions: p.sessions.map(s => ({
                                                    ...s,
                                                    bidang: defaultBidang,
                                                })),
                                            })));
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500"
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
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                        BULAN
                                    </label>
                                    <select
                                        value={modalMonth}
                                        onChange={(e) => setModalMonth(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        {MONTH_NAMES.map((m, idx) => (
                                            <option key={idx + 1} value={idx + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                        TAHUN
                                    </label>
                                    <select
                                        value={modalYear}
                                        onChange={(e) => setModalYear(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        {[2025, 2026, 2027].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Accordion / Card Pekan (Persis Gambar 3 & 4) */}
                            <div className="space-y-4 pt-1">
                                {modalPekans.map((pGroup, pekanIdx) => (
                                    <div key={pGroup.pekan} className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                                        {/* Header Pekan Biru Tua */}
                                        <div className="bg-[#003d6d] px-4 py-2.5 flex items-center justify-between text-white">
                                            <span className="text-xs font-bold tracking-wide">
                                                Pekan {pGroup.pekan} | {pGroup.sessions.length} Sesi Terjadwal
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => addSessionToPekan(pekanIdx)}
                                                className="px-2.5 py-1 bg-white text-[#003d6d] hover:bg-slate-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                            >
                                                <span>+ Tambah Sesi</span>
                                            </button>
                                        </div>

                                        {/* Daftar Sesi di Dalam Pekan Ini */}
                                        <div className="p-4 bg-slate-50/50 space-y-4">
                                            {pGroup.sessions.map((slot, sessionIdx) => (
                                                <div key={sessionIdx} className="bg-white p-3.5 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
                                                    {/* Header Nomor Sesi */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004e89] text-[10px] font-extrabold flex items-center justify-center">
                                                                {sessionIdx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-800">
                                                                Sesi {sessionIdx + 1}
                                                            </span>
                                                        </div>
                                                        {pGroup.sessions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSessionFromPekan(pekanIdx, sessionIdx)}
                                                                className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                                                                title="Hapus sesi ini"
                                                            >
                                                                Hapus Sesi &times;
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Baris Input 1: Tanggal, Jam Mulai, Jam Selesai, Kelas, Mapel (Persis Gambar 3 & 4) */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                TANGGAL SESI
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={slot.tanggal}
                                                                onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'tanggal', e.target.value)}
                                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                JAM MULAI
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={slot.jam_mulai}
                                                                onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'jam_mulai', e.target.value)}
                                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                JAM SELESAI
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={slot.jam_selesai}
                                                                onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'jam_selesai', e.target.value)}
                                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                KELAS
                                                            </label>
                                                            <select
                                                                value={slot.kelas}
                                                                onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'kelas', e.target.value)}
                                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                                                            >
                                                                {KELAS_OPTIONS.map((k) => (
                                                                    <option key={k} value={k}>{k}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                MAPEL / BIDANG
                                                            </label>
                                                            <select
                                                                value={slot.bidang}
                                                                onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'bidang', e.target.value)}
                                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                                                            >
                                                                <option value="MTK">MTK</option>
                                                                <option value="IPA">IPA</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Baris Input 2: Bahan Ajar & Upload Langsung (Persis Gambar 3 & 4) */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                PILIH MATERI DARI BANK SOAL
                                                            </label>
                                                            <select
                                                                value={slot.question_id}
                                                                onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'question_id', e.target.value)}
                                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                                                            >
                                                                <option value="">-- Tanpa Bahan Ajar / Pilih Nanti --</option>
                                                                {materialsList.map((m) => (
                                                                    <option key={m.id} value={m.id}>
                                                                        {m.title} ({m.subject || 'Umum'})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                                                UPLOAD PDF LANGSUNG (OPSIONAL)
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0] || null;
                                                                        updateSessionField(pekanIdx, sessionIdx, 'pdf_file', file);
                                                                    }}
                                                                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-[#d90429] file:text-white hover:file:bg-rose-700 cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Baris Input 3: Catatan (Persis Gambar 3 & 4) */}
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={slot.notes}
                                                            onChange={(e) => updateSessionField(pekanIdx, sessionIdx, 'notes', e.target.value)}
                                                            placeholder="Catatan tambahan sesi (opsional)..."
                                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Tombol Tambah Pekan Berikutnya (Persis Gambar 3 & 4) */}
                                {nextAvailablePekan && (
                                    <div className="text-center pt-1">
                                        <button
                                            type="button"
                                            onClick={addNextPekan}
                                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                        >
                                            <Icon icon="tabler:plus" className="w-4 h-4 text-slate-500" />
                                            <span>+ Tambah Pekan {nextAvailablePekan}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer Modal: Batal & Simpan Ploting (Persis Gambar 3 & 4) */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowPlotModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-[#004e89] hover:bg-[#003d6d] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    {processing && <Icon icon="tabler:loader-2" className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{processing ? 'Menyimpan...' : 'Simpan Ploting'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
