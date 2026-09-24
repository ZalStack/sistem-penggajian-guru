import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Input from '@/Components/ui/input';
import Select from '@/Components/ui/select';
import Button from '@/Components/ui/button';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Guru, Transport } from '@/types';
import { useEffect, useState } from 'react';

interface PenggajianCreateProps {
    gurus: Guru[];
    transports: Transport[];
}

export default function PenggajianCreate({ gurus, transports }: PenggajianCreateProps) {
    const now = new Date().toISOString().slice(0, 7);
    const { data, setData, post, processing, errors } = useForm({
        guru_id: '',
        periode: now,
        jumlah_sesi: 1,
        transport_id: transports.length > 0 ? String(transports[0].id) : '',
    });

    const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);
    const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);

    useEffect(() => {
        if (data.guru_id) {
            const g = gurus.find((guru) => guru.id === Number(data.guru_id)) || null;
            setSelectedGuru(g);
        } else {
            setSelectedGuru(null);
        }
    }, [data.guru_id, gurus]);

    useEffect(() => {
        if (data.transport_id) {
            const t = transports.find((tr) => tr.id === Number(data.transport_id)) || null;
            setSelectedTransport(t);
        } else {
            setSelectedTransport(null);
        }
    }, [data.transport_id, transports]);

    const honorPerSesi = selectedGuru?.grade?.honor_per_sesi ?? 0;
    const biayaTransportPerSesi = selectedTransport?.biaya ?? 0;
    const sesi = Number(data.jumlah_sesi) || 0;

    const totalHonor = honorPerSesi * sesi;
    const totalTransport = biayaTransportPerSesi * sesi;
    const grandTotal = totalHonor + totalTransport;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('penggajian.store'));
    };

    const guruOptions = gurus.map((g) => ({
        value: g.id,
        label: `${g.nama} — Grade ${g.grade?.kode_grade ?? '-'} (${g.mapel})`,
    }));

    const transportOptions = transports.map((t) => ({
        value: t.id,
        label: `${t.jenis} — ${formatCurrency(t.biaya)}/sesi`,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Input Penggajian" />

            <div className="animate-fade-in page-header flex items-center gap-3 mb-8">
                <Link
                    href={route('penggajian.index')}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                    <Icon icon="lucide:arrow-left" className="text-xl" />
                </Link>
                <div>
                    <h1 className="page-title text-2xl font-bold text-slate-900 tracking-tight">Input Penggajian Baru</h1>
                    <p className="page-subtitle text-sm text-slate-500">Hitung dan catat honor serta transport guru per periode</p>
                </div>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Data Penggajian">
                            <div className="space-y-6">
                                <Select
                                    label="Guru"
                                    value={data.guru_id}
                                    onChange={(e) => setData('guru_id', e.target.value)}
                                    options={guruOptions}
                                    placeholder="-- Pilih Guru Penerima --"
                                    error={errors.guru_id}
                                    required
                                />

                                {selectedGuru && (
                                    <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="lucide:user-check" className="text-sky-600 text-base" />
                                            <span className="text-slate-900 font-medium">
                                                Grade: <strong className="font-semibold">{selectedGuru.grade?.kode_grade}</strong> &bull; Mapel: {selectedGuru.mapel}
                                            </span>
                                        </div>
                                        <span className="text-sky-700 font-extrabold">{formatCurrency(honorPerSesi)} / sesi</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Input
                                        label="Periode (Bulan/Tahun)"
                                        type="month"
                                        value={data.periode}
                                        onChange={(e) => setData('periode', e.target.value)}
                                        error={errors.periode}
                                        required
                                    />
                                    <Input
                                        label="Jumlah Sesi Mengajar"
                                        type="number"
                                        value={data.jumlah_sesi}
                                        onChange={(e) => setData('jumlah_sesi', Number(e.target.value))}
                                        error={errors.jumlah_sesi}
                                        min={1}
                                        placeholder="Contoh: 12"
                                        required
                                    />
                                </div>

                                <Select
                                    label="Jenis Transport"
                                    value={data.transport_id}
                                    onChange={(e) => setData('transport_id', e.target.value)}
                                    options={transportOptions}
                                    placeholder="-- Pilih Transport --"
                                    error={errors.transport_id}
                                    required
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Simulasi Perhitungan">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-sm">
                                    <span className="text-slate-500">Honor / Sesi</span>
                                    <span className="font-extrabold text-slate-800">{formatCurrency(honorPerSesi)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-sm">
                                    <span className="text-slate-500">Transport / Sesi</span>
                                    <span className="font-extrabold text-slate-800">{formatCurrency(biayaTransportPerSesi)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-sm">
                                    <span className="text-slate-500">Jumlah Sesi</span>
                                    <span className="font-extrabold text-slate-900">{sesi} sesi</span>
                                </div>

                                <hr className="border-slate-200 my-3" />

                                <div className="flex items-center justify-between p-3.5 bg-sky-50/70 rounded-xl text-sm">
                                    <span className="font-medium text-sky-700">Total Honor</span>
                                    <span className="font-extrabold text-sky-700">{formatCurrency(totalHonor)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 bg-sky-50/70 rounded-xl text-sm">
                                    <span className="font-medium text-sky-700">Total Transport</span>
                                    <span className="font-extrabold text-sky-700">{formatCurrency(totalTransport)}</span>
                                </div>

                                <div className="p-5 bg-slate-900 rounded-xl text-white mt-3">
                                    <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                                        Grand Total Penggajian
                                    </span>
                                    <span className="text-2xl font-extrabold tracking-tight">
                                        {formatCurrency(grandTotal)}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-3">
                            <Button type="submit" processing={processing} className="w-full justify-center py-3">
                                <Icon icon="lucide:save" className="text-base" />
                                <span>Simpan Penggajian</span>
                            </Button>
                            <Link
                                href={route('penggajian.index')}
                                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
