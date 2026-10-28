import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEvent } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Input from '@/Components/ui/input';
import PasswordInput from '@/Components/PasswordInput';
import InputError from '@/Components/InputError';
import { type PageProps } from '@/types';

export default function Edit({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<PageProps>().props;

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const {
        data: passwordData,
        setData: setPasswordData,
        put: putPassword,
        processing: processingPassword,
        errors: passwordErrors,
        recentlySuccessful: passwordRecentlySuccessful,
        reset: resetPassword,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        putPassword(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => resetPassword(),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profil Saya" />

            <div className="mx-auto max-w-3xl space-y-6 py-6">
                <div>
                    <h1 className="page-title">Profil Saya</h1>
                    <p className="page-subtitle">Perbarui informasi akun dan kata sandi Anda</p>
                </div>

                {/* Informasi Akun */}
                <section className="card-modern">
                    <div className="mb-5 flex items-center gap-2">
                        <Icon icon="lucide:user-round" className="text-[18px] text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-900">Informasi Akun</h2>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                Email Anda belum diverifikasi.
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="ml-1 font-semibold underline hover:no-underline"
                                >
                                    Kirim ulang tautan verifikasi
                                </Link>
                            </div>
                        )}

                        {status === 'verification-link-sent' && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                <Icon icon="lucide:check-circle-2" className="text-[16px]" /> Tautan verifikasi telah dikirim ke email Anda.
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" className="btn-primary" disabled={processing}>
                                {processing && <Icon icon="lucide:loader-2" className="animate-spin text-[16px]" />}
                                Simpan Perubahan
                            </button>
                            {recentlySuccessful && <span className="text-sm font-medium text-emerald-600">Tersimpan</span>}
                        </div>
                    </form>
                </section>

                {/* Ubah Kata Sandi */}
                <section id="ubah-kata-sandi" className="card-modern scroll-mt-24">
                    <div className="mb-5 flex items-center gap-2">
                        <Icon icon="lucide:lock" className="text-[18px] text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-900">Ubah Kata Sandi</h2>
                    </div>
                    <form onSubmit={submitPassword} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Kata Sandi Saat Ini</label>
                            <PasswordInput
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData('current_password', e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <InputError message={passwordErrors.current_password} className="mt-2" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
                            <PasswordInput
                                value={passwordData.password}
                                onChange={(e) => setPasswordData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                autoComplete="new-password"
                                required
                            />
                            <InputError message={passwordErrors.password} className="mt-2" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi</label>
                            <PasswordInput
                                value={passwordData.password_confirmation}
                                onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                placeholder="Ulangi kata sandi baru"
                                autoComplete="new-password"
                                required
                            />
                            <InputError message={passwordErrors.password_confirmation} className="mt-2" />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" className="btn-primary" disabled={processingPassword}>
                                {processingPassword && <Icon icon="lucide:loader-2" className="animate-spin text-[16px]" />}
                                Perbarui Kata Sandi
                            </button>
                            {passwordRecentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-600">Kata sandi diperbarui</span>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
