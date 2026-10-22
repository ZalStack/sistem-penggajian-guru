import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Atur Ulang Kata Sandi" />

            <div className="mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-brand">
                    <Icon icon="lucide:key-round" className="text-white text-[21px]" />
                </div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-slate-900 mt-4">
                    Atur <span className="text-brand-gradient">Kata Sandi Baru</span>
                </h2>
                <p className="text-[13px] text-slate-500 mt-2 leading-5 font-medium">
                    Silakan buat kata sandi baru untuk mengamankan akun Anda
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Alamat Email"
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                    icon={<Icon icon="lucide:mail" className="text-base" />}
                />

                <Input
                    label="Kata Sandi Baru"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="new-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    placeholder="Minimal 8 karakter"
                    required
                    icon={<Icon icon="lucide:lock" className="text-base" />}
                />

                <Input
                    label="Konfirmasi Kata Sandi Baru"
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                    placeholder="••••••••"
                    required
                    icon={<Icon icon="lucide:lock-check" className="text-base" />}
                />

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
                    <Icon icon="lucide:shield-check" className="text-indigo-500 text-[16px] mt-0.5 shrink-0" />
                    <p className="text-[12px] leading-5 text-indigo-700/80 font-medium">
                        Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol agar kata sandi lebih kuat.
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        processing={processing}
                        className="w-full justify-center py-3.5 text-[14px]"
                    >
                        <Icon icon="lucide:key" className="text-base" />
                        <span>Simpan Kata Sandi Baru</span>
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
