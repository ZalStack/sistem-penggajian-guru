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
                    <p className="text-xs text-slate-500 mt-0.5">Lengkapi formulir untuk mendaftarkan guru baru ke dalam sistem</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <Card>
                    <form onSubmit={submit} className="space-y-5">
                        <Input
                            label="Nama Lengkap Guru"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            error={errors.nama}
                            placeholder="Contoh: Ahmad Dahlan, S.Pd."
                            required
                        />

                        <Select
                            label="Grade Honorarium"
                            value={data.grade_id}
                            onChange={(e) => setData('grade_id', e.target.value)}
                            options={gradeOptions}
                            placeholder="Pilih Grade Guru"
                            error={errors.grade_id}
                            required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <Input
                                label="Jenjang / Kelas"
                                value={data.jenjang}
                                onChange={(e) => setData('jenjang', e.target.value)}
                                placeholder="Contoh: SMP / SMA / KPM Pusat"
                                error={errors.jenjang}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                            <Button type="submit" processing={processing} className="shadow-sm">
                                <Icon icon="lucide:save" /> Simpan Data Guru
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
