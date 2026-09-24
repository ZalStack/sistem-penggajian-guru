import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Grade, Guru } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GuruEditProps {
    guru: Guru & { user?: { id: number; email: string } | null };
    grades: Grade[];
}

export default function GuruEdit({ guru, grades }: GuruEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nama: guru.nama,
        grade_id: guru.grade_id as string | number,
        mapel: guru.mapel,
        jenjang: guru.jenjang || '',
        domisili: guru.domisili || '',
        nomor_telepon: guru.nomor_telepon || '',
        tunjangan_khusus: String(guru.tunjangan_khusus ?? 0),
        bank: guru.bank || '',
        nomor_rekening: guru.nomor_rekening || '',
        keterangan_mengajar: guru.keterangan_mengajar || '',
        email: guru.user?.email ?? '',
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
        put(route('guru.update', guru.id));
    };

    const handleResetPassword = () => {
        if (confirm(`Reset password guru "${guru.nama}"? Password baru akan ditampilkan setelah reset.`)) {
            router.post(route('guru.resetPassword', guru.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Guru - ${guru.nama}`} />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
                <div className="flex items-center gap-3 flex-1">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:arrow-left" className="text-lg" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title">Edit Data Guru</h1>
                        <p className="page-subtitle truncate">Perbarui informasi lengkap guru — {guru.nama}</p>
                    </div>
                </div>
                {guru.user && (
                    <button
                        onClick={handleResetPassword}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-sm w-full sm:w-auto"
                    >
                        <Icon icon="lucide:key-round" /> Reset Password
                    </button>
                )}
            </div>

            <form onSubmit={submit} className="w-full space-y-6">
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
                                placeholder="Contoh: Jakarta Selatan"
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
                            label="Nomor Telepon / WhatsApp"
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
                            <Icon icon="lucide:lock" className="text-amber-600 text-base flex-shrink-0 mt-0.5" />
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

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <Link
                        href={route('guru.index')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors text-center"
                    >
                        Batal
                    </Link>
                    <Button type="submit" processing={processing} className="shadow-sm w-full sm:w-auto">
                        <Icon icon="lucide:save" /> Simpan Perubahan
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
