import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent } from 'react';
import InputError from '@/Components/InputError';
import Input from '@/Components/ui/input';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('password.store'));
    };

    return (
        <>
            <Head title="Atur Ulang Kata Sandi" />

            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-brand">
                    <Icon icon="lucide:key-round" className="text-[20px]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Atur Ulang Kata Sandi</h1>
                    <p className="text-sm text-gray-500">Buat kata sandi baru untuk akun Anda</p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <input type="hidden" name="token" value={data.token} />

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="nama@satugurukpm.id"
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
                        required
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
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <button type="submit" className="btn-primary w-full" disabled={processing}>
                    {processing ? (
                        <Icon icon="lucide:loader-2" className="animate-spin text-[16px]" />
                    ) : (
                        <Icon icon="lucide:key-round" className="text-[16px]" />
                    )}
                    {processing ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </button>

                <div className="text-center text-sm text-gray-500">
                    <Link href={route('login')} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Kembali ke Halaman Masuk
                    </Link>
                </div>
            </form>
        </>
    );
}

ResetPassword.layout = (children: React.ReactNode) => <GuestLayout>{children}</GuestLayout>;
