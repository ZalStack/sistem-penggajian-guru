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
                    className="shrink-0 p-2.5 rounded-xl text-slate-500 bg-white border border-slate-200 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-colors"
                >
                    <Icon icon="lucide:arrow-left" className="text-xl" />
                </Link>
                <div className="min-w-0">
                    <h1 className="page-title">Input Penggajian Baru</h1>
                    <p className="page-subtitle">Hitung dan catat honor serta transport guru per periode</p>
                </div>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
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
                                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shrink-0">
                                                <Icon icon="lucide:user-check" className="text-base" />
                                            </span>
                                            <span className="text-slate-900 font-medium break-words">
                                                Grade: <strong className="font-semibold">{selectedGuru.grade?.kode_grade}</strong> &bull; Mapel: {selectedGuru.mapel}
                                            </span>
                                        </div>
                                        <span className="text-indigo-700 font-extrabold break-words">{formatCurrency(honorPerSesi)} / sesi</span>
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
                                <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-br from-indigo-50/70 to-violet-50/50 border border-indigo-100/70 rounded-xl text-sm">
                                    <span className="text-slate-500">Honor / Sesi</span>
                                    <span className="font-extrabold text-slate-800 break-words text-right">{formatCurrency(honorPerSesi)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-br from-indigo-50/70 to-violet-50/50 border border-indigo-100/70 rounded-xl text-sm">
                                    <span className="text-slate-500">Transport / Sesi</span>
                                    <span className="font-extrabold text-slate-800 break-words text-right">{formatCurrency(biayaTransportPerSesi)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-br from-indigo-50/70 to-violet-50/50 border border-indigo-100/70 rounded-xl text-sm">
                                    <span className="text-slate-500">Jumlah Sesi</span>
                                    <span className="font-extrabold text-slate-900 break-words text-right">{sesi} sesi</span>
                                </div>

                                <hr className="border-indigo-100 my-3" />

                                <div className="flex items-center justify-between gap-3 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm">
                                    <span className="font-medium text-indigo-700">Total Honor</span>
                                    <span className="font-extrabold text-indigo-700 break-words text-right">{formatCurrency(totalHonor)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm">
                                    <span className="font-medium text-indigo-700">Total Transport</span>
                                    <span className="font-extrabold text-indigo-700 break-words text-right">{formatCurrency(totalTransport)}</span>
                                </div>

                                <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-white mt-3 shadow-brand">
                                    <span className="block text-[11px] sm:text-xs uppercase tracking-wider text-indigo-100 font-semibold mb-2">
                                        Grand Total Penggajian
                                    </span>
                                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight break-words">
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
                                className="btn-secondary w-full justify-center"
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
