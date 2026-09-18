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
        grade_id: '',
        mapel: 'IPA',
        jenjang: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const gradeOptions = grades.map((g) => ({
        value: g.id,
        label: `Grade ${g.kode_grade} (${formatCurrency(g.honor_per_sesi)}/sesi)`,
    }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('guru.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Guru Baru" />

            <div className="flex items-center gap-3 mb-6">
                <Link
                    href={route('guru.index')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                    <Icon icon="lucide:arrow-left" className="text-lg" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Guru Baru</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Buat akun login dan data guru baru sekaligus</p>
                </div>
            </div>

            <div className="max-w-2xl space-y-6">
                <Card title="Data Diri Guru" description="Informasi dasar tentang guru">
                    <form onSubmit={submit} className="space-y-5">
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

                        <Input
                            label="Jenjang / Kelas"
                            value={data.jenjang}
                            onChange={(e) => setData('jenjang', e.target.value)}
                            placeholder="Contoh: SMP / SMA / KPM Pusat"
                            error={errors.jenjang}
                        />

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Akun Login</h3>
                            <p className="text-xs text-slate-500 mb-4">Email dan password akan digunakan oleh guru untuk login ke sistem.</p>
                            <div className="space-y-4">
                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    placeholder="Contoh: guru1@guru.com"
                                    required
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        error={errors.password}
                                        placeholder="Minimal 6 karakter"
                                        required
                                    />
                                    <Input
                                        label="Konfirmasi Password"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        error={errors.password_confirmation}
                                        placeholder="Ulangi password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                            <Button type="submit" processing={processing} className="shadow-sm">
                                <Icon icon="lucide:save" /> Simpan & Buat Akun
                            </Button>
                            <Link
                                href={route('guru.index')}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                            >
                                Batal
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
