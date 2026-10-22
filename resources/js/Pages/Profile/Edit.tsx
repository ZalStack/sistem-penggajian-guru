import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import Badge from '@/Components/ui/badge';
import { Head, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';
import { User, Guru } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProfileProps {
    user: User & { guru?: Guru | null };
    guru?: Guru | null;
    mustVerifyEmail?: boolean;
    status?: string;
}

export default function ProfileEdit({ user, guru: guruProp }: ProfileProps) {
    const guru = guruProp ?? user.guru ?? null;
    const isGuru = user.role === 'guru';

    const {
        data: profileData,
        setData: setProfileData,
        put: putProfile,
        processing: profileProcessing,
        errors: profileErrors,
    } = useForm({
        name: user.name,
        email: user.email,
        domisili: guru?.domisili ?? '',
        alamat: guru?.alamat ?? '',
        riwayat_pendidikan: guru?.riwayat_pendidikan ?? '',
        nomor_telepon: guru?.nomor_telepon ?? '',
        bank: guru?.bank ?? '',
        nomor_rekening: guru?.nomor_rekening ?? '',
        keterangan_mengajar: guru?.keterangan_mengajar ?? '',
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
        : isGuru ? 'GR' : 'AD';

    const bankOptions = [
        { value: 'BCA', label: 'BCA' },
        { value: 'BNI', label: 'BNI' },
        { value: 'BRI', label: 'BRI' },
        { value: 'Mandiri', label: 'Mandiri' },
        { value: 'BSI', label: 'BSI' },
        { value: 'Muamalat', label: 'Muamalat' },
        { value: 'BTN', label: 'BTN' },
        { value: 'CIMB Niaga', label: 'CIMB Niaga' },
        { value: 'Danamon', label: 'Danamon' },
        { value: 'Permata', label: 'Permata' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Profil" />

            <div className="animate-fade-in mb-6 sm:mb-8">
                <h1 className="page-title">Pengaturan Akun</h1>
                <p className="page-subtitle mt-1">
                    {isGuru
                        ? 'Kelola profil pribadi, domisili, kontak & rekening Anda'
                        : 'Kelola profil administrator dan keamanan kata sandi akun Anda'}
                </p>
            </div>

            {/* Header Profile Card */}
            <div className="card-modern-hover overflow-hidden mb-6">
                <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" />
                <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(99,102,241,0.6)] flex-shrink-0">
                        {initials}
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                            <h2 className="text-lg font-bold text-slate-900 truncate">{user.name}</h2>
                            <Badge variant={isGuru ? 'info' : 'purple'}>{isGuru ? 'Guru' : 'Administrator'}</Badge>
                            {isGuru && guru?.grade && <Badge variant="purple">Grade {guru.grade.kode_grade}</Badge>}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 break-all">{user.email}</p>
                        {isGuru ? (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <span className="inline-flex items-center gap-1.5 text-slate-600">
                                    <Icon icon="lucide:map-pin" className="text-indigo-500" /> {guru?.domisili || 'Domisili belum diisi'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-slate-600">
                                    <Icon icon="lucide:phone" className="text-indigo-500" /> {guru?.nomor_telepon || 'Nomor WA belum diisi'}
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 mt-2 flex items-center justify-center sm:justify-start gap-1">
                                <Icon icon="lucide:shield-check" className="text-emerald-500" />
                                Akses Penuh Pengelolaan Sistem Penggajian KPM Pusat
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profil Informasi */}
                <Card
                    title={isGuru ? 'Informasi Profil Guru' : 'Informasi Profil'}
                    description={
                        isGuru
                            ? 'Perbarui data pribadi, kontak, dan rekening Anda. Tunjangan khusus hanya Admin yang dapat mengubah.'
                            : 'Perbarui nama lengkap dan alamat email yang digunakan untuk masuk ke sistem'
                    }
                >
                    <form onSubmit={updateProfile} className="space-y-4 mt-2">
                        <Input
                            label="Nama Lengkap"
                            value={profileData.name}
                            onChange={(e) => setProfileData('name', e.target.value)}
                            error={profileErrors.name}
                            placeholder={isGuru ? 'Nama lengkap guru' : 'Nama Lengkap Admin'}
                            required
                        />
                        <Input
                            label="Alamat Email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData('email', e.target.value)}
                            error={profileErrors.email}
                            placeholder={isGuru ? 'guru@siguru.com' : 'admin@siguru.com'}
                            required
                        />

                        {isGuru && (
                            <>
                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <h4 className="section-title flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)] shrink-0">
                                            <Icon icon="lucide:map-pin" className="text-sm" />
                                        </span>
                                        Domisili & Kontak
                                    </h4>
                                    <Input
                                        label="Kota Domisili"
                                        value={profileData.domisili}
                                        onChange={(e) => setProfileData('domisili', e.target.value)}
                                        error={profileErrors.domisili}
                                        placeholder="Contoh: Jakarta Selatan, Bogor"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Alamat Lengkap
                                        </label>
                                        <textarea
                                            value={profileData.alamat}
                                            onChange={(e) => setProfileData('alamat', e.target.value)}
                                            placeholder="Contoh: Jl. Melati No. 12, RT 03/RW 05, Kec. Cibinong, Kab. Bogor"
                                            rows={2}
                                            className="input-modern resize-none"
                                        />
                                        {profileErrors.alamat && (
                                            <p className="text-xs text-rose-500 font-medium mt-1.5">{profileErrors.alamat}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Riwayat Pendidikan
                                        </label>
                                        <textarea
                                            value={profileData.riwayat_pendidikan}
                                            onChange={(e) => setProfileData('riwayat_pendidikan', e.target.value)}
                                            placeholder={'Contoh:\nS1 Pendidikan IPA — UNJ\nS2 Pendidikan Dasar — UI'}
                                            rows={3}
                                            className="input-modern resize-none leading-6"
                                        />
                                        {profileErrors.riwayat_pendidikan && (
                                            <p className="text-xs text-rose-500 font-medium mt-1.5">{profileErrors.riwayat_pendidikan}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">Tulis satu pendidikan per baris</p>
                                    </div>
                                    <Input
                                        label="Nomor WA"
                                        value={profileData.nomor_telepon}
                                        onChange={(e) => setProfileData('nomor_telepon', e.target.value)}
                                        error={profileErrors.nomor_telepon}
                                        placeholder="081234567890"
                                        hint="Gunakan angka, boleh diawali +62"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <h4 className="section-title flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)] shrink-0">
                                            <Icon icon="lucide:building-2" className="text-sm" />
                                        </span>
                                        Informasi Rekening
                                    </h4>

                                    {/* Tunjangan Khusus - READ ONLY untuk guru */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Tunjangan Khusus <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold ml-1">Hanya Admin</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={formatCurrency(Number(guru?.tunjangan_khusus ?? 0))}
                                                disabled
                                                className="input-modern bg-slate-50 text-slate-600 cursor-not-allowed pr-10"
                                            />
                                            <Icon
                                                icon="lucide:lock"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <Icon icon="lucide:shield-check" className="text-xs" /> Hanya Admin yang dapat mengubah nominal tunjangan khusus
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Select
                                            label="Bank"
                                            value={profileData.bank}
                                            onChange={(e) => setProfileData('bank', e.target.value)}
                                            options={bankOptions}
                                            placeholder="Pilih Bank"
                                            error={profileErrors.bank}
                                        />
                                        <Input
                                            label="Nomor Rekening"
                                            value={profileData.nomor_rekening}
                                            onChange={(e) => setProfileData('nomor_rekening', e.target.value)}
                                            error={profileErrors.nomor_rekening}
                                            placeholder="1234567890"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Keterangan Mengajar
                                    </label>
                                    <textarea
                                        value={profileData.keterangan_mengajar}
                                        onChange={(e) => setProfileData('keterangan_mengajar', e.target.value)}
                                        placeholder="Contoh: Mengajar IPA kelas 8-9, jadwal Senin & Rabu..."
                                        rows={3}
                                        className="input-modern resize-none"
                                    />
                                    {profileErrors.keterangan_mengajar && (
                                        <p className="text-xs text-rose-500 font-medium mt-1.5">{profileErrors.keterangan_mengajar}</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">Deskripsi singkat tugas mengajar Anda</p>
                                </div>
                            </>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                            <Button type="submit" processing={profileProcessing}>
                                <Icon icon="lucide:save" className="text-base" />
                                <span>Simpan Profil</span>
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="space-y-6">
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
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                                <Button type="submit" processing={passwordProcessing}>
                                    <Icon icon="lucide:key-round" className="text-base" />
                                    <span>Perbarui Sandi</span>
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {isGuru && guru && (
                        <Card title="Ringkasan Data Guru" description="Informasi yang terhubung dengan akun Anda">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</span>
                                    <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>{guru.mapel}</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Kelas yang Diajar</span>
                                    <span className="text-sm font-semibold text-slate-800">{guru.jenjang || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Grade</span>
                                    <span className="text-sm font-semibold text-slate-800">Grade {guru.grade?.kode_grade ?? '-'}</span>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                        <Icon icon="lucide:info" /> Catatan
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                        Untuk perubahan <b>Grade, Mata Pelajaran, Kelas yang Diajar & Tunjangan Khusus</b>, silakan hubungi Admin.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
