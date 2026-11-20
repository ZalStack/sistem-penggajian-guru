import PasswordInput from '@/Components/PasswordInput';
import Button from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler, KeyboardEvent, useMemo, useRef, useState } from 'react';

interface TeacherAccount {
    id: number;
    name: string;
    email: string;
    role: string;
    is_admin: boolean;
    mapel: string;
    grade: string;
    jenjang: string;
    domisili: string;
    avatar: string;
}

export default function Login({
    status,
    canResetPassword,
    teachers = [],
}: {
    status?: string;
    canResetPassword?: boolean;
    teachers?: TeacherAccount[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<TeacherAccount | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const suggestionsContainerRef = useRef<HTMLDivElement>(null);

    const filteredTeachers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        return teachers
            .filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    (t.email && t.email.toLowerCase().includes(q))
            )
            .slice(0, 10);
    }, [search, teachers]);

    const scrollHighlightedIntoView = (index: number) => {
        requestAnimationFrame(() => {
            if (!suggestionsContainerRef.current) return;
            const items = suggestionsContainerRef.current.querySelectorAll('button');
            if (items[index]) {
                items[index].scrollIntoView({ block: 'nearest' });
            }
        });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const len = filteredTeachers.length;
        if (len === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = !isOpen ? 0 : (highlightedIndex + 1) % len;
            setIsOpen(true);
            setHighlightedIndex(next);
            scrollHighlightedIntoView(next);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = !isOpen ? len - 1 : (highlightedIndex - 1 + len) % len;
            setIsOpen(true);
            setHighlightedIndex(prev);
            scrollHighlightedIntoView(prev);
        } else if (e.key === 'Enter') {
            if (isOpen && highlightedIndex >= 0 && filteredTeachers[highlightedIndex]) {
                e.preventDefault();
                e.stopPropagation();
                handleSelectAccount(filteredTeachers[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setHighlightedIndex(-1);
        const q = val.trim().toLowerCase();
        if (q.length > 0) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
            setSelectedAccount(null);
        }

        setData('email', val);
    };

    const handleSelectAccount = (account: TeacherAccount) => {
        setSelectedAccount(account);
        setSearch(account.name);
        setData('email', account.email || account.name);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleClearSelection = () => {
        setSelectedAccount(null);
        setSearch('');
        setData('email', '');
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Masuk — SATU GURU" />

            <div className="mb-6">
                <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 leading-tight">
                    Masuk ke Akun Anda
                </h1>
                <p className="text-sm leading-5 text-slate-500 mt-1.5">
                    Pilih nama guru / akun Anda dan masukkan kata sandi.
                </p>
            </div>

            {status && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Icon icon="tabler:circle-check" className="text-[16px]" />
                    </span>
                    <span className="leading-5">{status}</span>
                </div>
            )}

            {errors.email && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-800 flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <Icon icon="tabler:alert-triangle" className="text-[16px]" />
                    </span>
                    <span className="leading-5">{errors.email}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4" autoComplete="off">
                {/* 1. Input Nama Guru / Email (Autocomplete) */}
                <div className="relative">
                    <label
                        htmlFor="email"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                        Nama Guru / Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Icon icon="tabler:user" className="text-[17px]" />
                        </div>
                        <input
                            id="teacher-search-box"
                            name="search_guru_query"
                            type="search"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                if (search.trim().length > 0) setIsOpen(true);
                            }}
                            placeholder="Ketik nama guru atau admin..."
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-form-type="other"
                            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-white"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base p-1 cursor-pointer"
                            >
                                &times;
                            </button>
                        )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {isOpen && filteredTeachers.length > 0 && (
                        <div
                            ref={suggestionsContainerRef}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto z-30 divide-y divide-slate-100"
                        >
                            {filteredTeachers.map((t, idx) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleSelectAccount(t)}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    className={`w-full text-left px-3.5 py-2.5 transition flex items-center justify-between gap-2 cursor-pointer ${
                                        highlightedIndex === idx ? 'bg-indigo-100/80 ring-1 ring-indigo-300' : 'hover:bg-indigo-50/70'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-slate-800 truncate flex items-center gap-2">
                                            <span>{t.name}</span>
                                            {!t.is_admin && t.grade && t.grade !== '-' && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shrink-0">
                                                    Grade {t.grade}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                            {t.is_admin ? (
                                                <span>Administrator Sistem &bull; {t.email}</span>
                                            ) : (
                                                <span>
                                                    {t.mapel} &bull; {t.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs shrink-0">
                                        {t.avatar || (t.is_admin ? '🛡️' : '👨‍🏫')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Auto-Filled Detail Pill (Muncul saat Guru dipilih) */}
                {selectedAccount && !selectedAccount.is_admin && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs gap-3">
                            <span className="text-indigo-700 font-medium text-[11px] shrink-0">
                                📧 Email Akun
                            </span>
                            <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] truncate">
                                {selectedAccount.email}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-indigo-700 font-medium text-[11px]">
                                📚 Bidang / Mapel
                            </span>
                            <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                                {selectedAccount.mapel || '-'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-indigo-700 font-medium text-[11px]">
                                🏅 Grade
                            </span>
                            <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                                {selectedAccount.grade || '-'}
                            </span>
                        </div>
                    </div>
                )}

                <div>
                    <PasswordInput
                        label="Kata Sandi"
                        id="password"
                        value={data.password}
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        required
                    />

                    {canResetPassword && (
                        <div className="mt-2 flex justify-end">
                            <Link
                                href={route('password.request')}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200 hover:decoration-indigo-400 transition-colors"
                            >
                                <Icon icon="tabler:key" className="text-[14px]" />
                                Lupa kata sandi?
                            </Link>
                        </div>
                    )}
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer group min-h-[36px]">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/25"
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-700 transition-colors">
                        Ingat saya di perangkat ini
                    </span>
                </label>

                <Button type="submit" processing={processing} className="w-full justify-center py-3 text-[14px]">
                    <Icon icon="tabler:login-2" className="text-[17px]" />
                    Masuk ke Dashboard
                </Button>
            </form>
        </GuestLayout>
    );
}
