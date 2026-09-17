import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import { Head, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';
import { User } from '@/types';

interface ProfileProps {
    user: User;
}

export default function ProfileEdit({ user }: ProfileProps) {
    const {
        data: profileData,
        setData: setProfileData,
        put: putProfile,
        processing: profileProcessing,
        errors: profileErrors,
    } = useForm({
        name: user.name,
        email: user.email,
    });

    const {
        data: passwordData,
        setData: setPasswordData,
        put: putPassword,
        processing: passwordProcessing,
        errors: passwordErrors,
        reset: resetPassword,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updateProfile: FormEventHandler = (e) => {
        e.preventDefault();
        putProfile(route('profile.update'));
    };

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        putPassword(route('password.update'), {
            onSuccess: () => resetPassword(),
        });
    };

    const initials = user.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'AD';

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Profil" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan Akun</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Kelola profil administrator dan keamanan kata sandi akun Anda
                </p>
            </div>

            {/* Profile Header Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white font-bold text-xl flex items-center justify-center shadow-md">
                    {initials}
                </div>
                <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                        <Badge variant="purple">Administrator</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-2 flex items-center justify-center sm:justify-start gap-1">
                        <Icon icon="lucide:shield-check" className="text-emerald-500" />
                        Akses Penuh Pengelolaan Sistem Penggajian KPM Pusat
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information */}
                <Card
                    title="Informasi Profil"
                    description="Perbarui nama lengkap dan alamat email yang digunakan untuk masuk ke sistem"
                >
                    <form onSubmit={updateProfile} className="space-y-4 mt-2">
                        <Input
                            label="Nama Lengkap"
                            value={profileData.name}
                            onChange={(e) => setProfileData('name', e.target.value)}
                            error={profileErrors.name}
                            placeholder="Nama Lengkap Admin"
                            required
                        />
                        <Input
                            label="Alamat Email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData('email', e.target.value)}
                            error={profileErrors.email}
                            placeholder="admin@siguru.com"
                            required
                        />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" processing={profileProcessing}>
                                <Icon icon="lucide:save" className="text-base" />
                                <span>Simpan Profil</span>
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Password Update */}
                <Card
                    title="Ubah Kata Sandi"
                    description="Gunakan kombinasi minimal 8 karakter dengan angka dan simbol untuk keamanan maksimal"
                >
                    <form onSubmit={updatePassword} className="space-y-4 mt-2">
                        <Input
                            label="Kata Sandi Saat Ini"
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData('current_password', e.target.value)}
                            error={passwordErrors.current_password}
                            placeholder="••••••••"
                            required
                        />
                        <Input
                            label="Kata Sandi Baru"
                            type="password"
                            value={passwordData.password}
                            onChange={(e) => setPasswordData('password', e.target.value)}
                            error={passwordErrors.password}
                            placeholder="Minimal 8 karakter"
                            required
                        />
                        <Input
                            label="Ulangi Kata Sandi Baru"
                            type="password"
                            value={passwordData.password_confirmation}
                            onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                            error={passwordErrors.password_confirmation}
                            placeholder="••••••••"
                            required
                        />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" processing={passwordProcessing}>
                                <Icon icon="lucide:key-round" className="text-base" />
                                <span>Perbarui Sandi</span>
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
