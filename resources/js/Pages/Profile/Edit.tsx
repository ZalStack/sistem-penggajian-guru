import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import PasswordInput from '@/Components/PasswordInput';
import InputError from '@/Components/InputError';
import { Grade, Guru, PageProps, Program } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProfileEditProps {
    mustVerifyEmail: boolean;
    status?: string;
    guru?: Guru | null;
    grades?: Grade[];
    programs?: Program[];
    fotoUrl?: string | null;
}

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

export default function Edit({
    mustVerifyEmail,
    status,
    guru,
    grades = [],
    programs = [],
    fotoUrl = null,
}: ProfileEditProps) {
    const { auth } = usePage<PageProps>().props;
    const isGuru = Boolean(guru);

    const { data, setData, patch, processing, errors, recentlySuccessful, reset } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        // Data guru — sama dengan form Data Guru (admin), kecuali grade & tunjangan
        mapel: (guru?.mapel ?? 'IPA') as 'IPA' | 'MTK',
        program_ids: (guru?.programs ?? []).map((p) => p.id),
        jenjang: guru?.jenjang || '',
        domisili: guru?.domisili || '',
        alamat: guru?.alamat || '',
        riwayat_pendidikan: guru?.riwayat_pendidikan || '',
        pendidikan_terakhir: guru?.pendidikan_terakhir || '',
        tanggal_bergabung: guru?.tanggal_bergabung ? guru.tanggal_bergabung.substring(0, 10) : '',
        lama_mengajar: (guru?.lama_mengajar ?? '') as string | number,
        riwayat_mengajar: guru?.riwayat_mengajar || '',
        nomor_telepon: guru?.nomor_telepon || '',
        bank: guru?.bank || '',
        nomor_rekening: guru?.nomor_rekening || '',
        keterangan_mengajar: guru?.keterangan_mengajar || '',
        foto: null as File | null,
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

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fotoLoadError, setFotoLoadError] = useState(false);
    const fotoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!data.foto) {
            setPreviewUrl(null);

            return;
        }

        const objectUrl = URL.createObjectURL(data.foto);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.foto]);

    useEffect(() => {
        setFotoLoadError(false);
    }, [fotoUrl]);

    const initials = (guru?.nama || auth.user.name || 'G')
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const activeFoto = previewUrl ?? (fotoLoadError ? null : fotoUrl);

    const gradeOptions = grades.map((g) => ({
        value: g.id,
        label: `Grade ${g.kode_grade} (${formatCurrency(g.honor_per_sesi)}/sesi)`,
    }));

    const toggleProgram = (id: number) => {
        setData(
            'program_ids',
            data.program_ids.includes(id)
                ? data.program_ids.filter((p) => p !== id)
                : [...data.program_ids, id]
        );
    };

    const pilihFoto = () => fotoInputRef.current?.click();

    const onFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData('foto', e.target.files?.[0] ?? null);
        setFotoLoadError(false);
        e.target.value = '';
    };

    const batalPilihFoto = () => setData('foto', null);

    const hapusFoto = () => {
        if (confirm(`Hapus foto profil "${guru?.nama ?? auth.user.name}"?`)) {
            setData('foto', null);
            router.delete(route('profile.foto.destroy'), { preserveScroll: true });
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => reset('foto'),
        });
    };

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        putPassword(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => resetPassword(),
        });
    };

    const verifikasiNotices = (
        <>
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
                    <Icon icon="tabler:circle-check" className="text-[16px]" /> Tautan verifikasi telah dikirim ke email Anda.
                </div>
            )}
        </>
    );

    const aksiSimpan = (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1">
            <Button type="submit" processing={processing} className="w-full sm:w-auto">
                <Icon icon="tabler:device-floppy" /> Simpan Perubahan
            </Button>
            {recentlySuccessful && (
                <span className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-emerald-600">
                    <Icon icon="tabler:circle-check" className="text-[16px]" /> Tersimpan
                </span>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Profil Saya" />

            <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
                <div>
                    <h1 className="page-title">Profil Saya</h1>
                    <p className="page-subtitle">
                        {isGuru
                            ? 'Perbarui foto, data mengajar, kontak, dan keamanan akun Anda'
                            : 'Perbarui informasi akun dan kata sandi Anda'}
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {isGuru && (
                        <>
                            {/* Foto Profil */}
                            <Card
                                title="Foto Profil"
                                description="Tampil di profil Anda & avatar sidebar — JPG, PNG, atau WEBP, maksimal 5 MB"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                                    <div className="relative shrink-0">
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/60 flex items-center justify-center text-white text-3xl font-extrabold ring-4 ring-white">
                                            {activeFoto ? (
                                                <img
                                                    src={activeFoto}
                                                    alt={`Foto ${guru?.nama ?? auth.user.name}`}
                                                    onError={() => setFotoLoadError(true)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <span className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600">
                                            <Icon icon="tabler:camera" className="text-[15px]" />
                                        </span>
                                    </div>

                                    <div className="w-full min-w-0 space-y-3">
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-bold text-slate-900 truncate">
                                                {guru?.nama ?? auth.user.name}
                                            </p>
                                            <p className="text-[12.5px] text-slate-500 truncate">{auth.user.email}</p>
                                            <span className="badge-base mt-1.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                                                <Icon icon="tabler:school" className="text-[12px]" />
                                                Guru {guru?.mapel === 'MTK' ? 'Matematika' : 'IPA'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button type="button" variant="secondary" size="sm" onClick={pilihFoto}>
                                                <Icon icon="tabler:photo-plus" /> {data.foto ? 'Ganti Foto' : 'Pilih Foto'}
                                            </Button>
                                            {data.foto && (
                                                <Button type="button" variant="ghost" size="sm" onClick={batalPilihFoto}>
                                                    <Icon icon="tabler:x" /> Batalkan Pilihan
                                                </Button>
                                            )}
                                            {fotoUrl && !data.foto && (
                                                <Button type="button" variant="danger" size="sm" onClick={hapusFoto}>
                                                    <Icon icon="tabler:trash" /> Hapus Foto
                                                </Button>
                                            )}
                                        </div>

                                        {data.foto ? (
                                            <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 break-all">
                                                <Icon icon="tabler:circle-check" className="text-[14px] shrink-0" />
                                                {data.foto.name} — klik &quot;Simpan Perubahan&quot; untuk mengunggah
                                            </p>
                                        ) : fotoUrl ? (
                                            <p className="text-xs text-slate-500">
                                                Foto saat ini sudah tersimpan. Pilih foto baru bila ingin menggantinya.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-500">
                                                Belum ada foto. Pilih foto lalu klik &quot;Simpan Perubahan&quot; untuk mengunggah.
                                            </p>
                                        )}

                                        <InputError message={errors.foto} />
                                    </div>
                                </div>

                                <input
                                    ref={fotoInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={onFotoChange}
                                />
                            </Card>

                            {/* Data Utama Guru */}
                            <Card title="Data Utama Guru" description="Identitas, penugasan, dan riwayat mengajar">
                                <div className="space-y-5">
                                    <Input
                                        label="Nama Lengkap"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                        placeholder="Masukkan nama lengkap"
                                        required
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Select
                                                label="Grade Honorarium"
                                                value={guru?.grade_id ?? ''}
                                                options={gradeOptions}
                                                placeholder="Belum ada grade"
                                                disabled
                                                className="disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                            />
                                            <p className="text-[11px] leading-4 text-slate-500 font-[450] flex items-center gap-1">
                                                <Icon icon="tabler:lock" className="text-[12px] shrink-0" />
                                                Grade honorarium hanya dapat diubah oleh admin.
                                            </p>
                                        </div>
                                        <Select
                                            label="Mata Pelajaran"
                                            value={data.mapel}
                                            onChange={(e) => setData('mapel', e.target.value as 'IPA' | 'MTK')}
                                            options={[
                                                { value: 'IPA', label: 'IPA (Ilmu Pengetahuan Alam)' },
                                                { value: 'MTK', label: 'MTK (Matematika)' },
                                            ]}
                                            error={errors.mapel}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Program / Jenis Kelas yang Diajar
                                        </label>
                                        {programs.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {programs.map((p) => {
                                                    const active = data.program_ids.includes(p.id);
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => toggleProgram(p.id)}
                                                            aria-pressed={active}
                                                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                                active
                                                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                                                            }`}
                                                        >
                                                            {active && <Icon icon="tabler:check" className="text-[13px]" />}
                                                            {p.nama}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Belum ada program — hubungi admin untuk membuat program.</p>
                                        )}
                                        {errors.program_ids && (
                                            <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.program_ids}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1.5">
                                            Pilih semua jenis kelas yang menjadi penugasan Anda (bisa lebih dari satu).
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Kelas yang Diajar"
                                            value={data.jenjang}
                                            onChange={(e) => setData('jenjang', e.target.value)}
                                            placeholder="Contoh: SMP / SMA / KPM Pusat"
                                            error={errors.jenjang}
                                        />
                                        <Input
                                            label="Kota Domisili"
                                            value={data.domisili}
                                            onChange={(e) => setData('domisili', e.target.value)}
                                            placeholder="Contoh: Jakarta Selatan"
                                            error={errors.domisili}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat Lengkap</label>
                                        <textarea
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            placeholder="Contoh: Jl. Melati No. 12, RT 03/RW 05, Kec. Cibinong, Kab. Bogor"
                                            rows={2}
                                            className="input-modern resize-none"
                                        />
                                        {errors.alamat && (
                                            <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.alamat}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Riwayat Pendidikan
                                                </label>
                                                <textarea
                                                    value={data.riwayat_pendidikan}
                                                    onChange={(e) => setData('riwayat_pendidikan', e.target.value)}
                                                    placeholder={'Contoh:\nS1 Pendidikan IPA — UNJ\nS2 Pendidikan Dasar — UI'}
                                                    rows={3}
                                                    className="input-modern resize-none leading-6"
                                                />
                                                {errors.riwayat_pendidikan && (
                                                    <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.riwayat_pendidikan}</p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-1">Tulis satu pendidikan per baris</p>
                                            </div>
                                            <Input
                                                label="Pendidikan Terakhir"
                                                value={data.pendidikan_terakhir}
                                                onChange={(e) => setData('pendidikan_terakhir', e.target.value)}
                                                error={errors.pendidikan_terakhir}
                                                placeholder="Contoh: S.Pd, M.Pd"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Input
                                                label="Tanggal Bergabung di KPM"
                                                type="date"
                                                value={data.tanggal_bergabung}
                                                onChange={(e) => setData('tanggal_bergabung', e.target.value)}
                                                error={errors.tanggal_bergabung}
                                                hint="Kapan Anda bergabung mengajar di KPM"
                                            />
                                            <Input
                                                label="Lama Mengajar (tahun)"
                                                type="number"
                                                min={0}
                                                max={60}
                                                value={data.lama_mengajar}
                                                onChange={(e) => setData('lama_mengajar', e.target.value)}
                                                error={errors.lama_mengajar}
                                                placeholder="Contoh: 5"
                                                hint="Total pengalaman mengajar dalam tahun"
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Riwayat Mengajar
                                                </label>
                                                <textarea
                                                    value={data.riwayat_mengajar}
                                                    onChange={(e) => setData('riwayat_mengajar', e.target.value)}
                                                    placeholder={'Contoh:\n2018–2020 — SMPN 1 Bogor — IPA Kelas 8\n2020–sekarang — KPM Pusat — IPA Kelas 9'}
                                                    rows={3}
                                                    className="input-modern resize-none leading-6"
                                                />
                                                {errors.riwayat_mengajar && (
                                                    <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.riwayat_mengajar}</p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Format: tahun — instansi — kelas/mapel, satu per baris
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Keterangan Mengajar
                                        </label>
                                        <textarea
                                            value={data.keterangan_mengajar}
                                            onChange={(e) => setData('keterangan_mengajar', e.target.value)}
                                            placeholder="Deskripsi tugas mengajar, jadwal, atau catatan khusus..."
                                            rows={3}
                                            className="input-modern resize-none"
                                        />
                                        {errors.keterangan_mengajar && (
                                            <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.keterangan_mengajar}</p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Kontak & Akun Login */}
                            <Card title="Kontak & Akun Login" description="Email untuk masuk & nomor WhatsApp aktif">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Nomor WA"
                                            value={data.nomor_telepon}
                                            onChange={(e) => setData('nomor_telepon', e.target.value)}
                                            placeholder="081234567890"
                                            error={errors.nomor_telepon}
                                        />
                                        <Input
                                            label="Email Login"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={errors.email}
                                            placeholder="Email yang digunakan untuk login"
                                            required
                                        />
                                    </div>
                                    {verifikasiNotices}
                                </div>
                            </Card>

                            {/* Informasi Keuangan */}
                            <Card
                                title="Informasi Keuangan"
                                description="Tunjangan khusus hanya dapat diubah oleh admin"
                            >
                                <div className="space-y-5">
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                                        <Icon icon="tabler:lock" className="text-amber-600 text-base flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <span className="font-bold">Tunjangan Khusus bersifat sensitif.</span> Hanya Admin yang
                                            dapat mengubah nominal ini — pada form Anda, nilai ini hanya tampilan (read-only).
                                        </p>
                                    </div>

                                    <Input
                                        label="Tunjangan Khusus (IDR)"
                                        value={formatCurrency(Number(guru?.tunjangan_khusus ?? 0))}
                                        disabled
                                        icon={<Icon icon="tabler:lock" className="text-[15px]" />}
                                        hint="Terhubung ke perhitungan honor — hanya admin yang dapat mengubah."
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Select
                                            label="Bank"
                                            value={data.bank}
                                            onChange={(e) => setData('bank', e.target.value)}
                                            options={bankOptions}
                                            placeholder="Pilih Bank"
                                            error={errors.bank}
                                        />
                                        <Input
                                            label="Nomor Rekening"
                                            value={data.nomor_rekening}
                                            onChange={(e) => setData('nomor_rekening', e.target.value)}
                                            error={errors.nomor_rekening}
                                            placeholder="Masukkan nomor rekening"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}

                    {!isGuru && (
                        <Card title="Informasi Akun" description="Perbarui nama lengkap & email login Anda">
                            <div className="space-y-4">
                                <Input
                                    label="Nama Lengkap"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="Masukkan nama lengkap"
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    placeholder="Email yang digunakan untuk login"
                                    required
                                />
                                {verifikasiNotices}
                            </div>
                        </Card>
                    )}

                    {aksiSimpan}
                </form>

                {/* Ubah Kata Sandi */}
                <Card
                    id="ubah-kata-sandi"
                    className="scroll-mt-24"
                    title="Ubah Kata Sandi"
                    description="Gunakan kata sandi yang kuat dan belum pernah dipakai di layanan lain"
                >
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
                                {processingPassword && <Icon icon="tabler:loader-2" className="animate-spin text-[16px]" />}
                                Perbarui Kata Sandi
                            </button>
                            {passwordRecentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-600">Kata sandi diperbarui</span>
                            )}
                        </div>
                    </form>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
