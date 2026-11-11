import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import React, { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import YearPicker from '@/Components/YearPicker';
import { Grade, Guru, PageProps, Program } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProfileEditProps {
    mustVerifyEmail: boolean;
    status?: string;
    guru?: Guru | null;
    grades?: Grade[];
    programs?: Program[];
    fotoUrl?: string | null;
}

interface RiwayatMengajarRow {
    instansi: string;
    tahun_mulai: string;
    tahun_selesai: string;
    is_current: boolean;
}

const parseRiwayatMengajarItem = (raw: string): RiwayatMengajarRow => {
    if (!raw || typeof raw !== 'string') {
        return { instansi: '', tahun_mulai: '', tahun_selesai: '', is_current: false };
    }
    const trimmed = raw.trim();
    if (!trimmed) {
        return { instansi: '', tahun_mulai: '', tahun_selesai: '', is_current: false };
    }

    const rangeRegex = /^(\d{4})\s*(?:[–\-—]|s\/?d|to)\s*(\d{4}|sekarang|skrg|present)?\s*(?:[–\-—:]\s*)?(.*)$/i;
    const match = trimmed.match(rangeRegex);

    if (match) {
        const start = match[1] || '';
        const rawEnd = (match[2] || '').toLowerCase();
        const isCurrent = rawEnd === 'sekarang' || rawEnd === 'skrg' || rawEnd === 'present';
        const end = isCurrent ? 'sekarang' : rawEnd.match(/^\d{4}$/) ? rawEnd : '';
        const instansi = (match[3] || '').trim().replace(/^[–\-—:\s]+/, '');

        return {
            instansi: instansi || '',
            tahun_mulai: start,
            tahun_selesai: end,
            is_current: isCurrent,
        };
    }

    const singleYearRegex = /^(\d{4})\s*(?:[–\-—:]\s*)?(.*)$/;
    const singleMatch = trimmed.match(singleYearRegex);
    if (singleMatch) {
        return {
            instansi: (singleMatch[2] || '').replace(/^[–\-—:\s]+/, '').trim(),
            tahun_mulai: singleMatch[1],
            tahun_selesai: '',
            is_current: false,
        };
    }

    return {
        instansi: trimmed,
        tahun_mulai: '',
        tahun_selesai: '',
        is_current: false,
    };
};

const formatRiwayatMengajarItem = (item: RiwayatMengajarRow): string => {
    const instansi = (item.instansi || '').trim();
    const start = item.tahun_mulai ? String(item.tahun_mulai).trim() : '';
    const isCurrent = item.is_current || String(item.tahun_selesai).toLowerCase() === 'sekarang';
    const end = isCurrent ? 'sekarang' : (item.tahun_selesai ? String(item.tahun_selesai).trim() : '');

    let period = '';
    if (start && end) {
        period = `${start}–${end}`;
    } else if (start) {
        period = `${start}`;
    } else if (end) {
        period = `${end}`;
    }

    if (period && instansi) {
        return `${period} — ${instansi}`;
    }
    return instansi || period || '';
};

export default function Edit({
    mustVerifyEmail,
    status,
    guru,
    grades = [],
    programs = [],
    fotoUrl = null,
}: ProfileEditProps) {
    const { auth } = usePage<PageProps>().props;
    const isGuru = Boolean(guru);
    const currentYear = new Date().getFullYear();

    // Parse Riwayat Pendidikan (array of strings)
    const initialRiwayatPendidikan = useMemo(() => {
        const raw = guru?.riwayat_pendidikan;
        if (!raw) return [''];
        if (Array.isArray(raw)) return raw.length ? raw : [''];
        const lines = String(raw).split('\n').map((s) => s.trim()).filter(Boolean);
        return lines.length ? lines : [''];
    }, [guru?.riwayat_pendidikan]);

    const [riwayatPendidikanList, setRiwayatPendidikanList] = useState<string[]>(initialRiwayatPendidikan);

    // Parse Riwayat Mengajar (array of structured rows)
    const initialRiwayatMengajar = useMemo(() => {
        const raw = guru?.riwayat_mengajar || guru?.keterangan_mengajar;
        if (!raw) return [{ instansi: '', tahun_mulai: '', tahun_selesai: '', is_current: false }];
        const lines = (Array.isArray(raw) ? raw : String(raw).split('\n')).map((s) => s.trim()).filter(Boolean);
        return lines.length
            ? lines.map(parseRiwayatMengajarItem)
            : [{ instansi: '', tahun_mulai: '', tahun_selesai: '', is_current: false }];
    }, [guru?.riwayat_mengajar, guru?.keterangan_mengajar]);

    const [riwayatMengajarRows, setRiwayatMengajarRows] = useState<RiwayatMengajarRow[]>(initialRiwayatMengajar);

// Hitung lama mengajar dari Tanggal Bergabung di KPM hingga saat ini
// Format: "20 hari" jika < 1 bulan, "1 bulan" jika sebulan, "1 tahun 2 bulan", "2 tahun", dst.
function calculateLamaMengajar(tanggalStr: string | null | undefined): { text: string; years: number } {
    if (!tanggalStr) {
        return { text: 'Belum diisi', years: 0 };
    }

    const parts = String(tanggalStr).split('T')[0].split('-');
    if (parts.length < 3) {
        return { text: 'Belum diisi', years: 0 };
    }

    const startYear = parseInt(parts[0], 10);
    const startMonth = parseInt(parts[1], 10) - 1;
    const startDay = parseInt(parts[2], 10);

    const startDate = new Date(startYear, startMonth, startDay);
    if (isNaN(startDate.getTime())) {
        return { text: 'Belum diisi', years: 0 };
    }

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDay = now.getDate();

    const today = new Date(curYear, curMonth, curDay);
    if (startDate > today) {
        return { text: '0 hari', years: 0 };
    }

    let years = curYear - startYear;
    let months = curMonth - startMonth;
    let days = curDay - startDay;

    if (days < 0) {
        months--;
        const prevMonthDays = new Date(curYear, curMonth, 0).getDate();
        days += prevMonthDays;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    let text = '';
    if (years > 0) {
        if (months > 0) {
            text = `${years} tahun ${months} bulan`;
        } else {
            text = `${years} tahun`;
        }
    } else if (months > 0) {
        if (days > 0) {
            text = `${months} bulan ${days} hari`;
        } else {
            text = `${months} bulan`;
        }
    } else {
        text = `${Math.max(0, days)} hari`;
    }

    return { text, years: Math.max(0, years) };
}

    const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm({
        name: auth.user.name || '',
        email: auth.user.email || '',
        password: '',
        password_confirmation: '',
        mapel: (guru?.mapel ?? 'IPA') as 'IPA' | 'MTK',
        program_ids: (guru?.programs ?? []).map((p) => p.id),
        jenjang: guru?.jenjang || '',
        domisili: guru?.domisili || '',
        alamat: guru?.alamat || '',
        tanggal_bergabung: guru?.tanggal_bergabung ? guru.tanggal_bergabung.substring(0, 10) : '',
        pelatihan_suprarasional:
            guru?.pelatihan_suprarasional == null ? '' : guru.pelatihan_suprarasional ? '1' : '0',
        nomor_telepon: guru?.nomor_telepon || '',
        bank: guru?.bank || '',
        nomor_rekening: guru?.nomor_rekening || '',
        foto: null as File | null,
    });

    const lamaMengajarInfo = useMemo(() => {
        return calculateLamaMengajar(data.tanggal_bergabung);
    }, [data.tanggal_bergabung]);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fotoLoadError, setFotoLoadError] = useState(false);
    const fotoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!data.foto) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(data.foto);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [data.foto]);

    useEffect(() => {
        setFotoLoadError(false);
    }, [fotoUrl]);

    const initials = (guru?.nama || auth.user.name || 'G')
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const activeFoto = previewUrl ?? (fotoLoadError ? null : fotoUrl);

    const toggleProgram = (id: number) => {
        setData(
            'program_ids',
            data.program_ids.includes(id)
                ? data.program_ids.filter((p) => p !== id)
                : [...data.program_ids, id]
        );
    };

    const triggerFoto = () => fotoInputRef.current?.click();

    const onFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('foto', file);
            setFotoLoadError(false);
        }
        e.target.value = '';
    };

    const clearFoto = () => {
        setData('foto', null);
    };

    // Riwayat Pendidikan handlers
    const addRiwayatPendidikan = () => {
        setRiwayatPendidikanList([...riwayatPendidikanList, '']);
    };

    const updateRiwayatPendidikan = (index: number, val: string) => {
        const updated = [...riwayatPendidikanList];
        updated[index] = val;
        setRiwayatPendidikanList(updated);
    };

    const removeRiwayatPendidikan = (index: number) => {
        if (riwayatPendidikanList.length > 1) {
            setRiwayatPendidikanList(riwayatPendidikanList.filter((_, i) => i !== index));
        }
    };

    // Riwayat Mengajar handlers
    const addRiwayatMengajar = () => {
        setRiwayatMengajarRows((prev) => [
            ...prev,
            { instansi: '', tahun_mulai: '', tahun_selesai: '', is_current: false },
        ]);
    };

    const updateRiwayatMengajar = (
        index: number,
        updates: Partial<RiwayatMengajarRow> | keyof RiwayatMengajarRow,
        val?: any
    ) => {
        setRiwayatMengajarRows((prev) => {
            const next = [...prev];
            if (!next[index]) return prev;
            if (typeof updates === 'string') {
                next[index] = { ...next[index], [updates]: val };
            } else {
                next[index] = { ...next[index], ...updates };
            }
            return next;
        });
    };

    const removeRiwayatMengajar = (index: number) => {
        setRiwayatMengajarRows((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const cleanPendidikan = riwayatPendidikanList.map((s) => s.trim()).filter(Boolean);
        const cleanMengajar = riwayatMengajarRows
            .map(formatRiwayatMengajarItem)
            .map((s) => s.trim())
            .filter(Boolean);

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        if (data.password) {
            formData.append('password', data.password);
            formData.append('password_confirmation', data.password_confirmation);
        }

        if (isGuru) {
            formData.append('mapel', data.mapel);
            data.program_ids.forEach((pid) => {
                formData.append('program_ids[]', String(pid));
            });
            formData.append('jenjang', data.jenjang);
            formData.append('domisili', data.domisili);
            formData.append('alamat', data.alamat);
            formData.append('tanggal_bergabung', data.tanggal_bergabung);
            formData.append('pelatihan_suprarasional', data.pelatihan_suprarasional);
            formData.append('nomor_telepon', data.nomor_telepon);
            formData.append('bank', data.bank);
            formData.append('nomor_rekening', data.nomor_rekening);
            formData.append('lama_mengajar', String(lamaMengajarInfo.years));

            cleanPendidikan.forEach((item) => {
                formData.append('riwayat_pendidikan[]', item);
            });
            cleanMengajar.forEach((item) => {
                formData.append('riwayat_mengajar[]', item);
            });

            if (data.foto) {
                formData.append('foto', data.foto);
            }
        }

        formData.append('_method', 'PATCH');

        router.post(route('profile.update'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('foto', 'password', 'password_confirmation');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profil & Biodata Guru" />

            <div className="w-full space-y-6 pb-12 animate-fade-in">
                {/* Flash Alert */}
                {recentlySuccessful && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">
                            ✓
                        </span>
                        <span>Profil berhasil diperbarui.</span>
                    </div>
                )}

                {/* Header Foto Profil & Ringkasan Akun Guru */}
                <div className="card-modern p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="relative group shrink-0">
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-2 border-indigo-200 shadow-sm flex items-center justify-center">
                                <span className="text-4xl font-extrabold text-indigo-600 select-none">{initials}</span>
                                {activeFoto && (
                                    <img
                                        src={activeFoto}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt="Foto Profil Guru"
                                        onError={() => setFotoLoadError(true)}
                                    />
                                )}
                            </div>
                            <button
                                onClick={triggerFoto}
                                type="button"
                                className="absolute -bottom-2 -right-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition cursor-pointer"
                                title="Ubah Foto Profil"
                            >
                                <Icon icon="tabler:camera" className="text-[14px]" />
                                <span>Foto</span>
                            </button>
                            <input
                                ref={fotoInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={onFotoChange}
                            />
                        </div>

                        <div className="flex-1 text-center md:text-left min-w-0">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                    {guru?.nama || auth.user.name}
                                </h2>
                                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold border border-indigo-200">
                                    {isGuru
                                        ? `Guru ${data.mapel === 'MTK' ? 'Matematika' : 'IPA'}`
                                        : 'Administrator'}
                                </span>
                                {isGuru && guru?.grade && (
                                    <span className="px-2.5 py-0.5 bg-violet-100 text-violet-800 rounded-full text-xs font-bold border border-violet-200">
                                        Grade {guru.grade.kode_grade}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                {auth.user.email}
                                {auth.user.username && (
                                    <span className="text-slate-400"> • @{auth.user.username}</span>
                                )}
                            </p>

                            {/* Info Kartu Biodata Ringkas */}
                            {isGuru && (
                                <div className="mt-3.5 flex flex-wrap justify-center md:justify-start gap-2">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold">
                                        Bidang: {data.mapel === 'MTK' ? 'Matematika' : 'IPA'}
                                    </span>
                                    {guru?.grade && (
                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold">
                                            Honor: {formatCurrency(guru.grade.honor_per_sesi)}/sesi
                                        </span>
                                    )}
                                    {data.domisili && (
                                        <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold">
                                            Domisili: {data.domisili}
                                        </span>
                                    )}
                                </div>
                            )}

                            {previewUrl && (
                                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="text-xs text-emerald-600 font-semibold">
                                        ✓ Foto baru dipilih — klik Simpan untuk menerapkan
                                    </span>
                                    <button
                                        onClick={clearFoto}
                                        type="button"
                                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                                    >
                                        Batalkan Pilihan Foto
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">JPG, PNG, atau WEBP, maksimal 5 MB.</p>
                        </div>
                    </div>
                </div>

                {/* Form Profil Guru: SATU CONTAINER TUNGGAL */}
                <form
                    onSubmit={submit}
                    className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-8"
                >
                    {/* BAGIAN 1: DATA UTAMA GURU & PENGAJARAN (Tanpa Bullet, Tanpa Ikon) */}
                    {isGuru && (
                        <div className="space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Data Utama Guru &amp; Pengajaran
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Identitas guru, mata pelajaran, penugasan kelas, dan domisili
                                </p>
                            </div>

                            {/* Baris 1: Nama Lengkap & Grade Honorarium */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Nama Lengkap &amp; Gelar *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nama lengkap beserta gelar akademik"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                    />
                                    {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-gray-700 uppercase">
                                            Grade Honorarium
                                        </label>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                            Terkunci Resmi
                                        </span>
                                    </div>
                                    <input
                                        disabled
                                        type="text"
                                        value={
                                            guru?.grade
                                                ? `Grade ${guru.grade.kode_grade} (${formatCurrency(guru.grade.honor_per_sesi)}/sesi)`
                                                : 'Grade Belum Ditetapkan'
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 font-bold text-sm cursor-not-allowed select-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Grade honorarium hanya dapat diubah oleh admin SiGuru.
                                    </p>
                                </div>
                            </div>

                            {/* Baris 2: Mata Pelajaran & Jenis Kelas (Checklist Semua Program di SiGuru) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Mata Pelajaran *
                                    </label>
                                    <select
                                        required
                                        value={data.mapel}
                                        onChange={(e) => setData('mapel', e.target.value as 'IPA' | 'MTK')}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer font-medium transition bg-white"
                                    >
                                        <option value="IPA">IPA (Ilmu Pengetahuan Alam)</option>
                                        <option value="MTK">MTK (Matematika)</option>
                                    </select>
                                    {errors.mapel && <p className="text-xs text-rose-500 mt-1">{errors.mapel}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Jenis Kelas
                                    </label>
                                    <div className="flex flex-wrap gap-2 pt-0.5">
                                        {programs.map((p) => {
                                            const active = data.program_ids.includes(p.id);
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => toggleProgram(p.id)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                        active
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                                                    }`}
                                                >
                                                    {active && <Icon icon="tabler:check" className="text-xs" />}
                                                    {p.nama}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Pilih jenis kelas penugasan Anda (bisa lebih dari satu).
                                    </p>
                                </div>
                            </div>

                            {/* Baris 3: Kelas yang Diajar & Kota Domisili */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Kelas yang Diajar
                                    </label>
                                    <input
                                        type="text"
                                        value={data.jenjang}
                                        onChange={(e) => setData('jenjang', e.target.value)}
                                        placeholder="Contoh: SMP / SMA / KPM Pusat"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Grup kelas atau tingkatan yang Anda ajar.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Kota Domisili
                                    </label>
                                    <input
                                        type="text"
                                        value={data.domisili}
                                        onChange={(e) => setData('domisili', e.target.value)}
                                        placeholder="Contoh: Bogor, Cibinong, Jakarta"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                    />
                                </div>
                            </div>

                            {/* Baris 4: Alamat Lengkap */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                    Alamat Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={data.alamat}
                                    onChange={(e) => setData('alamat', e.target.value)}
                                    placeholder="Contoh: Jl. Melati No. 12, RT 03/RW 05, Kec. Cibinong, Kab. Bogor"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                />
                            </div>

                            {/* Baris 5: Tanggal Bergabung, Suprarasional, Lama Mengajar */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Tanggal Bergabung
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tanggal_bergabung}
                                        onChange={(e) => setData('tanggal_bergabung', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Pelatihan Suprarasional
                                    </label>
                                    <select
                                        value={data.pelatihan_suprarasional}
                                        onChange={(e) => setData('pelatihan_suprarasional', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer font-medium transition bg-white"
                                    >
                                        <option value="">Belum diisi / Tidak</option>
                                        <option value="1">IYA (Pernah Ikut)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Lama Mengajar
                                    </label>
                                    <input
                                        disabled
                                        type="text"
                                        value={lamaMengajarInfo.text}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 font-bold text-sm cursor-not-allowed select-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Dikonversi otomatis dari tanggal bergabung di KPM hingga saat ini.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BAGIAN 2: RIWAYAT PENDIDIKAN & RIWAYAT MENGAJAR (Tanpa Bullet, Tanpa Ikon Judul, 2 Kolom Bersisian) */}
                    {isGuru && (
                        <div className="border-t border-gray-100 pt-6 space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Riwayat Pendidikan &amp; Pengalaman Mengajar
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Format input dinamis rapi (tidak full screen). Tambah baris baru menggunakan tombol tambah (+).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* KOLOM 1: RIWAYAT PENDIDIKAN */}
                                <div className="p-5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                                                Riwayat Pendidikan
                                            </label>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Contoh: <code>S1 Pendidikan IPA — UNJ</code>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addRiwayatPendidikan}
                                            className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                                        >
                                            <span>+ Tambah Baris</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {riwayatPendidikanList.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-6 text-center text-xs font-bold text-slate-400 font-mono shrink-0">
                                                    {idx + 1}.
                                                </span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateRiwayatPendidikan(idx, e.target.value)}
                                                    placeholder="Contoh: S1 Pendidikan IPA — UNJ"
                                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                                />
                                                {riwayatPendidikanList.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRiwayatPendidikan(idx)}
                                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                                                        title="Hapus baris ini"
                                                    >
                                                        <Icon icon="tabler:trash" className="text-[16px]" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-1 text-xs text-slate-400">
                                        <span>Tulis satu riwayat pendidikan per baris</span>
                                    </div>
                                </div>

                                {/* KOLOM 2: RIWAYAT MENGAJAR (Compact Horizontal Row) */}
                                <div className="p-5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                                                Riwayat Mengajar
                                            </label>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Instansi &amp; rentang periode mengajar
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addRiwayatMengajar}
                                            className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                                        >
                                            <span>+ Tambah Baris</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {riwayatMengajarRows.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-6 text-center text-xs font-bold text-slate-400 font-mono shrink-0">
                                                    {idx + 1}.
                                                </span>

                                                <input
                                                    type="text"
                                                    value={item.instansi}
                                                    onChange={(e) => updateRiwayatMengajar(idx, 'instansi', e.target.value)}
                                                    placeholder="Nama Instansi (contoh: SMPN 1 Bogor)"
                                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                                />

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="w-[90px] shrink-0">
                                                        <YearPicker
                                                            value={item.tahun_mulai}
                                                            onChange={(val) => updateRiwayatMengajar(idx, 'tahun_mulai', val)}
                                                            placeholder="Mulai"
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-bold select-none shrink-0">—</span>
                                                    <div className="w-[115px] shrink-0">
                                                        <YearPicker
                                                            value={item.tahun_selesai}
                                                            onChange={(val) => {
                                                                const isCur = String(val).toLowerCase() === 'sekarang';
                                                                updateRiwayatMengajar(idx, {
                                                                    tahun_selesai: isCur ? 'sekarang' : val,
                                                                    is_current: isCur,
                                                                });
                                                            }}
                                                            align="right"
                                                            allowCurrent
                                                            placeholder="Selesai"
                                                        />
                                                    </div>
                                                </div>

                                                {riwayatMengajarRows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRiwayatMengajar(idx)}
                                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                                                        title="Hapus baris ini"
                                                    >
                                                        <Icon icon="tabler:trash" className="text-[16px]" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-1 text-xs text-slate-400">
                                        <span>Tulis satu riwayat mengajar per baris (nama instansi &amp; rentang tahun)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Jika Non-Guru (Admin) */}
                    {!isGuru && (
                        <div className="space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Informasi Akun Administrator
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Nama lengkap &amp; alamat email login Anda</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Nama Lengkap *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                    />
                                    {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Email Login *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                    />
                                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BAGIAN 3: KONTAK & REKENING BANK (Tanpa Bullet, Tanpa Ikon) */}
                    <div className="border-t border-gray-100 pt-6 space-y-5">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Kontak &amp; Rekening Bank
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Surel login, nomor WhatsApp aktif, dan rekening penerimaan honor/payroll
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                    Nomor WhatsApp Aktif
                                </label>
                                <input
                                    type="text"
                                    value={data.nomor_telepon}
                                    onChange={(e) => setData('nomor_telepon', e.target.value)}
                                    placeholder="081234567890"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
                                />
                                <p className="text-xs text-gray-400 mt-1">Digunakan untuk koordinasi jadwal &amp; absensi kelas.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                    Email Login Akun *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama.guru@siguru.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
                                />
                                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        {isGuru && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-gray-700 uppercase">
                                            Tunjangan Khusus (IDR)
                                        </label>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                            Terkunci
                                        </span>
                                    </div>
                                    <input
                                        disabled
                                        type="text"
                                        value={formatCurrency(Number(guru?.tunjangan_khusus) || 0)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 font-mono font-bold text-sm cursor-not-allowed select-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Hanya admin SiGuru yang dapat mengubah nominal ini.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Bank
                                    </label>
                                    <input
                                        type="text"
                                        value={data.bank}
                                        onChange={(e) => setData('bank', e.target.value)}
                                        placeholder="Contoh: BCA, BSI, Mandiri, BRI"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Nomor Rekening
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nomor_rekening}
                                        onChange={(e) => setData('nomor_rekening', e.target.value)}
                                        placeholder="Nomor rekening bank Anda"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono font-medium transition"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BAGIAN 4: KEAMANAN & UBAH KATA SANDI (Tanpa Bullet, Tanpa Ikon) */}
                    <div className="border-t border-gray-100 pt-6 space-y-5">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Keamanan &amp; Kata Sandi Akun
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Kosongkan jika tidak ingin mengubah kata sandi Anda.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                    Kata Sandi Baru
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                />
                                {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                    Konfirmasi Kata Sandi Baru
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <Link
                            href={route('dashboard')}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-100 transition text-center cursor-pointer"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Icon icon="tabler:loader-2" className="text-[16px] animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="tabler:device-floppy" className="text-[16px]" />
                                    <span>Simpan</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
