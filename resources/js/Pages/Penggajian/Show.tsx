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

            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('penggajian.index')}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" className="text-xl" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Detail Penggajian</h1>
                        <p className="text-sm text-gray-500">
                            Rincian slip gaji resmi guru untuk periode {penggajian.periode}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:printer" className="text-base text-gray-500" />
                        <span>Cetak Slip</span>
                    </button>
                    <Link
                        href={route('penggajian.edit', penggajian.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:pencil" className="text-base" />
                        <span>Edit Data</span>
                    </Link>
                </div>
            </div>

            {/* Printable Slip Card */}
            <div className="max-w-2xl mx-auto">
                <Card className="p-8 print:border-none print:shadow-none print:p-0">
                    {/* Header Slip */}
                    <div className="border-b-2 border-gray-900 pb-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                                <Icon icon="lucide:graduation-cap" className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">SIGURU &bull; KPM PUSAT</h2>
                                <p className="text-xs text-gray-500">Sistem Informasi Penggajian Guru &mdash; Tahun Ajaran 2026/2027</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold uppercase rounded-lg tracking-wider">
                                Slip Gaji Resmi
                            </span>
                            <p className="text-xs text-gray-500 mt-1">Periode: <strong className="text-gray-900 font-semibold">{penggajian.periode}</strong></p>
                        </div>
                    </div>

                    {/* Guru Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/80 rounded-xl mb-6">
                        <div>
                            <span className="text-xs text-gray-400 font-medium">Nama Guru</span>
                            <div className="text-base font-bold text-gray-900 mt-0.5">{penggajian.guru?.nama ?? '-'}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="purple">Grade {penggajian.guru?.grade?.kode_grade ?? '-'}</Badge>
                                <Badge>{penggajian.guru?.mapel ?? '-'}</Badge>
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <span className="text-xs text-gray-400 font-medium">Jenjang & Jenis Transport</span>
                            <div className="text-sm font-semibold text-gray-800 mt-0.5">{penggajian.guru?.jenjang ?? '-'}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Transport: <span className="font-semibold text-gray-700">{penggajian.transport?.jenis ?? '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="space-y-4 mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Rincian Komponen Gaji</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs text-gray-500">
                                    <th className="text-left py-2 font-semibold">Komponen</th>
                                    <th className="text-center py-2 font-semibold">Volume</th>
                                    <th className="text-right py-2 font-semibold">Tarif Sesi</th>
                                    <th className="text-right py-2 font-semibold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="py-3 font-medium text-gray-800">Honor Mengajar</td>
                                    <td className="py-3 text-center text-gray-600">{penggajian.jumlah_sesi} sesi</td>
                                    <td className="py-3 text-right text-gray-600">{formatCurrency(honorPerSesi)}</td>
                                    <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(penggajian.honor)}</td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-gray-800">
                                        Tunjangan Transport <span className="text-xs text-gray-400">({penggajian.transport?.jenis})</span>
                                    </td>
                                    <td className="py-3 text-center text-gray-600">{penggajian.jumlah_sesi} sesi</td>
                                    <td className="py-3 text-right text-gray-600">{formatCurrency(biayaTransportPerSesi)}</td>
                                    <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(penggajian.total_transport)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Total Box */}
                    <div className="p-4 bg-gray-900 rounded-xl text-white flex items-center justify-between mb-8">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block">
                                Total Gaji Diterima (Take Home Pay)
                            </span>
                            <span className="text-xs text-gray-400">Termasuk honor dan akumulasi transport</span>
                        </div>
                        <span className="text-2xl font-black">{formatCurrency(penggajian.total)}</span>
                    </div>

                    {/* Tanda Tangan */}
                    <div className="grid grid-cols-2 gap-8 text-center text-xs text-gray-600 pt-6 border-t border-gray-100">
                        <div>
                            <p className="text-gray-400 mb-16">Penerima (Guru)</p>
                            <p className="font-bold text-gray-900 uppercase border-b border-dashed border-gray-300 pb-1 inline-block min-w-36">
                                {penggajian.guru?.nama}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-16">Bendahara / Pengelola KPM</p>
                            <p className="font-bold text-gray-900 uppercase border-b border-dashed border-gray-300 pb-1 inline-block min-w-36">
                                Admin Keuangan
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
