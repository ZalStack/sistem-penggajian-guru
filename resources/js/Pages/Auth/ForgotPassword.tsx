import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent } from 'react';
import InputError from '@/Components/InputError';
import Input from '@/Components/ui/input';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Lupa Kata Sandi" />

            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-brand">
                    <Icon icon="lucide:key-round" className="text-[20px]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Lupa Kata Sandi</h1>
                    <p className="text-sm text-gray-500">Tautan atur ulang akan dikirim ke email Anda</p>
                </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                Masukkan email terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
            </div>

            {status && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="nama@satugurukpm.id"
                        icon={<Icon icon="lucide:mail" className="text-[16px]" />}
                        required
                        autoFocus
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
                    <PasswordInput
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi</label>
                    <PasswordInput
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <button type="submit" className="btn-primary w-full" disabled={processing}>
                    {processing ? (
                        <Icon icon="lucide:loader-2" className="animate-spin text-[16px]" />
                    ) : (
                        <Icon icon="lucide:mail" className="text-[16px]" />
                    )}
                    {processing ? 'Mengirim...' : 'Kirim Tautan Atur Ulang'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
                <Link href={route('login')} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500">
                    <Icon icon="lucide:arrow-left" className="text-[14px]" /> Kembali ke Halaman Masuk
                </Link>
            </div>
        </>
    );
}

ForgotPassword.layout = (children: React.ReactNode) => <GuestLayout>{children}</GuestLayout>;
