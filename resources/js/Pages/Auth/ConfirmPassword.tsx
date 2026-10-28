import { Head, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent } from 'react';
import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({ password: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('password.confirm'));
    };

    return (
        <>
            <Head title="Konfirmasi Kata Sandi" />

            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-brand">
                    <Icon icon="lucide:shield-check" className="text-[20px]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Konfirmasi Kata Sandi</h1>
                    <p className="text-sm text-gray-500">Sebelum melanjutkan, masukkan kata sandi Anda</p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Kata Sandi</label>
                    <PasswordInput
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Masukkan kata sandi Anda"
                        autoComplete="current-password"
                        required
                        autoFocus
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <button type="submit" className="btn-primary w-full" disabled={processing}>
                    {processing && <Icon icon="lucide:loader-2" className="animate-spin text-[16px]" />}
                    {processing ? 'Memverifikasi...' : 'Konfirmasi & Lanjutkan'}
                </button>
            </form>
        </>
    );
}

ConfirmPassword.layout = (children: React.ReactNode) => <GuestLayout>{children}</GuestLayout>;
