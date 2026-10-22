import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword?: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Masuk — SIGURU" />

            <div className="mb-7">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[11px] font-bold tracking-[0.06em] uppercase shadow-brand">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Akses Aman
                </div>
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-slate-900 leading-none mt-4">
                    Masuk ke <span className="text-brand-gradient">SIGURU</span>
                </h1>
                <p className="text-[13.5px] leading-5 text-slate-500 mt-2.5 font-medium">Gunakan email & kata sandi yang terdaftar. Hubungi admin jika belum memiliki akun.</p>
            </div>

            {status && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[13px] font-semibold text-emerald-800 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(16,185,129,0.6)]"><Icon icon="lucide:check" /></span>
                    <span className="leading-5">{status}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Alamat Email"
                    id="email"
                    type="email"
                    value={data.email}
                    placeholder="nama@kpm-pusat.id"
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                    icon={<Icon icon="lucide:mail" className="text-[16px]" />}
                />

                <Input
                    label="Kata Sandi"
                    id="password"
                    type="password"
                    value={data.password}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                    icon={<Icon icon="lucide:lock" className="text-[16px]" />}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group min-h-[40px]">
                        <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/25" />
                        <span className="text-[13px] font-semibold tracking-[-0.01em] text-slate-600 group-hover:text-indigo-700 transition-colors">Ingat saya</span>
                    </label>
                    {canResetPassword && (
                        <Link href={route('password.request')} className="inline-flex items-center min-h-[40px] text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200 hover:decoration-indigo-400 transition-colors">
                            Lupa kata sandi?
                        </Link>
                    )}
                </div>

                <Button type="submit" processing={processing} className="w-full justify-center py-3.5 text-[14px]">
                    <Icon icon="lucide:log-in" className="text-[18px]" /> Masuk Sekarang
                </Button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                    <div className="relative flex justify-center"><span className="px-3 bg-white text-[11px] font-bold tracking-[0.08em] uppercase text-slate-400">Atau</span></div>
                </div>

                <Link href="/" className="flex items-center justify-center gap-2 w-full min-h-[44px] py-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-[13px] font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm transition-all">
                    <Icon icon="lucide:arrow-left" /> Kembali ke Beranda
                </Link>

                <p className="text-center text-[11px] leading-4 text-slate-400 font-medium pt-2">
                    Dengan masuk, Anda menyetujui pengelolaan data sesuai kebijakan internal KPM Pusat.
                </p>
            </form>
        </GuestLayout>
    );
}
