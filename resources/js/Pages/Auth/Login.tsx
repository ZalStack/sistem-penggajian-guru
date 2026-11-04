import PasswordInput from '@/Components/PasswordInput';
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
            <Head title="Masuk — Satu Guru KPM" />

            <div className="mb-6">
                <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 leading-tight">
                    Masuk ke Akun Anda
                </h1>
                <p className="text-[13px] leading-5 text-slate-500 mt-1.5">
                    Gunakan email & kata sandi yang dibagikan admin.
                </p>
            </div>

            {status && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[13px] font-semibold text-emerald-800 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Icon icon="tabler:circle-check" className="text-[16px]" />
                    </span>
                    <span className="leading-5">{status}</span>
                </div>
            )}

            {errors.email && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[13px] font-semibold text-rose-800 flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <Icon icon="tabler:alert-triangle" className="text-[16px]" />
                    </span>
                    <span className="leading-5">{errors.email}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Alamat Email"
                    id="email"
                    type="email"
                    value={data.email}
                    placeholder="nama@kpm.id"
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    icon={<Icon icon="tabler:mail" className="text-[17px]" />}
                />

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
                                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200 hover:decoration-indigo-400 transition-colors"
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
                    <span className="text-[13px] font-medium text-slate-600 group-hover:text-indigo-700 transition-colors">Ingat saya di perangkat ini</span>
                </label>

                <Button type="submit" processing={processing} className="w-full justify-center py-3 text-[14px]">
                    <Icon icon="tabler:login" className="text-[18px]" /> Masuk
                </Button>

                <p className="text-center text-[11px] leading-4 text-slate-400 font-medium pt-1">
                    Belum punya akun? Hubungi admin KPM untuk mendapatkan akses.
                </p>
            </form>
        </GuestLayout>
    );
}
