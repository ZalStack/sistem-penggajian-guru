import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';

interface Props {
    status?: string;
}

export default function ForgotPassword({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi" />

            <div className="mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-brand">
                    <Icon icon="lucide:mail-question" className="text-white text-[21px]" />
                </div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-slate-900 mt-4">
                    Lupa <span className="text-brand-gradient">Kata Sandi?</span>
                </h2>
                <p className="text-[13px] text-slate-500 mt-2 leading-5 font-medium">
                    Masukkan alamat email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi akun Anda.
                </p>
            </div>

            {status && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] font-semibold text-emerald-800 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(16,185,129,0.6)]">
                        <Icon icon="lucide:check" className="text-base" />
                    </span>
                    <span className="leading-5">{status}</span>
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
                    icon={<Icon icon="lucide:mail" className="text-base" />}
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        processing={processing}
                        className="w-full justify-center py-3.5 text-[14px]"
                    >
                        <Icon icon="lucide:send" className="text-base" />
                        <span>Kirim Tautan Reset</span>
                    </Button>
                </div>

                <div className="pt-4 border-t border-slate-200/70 text-center">
                    <Link
                        href={route('login')}
                        className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 rounded-xl text-[13px] font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" />
                        <span>Kembali ke halaman Masuk</span>
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
