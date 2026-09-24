import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import Badge from '@/Components/ui/badge';
import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Penggajian } from '@/types';

interface PenggajianShowProps {
    penggajian: Penggajian;
}

export default function PenggajianShow({ penggajian }: PenggajianShowProps) {
    const handlePrint = () => {
        window.print();
    };

    const honorPerSesi = penggajian.guru?.grade?.honor_per_sesi ?? 0;
    const biayaTransportPerSesi = penggajian.transport?.biaya ?? 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Slip Gaji - ${penggajian.guru?.nama ?? ''}`} />

            <div className="print:hidden animate-fade-in page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('penggajian.index')}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" className="text-xl" />
                    </Link>
                    <div>
                        <h1 className="page-title text-2xl font-bold text-slate-900 tracking-tight">Detail Penggajian</h1>
                        <p className="page-subtitle text-sm text-slate-500">
                            Rincian slip gaji resmi guru untuk periode {penggajian.periode}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                    >
                        <Icon icon="lucide:printer" className="text-base text-slate-500" />
                        <span>Cetak Slip</span>
                    </button>
                    <Link
                        href={route('penggajian.edit', penggajian.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                    >
                        <Icon icon="lucide:pencil" className="text-base" />
                        <span>Edit Data</span>
                    </Link>
                </div>
            </div>

            <div className="w-full mx-auto space-y-6">
                <Card className="p-8 print:border-none print:shadow-none print:p-0">
                    <div className="border-b-2 border-gray-900 pb-5 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Icon icon="lucide:graduation-cap" className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">SIGURU &bull; KPM PUSAT</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Sistem Informasi Penggajian Guru &mdash; Tahun Ajaran 2026/2027</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded-lg tracking-wider">
                                Slip Gaji Resmi
                            </span>
                            <p className="text-xs text-slate-500 mt-2">Periode: <strong className="text-slate-900 font-semibold">{penggajian.periode}</strong></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50/80 rounded-xl mb-8">
                        <div>
                            <span className="text-xs text-slate-400 font-medium">Nama Guru</span>
                            <div className="text-base font-bold text-slate-900 mt-1">{penggajian.guru?.nama ?? '-'}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="purple">Grade {penggajian.guru?.grade?.kode_grade ?? '-'}</Badge>
                                <Badge>{penggajian.guru?.mapel ?? '-'}</Badge>
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <span className="text-xs text-slate-400 font-medium">Jenjang & Jenis Transport</span>
                            <div className="text-sm font-semibold text-slate-800 mt-1">{penggajian.guru?.jenjang ?? '-'}</div>
                            <div className="text-xs text-slate-500 mt-2">
                                Transport: <span className="font-semibold text-slate-700">{penggajian.transport?.jenis ?? '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rincian Komponen Gaji</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500">
                                    <th className="text-left py-2.5 font-semibold">Komponen</th>
                                    <th className="text-center py-2.5 font-semibold">Volume</th>
                                    <th className="text-right py-2.5 font-semibold">Tarif Sesi</th>
                                    <th className="text-right py-2.5 font-semibold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-4 font-medium text-slate-800">Honor Mengajar</td>
                                    <td className="py-4 text-center text-slate-600">{penggajian.jumlah_sesi} sesi</td>
                                    <td className="py-4 text-right text-slate-600">{formatCurrency(honorPerSesi)}</td>
                                    <td className="py-4 text-right font-extrabold text-slate-900">{formatCurrency(penggajian.honor)}</td>
                                </tr>
                                <tr>
                                    <td className="py-4 font-medium text-slate-800">
                                        Tunjangan Transport <span className="text-xs text-slate-400">({penggajian.transport?.jenis})</span>
                                    </td>
                                    <td className="py-4 text-center text-slate-600">{penggajian.jumlah_sesi} sesi</td>
                                    <td className="py-4 text-right text-slate-600">{formatCurrency(biayaTransportPerSesi)}</td>
                                    <td className="py-4 text-right font-extrabold text-slate-900">{formatCurrency(penggajian.total_transport)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-5 bg-slate-900 rounded-xl text-white flex items-center justify-between mb-10">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                                Total Gaji Diterima (Take Home Pay)
                            </span>
                            <span className="text-xs text-slate-400 mt-0.5 block">Termasuk honor dan akumulasi transport</span>
                        </div>
                        <span className="text-2xl font-black">{formatCurrency(penggajian.total)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-600 pt-8 border-t border-slate-100">
                        <div>
                            <p className="text-slate-400 mb-16">Penerima (Guru)</p>
                            <p className="font-bold text-slate-900 uppercase border-b border-dashed border-slate-300 pb-1 inline-block min-w-36">
                                {penggajian.guru?.nama}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 mb-16">Bendahara / Pengelola KPM</p>
                            <p className="font-bold text-slate-900 uppercase border-b border-dashed border-slate-300 pb-1 inline-block min-w-36">
                                Admin Keuangan
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
