import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Grade, Guru, Program } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GuruEditProps {
    guru: Guru & { user?: { id: number; email: string } | null };
    grades: Grade[];
    programs: Program[];
}

export default function GuruEdit({ guru, grades, programs }: GuruEditProps) {
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

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors shadow-sm shrink-0"
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
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-[0_4px_10px_-4px_rgba(217,119,6,0.6)] w-full sm:w-auto"
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
                                                {active && <Icon icon="lucide:check" className="text-[13px]" />}
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
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50/50 hover:border-indigo-200 hover:text-indigo-700 text-sm font-medium transition-colors text-center"
                    >
                        Batal
                    </Link>
                    <Button type="submit" processing={processing} className="w-full sm:w-auto">
                        <Icon icon="lucide:save" /> Simpan Perubahan
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
