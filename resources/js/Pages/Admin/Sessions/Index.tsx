import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
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
    currentMonth?: number;
    currentYear?: number;
    basePath?: string;
    pagination?: PaginatedData<TeachingSession>;
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

interface SessionRowForm {
    _uid: number;
    id: number | null;
    pekan: number;
    kelas: string;
    level: string;
    bidang: string;
    question_id: string;
    session_date: string;
    jam_mulai: string;
    jam_selesai: string;
    session_time: string;
    is_active: boolean;
    notes: string;
    show_pdf_upload: boolean;
    material_pdf: File | null;
    pdf_name: string;
}

const KELAS_OPTIONS = [
    'Kelas Khusus',
    'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6',
    'Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12',
];

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

let sessionUidCounter = 1;

export default function SessionIndex({
    schedules: initialSchedules = [],
    teachers: initialTeachers = [],
    gurus: initialGurus = [],
    materials: initialMaterials = [],
    questions: initialQuestions = [],
    month: initialMonth = new Date().getMonth() + 1,
    year: initialYear = new Date().getFullYear(),
    currentPekan = 1,
    currentMonth = new Date().getMonth() + 1,
    currentYear = new Date().getFullYear(),
    basePath = 'session',
    pagination: initialPagination,
    sessions: initialSessions,
    filters = {},
}: SessionIndexProps) {
    const page = usePage();
    const teachersList = initialTeachers.length > 0 ? initialTeachers : initialGurus;
    const questionsList = initialQuestions.length > 0 ? initialQuestions : initialMaterials;
    const schedulesList = initialSchedules;
    const pagination = initialPagination || (initialSessions && 'total' in initialSessions ? initialSessions : null);

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

    const [processing, setProcessing] = useState(false);

    // MODAL TERPADU STATE
    const [showModal, setShowModal] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3, 4]);
    const toggleExpandWeek = (pekanNum: number) => {
        setExpandedWeeks(prev =>
            prev.includes(pekanNum) ? prev.filter(p => p !== pekanNum) : [...prev, pekanNum]
        );
    };
    const [modalForm, setModalForm] = useState<{
        is_edit: boolean;
        is_specific: boolean;
        cycle_mode: 'single' | '2weeks' | '4weeks';
        teacher_id: string;
        month: number;
        year: number;
        sessions: SessionRowForm[];
    }>({
        is_edit: false,
        is_specific: false,
        cycle_mode: 'single',
        teacher_id: '',
        month: initialMonth,
        year: initialYear,
        sessions: [],
    });

    // MODAL DETAIL SESI STATE
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedWeekDetail, setSelectedWeekDetail] = useState<{
        teacher: any;
        teacherName: string;
        pekan: number;
        session1: any | null;
        session2: any | null;
    } | null>(null);

    const openWeekDetailModal = (teacher: any, pekan: number, schedules: any[] = []) => {
        setSelectedWeekDetail({
            teacher,
            teacherName: teacher?.user?.name || teacher?.name || (teacher as any)?.nama || 'Guru',
            pekan,
            session1: schedules[0] || null,
            session2: schedules[1] || null,
        });
        setShowDetailModal(true);
    };

    const editFromDetail = (teacher: any, pekan: number, item: any) => {
        setShowDetailModal(false);
        openEditSingleModal(teacher, pekan, item);
    };

    const deleteFromDetail = (item: any) => {
        setShowDetailModal(false);
        deletePlot(item);
    };

    const createEmptySession = (pekan: number | string = 1, specificTeacher: any = null): SessionRowForm => {
        const tId = specificTeacher ? specificTeacher.id : modalForm.teacher_id;
        const teacher = teachersList.find(t => Number(t.id) === Number(tId));
        return {
            _uid: sessionUidCounter++,
            id: null,
            pekan: Number(pekan) || 1,
            kelas: teacher?.kelas_diajar || '',
            level: '',
            bidang: ((teacher as any)?.subject || (teacher as any)?.mapel) === 'IPA' ? 'IPA' : 'MTK',
            question_id: '',
            session_date: '',
            jam_mulai: '08:00',
            jam_selesai: '09:30',
            session_time: '08:00 - 09:30',
            is_active: true,
            notes: '',
            show_pdf_upload: false,
            material_pdf: null,
            pdf_name: '',
        };
    };

    // Ambil sesi terplot untuk guru tertentu pada pekan dan bulan terpilih
    const getPlottedSchedulesForTeacherAndPekan = (teacherId: number | string, pekan: number | string, month = selectedMonth, year = selectedYear) => {
        if (!teacherId) return [];
        return schedulesList.filter(s =>
            (Number((s as any).teacher_id) === Number(teacherId) || Number((s as any).guru_id) === Number(teacherId)) &&
            Number(s.pekan) === Number(pekan) &&
            (Number((s as any).month) === Number(month) || (s.tanggal && new Date(s.tanggal).getMonth() + 1 === Number(month))) &&
            (Number((s as any).year) === Number(year) || (s.tanggal && new Date(s.tanggal).getFullYear() === Number(year)))
        );
    };

    // Cek pekan yang sudah diplot untuk guru tertentu pada bulan dan tahun terpilih
    const getPlottedWeeksForTeacher = (teacherId: number | string, month = selectedMonth, year = selectedYear): number[] => {
        if (!teacherId) return [];
        const schedules = schedulesList.filter(s =>
            (Number((s as any).teacher_id) === Number(teacherId) || Number((s as any).guru_id) === Number(teacherId)) &&
            (Number((s as any).month) === Number(month) || (s.tanggal && new Date(s.tanggal).getMonth() + 1 === Number(month))) &&
            (Number((s as any).year) === Number(year) || (s.tanggal && new Date(s.tanggal).getFullYear() === Number(year)))
        );
        const peks = schedules.map(s => Number(s.pekan)).filter(Boolean);
        return Array.from(new Set(peks)).sort((a, b) => a - b);
    };

    // Format teks daftar pekan terploting: misal "pekan 2 sudah di ploting", "pekan 2 & 3 sudah di ploting"
    const formattedPlottedWeeksText = useMemo(() => {
        if (!modalForm.teacher_id) return '';
        const plotted = getPlottedWeeksForTeacher(modalForm.teacher_id, modalForm.month, modalForm.year);
        if (!plotted || plotted.length === 0) return '';
        let label = '';
        if (plotted.length === 1) {
            label = `pekan ${plotted[0]}`;
        } else if (plotted.length === 2) {
            label = `pekan ${plotted[0]} & ${plotted[1]}`;
        } else {
            const last = plotted[plotted.length - 1];
            const rest = plotted.slice(0, plotted.length - 1).join(', ');
            label = `pekan ${rest} & ${last}`;
        }
        return `${label} sudah di ploting`;
    }, [modalForm.teacher_id, modalForm.month, modalForm.year, schedulesList]);

    // Cek apakah suatu pekan sudah lewat (lampau) dari kalender berjalan saat ini
    // Aturan: Hanya boleh plot pekan saat ini dan pekan-pekan ke depan. Pekan yang sudah lewat otomatis terkunci/dinonaktifkan.
    const isPekanPast = (pekanNum: number | string, month: number | string = selectedMonth, year: number | string = selectedYear) => {
        const cYear = currentYear || new Date().getFullYear();
        const cMonth = currentMonth || (new Date().getMonth() + 1);
        const cPekan = currentPekan || 1;

        const y = Number(year);
        const m = Number(month);
        const p = Number(pekanNum);

        if (y < cYear) return true;
        if (y > cYear) return false;

        // Tahun sama
        if (m < cMonth) return true;
        if (m > cMonth) return false;

        // Tahun & bulan sama: jika pekan lebih kecil dari pekan saat ini, maka sudah lewat
        return p < cPekan;
    };

    // Cek apakah pekan tertentu pada guru terpilih sudah terplot
    const isPekanPlottedForSelectedTeacher = (pekanNum: number | string) => {
        if (modalForm.is_edit) return false;
        if (!modalForm.teacher_id) return false;
        const plotted = getPlottedWeeksForTeacher(modalForm.teacher_id, modalForm.month, modalForm.year);
        return plotted.includes(Number(pekanNum));
    };

    // Cek apakah pekan terkunci/nonaktif di modal (karena sudah diplot ATAU sudah lewat/kadaluwarsa)
    const isPekanLockedInModal = (pekanNum: number | string) => {
        if (modalForm.is_edit) return false;
        return isPekanPlottedForSelectedTeacher(pekanNum) || isPekanPast(pekanNum, modalForm.month, modalForm.year);
    };

    const isAllWeeksPlottedFor = (teacherId: number | string, month = selectedMonth, year = selectedYear) => {
        const plotted = getPlottedWeeksForTeacher(teacherId, month, year);
        return [1, 2, 3, 4].every(p => plotted.includes(p));
    };

    // Cek apakah guru sudah tidak bisa ditambah sesi lagi (semua pekan sudah terplot ATAU sudah lewat)
    const isNoMorePekanAvailableFor = (teacherId: number | string, month = selectedMonth, year = selectedYear) => {
        const plotted = getPlottedWeeksForTeacher(teacherId, month, year);
        return [1, 2, 3, 4].every(p => plotted.includes(p) || isPekanPast(p, month, year));
    };

    const unplottedSessionsCount = useMemo(() => {
        if (modalForm.is_edit) return modalForm.sessions.length;
        return modalForm.sessions.filter(s => !isPekanLockedInModal(s.pekan)).length;
    }, [modalForm.is_edit, modalForm.sessions, modalForm.teacher_id, modalForm.month, modalForm.year, currentPekan, currentMonth, currentYear]);

    // Daftar nomor pekan yang saat ini aktif di form modal
    const activePekans = useMemo(() => {
        if (!modalForm.is_edit && !modalForm.is_specific) {
            return [1, 2, 3, 4];
        }
        const peks = modalForm.sessions.map(s => Number(s.pekan)).filter(Boolean);
        const unique = Array.from(new Set(peks)).sort((a, b) => a - b);
        return unique.length > 0 ? unique : [1];
    }, [modalForm.is_edit, modalForm.is_specific, modalForm.sessions]);

    const getSessionsForPekan = (pekan: number | string) => {
        return modalForm.sessions.filter(s => Number(s.pekan) === Number(pekan));
    };

    const getSessionIndexInPekan = (session: SessionRowForm) => {
        const list = getSessionsForPekan(session.pekan);
        const idx = list.findIndex(s => s._uid === session._uid);
        return idx !== -1 ? idx + 1 : 1;
    };

    const nextPekanNumber = useMemo(() => {
        for (let p = 1; p <= 4; p++) {
            if (!activePekans.includes(p) && !isPekanPast(p, modalForm.month, modalForm.year)) {
                return p;
            }
        }
        return null;
    }, [activePekans, modalForm.month, modalForm.year, currentPekan, currentMonth, currentYear]);

    const canAddMorePekan = useMemo(() => {
        if (modalForm.is_edit || modalForm.is_specific) return false;
        if (activePekans.length >= 4) return false;
        return nextPekanNumber !== null;
    }, [modalForm.is_edit, modalForm.is_specific, activePekans, nextPekanNumber]);

    const addSessionForPekan = (pekan: number, insertAfterIndex: number | null = null) => {
        const targetPekan = Number(pekan);
        const newSession = createEmptySession(targetPekan);

        const existingSamePekan = modalForm.sessions.find(s => Number(s.pekan) === targetPekan);
        if (existingSamePekan) {
            newSession.kelas = existingSamePekan.kelas || '';
            newSession.level = existingSamePekan.level || '';
            newSession.bidang = existingSamePekan.bidang || 'MTK';
            newSession.session_date = existingSamePekan.session_date || '';
            newSession.jam_mulai = existingSamePekan.jam_mulai || '08:00';
            newSession.jam_selesai = existingSamePekan.jam_selesai || '09:30';
            newSession.session_time = existingSamePekan.session_time || '08:00 - 09:30';
        }

        setModalForm(prev => {
            const nextSessions = [...prev.sessions];
            if (insertAfterIndex !== null && insertAfterIndex >= 0) {
                nextSessions.splice(insertAfterIndex + 1, 0, newSession);
            } else {
                let lastIndex = -1;
                for (let i = nextSessions.length - 1; i >= 0; i--) {
                    if (Number(nextSessions[i].pekan) === targetPekan) {
                        lastIndex = i;
                        break;
                    }
                }
                if (lastIndex !== -1) {
                    nextSessions.splice(lastIndex + 1, 0, newSession);
                } else {
                    let insertPoint = nextSessions.length;
                    for (let i = 0; i < nextSessions.length; i++) {
                        if (Number(nextSessions[i].pekan) > targetPekan) {
                            insertPoint = i;
                            break;
                        }
                    }
                    nextSessions.splice(insertPoint, 0, newSession);
                }
            }
            return { ...prev, sessions: nextSessions };
        });
    };

    const addNextPekan = () => {
        if (nextPekanNumber && nextPekanNumber <= 4) {
            addSessionForPekan(nextPekanNumber);
        }
    };

    const removePekan = (pekan: number) => {
        if (activePekans.length <= 1) return;
        setModalForm(prev => {
            const filtered = prev.sessions.filter(s => Number(s.pekan) !== Number(pekan));
            return {
                ...prev,
                sessions: filtered.length > 0 ? filtered : [createEmptySession(1)],
            };
        });
    };

    const removeSessionByUid = (uid: number) => {
        setModalForm(prev => {
            if (prev.sessions.length > 1) {
                return {
                    ...prev,
                    sessions: prev.sessions.filter(s => s._uid !== uid),
                };
            }
            return prev;
        });
    };

    const onTimeChange = (session: SessionRowForm) => {
        let newTime = session.session_time;
        if (session.jam_mulai && session.jam_selesai) {
            newTime = `${session.jam_mulai} - ${session.jam_selesai}`;
        } else if (session.jam_mulai) {
            newTime = session.jam_mulai;
        }
        updateSession(session._uid, { session_time: newTime });
    };

    const updateSession = (uid: number, updates: Partial<SessionRowForm>) => {
        setModalForm(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => s._uid === uid ? { ...s, ...updates } : s),
        }));
    };

    const createSessionFromSchedule = (sched: any): SessionRowForm => {
        let start = '08:00';
        let end = '09:30';
        if (sched?.session_time && sched.session_time.includes('-')) {
            const parts = sched.session_time.split('-');
            if (parts[0]) start = parts[0].trim().slice(0, 5);
            if (parts[1]) end = parts[1].trim().slice(0, 5);
        } else if (sched?.session_time) {
            start = sched.session_time.trim().slice(0, 5);
        } else if (sched?.jam_mulai && sched?.jam_selesai) {
            start = String(sched.jam_mulai).trim().slice(0, 5);
            end = String(sched.jam_selesai).trim().slice(0, 5);
        }

        const dateVal = sched.session_date ? String(sched.session_date).slice(0, 10) : (sched.tanggal ? String(sched.tanggal).slice(0, 10) : '');
        const kelasVal = sched.kelas || sched.program || sched.level || '';
        const bidangVal = sched.bidang || sched.mapel || 'MTK';

        return {
            _uid: sessionUidCounter++,
            id: sched.id || null,
            pekan: Number(sched.pekan) || 1,
            kelas: kelasVal,
            level: sched.level || '',
            bidang: bidangVal,
            question_id: sched.question_id || (sched.material_id ? String(sched.material_id) : ''),
            session_date: dateVal,
            jam_mulai: start,
            jam_selesai: end,
            session_time: sched.session_time || `${start} - ${end}`,
            is_active: sched.is_active !== undefined ? Boolean(sched.is_active) : true,
            notes: sched.notes || sched.catatan || '',
            show_pdf_upload: false,
            material_pdf: null,
            pdf_name: sched.material_path ? sched.material_path.split('/').pop() : '',
        };
    };

    const onTeacherChange = (teacherId: string) => {
        const teacher = teachersList.find(t => Number(t.id) === Number(teacherId));
        if (teacher && !modalForm.is_edit) {
            const existingSchedules = schedulesList.filter(s =>
                (Number((s as any).teacher_id) === Number(teacher.id) || Number((s as any).guru_id) === Number(teacher.id)) &&
                (Number((s as any).month) === Number(modalForm.month) || (s.tanggal && new Date(s.tanggal).getMonth() + 1 === Number(modalForm.month))) &&
                (Number((s as any).year) === Number(modalForm.year) || (s.tanggal && new Date(s.tanggal).getFullYear() === Number(modalForm.year)))
            ).sort((a, b) => Number(a.pekan) - Number(b.pekan));

            if (existingSchedules.length > 0) {
                setModalForm(prev => ({
                    ...prev,
                    teacher_id: teacherId,
                    sessions: existingSchedules.map(createSessionFromSchedule),
                }));
            } else {
                let defaultPekan = 1;
                for (let p = 1; p <= 4; p++) {
                    if (!isPekanPast(p, modalForm.month, modalForm.year)) {
                        defaultPekan = p;
                        break;
                    }
                }
                setModalForm(prev => ({
                    ...prev,
                    teacher_id: teacherId,
                    sessions: [createEmptySession(defaultPekan, teacher)],
                }));
            }
        } else if (teacher) {
            const defaultBidang = ((teacher as any)?.subject || (teacher as any)?.mapel) === 'IPA' ? 'IPA' : 'MTK';
            const defaultKelas = teacher?.kelas_diajar || '';

            setModalForm(prev => ({
                ...prev,
                teacher_id: teacherId,
                sessions: prev.sessions.map(s => ({
                    ...s,
                    kelas: s.kelas || defaultKelas,
                    bidang: s.bidang || defaultBidang,
                })),
            }));
        }
    };

    const setCycleMode = (mode: 'single' | '2weeks' | '4weeks') => {
        let newSessions: SessionRowForm[] = [];
        if (mode === 'single') {
            newSessions = [createEmptySession(1)];
        } else if (mode === '2weeks') {
            newSessions = [createEmptySession(1), createEmptySession(2)];
        } else if (mode === '4weeks') {
            newSessions = [1, 2, 3, 4].map(p => createEmptySession(p));
        }
        setModalForm(prev => ({
            ...prev,
            cycle_mode: mode,
            sessions: newSessions,
        }));
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>, session: SessionRowForm) => {
        const file = e.target.files?.[0];
        if (file) {
            updateSession(session._uid, {
                material_pdf: file,
                pdf_name: file.name,
            });
        }
    };

    const clearSessionPdf = (session: SessionRowForm) => {
        updateSession(session._uid, {
            material_pdf: null,
            pdf_name: '',
        });
    };

    const openModalTambahSesi = (teacher: any = null, pekan: number | null = null) => {
        setDismissedConflict(false);
        setExpandedWeeks([1, 2, 3, 4]);
        setModalForm({
            is_edit: false,
            is_specific: Boolean(teacher),
            cycle_mode: 'single',
            teacher_id: teacher ? String(teacher.id) : '',
            month: selectedMonth,
            year: selectedYear,
            sessions: [createEmptySession(pekan || 1, teacher)],
        });
        setShowModal(true);
    };

    const openModalAturSesiGuru = (teacher: any) => {
        if (!teacher) return;
        setDismissedConflict(false);
        setExpandedWeeks([1, 2, 3, 4]);

        const existingSchedules = schedulesList.filter(s =>
            (Number((s as any).teacher_id) === Number(teacher.id) || Number((s as any).guru_id) === Number(teacher.id)) &&
            (Number((s as any).month) === Number(selectedMonth) || (s.tanggal && new Date(s.tanggal).getMonth() + 1 === Number(selectedMonth))) &&
            (Number((s as any).year) === Number(selectedYear) || (s.tanggal && new Date(s.tanggal).getFullYear() === Number(selectedYear)))
        ).sort((a, b) => Number(a.pekan) - Number(b.pekan));

        let defaultPekan = 1;
        for (let p = 1; p <= 4; p++) {
            if (!isPekanPast(p, selectedMonth, selectedYear)) {
                defaultPekan = p;
                break;
            }
        }

        setModalForm({
            is_edit: false,
            is_specific: false,
            cycle_mode: 'single',
            teacher_id: String(teacher.id),
            month: selectedMonth,
            year: selectedYear,
            sessions: existingSchedules.length > 0
                ? existingSchedules.map(createSessionFromSchedule)
                : [createEmptySession(defaultPekan, teacher)],
        });
        setShowModal(true);
    };

    const openEditSingleModal = (teacher: any, pekan: number, item: any) => {
        setDismissedConflict(false);
        let start = '08:00';
        let end = '09:30';
        if (item?.session_time && item.session_time.includes('-')) {
            const parts = item.session_time.split('-');
            if (parts[0]) start = parts[0].trim();
            if (parts[1]) end = parts[1].trim();
        } else if (item?.session_time) {
            start = item.session_time.trim();
        }

        setModalForm({
            is_edit: true,
            is_specific: true,
            cycle_mode: 'single',
            teacher_id: String(item?.teacher_id || item?.guru_id || teacher?.id || ''),
            month: item?.month || selectedMonth,
            year: item?.year || selectedYear,
            sessions: [{
                _uid: sessionUidCounter++,
                id: item.id,
                pekan: item.pekan || pekan || 1,
                kelas: item.kelas || '',
                level: item.level || '',
                bidang: item.bidang || item.mapel || 'MTK',
                question_id: item.question_id || (item.material_id ? String(item.material_id) : ''),
                session_date: item.session_date ? String(item.session_date).slice(0, 10) : (item.tanggal ? String(item.tanggal).slice(0, 10) : ''),
                jam_mulai: start,
                jam_selesai: end,
                session_time: item.session_time || `${start} - ${end}`,
                is_active: Boolean(item.is_active),
                notes: item.notes || item.catatan || '',
                show_pdf_upload: false,
                material_pdf: null,
                pdf_name: '',
            }],
        });
        setShowModal(true);
    };

    const submitModal = (e: FormEvent) => {
        e.preventDefault();
        if (!modalForm.teacher_id) return;
        setDismissedConflict(false);

        const sessionsToSubmit = modalForm.is_edit
            ? modalForm.sessions
            : modalForm.sessions.filter(s => !isPekanPlottedForSelectedTeacher(s.pekan));

        if (sessionsToSubmit.length === 0) {
            alert('Tidak ada sesi pada pekan yang dapat disimpan karena pekan tersebut sudah terploting.');
            return;
        }

        setProcessing(true);
        const hasFiles = sessionsToSubmit.some(s => s.material_pdf instanceof File);

        if (hasFiles) {
            const formData = new FormData();
            formData.append('teacher_id', modalForm.teacher_id);
            formData.append('guru_id', modalForm.teacher_id);
            formData.append('month', String(modalForm.month));
            formData.append('year', String(modalForm.year));

            sessionsToSubmit.forEach((s, idx) => {
                if (s.id) formData.append(`sessions[${idx}][id]`, String(s.id));
                formData.append(`sessions[${idx}][pekan]`, String(s.pekan));
                formData.append(`sessions[${idx}][kelas]`, s.kelas || '');
                formData.append(`sessions[${idx}][level]`, s.level || '');
                formData.append(`sessions[${idx}][bidang]`, s.bidang || '');
                formData.append(`sessions[${idx}][session_date]`, s.session_date || '');
                formData.append(`sessions[${idx}][session_time]`, s.session_time || '');
                formData.append(`sessions[${idx}][is_active]`, s.is_active ? '1' : '0');
                formData.append(`sessions[${idx}][notes]`, s.notes || '');
                formData.append(`sessions[${idx}][question_id]`, s.question_id || '');
                if (s.material_pdf instanceof File) {
                    formData.append(`sessions[${idx}][material_pdf]`, s.material_pdf);
                }
            });

            router.post(`/${basePath}`, formData, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); },
                onFinish: () => { setProcessing(false); },
            });
            return;
        }

        router.post(`/${basePath}`, {
            teacher_id: modalForm.teacher_id,
            guru_id: modalForm.teacher_id,
            month: modalForm.month,
            year: modalForm.year,
            sessions: sessionsToSubmit,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowModal(false); },
            onFinish: () => { setProcessing(false); },
        });
    };

    const deletePlot = (schedule: any) => {
        if (confirm(`Hapus sesi mengajar Pekan ${schedule.pekan} (${schedule.kelas || 'Semua Kelas'})?`)) {
            router.delete(`/${basePath}/${schedule.id}`, {
                preserveScroll: true,
            });
        }
    };

    const isTeacherActive = (t: any) => {
        return t ? t.is_active_this_week !== false : true;
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
            per_page: 15,
        }, { preserveState: true });
    };

    const resetFilter = () => {
        setTeacherSearch('');
        setFilterKelas('');
        setFilterBidang('');
        setFilterPekan('');
        setFilterStatus('');
        setTeacherPage(1);
        router.get(`/${basePath}`, {
            month: selectedMonth,
            year: selectedYear,
            per_page: 15,
        }, { preserveState: true });
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.visit(url, { preserveState: true, preserveScroll: true });
        }
    };

    // Auto-polling realtime setiap 5 detik agar selalu sinkron otomatis dengan Adik-Kakak
    useEffect(() => {
        const interval = setInterval(() => {
            // Hanya reload jika modal sedang tidak terbuka (agar tidak mengganggu saat admin mengetik/input)
            if (!showModal && !showDetailModal) {
                router.reload({
                    only: ['sessions', 'schedules', 'teachers', 'gurus'],
                });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [showModal, showDetailModal]);

    // Filter teachers for matrix view
    const filteredTeachers = useMemo(() => {
        return teachersList.filter((t) => {
            const kw = teacherSearch.trim().toLowerCase();
            if (kw) {
                const name = (t.user?.name || t.name || (t as any).nama || '').toLowerCase();
                const subject = ((t as any).subject || (t as any).mapel || '').toLowerCase();
                if (!name.includes(kw) && !subject.includes(kw)) return false;
            }

            if (filterStatus) {
                const active = isTeacherActive(t);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }

            if (filterBidang) {
                const b = ((t as any).subject || (t as any).mapel || '').toUpperCase();
                const b2 = ((t as any).subject_2 || (t as any).bidang_2 || '').toUpperCase();
                const target = filterBidang.toUpperCase();
                if (!b.includes(target) && !b2.includes(target)) return false;
            }

            if (filterKelas) {
                const teacherSchedules = schedulesList.filter(s =>
                    Number((s as any).teacher_id) === Number(t.id) || Number((s as any).guru_id) === Number(t.id)
                );
                const hasClassInSchedule = teacherSchedules.some(s => s.kelas === filterKelas);
                const hasClassInTeacher = (t.kelas_diajar || (t as any).jenjang || '').includes(filterKelas);
                if (!hasClassInSchedule && !hasClassInTeacher) return false;
            }

            if (filterPekan) {
                const teacherSchedules = schedulesList.filter(s =>
                    Number((s as any).teacher_id) === Number(t.id) || Number((s as any).guru_id) === Number(t.id)
                );
                const hasPekan = teacherSchedules.some(s => Number(s.pekan) === Number(filterPekan));
                if (!hasPekan) return false;
            }

            return true;
        });
    }, [teachersList, schedulesList, teacherSearch, filterStatus, filterBidang, filterKelas, filterPekan]);

    const [teacherPage, setTeacherPage] = useState(1);
    const teacherPerPage = 15;

    useEffect(() => {
        setTeacherPage(1);
    }, [teacherSearch, filterStatus, filterBidang, filterKelas, filterPekan]);

    const teacherTotalPages = Math.ceil(filteredTeachers.length / teacherPerPage) || 1;
    const paginatedTeachers = useMemo(() => {
        const start = (teacherPage - 1) * teacherPerPage;
        return filteredTeachers.slice(start, start + teacherPerPage);
    }, [filteredTeachers, teacherPage, teacherPerPage]);

    // Filter schedules for list view
    const filteredSchedules = useMemo(() => {
        return schedulesList.filter((s) => {
            if (teacherSearch) {
                const kw = teacherSearch.trim().toLowerCase();
                const tName = ((s as any).teacher?.user?.name || (s as any).teacher?.name || (s as any).guru?.nama || (s as any).guru?.user?.name || '').toLowerCase();
                if (!tName.includes(kw)) return false;
            }
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterBidang && ((s as any).bidang || s.mapel) !== filterBidang) return false;
            if (filterPekan && Number(s.pekan) !== Number(filterPekan)) return false;
            if (filterStatus) {
                const active = isTeacherActive((s as any).teacher || (s as any).guru);
                if (filterStatus === 'aktif' && !active) return false;
                if (filterStatus === 'nonaktif' && active) return false;
            }
            return true;
        });
    }, [schedulesList, teacherSearch, filterKelas, filterBidang, filterPekan, filterStatus]);

    const getSchedulesFor = (teacherId: number | string, pekan: number | string) => {
        return schedulesList.filter((s) => {
            const matchTeacher = Number((s as any).teacher_id) === Number(teacherId) || Number((s as any).guru_id) === Number(teacherId);
            if (!matchTeacher || Number(s.pekan) !== Number(pekan)) return false;
            if (filterKelas && s.kelas !== filterKelas) return false;
            if (filterBidang && ((s as any).bidang || s.mapel) !== filterBidang) return false;
            return true;
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ploting Guru" />

            <div className="space-y-4">
                {/* Title & Subtitle + Tombol + Ploting di Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-deep-twilight">Ploting Guru</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Kelola penugasan guru, tambah multi-sesi per pekan, dan aktivasi akun guru kelas khusus</p>
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
                                <span>Daftar Sesi</span>
                            </button>
                        </div>

                        {/* Tombol Ploting di Header Atas */}
                        <button
                            type="button"
                            onClick={() => openModalTambahSesi()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-french-blue text-white text-xs font-bold rounded-xl hover:bg-deep-twilight transition-all shadow-2xs cursor-pointer shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Ploting</span>
                        </button>
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
                            <p className="text-[11px] text-red-700 mt-1">Sistem mencegah jadwal ganda pada guru/kelas di jam yang sama. Harap sesuaikan jam sesi atau batalkan sesi lama terlebih dahulu.</p>
                        </div>
                        <button type="button" onClick={clearConflictError} className="text-red-400 hover:text-red-600 text-base font-bold cursor-pointer">
                            &times;
                        </button>
                    </div>
                )}

                {/* Filter Bar yang Compact & Simpel */}
                <div className="bg-white rounded-2xl border border-light-cyan p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Cari Guru */}
                        <div className="w-full sm:w-48">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    placeholder="Cari guru..."
                                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all"
                                />
                                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Filter Kelas */}
                        <div className="w-28">
                            <select
                                value={filterKelas}
                                onChange={(e) => setFilterKelas(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Kelas</option>
                                {KELAS_OPTIONS.map((k) => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Bidang */}
                        <div className="w-24">
                            <select
                                value={filterBidang}
                                onChange={(e) => setFilterBidang(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                <option value="">Bidang</option>
                                <option value="MTK">MTK</option>
                                <option value="IPA">IPA</option>
                            </select>
                        </div>

                        {/* Filter Pekan */}
                        <div className="w-24">
                            <select
                                value={filterPekan}
                                onChange={(e) => setFilterPekan(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Pekan</option>
                                <option value="1">Pekan 1</option>
                                <option value="2">Pekan 2</option>
                                <option value="3">Pekan 3</option>
                                <option value="4">Pekan 4</option>
                            </select>
                        </div>

                        {/* Filter Status Guru */}
                        <div className="w-24">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                <option value="">Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </div>

                        {/* Bulan & Tahun */}
                        <div className="w-28">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-2 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                    <option key={m} value={m}>{monthName(m)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-20">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full px-2 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight focus:bg-white focus:border-bright-teal outline-none transition-all cursor-pointer"
                            >
                                {[2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tombol Terapkan Filter */}
                        <button
                            type="button"
                            onClick={applyFilter}
                            className="px-3 py-1.5 bg-bright-teal text-white text-xs font-bold rounded-xl hover:bg-blue-green transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
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
                                className="px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* TAMPILAN 1: Matriks 4 Pekan (Compact, Proporsional & Tanpa Scrolling Horizontal) */}
                {viewMode === 'matrix' ? (
                    <div className="bg-white rounded-2xl border border-light-cyan overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed min-w-[760px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-light-cyan text-[10px] uppercase tracking-wider text-gray-500">
                                        <th className="py-2.5 px-1 font-semibold text-center w-8">No</th>
                                        <th className="py-2.5 px-2 font-semibold w-36">Guru Pengajar</th>
                                        <th className="py-2.5 px-1 font-semibold text-center w-24">Status</th>
                                        {[1, 2, 3, 4].map((p) => (
                                            <th
                                                key={p}
                                                className={`py-2.5 px-1.5 font-bold text-center transition-colors w-[18%] ${
                                                    p === currentPekan ? 'bg-blue-100/90 text-blue-900 font-black border-x-2 border-blue-300' : ''
                                                }`}
                                            >
                                                <div className="inline-flex items-center justify-center gap-1">
                                                    <span>Pekan {p}</span>
                                                    {p === currentPekan && (
                                                        <span className="relative flex h-2 w-2" title="Pekan Berjalan Aktif">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="py-2.5 px-1.5 font-semibold text-center w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-cyan/60 text-xs">
                                    {filteredTeachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-6 text-center text-gray-400">
                                                Tidak ada data guru ditemukan sesuai filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTeachers.map((t, tIdx) => {
                                            const tSchedules = [1, 2, 3, 4].map(p => getSchedulesFor(t.id, p));
                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50/60 align-top">
                                                    <td className="py-2.5 px-1 text-center font-bold text-gray-500">{(teacherPage - 1) * teacherPerPage + tIdx + 1}</td>
                                                    <td className="py-2.5 px-2">
                                                        <p className="font-bold text-deep-twilight truncate" title={t.user?.name || t.name || (t as any).nama}>
                                                            {t.user?.name || t.name || (t as any).nama || `Guru #${t.id}`}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 truncate">
                                                            Bidang: {(t as any).subject || (t as any).mapel || '-'}{(t as any).subject_2 || (t as any).bidang_2 ? ` / ${(t as any).subject_2 || (t as any).bidang_2}` : ''}
                                                        </p>
                                                    </td>

                                                    <td className="py-2.5 px-1 text-center">
                                                        <div className="relative w-full">
                                                            <select
                                                                value={isTeacherActive(t) ? 'aktif' : 'nonaktif'}
                                                                onChange={(e) => changeTeacherStatus(t, e.target.value)}
                                                                style={{ backgroundImage: 'none' }}
                                                                className={`appearance-none pl-2.5 pr-6 py-1.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer transition-all w-full text-center shadow-2xs ${
                                                                    isTeacherActive(t)
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                                        : 'bg-red-50 text-red-700 border-red-300'
                                                                }`}
                                                            >
                                                                <option value="aktif">Aktif</option>
                                                                <option value="nonaktif">Nonaktif</option>
                                                            </select>
                                                            <svg className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </td>

                                                    {/* Kolom Pekan 1..4: Desain Kapsul Seperti Tombol Atur Sesi */}
                                                    {[1, 2, 3, 4].map((p) => {
                                                        const schedules = tSchedules[p - 1];
                                                        return (
                                                            <td
                                                                key={p}
                                                                className={`py-2 px-1.5 transition-colors w-[18%] ${
                                                                    p === currentPekan ? 'bg-blue-50/90 border-x-2 border-blue-200/90' : ''
                                                                }`}
                                                            >
                                                                {schedules.length === 0 ? (
                                                                    <div
                                                                        className={`rounded-xl border py-1.5 px-2 text-center text-xs font-normal italic shadow-2xs ${
                                                                            isPekanPast(p)
                                                                                ? 'border-slate-300 bg-slate-200/60 text-slate-500 font-medium'
                                                                                : 'border-slate-200 bg-slate-50/70 text-gray-400'
                                                                        }`}
                                                                    >
                                                                        {isPekanPast(p) ? 'Terlewat' : 'Tidak ada jadwal'}
                                                                    </div>
                                                                ) : (
                                                                    <div className="rounded-xl bg-french-blue/10 border border-french-blue/20 text-french-blue px-2.5 py-1.5 flex items-center justify-center gap-2 transition-all shadow-2xs hover:bg-french-blue/15">
                                                                        <div className="flex items-center gap-1.5 text-xs font-normal tracking-tight">
                                                                            <span className={schedules[0] ? 'text-french-blue font-medium' : 'text-slate-400 font-normal italic'}>
                                                                                {schedules[0] ? 'Sesi-1' : '-'}
                                                                            </span>
                                                                            <span className="text-french-blue/30 font-light">|</span>
                                                                            <span className={schedules[1] ? 'text-french-blue font-medium' : 'text-slate-400 font-normal italic'}>
                                                                                {schedules[1] ? 'Sesi-2' : '-'}
                                                                            </span>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openWeekDetailModal(t, p, schedules)}
                                                                            className="p-0.5 rounded text-french-blue hover:text-deep-twilight hover:bg-french-blue/15 transition-colors cursor-pointer shrink-0"
                                                                            title={`Lihat Detail Sesi Pekan ${p}`}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="py-2.5 px-1.5 text-center w-24">
                                                        {isNoMorePekanAvailableFor(t.id) ? (
                                                            <button
                                                                type="button"
                                                                disabled
                                                                className="w-full px-2 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed whitespace-nowrap shadow-2xs border border-slate-200"
                                                                title={isAllWeeksPlottedFor(t.id) ? 'Semua pekan sudah diplot pada bulan ini' : 'Pekan yang belum terplot sudah terlewat'}
                                                            >
                                                                {isAllWeeksPlottedFor(t.id) ? 'Penuh' : 'Terkunci'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => openModalAturSesiGuru(t)}
                                                                className="w-full px-2 py-1.5 rounded-xl bg-french-blue/10 hover:bg-french-blue/20 text-french-blue text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs border border-french-blue/20"
                                                                title="Atur multi-sesi atau multi-pekan untuk guru ini"
                                                            >
                                                                + Atur Sesi
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Navigasi Paginasi Matriks Guru (Maksimal 15 Guru per Halaman) */}
                        {filteredTeachers.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2.5 text-xs text-slate-600 border-t border-light-cyan/60 bg-slate-50/50">
                                <div>
                                    Menampilkan <strong className="text-slate-800">{(teacherPage - 1) * teacherPerPage + 1}</strong> sampai <strong className="text-slate-800">{Math.min(teacherPage * teacherPerPage, filteredTeachers.length)}</strong> dari <strong className="text-slate-800">{filteredTeachers.length}</strong> total guru
                                </div>
                                {teacherTotalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={teacherPage <= 1}
                                            onClick={() => setTeacherPage((p) => Math.max(1, p - 1))}
                                            className="px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        >
                                            &laquo; Prev
                                        </button>
                                        {Array.from({ length: teacherTotalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setTeacherPage(p)}
                                                className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                                                    p === teacherPage
                                                        ? 'bg-bright-teal text-white border-bright-teal font-bold'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={teacherPage >= teacherTotalPages}
                                            onClick={() => setTeacherPage((p) => Math.min(teacherTotalPages, p + 1))}
                                            className="px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        >
                                            Next &raquo;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* TAMPILAN 2: Daftar Sesi Mengajar */
                    <div className="bg-white rounded-2xl border border-light-cyan overflow-hidden shadow-xs">
                        <div className="p-3 border-b border-light-cyan/60 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-bold text-deep-twilight">Daftar Sesi Mengajar</h3>
                                <p className="text-[10px] text-gray-400">Data sesi terurut menurun berdasarkan tanggal dan pekan</p>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                Total {filteredSchedules.length} Sesi
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-light-cyan text-[10px] uppercase tracking-wider text-gray-500">
                                        <th className="py-2.5 px-2 font-semibold text-center w-10">No</th>
                                        <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">Pekan</th>
                                        <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">Jam</th>
                                        <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">Tanggal</th>
                                        <th className="py-2.5 px-3 font-semibold min-w-[130px]">Nama</th>
                                        <th className="py-2.5 px-2 font-semibold text-center whitespace-nowrap">Kelas</th>
                                        <th className="py-2.5 px-2 font-semibold text-center whitespace-nowrap">Bidang</th>
                                        <th className="py-2.5 px-2 font-semibold text-center whitespace-nowrap">Level</th>
                                        <th className="py-2.5 px-3 font-semibold max-w-[180px]">Bahan Ajar</th>
                                        <th className="py-2.5 px-2 font-semibold text-center w-20">Status</th>
                                        <th className="py-2.5 px-2 font-semibold text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-cyan/60 text-[11px]">
                                    {filteredSchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="py-6 text-center text-gray-400">
                                                Tidak ada data sesi mengajar ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchedules.map((s, sIdx) => {
                                            const teacherObj = (s as any).teacher || (s as any).guru;
                                            const qObj = (s as any).question || (s as any).material;
                                            return (
                                                <tr
                                                    key={s.id}
                                                    className={`transition-colors ${
                                                        s.is_current_pekan ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50/60'
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-2 text-center font-bold text-gray-500">
                                                        {(pagination?.from || 1) + sIdx}
                                                    </td>
                                                    <td className="py-2.5 px-2.5 text-center font-bold text-deep-twilight whitespace-nowrap">
                                                        Pekan {s.pekan}
                                                    </td>
                                                    <td className="py-2.5 px-2.5 text-center font-bold text-deep-twilight whitespace-nowrap">
                                                        {s.session_time || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-2.5 text-center text-slate-600 whitespace-nowrap">
                                                        {formatDate((s as any).session_date || s.tanggal)}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <p className="font-bold text-deep-twilight">{teacherObj?.user?.name || teacherObj?.name || teacherObj?.nama || '-'}</p>
                                                        <p className="text-[10px] text-gray-400">NIP: {teacherObj?.nip || '-'}</p>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                                        <span className="font-bold text-deep-twilight">{s.kelas || 'Semua Kelas'}</span>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-bright-teal/10 text-bright-teal">
                                                            {(s as any).bidang || s.mapel || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                                        {s.level ? (
                                                            <span className="text-slate-700 font-medium">{s.level}</span>
                                                        ) : (
                                                            <span className="font-bold text-gray-800 text-sm leading-none">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 max-w-[180px]">
                                                        {qObj ? (
                                                            <div className="truncate" title={qObj.title}>
                                                                <span className="text-[11px] font-medium text-slate-700">📄 {qObj.title}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center font-bold text-gray-800 text-sm leading-none">-</div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                            }`}
                                                        >
                                                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditSingleModal(teacherObj, s.pekan, s)}
                                                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                                            >
                                                                Ubah
                                                            </button>
                                                            <span className="text-gray-300">|</span>
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

                        {/* Navigasi Paginasi Daftar Sesi (Maksimal 15 Sesi per Halaman) */}
                        {pagination && pagination.total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2.5 text-xs text-slate-600 border-t border-light-cyan/60 bg-slate-50/50">
                                <div>
                                    Menampilkan <strong className="text-slate-800">{pagination.from || 1}</strong> sampai <strong className="text-slate-800">{pagination.to || pagination.total}</strong> dari <strong className="text-slate-800">{pagination.total}</strong> total sesi
                                </div>
                                <div className="flex items-center gap-1">
                                    {pagination.links?.map((link: any, i: number) => {
                                        if (link.url) {
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => goToPage(link.url)}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                                                        link.active ? 'bg-bright-teal text-white border-bright-teal font-bold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                />
                                            );
                                        }
                                        return (
                                            <span
                                                key={i}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className="px-2.5 py-1 text-xs text-slate-400 border border-transparent"
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL TERPADU: TAMBAH / ATUR SESI MENGAJAR */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowModal(false);
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-light-cyan max-w-xl w-full p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-light-cyan/60 pb-2.5 mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-deep-twilight">
                                    {modalForm.is_edit ? 'Ubah Sesi Mengajar' : 'Tambah Sesi Mengajar'}
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Atur jadwal per pekan dan tambah sesi mengajar secara bertahap atau fleksibel.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitModal} className="space-y-3" encType="multipart/form-data">
                            {/* Pilihan Guru, Bulan, Tahun */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-[10px] font-bold text-deep-twilight uppercase tracking-wider mb-0.5">Guru Pengajar *</label>
                                    <select
                                        value={modalForm.teacher_id}
                                        required
                                        disabled={modalForm.is_specific}
                                        onChange={(e) => onTeacherChange(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachersList.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.user?.name || t.name || (t as any).nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-deep-twilight uppercase tracking-wider mb-0.5">Bulan</label>
                                    <select
                                        value={modalForm.month}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, month: Number(e.target.value) }))}
                                        className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                            <option key={m} value={m}>{monthName(m)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-deep-twilight uppercase tracking-wider mb-0.5">Tahun</label>
                                    <select
                                        value={modalForm.year}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                                        className="w-full px-2.5 py-1.5 rounded-xl border border-light-cyan bg-light-cyan/20 text-xs text-deep-twilight outline-none"
                                    >
                                        {[2025, 2026, 2027].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* DAFTAR PEKAN DAN SESI MENGAJAR */}
                            <div className="space-y-3">
                                {/* Info jika guru sudah memiliki pekan yang diplot */}
                                {!modalForm.is_edit && modalForm.teacher_id && formattedPlottedWeeksText && (
                                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                            <span className="capitalize">{formattedPlottedWeeksText}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Peringatan jika semua pekan sudah terplot atau pekan yang tersisa sudah lewat */}
                                {!modalForm.is_edit && modalForm.teacher_id && isNoMorePekanAvailableFor(modalForm.teacher_id, modalForm.month, modalForm.year) && (
                                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 text-center font-medium">
                                        Tidak ada pekan yang dapat diploting lagi pada bulan ini (pekan sudah terisi atau waktu telah terlewat). Silakan gunakan ikon detail sesi pada tabel untuk melihat atau mengelola jadwal.
                                    </div>
                                )}

                                {activePekans.map((pekanNum) => {
                                    const isPlotted = isPekanPlottedForSelectedTeacher(pekanNum);
                                    const isLocked = isPekanLockedInModal(pekanNum);
                                    const isPast = isPekanPast(pekanNum, modalForm.month, modalForm.year);
                                    const sessionsInPekan = getSessionsForPekan(pekanNum);
                                    const plottedSessions = getPlottedSchedulesForTeacherAndPekan(modalForm.teacher_id, pekanNum, modalForm.month, modalForm.year);
                                    const isExpanded = expandedWeeks.includes(pekanNum);

                                    return (
                                        <div
                                            key={pekanNum}
                                            className={`rounded-xl border transition-all p-3 space-y-2.5 shadow-2xs ${
                                                isLocked ? "border-slate-300 bg-slate-100/90" : "border-slate-200 bg-white"
                                            }`}
                                        >
                                            {/* Header Pekan dengan Accordion Toggle */}
                                            <div
                                                onClick={() => toggleExpandWeek(pekanNum)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors shadow-xs cursor-pointer select-none ${
                                                    isLocked ? "bg-slate-700 hover:bg-slate-800 text-white" : "bg-french-blue hover:bg-deep-twilight text-white"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                            isLocked ? "bg-slate-900/60 text-white" : "bg-white/20 text-white"
                                                        }`}
                                                    >
                                                        Pekan {pekanNum}
                                                    </span>
                                                    <span className={`text-[11px] font-medium ${isLocked ? "text-slate-100 font-semibold" : "text-white/90"}`}>
                                                        {isPlotted ? "Sudah Diploting" : (isPast ? "Tidak Ada Jadwal (Terlewat)" : `${sessionsInPekan.length} Sesi Terjadwal`)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {!modalForm.is_edit && !modalForm.is_specific && !isLocked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addSessionForPekan(pekanNum)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-french-blue hover:bg-slate-50 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                                            title={`Tambah sesi baru pada Pekan ${pekanNum}`}
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span>Tambah Sesi</span>
                                                        </button>
                                                    )}

                                                    {isLocked && (
                                                        <span className="text-[10px] bg-slate-900/60 text-white px-2 py-0.5 rounded-md font-bold tracking-wide">
                                                            {isPlotted ? "Terkunci" : "Terlewat"}
                                                        </span>
                                                    )}

                                                    {/* Panah Accordion Chevron */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpandWeek(pekanNum)}
                                                        className="p-1 rounded-md hover:bg-white/20 text-white transition-colors cursor-pointer"
                                                        title={isExpanded ? "Tutup Pekan" : "Buka Pekan"}
                                                    >
                                                        <svg
                                                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Isi Konten Accordion */}
                                            {isExpanded && (
                                                <div className="space-y-2 pt-0.5">
                                                    {/* JIKA PEKAN TERKUNCI & SUDAH DIPLOT: TAMPILKAN KARTU RINGKASAN READ-ONLY YANG BERSIH */}
                                                    {isLocked && isPlotted ? (
                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                                {(plottedSessions.length > 0 ? plottedSessions : sessionsInPekan).map((sched, idx) => (
                                                                    <div
                                                                        key={sched.id || idx}
                                                                        className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5 text-xs"
                                                                    >
                                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                                            <span className="font-bold text-french-blue text-[11px]">Sesi {idx + 1}</span>
                                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                                                                sched.is_active !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                                                                            }`}>
                                                                                {sched.is_active !== false ? "Aktif" : "Nonaktif"}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1 text-[11px] text-slate-700">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-gray-400">Kelas:</span>
                                                                                <span className="font-semibold text-deep-twilight">{sched.kelas || sched.program || "Semua Kelas"}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-gray-400">Bidang:</span>
                                                                                <span className="font-semibold text-deep-twilight">{sched.bidang || sched.mapel || "-"}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-gray-400">Waktu:</span>
                                                                                <span className="font-semibold text-deep-twilight">⏰ {sched.session_time || `${sched.jam_mulai || "08:00"} - ${sched.jam_selesai || "09:30"}`}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-gray-400">Tanggal:</span>
                                                                                <span className="font-semibold text-deep-twilight">📅 {formatDate(sched.session_date || sched.tanggal)}</span>
                                                                            </div>
                                                                            {(sched.question || sched.material || sched.bahan_ajar) && (
                                                                                <div className="pt-1 border-t border-slate-100 text-[10px] truncate text-slate-600">
                                                                                    📄 {(sched.question || sched.material)?.title || sched.bahan_ajar}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
                                                                <span>ℹ️</span>
                                                                <span>Pekan ini sudah terploting dan terkunci. Jika ingin mengubah jadwal sesi ini, silakan gunakan tombol <strong>Ubah</strong> pada tabel atau detail sesi.</span>
                                                            </div>
                                                        </div>
                                                    ) : isLocked && !isPlotted ? (
                                                        /* JIKA PEKAN TERLEWAT DAN KOSONG (TIDAK ADA JADWAL) */
                                                        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-1 text-slate-500 text-xs">
                                                            <p className="font-semibold text-slate-600">Tidak Ada Jadwal</p>
                                                            <p className="text-[11px] text-slate-400 italic">Pekan ini telah terlewat dan tidak dijadwalkan sesi mengajar.</p>
                                                        </div>
                                                    ) : sessionsInPekan.length === 0 ? (
                                                        /* JIKA PEKAN AKTIF TAPI BELUM ADA SESI */
                                                        <div className="p-4 rounded-xl border border-dashed border-french-blue/30 bg-french-blue/5 text-center space-y-2">
                                                            <p className="text-xs text-slate-600 font-medium">Belum ada sesi di Pekan {pekanNum}.</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => addSessionForPekan(pekanNum)}
                                                                className="px-3 py-1.5 bg-french-blue text-white rounded-lg text-xs font-semibold hover:bg-deep-twilight transition-colors cursor-pointer inline-flex items-center gap-1"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                <span>+ Tambah Sesi Pekan {pekanNum}</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* JIKA PEKAN AKTIF (MISAL PEKAN 4): TAMPILKAN FORM SESI AKTIF LENGKAP */
                                                        sessionsInPekan.map((s) => (
                                                            <div
                                                                key={s._uid}
                                                                className="p-2.5 rounded-lg border space-y-2 relative transition-colors border-slate-200/90 bg-slate-50/70"
                                                            >
                                                                {/* Sub-Header Sesi */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center bg-french-blue">
                                                                            {getSessionIndexInPekan(s)}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-slate-800">
                                                                            Sesi {getSessionIndexInPekan(s)}
                                                                        </span>
                                                                    </div>

                                                                    {!modalForm.is_edit && !modalForm.is_specific && (sessionsInPekan.length > 1) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeSessionByUid(s._uid)}
                                                                            className="text-[10px] text-red-500 hover:text-red-700 hover:underline cursor-pointer font-medium"
                                                                        >
                                                                            Hapus Sesi
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Input Tanggal & Jam Picker */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold uppercase mb-0.5 text-gray-600">Tanggal Sesi</label>
                                                                        <input
                                                                            type="date"
                                                                            value={s.session_date}
                                                                            onChange={(e) => updateSession(s._uid, { session_date: e.target.value })}
                                                                            className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-xs font-semibold text-deep-twilight outline-none focus:border-bright-teal cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold uppercase mb-0.5 text-gray-600">Jam Mulai</label>
                                                                        <input
                                                                            type="time"
                                                                            value={s.jam_mulai}
                                                                            onChange={(e) => {
                                                                                updateSession(s._uid, { jam_mulai: e.target.value });
                                                                                onTimeChange({ ...s, jam_mulai: e.target.value });
                                                                            }}
                                                                            className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-xs font-semibold text-deep-twilight outline-none focus:border-bright-teal cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold uppercase mb-0.5 text-gray-600">Jam Selesai</label>
                                                                        <input
                                                                            type="time"
                                                                            value={s.jam_selesai}
                                                                            onChange={(e) => {
                                                                                updateSession(s._uid, { jam_selesai: e.target.value });
                                                                                onTimeChange({ ...s, jam_selesai: e.target.value });
                                                                            }}
                                                                            className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-xs font-semibold text-deep-twilight outline-none focus:border-bright-teal cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold uppercase mb-0.5 text-gray-600">Kelas</label>
                                                                        <select
                                                                            value={s.kelas}
                                                                            onChange={(e) => updateSession(s._uid, { kelas: e.target.value })}
                                                                            className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-xs font-semibold text-deep-twilight outline-none cursor-pointer"
                                                                        >
                                                                            <option value="">Semua Kelas</option>
                                                                            {KELAS_OPTIONS.map((k) => (
                                                                                <option key={k} value={k}>{k}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold uppercase mb-0.5 text-gray-600">Bidang</label>
                                                                        <select
                                                                            value={s.bidang}
                                                                            onChange={(e) => updateSession(s._uid, { bidang: e.target.value })}
                                                                            className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-xs font-semibold text-deep-twilight outline-none cursor-pointer"
                                                                        >
                                                                            <option value="MTK">MTK</option>
                                                                            <option value="IPA">IPA</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {/* Bahan Ajar: Bank Soal & Direct PDF Upload */}
                                                                <div className="pt-1.5 border-t border-slate-200/80 space-y-1.5">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold uppercase mb-0.5 text-slate-600">
                                                                                Pilih Materi Dari Bank Soal
                                                                            </label>
                                                                            <select
                                                                                value={s.question_id}
                                                                                onChange={(e) => updateSession(s._uid, { question_id: e.target.value })}
                                                                                className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-xs text-deep-twilight outline-none cursor-pointer"
                                                                            >
                                                                                <option value="">-- Tanpa Bahan Ajar / Pilih Nanti --</option>
                                                                                {materialsList.map((m) => (
                                                                                    <option key={m.id} value={m.id}>
                                                                                        {m.title || m.nama_materi || `Materi #${m.id}`}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center justify-between mb-0.5">
                                                                                <label className="block text-[9px] font-bold uppercase text-slate-600">
                                                                                    Atau Upload PDF Langsung
                                                                                </label>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => updateSession(s._uid, { show_pdf_upload: !s.show_pdf_upload })}
                                                                                    className="text-[9px] text-french-blue hover:underline cursor-pointer font-semibold"
                                                                                >
                                                                                    {s.show_pdf_upload ? "Tutup Upload" : "+ Upload PDF"}
                                                                                </button>
                                                                            </div>

                                                                            {s.show_pdf_upload && (
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf"
                                                                                        onChange={(e) => onFileChange(e, s)}
                                                                                        className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-french-blue/10 file:text-french-blue hover:file:bg-french-blue/20 cursor-pointer"
                                                                                    />
                                                                                    {s.pdf_name && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => clearSessionPdf(s)}
                                                                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                                                                            title="Hapus file terpilih"
                                                                                        >
                                                                                            &times;
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {s.pdf_name && !s.show_pdf_upload && (
                                                                                <div className="text-[10px] text-slate-800 flex items-center justify-between bg-slate-200/80 px-2 py-0.5 rounded font-medium border border-slate-300">
                                                                                    <span className="truncate">📎 {s.pdf_name}</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => clearSessionPdf(s)}
                                                                                        className="text-red-500 font-bold ml-1"
                                                                                    >
                                                                                        &times;
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Catatan Sesi */}
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            value={s.notes}
                                                                            onChange={(e) => updateSession(s._uid, { notes: e.target.value })}
                                                                            placeholder="Catatan sesi (opsional)"
                                                                            className="w-full px-2 py-1 rounded-lg border border-light-cyan bg-white text-[11px] text-deep-twilight outline-none placeholder:text-gray-400"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Tombol Tambah Pekan Baru */}
                                {canAddMorePekan && (
                                    <div className="pt-1 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={addNextPekan}
                                            className="py-1.5 px-4 rounded-xl border-2 border-dashed border-french-blue hover:border-french-blue/80 bg-white hover:bg-french-blue/5 text-french-blue text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                        >
                                            <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>Tambah Pekan {nextPekanNumber}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Action Submit Modal */}
                            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-light-cyan/60">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-3.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || (!modalForm.is_edit && Boolean(modalForm.teacher_id) && isAllWeeksPlottedFor(modalForm.teacher_id, modalForm.month, modalForm.year)) || unplottedSessionsCount === 0}
                                    className="px-4 py-1.5 bg-bright-teal text-white text-xs font-bold rounded-xl hover:bg-blue-green transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    {processing && (
                                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                    )}
                                    <span>{processing ? 'Menyimpan...' : (modalForm.is_edit ? 'Simpan Perubahan' : 'Simpan Ploting')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL SESI PEKAN (BENTUK KANAN - KIRI) */}
            {showDetailModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight/50 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDetailModal(false);
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-light-cyan max-w-2xl w-full p-4 sm:p-5">
                        <div className="flex items-center justify-between border-b border-light-cyan/60 pb-2 mb-3">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-french-blue text-white text-sm font-semibold flex items-center justify-center shrink-0">
                                    P{selectedWeekDetail?.pekan || 1}
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-deep-twilight">
                                        {selectedWeekDetail?.teacherName}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-normal mt-0.5">
                                        Detail Sesi Mengajar Pekan {selectedWeekDetail?.pekan}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailModal(false)}
                                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center font-bold cursor-pointer text-base"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Tampilan 2 Sesi Bersebelahan Kanan - Kiri */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Kolom Kiri: Sesi 1 */}
                            <div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between space-y-2.5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                                        <span className="text-xs text-french-blue font-semibold">Sesi 1</span>
                                        {selectedWeekDetail?.session1 ? (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-normal ${
                                                    selectedWeekDetail.session1.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                            >
                                                {selectedWeekDetail.session1.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic font-normal">Belum Ada Sesi 1</span>
                                        )}
                                    </div>

                                    {selectedWeekDetail?.session1 ? (
                                        <div className="space-y-1.5 text-[11px] font-normal">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Kelas:</span>
                                                <span className="text-deep-twilight font-normal">{selectedWeekDetail.session1.kelas || 'Semua Kelas'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Bidang:</span>
                                                <span className="text-deep-twilight font-normal">{selectedWeekDetail.session1.bidang || selectedWeekDetail.session1.mapel || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Waktu:</span>
                                                <span className="text-deep-twilight font-normal">⏰ {selectedWeekDetail.session1.session_time || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Tanggal:</span>
                                                <span className="text-deep-twilight font-normal">📅 {formatDate(selectedWeekDetail.session1.session_date || selectedWeekDetail.session1.tanggal)}</span>
                                            </div>

                                            <div className="pt-1 border-t border-slate-200/60">
                                                <span className="text-[10px] text-gray-500 block mb-0.5">Materi / Soal:</span>
                                                {selectedWeekDetail.session1.question || selectedWeekDetail.session1.material ? (
                                                    <p className="text-deep-twilight truncate font-normal" title={(selectedWeekDetail.session1.question || selectedWeekDetail.session1.material).title}>
                                                        📄 {(selectedWeekDetail.session1.question || selectedWeekDetail.session1.material).title}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic text-[10px]">Belum ada materi terlampir</p>
                                                )}
                                            </div>

                                            {(selectedWeekDetail.session1.notes || selectedWeekDetail.session1.catatan) && (
                                                <div className="pt-1 border-t border-slate-200/60 text-[10px] text-slate-600 font-normal">
                                                    <span className="text-slate-600 block">Catatan:</span>
                                                    {selectedWeekDetail.session1.notes || selectedWeekDetail.session1.catatan}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center text-gray-400 italic text-[11px] font-normal">
                                            Sesi 1 belum dijadwalkan pada pekan ini.
                                        </div>
                                    )}
                                </div>

                                {selectedWeekDetail?.session1 && (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                                        <button
                                            type="button"
                                            onClick={() => deleteFromDetail(selectedWeekDetail.session1)}
                                            className="text-[10px] font-normal text-red-500 hover:text-red-700 cursor-pointer"
                                        >
                                            Hapus Sesi 1
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editFromDetail(selectedWeekDetail.teacher, selectedWeekDetail.pekan, selectedWeekDetail.session1)}
                                            className="px-2.5 py-1 bg-bright-teal text-white text-[10px] font-normal rounded-lg hover:bg-blue-green transition-colors cursor-pointer"
                                        >
                                            Ubah Sesi 1
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Kolom Kanan: Sesi 2 */}
                            <div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between space-y-2.5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                                        <span className="text-xs text-french-blue font-semibold">Sesi 2</span>
                                        {selectedWeekDetail?.session2 ? (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-normal ${
                                                    selectedWeekDetail.session2.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                            >
                                                {selectedWeekDetail.session2.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic font-normal">Belum Ada Sesi 2</span>
                                        )}
                                    </div>

                                    {selectedWeekDetail?.session2 ? (
                                        <div className="space-y-1.5 text-[11px] font-normal">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Kelas:</span>
                                                <span className="text-deep-twilight font-normal">{selectedWeekDetail.session2.kelas || 'Semua Kelas'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Bidang:</span>
                                                <span className="text-deep-twilight font-normal">{selectedWeekDetail.session2.bidang || selectedWeekDetail.session2.mapel || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Waktu:</span>
                                                <span className="text-deep-twilight font-normal">⏰ {selectedWeekDetail.session2.session_time || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Tanggal:</span>
                                                <span className="text-deep-twilight font-normal">📅 {formatDate(selectedWeekDetail.session2.session_date || selectedWeekDetail.session2.tanggal)}</span>
                                            </div>

                                            <div className="pt-1 border-t border-slate-200/60">
                                                <span className="text-[10px] text-gray-500 block mb-0.5">Materi / Soal:</span>
                                                {selectedWeekDetail.session2.question || selectedWeekDetail.session2.material ? (
                                                    <p className="text-deep-twilight truncate font-normal" title={(selectedWeekDetail.session2.question || selectedWeekDetail.session2.material).title}>
                                                        📄 {(selectedWeekDetail.session2.question || selectedWeekDetail.session2.material).title}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic text-[10px]">Belum ada materi terlampir</p>
                                                )}
                                            </div>

                                            {(selectedWeekDetail.session2.notes || selectedWeekDetail.session2.catatan) && (
                                                <div className="pt-1 border-t border-slate-200/60 text-[10px] text-slate-600 font-normal">
                                                    <span className="text-slate-600 block">Catatan:</span>
                                                    {selectedWeekDetail.session2.notes || selectedWeekDetail.session2.catatan}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center text-gray-400 italic text-[11px] font-normal">
                                            Sesi 2 belum dijadwalkan pada pekan ini.
                                        </div>
                                    )}
                                </div>

                                {selectedWeekDetail?.session2 && (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                                        <button
                                            type="button"
                                            onClick={() => deleteFromDetail(selectedWeekDetail.session2)}
                                            className="text-[10px] font-normal text-red-500 hover:text-red-700 cursor-pointer"
                                        >
                                            Hapus Sesi 2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editFromDetail(selectedWeekDetail.teacher, selectedWeekDetail.pekan, selectedWeekDetail.session2)}
                                            className="px-2.5 py-1 bg-bright-teal text-white text-[10px] font-normal rounded-lg hover:bg-blue-green transition-colors cursor-pointer"
                                        >
                                            Ubah Sesi 2
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-3 mt-3 border-t border-light-cyan/60">
                            <button
                                type="button"
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
