import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';

interface Props {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk ke Sistem" />

            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Selamat Datang Kembali</h2>
                <p className="text-xs text-gray-500 mt-1">
                    Silakan masukkan email dan kata sandi akun administrator Anda
                </p>
            </div>

            {status && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700 flex items-center gap-2">
                    <Icon icon="lucide:check-circle" className="text-emerald-500 text-base" />
                    <span>{status}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Alamat Email"
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    placeholder="admin@siguru.com"
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                />

                <Input
                    label="Kata Sandi"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />

                <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4"
                        />
                        <span className="text-gray-600 font-medium">Ingat saya</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                        >
                            Lupa kata sandi?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        processing={processing}
                        className="w-full justify-center py-2.5"
                    >
                        <Icon icon="lucide:log-in" className="text-base" />
                        <span>Masuk ke Akun</span>
                    </Button>
                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" />
                        <span>Kembali ke Beranda</span>
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
