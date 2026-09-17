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
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Reset Kata Sandi</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Masukkan alamat email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi akun Anda.
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

                <div className="pt-2">
                    <Button
                        type="submit"
                        processing={processing}
                        className="w-full justify-center py-2.5"
                    >
                        <Icon icon="lucide:mail" className="text-base" />
                        <span>Kirim Tautan Reset</span>
                    </Button>
                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                    <Link
                        href={route('login')}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" />
                        <span>Kembali ke halaman Masuk</span>
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
