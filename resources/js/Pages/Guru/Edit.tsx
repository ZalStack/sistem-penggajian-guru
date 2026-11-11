import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import Modal from '@/Components/ui/modal';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Grade, Guru, Program } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GuruEditProps {
    guru: Guru & { user?: { id: number; email: string } | null };
    grades: Grade[];
    programs: Program[];
}

export default function GuruEdit({ guru, grades, programs }: GuruEditProps) {
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        nama: guru.nama,
        grade_id: guru.grade_id as string | number,
        mapel: guru.mapel,
        jenjang: guru.jenjang || '',
        program_ids: (guru.programs ?? []).map((p) => p.id),
        domisili: guru.domisili || '',
        alamat: guru.alamat || '',
        riwayat_pendidikan: guru.riwayat_pendidikan || '',
        pendidikan_terakhir: guru.pendidikan_terakhir || '',
        tanggal_bergabung: guru.tanggal_bergabung || '',
        pelatihan_suprarasional:
            guru.pelatihan_suprarasional == null ? '' : guru.pelatihan_suprarasional ? '1' : '0',
        lama_mengajar: (guru.lama_mengajar ?? '') as string | number,
        riwayat_mengajar: guru.riwayat_mengajar || '',
        nomor_telepon: guru.nomor_telepon || '',
        tunjangan_khusus: String(guru.tunjangan_khusus ?? 0),
        bank: guru.bank || '',
        nomor_rekening: guru.nomor_rekening || '',
        keterangan_mengajar: guru.keterangan_mengajar || '',
        email: guru.user?.email ?? '',
    });

    const toggleProgram = (id: number) => {
        setData(
            'program_ids',
            data.program_ids.includes(id)
                ? data.program_ids.filter((p) => p !== id)
                : [...data.program_ids, id]
        );
    };

    const gradeOptions = grades.map((g) => ({
        value: g.id,
        label: `Grade ${g.kode_grade} (${formatCurrency(g.honor_per_sesi)}/sesi)`,
    }));

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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('guru.update', guru.id), {
            preserveScroll: true,
        });
    };

    const confirmResetPassword = () => {
        setIsResetting(true);
        router.post(route('guru.resetPassword', guru.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsResetting(false);
                setShowResetModal(false);
            },
            onSuccess: () => {
                router.reload({ preserveScroll: true });
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Guru - ${guru.nama}`} />

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors shadow-sm shrink-0"
                        aria-label="Kembali ke data guru"
                    >
                        <Icon icon="tabler:arrow-left" className="text-lg" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title">Edit Data Guru</h1>
                        <p className="page-subtitle truncate">Perbarui informasi lengkap guru — {guru.nama}</p>
                    </div>
                </div>
                {guru.user && (
                    <Button
                        type="button"
                        variant="warning"
                        onClick={() => setShowResetModal(true)}
                        className="w-full sm:w-auto"
                        aria-label={`Reset password untuk ${guru.nama}`}
                    >
                        <Icon icon="tabler:key" className="text-base" /> Reset Password
                    </Button>
                )}
            </div>

            <form onSubmit={submit} className="w-full space-y-6">
                {/* Ringkasan Kesalahan Formulir */}
                {Object.keys(errors).length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3.5 animate-slide-down" role="alert" aria-live="assertive">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <Icon icon="tabler:alert-triangle" className="text-xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-rose-900">Terdapat kesalahan pada formulir</h4>
                            <p className="text-xs text-rose-700 mt-0.5">Ada {Object.keys(errors).length} bidang yang perlu diperiksa kembali sebelum menyimpan:</p>
                            <ul className="mt-2 list-disc list-inside text-xs text-rose-600 space-y-1">
                                {Object.entries(errors).slice(0, 5).map(([field, msg]) => (
                                    <li key={field}>
                                        <span className="font-semibold capitalize">{field.replace('_', ' ')}</span>: {msg}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                <Card title="Data Utama Guru" description="Identitas dan penugasan">
                    <div className="space-y-5">
                        <Input
                            label="Nama Lengkap Guru"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            error={errors.nama}
                            placeholder="Masukkan nama guru"
                            required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="Grade Honorarium"
                                value={data.grade_id}
                                onChange={(e) => setData('grade_id', Number(e.target.value))}
                                options={gradeOptions}
                                placeholder="Pilih Grade Guru"
                                error={errors.grade_id}
                                required
                            />
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
                                                {active && <Icon icon="tabler:check" className="text-xs" />}
                                                {p.nama}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400">Belum ada program — buat program terlebih dahulu.</p>
                            )}
                            {errors.program_ids && (
                                <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.program_ids}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1.5">
                                Pilih semua jenis kelas yang menjadi penugasan guru ini (bisa lebih dari satu).
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

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Alamat Lengkap
                                </label>
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
                                        hint="Kapan guru bergabung mengajar di KPM"
                                    />
                                    <div className="space-y-1.5">
                                        <Select
                                            label="Pernah Ikut Pelatihan Suprarasional"
                                            value={data.pelatihan_suprarasional}
                                            onChange={(e) => setData('pelatihan_suprarasional', e.target.value)}
                                            options={[
                                                { value: '1', label: 'IYA — Pernah ikut' },
                                                { value: '0', label: 'TIDAK — Belum pernah ikut' },
                                            ]}
                                            placeholder="Belum diisi"
                                            error={errors.pelatihan_suprarasional}
                                        />
                                        <p className="text-xs leading-4 text-slate-500 font-[450] flex items-center gap-1">
                                            <Icon icon="tabler:school" className="text-xs shrink-0" />
                                            Pilih IYA jika guru pernah mengikuti pelatihan Suprarasional.
                                        </p>
                                    </div>
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
                                        <p className="text-xs text-slate-400 mt-1">Format: tahun — instansi — kelas/mapel, satu per baris</p>
                                    </div>
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

                <Card title="Kontak & Akun Login" description="Email dan nomor telepon guru">
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
                </Card>

                <Card title="Informasi Keuangan (Admin Only untuk Tunjangan)" description="Tunjangan khusus hanya admin yang dapat mengubah">
                    <div className="space-y-5">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                            <Icon icon="tabler:lock" className="text-amber-600 text-base flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                <span className="font-bold">Tunjangan Khusus bersifat sensitif.</span> Hanya Admin yang dapat mengubah nominal ini. Guru melihatnya sebagai read-only di profil mereka.
                            </p>
                        </div>

                        <Input
                            label="Tunjangan Khusus (IDR)"
                            type="number"
                            min={0}
                            value={data.tunjangan_khusus}
                            onChange={(e) => setData('tunjangan_khusus', e.target.value)}
                            error={errors.tunjangan_khusus}
                            placeholder="Contoh: 750000"
                            hint={data.tunjangan_khusus ? `Terformat: ${formatCurrency(Number(data.tunjangan_khusus))}` : undefined}
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

                <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 px-4 sm:px-6 lg:px-8 xl:px-10 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-float flex flex-col-reverse sm:flex-row items-center justify-end gap-3 rounded-b-2xl">
                    <Link
                        href={route('guru.index')}
                        className="w-full sm:w-auto text-center"
                    >
                        <Button variant="secondary" type="button" className="w-full sm:w-auto">
                            Batal
                        </Button>
                    </Link>
                    <Button type="submit" processing={processing} className="w-full sm:w-auto">
                        <Icon icon="tabler:device-floppy" className="text-base" /> Simpan Perubahan
                    </Button>
                </div>
            </form>

            {/* Modal Konfirmasi Reset Password */}
            <Modal show={showResetModal} onClose={() => setShowResetModal(false)} showCloseButton={true}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-amber-100">
                        <Icon icon="tabler:key" className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password Guru?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Password untuk akun <strong className="text-slate-800">{guru.nama}</strong> akan direset secara acak. Password baru akan muncul pada notifikasi sistem setelah proses berhasil.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setShowResetModal(false)}>
                            Batal
                        </Button>
                        <Button variant="warning" processing={isResetting} onClick={confirmResetPassword}>
                            Ya, Reset Password
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
