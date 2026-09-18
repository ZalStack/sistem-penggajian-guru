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
        grade_id: guru.grade_id,
        mapel: guru.mapel,
        jenjang: guru.jenjang || '',
        email: guru.user?.email ?? '',
    });

    const gradeOptions = grades.map((g) => ({
        value: g.id,
        label: `Grade ${g.kode_grade} (${formatCurrency(g.honor_per_sesi)}/sesi)`,
    }));

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

            <div className="flex items-center gap-3 mb-6">
                <Link
                    href={route('guru.index')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                    <Icon icon="lucide:arrow-left" className="text-lg" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Data Guru</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Perbarui informasi guru, akun login, dan penugasan</p>
                </div>
                {guru.user && (
                    <button
                        onClick={handleResetPassword}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:key-round" /> Reset Password
                    </button>
                )}
            </div>

            <div className="max-w-2xl space-y-6">
                <Card title="Data Guru" description="Informasi dasar dan penugasan guru">
                    <form onSubmit={submit} className="space-y-5">
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

                        <Input
                            label="Jenjang / Kelas"
                            value={data.jenjang}
                            onChange={(e) => setData('jenjang', e.target.value)}
                            placeholder="Contoh: SMP / SMA / KPM Pusat"
                            error={errors.jenjang}
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

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                            <Button type="submit" processing={processing} className="shadow-sm">
                                <Icon icon="lucide:save" /> Simpan Perubahan
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
