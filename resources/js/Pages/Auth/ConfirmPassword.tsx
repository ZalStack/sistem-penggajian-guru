import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Konfirmasi Kata Sandi" />

            <div className="mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-brand">
                    <Icon icon="lucide:shield-check" className="text-white text-[21px]" />
                </div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-slate-900 mt-4">
                    Konfirmasi <span className="text-brand-gradient">Kata Sandi</span>
                </h2>
                <p className="text-[13px] text-slate-500 mt-2 leading-5 font-medium">
                    Ini adalah area aman aplikasi. Silakan konfirmasi kata sandi Anda sebelum melanjutkan.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Kata Sandi"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoFocus
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)}
                    error={errors.password}
                    icon={<Icon icon="lucide:lock" className="text-base" />}
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        processing={processing}
                        className="w-full justify-center py-3.5 text-[14px]"
                    >
                        <Icon icon="lucide:check-circle" className="text-base" />
                        <span>Konfirmasi</span>
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
