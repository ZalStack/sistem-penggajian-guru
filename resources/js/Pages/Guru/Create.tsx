import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { Grade, Program } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GuruCreateProps {
    grades: Grade[];
    programs: Program[];
}

export default function GuruCreate({ grades, programs }: GuruCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        grade_id: '' as string | number,
        mapel: 'IPA' as 'IPA' | 'MTK',
        jenjang: '',
        program_ids: [] as number[],
        domisili: '',
        alamat: '',
        riwayat_pendidikan: '',
        pendidikan_terakhir: '',
        tanggal_bergabung: '',
        lama_mengajar: '' as string | number,
        riwayat_mengajar: '',
        nomor_telepon: '',
        tunjangan_khusus: '',
        bank: '',
        nomor_rekening: '',
        keterangan_mengajar: '',
        email: '',
        password: '',
        password_confirmation: '',
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
        post(route('guru.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Guru Baru" />

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors shadow-sm shrink-0"
                    >
                        <Icon icon="lucide:arrow-left" className="text-lg" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title">Tambah Guru Baru</h1>
                        <p className="page-subtitle">Buat akun login dan lengkapi data detail guru</p>
                    </div>
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
                                placeholder="Contoh: Jakarta Selatan, Bogor, Depok"
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
                                label="Nomor WA"
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
                                placeholder="Contoh: guru1@satugurukpm.id"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0">
                                    <Icon icon="lucide:key-round" className="text-sm" />
                                </span>
                                Password Akun
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
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50/50 hover:border-indigo-200 hover:text-indigo-700 text-sm font-medium transition-colors text-center"
                    >
                        Batal
                    </Link>
                    <Button type="submit" processing={processing} className="w-full sm:w-auto">
                        <Icon icon="lucide:save" /> Simpan & Buat Akun
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
