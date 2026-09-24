import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Grade } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GuruCreateProps {
    grades: Grade[];
}

export default function GuruCreate({ grades }: GuruCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        grade_id: '' as string | number,
        mapel: 'IPA' as 'IPA' | 'MTK',
        jenjang: '',
        domisili: '',
        nomor_telepon: '',
        tunjangan_khusus: '',
        bank: '',
        nomor_rekening: '',
        keterangan_mengajar: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

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
        post(route('guru.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Guru Baru" />

            <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
                <Link
                    href={route('guru.index')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <Icon icon="lucide:arrow-left" className="text-lg" />
                </Link>
                <div>
                    <h1 className="page-title">Tambah Guru Baru</h1>
                    <p className="page-subtitle">Buat akun login dan lengkapi data detail guru</p>
                </div>
            </div>

            <form onSubmit={submit} className="w-full space-y-6">
                {/* Data Utama */}
                <Card title="Data Utama Guru" description="Informasi penugasan dan identitas dasar">
                    <div className="space-y-5">
                        <Input
                            label="Nama Lengkap Guru"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            error={errors.nama}
                            placeholder="Contoh: Ahmad Dahlan, S.Pd."
                            required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="Grade Honorarium"
                                value={data.grade_id}
                                onChange={(e) => setData('grade_id', e.target.value)}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Jenjang / Kelas"
                                value={data.jenjang}
                                onChange={(e) => setData('jenjang', e.target.value)}
                                placeholder="Contoh: SMP / SMA / KPM Pusat"
                                error={errors.jenjang}
                            />
                            <Input
                                label="Domisili"
                                value={data.domisili}
                                onChange={(e) => setData('domisili', e.target.value)}
                                placeholder="Contoh: Jakarta Selatan, Bogor, Depok"
                                error={errors.domisili}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Keterangan Mengajar
                            </label>
                            <textarea
                                value={data.keterangan_mengajar}
                                onChange={(e) => setData('keterangan_mengajar', e.target.value)}
                                placeholder="Contoh: Mengajar IPA Kelas 8 dan 9, jadwal Senin & Rabu, fokus persiapan olimpiade..."
                                rows={3}
                                className="input-modern resize-none"
                            />
                            {errors.keterangan_mengajar && (
                                <p className="text-xs text-rose-500 font-medium mt-1.5">{errors.keterangan_mengajar}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">Deskripsi singkat tentang tugas mengajar guru</p>
                        </div>
                    </div>
                </Card>

                {/* Kontak & Akun */}
                <Card title="Kontak & Akun Login" description="Informasi komunikasi dan akses sistem">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Nomor Telepon / WhatsApp"
                                value={data.nomor_telepon}
                                onChange={(e) => setData('nomor_telepon', e.target.value)}
                                placeholder="Contoh: 081234567890"
                                error={errors.nomor_telepon}
                                hint="Format: angka, boleh pakai +62"
                            />
                            <Input
                                label="Email Login"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                placeholder="Contoh: guru1@siguru.com"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                <Icon icon="lucide:key-round" className="text-slate-500" /> Password Akun
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Jika dikosongkan, sistem akan generate password otomatis & menampilkannya sekali.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    placeholder="Minimal 8 karakter (opsional)"
                                />
                                <Input
                                    label="Konfirmasi Password"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                    placeholder="Ulangi password"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Keuangan - Admin only editable later, but set di awal */}
                <Card
                    title="Informasi Keuangan"
                    description="Data tunjangan khusus dan rekening - hanya Admin yang dapat mengubah tunjangan khusus setelah dibuat"
                >
                    <div className="space-y-5">
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                            <Icon icon="lucide:shield-check" className="text-amber-600 text-lg flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-amber-800">Akses Tunjangan Khusus</p>
                                <p className="text-xs text-amber-700 leading-relaxed">Tunjangan khusus hanya dapat diubah oleh <b>Admin</b>. Guru tidak memiliki akses mengubah nominal ini via profil pribadi.</p>
                            </div>
                        </div>

                        <Input
                            label="Tunjangan Khusus (IDR)"
                            type="number"
                            min={0}
                            value={data.tunjangan_khusus}
                            onChange={(e) => setData('tunjangan_khusus', e.target.value)}
                            error={errors.tunjangan_khusus}
                            placeholder="Contoh: 500000"
                            hint="Nominal tambahan di luar honor sesi. Kosongkan = 0"
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
                                placeholder="Contoh: 1234567890"
                            />
                        </div>
                        {/* Jika bank tidak ada di opsi, tetap bisa ketik manual via input fallback - untuk sekarang select sudah cukup, tapi user bisa pilih lalu edit manual jika perlu melalui Edit */}
                    </div>
                </Card>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <Link
                        href={route('guru.index')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors text-center"
                    >
                        Batal
                    </Link>
                    <Button type="submit" processing={processing} className="shadow-sm w-full sm:w-auto">
                        <Icon icon="lucide:save" /> Simpan & Buat Akun
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
