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

            <div className="print:hidden animate-fade-in page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href={route('penggajian.index')}
                        className="shrink-0 p-2.5 rounded-xl text-slate-500 bg-white border border-slate-200 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" className="text-xl" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title">Detail Penggajian</h1>
                        <p className="page-subtitle break-words">
                            Rincian slip gaji resmi guru untuk periode {penggajian.periode}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn-secondary"
                    >
                        <Icon icon="lucide:printer" className="text-base" />
                        <span>Cetak Slip</span>
                    </button>
                    <Link
                        href={route('penggajian.edit', penggajian.id)}
                        className="btn-primary"
                    >
                        <Icon icon="lucide:pencil" className="text-base" />
                        <span>Edit Data</span>
                    </Link>
                </div>
            </div>

            <div className="w-full mx-auto space-y-6">
                <Card className="p-5 sm:p-8 print:border-none print:shadow-none print:p-0 print-report">
                    <div className="border-b-2 border-indigo-200 pb-5 mb-8 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-brand">
                                <Icon icon="lucide:graduation-cap" className="text-2xl" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight break-words">SIGURU &bull; KPM PUSAT</h2>
                                <p className="text-xs text-slate-500 mt-0.5 break-words">Sistem Informasi Penggajian Guru &mdash; Tahun Ajaran 2026/2027</p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider">
                                Slip Gaji Resmi
                            </span>
                            <p className="text-xs text-slate-500 mt-2">Periode: <strong className="text-slate-900 font-semibold">{penggajian.periode}</strong></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl mb-8">
                        <div className="min-w-0">
                            <span className="text-xs text-slate-500 font-medium">Nama Guru</span>
                            <div className="text-base font-bold text-slate-900 mt-1 break-words">{penggajian.guru?.nama ?? '-'}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="purple">Grade {penggajian.guru?.grade?.kode_grade ?? '-'}</Badge>
                                <Badge>{penggajian.guru?.mapel ?? '-'}</Badge>
                            </div>
                        </div>
                        <div className="sm:text-right min-w-0">
                            <span className="text-xs text-slate-500 font-medium">Jenjang & Jenis Transport</span>
                            <div className="text-sm font-semibold text-slate-800 mt-1 break-words">{penggajian.guru?.jenjang ?? '-'}</div>
                            <div className="text-xs text-slate-500 mt-2">
                                Transport: <span className="font-semibold text-slate-700 break-words">{penggajian.transport?.jenis ?? '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Rincian Komponen Gaji</h3>
                        <div className="overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="border-b border-indigo-100 text-xs text-slate-500">
                                        <th className="text-left py-2.5 font-semibold">Komponen</th>
                                        <th className="text-center py-2.5 font-semibold">Volume</th>
                                        <th className="text-right py-2.5 font-semibold">Tarif Sesi</th>
                                        <th className="text-right py-2.5 font-semibold">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-4 font-medium text-slate-800">Honor Mengajar</td>
                                        <td className="py-4 text-center text-slate-600">{penggajian.jumlah_sesi} sesi</td>
                                        <td className="py-4 text-right text-slate-600">{formatCurrency(honorPerSesi)}</td>
                                        <td className="py-4 text-right font-extrabold text-slate-900">{formatCurrency(penggajian.honor)}</td>
                                    </tr>
                                    <tr className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-4 font-medium text-slate-800 break-words">
                                            Tunjangan Transport <span className="text-xs text-slate-400">({penggajian.transport?.jenis})</span>
                                        </td>
                                        <td className="py-4 text-center text-slate-600">{penggajian.jumlah_sesi} sesi</td>
                                        <td className="py-4 text-right text-slate-600">{formatCurrency(biayaTransportPerSesi)}</td>
                                        <td className="py-4 text-right font-extrabold text-slate-900">{formatCurrency(penggajian.total_transport)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10 shadow-brand">
                        <div className="min-w-0">
                            <span className="text-xs uppercase tracking-wider text-indigo-100 font-semibold block">
                                Total Gaji Diterima (Take Home Pay)
                            </span>
                            <span className="text-xs text-indigo-100/80 mt-0.5 block">Termasuk honor dan akumulasi transport</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black break-words">{formatCurrency(penggajian.total)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs text-slate-600 pt-8 border-t border-indigo-100">
                        <div>
                            <p className="text-slate-400 mb-16">Penerima (Guru)</p>
                            <p className="font-bold text-slate-900 uppercase border-b border-dashed border-indigo-300 pb-1 inline-block min-w-36 break-words">
                                {penggajian.guru?.nama}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 mb-16">Bendahara / Pengelola KPM</p>
                            <p className="font-bold text-slate-900 uppercase border-b border-dashed border-indigo-300 pb-1 inline-block min-w-36">
                                Admin Keuangan
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
