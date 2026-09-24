import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/ui/table';
import Badge from '@/Components/ui/badge';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { Guru } from '@/types';

interface GuruShowProps {
    guru: Guru & { user?: { id: number; email: string } | null };
}

export default function GuruShow({ guru }: GuruShowProps) {
    const handleResetPassword = () => {
        if (confirm(`Reset password guru "${guru.nama}"? Password baru akan ditampilkan setelah reset.`)) {
            router.post(route('guru.resetPassword', guru.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Detail Guru - ${guru.nama}`} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fade-in">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <Icon icon="lucide:arrow-left" className="text-lg" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title truncate">Detail Profil Guru</h1>
                        <p className="page-subtitle">Informasi lengkap penugasan, kontak & keuangan</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {guru.user && (
                        <button
                            onClick={handleResetPassword}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
                        >
                            <Icon icon="lucide:key-round" /> Reset Password
                        </button>
                    )}
                    <Link
                        href={route('guru.edit', guru.id)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-md"
                    >
                        <Icon icon="lucide:pencil" /> Edit Data
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Profile */}
                <Card className="lg:col-span-1 h-fit">
                    <div className="text-center pb-2">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-5 font-bold text-3xl shadow-lg">
                            {guru.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{guru.nama}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                            <Icon icon="lucide:mail" className="text-slate-400" /> {guru.user?.email ?? '-'}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                            <Badge variant="purple">Grade {guru.grade?.kode_grade ?? '-'}</Badge>
                            <Badge variant={guru.mapel === 'IPA' ? 'success' : 'info'}>{guru.mapel}</Badge>
                        </div>

                        <div className="mt-6 space-y-2.5 text-left">
                            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:book-open" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Mata Pelajaran</p>
                                    <p className="text-sm font-semibold text-slate-900">{guru.mapel}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:layers" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Jenjang</p>
                                    <p className="text-sm font-semibold text-slate-900">{guru.jenjang ?? '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:banknote" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Honor per Sesi</p>
                                    <p className="text-sm font-extrabold text-slate-900">{formatCurrency(guru.grade?.honor_per_sesi ?? 0)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3.5 bg-sky-50 rounded-xl border border-sky-100">
                                <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:gift" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-sky-500">Tunjangan Khusus</p>
                                    <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                                        {Number(guru.tunjangan_khusus) > 0 ? formatCurrency(Number(guru.tunjangan_khusus)) : 'Rp 0'}
                                        <span className="text-[9px] bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded font-bold uppercase">Admin Only</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Kontak & Domisili */}
                    <Card title="Kontak & Domisili" description="Informasi komunikasi guru">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:map-pin" className="text-slate-500 text-base" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Domisili</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{guru.domisili || '-'}</p>
                                {!guru.domisili && <p className="text-xs text-slate-400">Belum diisi</p>}
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:phone" className="text-emerald-600 text-base" />
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">No. Telepon / WA</span>
                                </div>
                                <p className="text-sm font-bold text-emerald-900">{guru.nomor_telepon || '-'}</p>
                                {guru.nomor_telepon && (
                                    <a href={`https://wa.me/${guru.nomor_telepon.replace(/[^0-9]/g, '')}`} target="_blank" className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1 mt-1">
                                        <Icon icon="lucide:message-circle" /> Chat WhatsApp
                                    </a>
                                )}
                            </div>
                            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:mail" className="text-sky-600 text-base" />
                                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Email Login</span>
                                </div>
                                <p className="text-sm font-bold text-slate-900 break-all">{guru.user?.email ?? '-'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:graduation-cap" className="text-slate-600 text-base" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenjang</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{guru.jenjang || '-'}</p>
                            </div>
                        </div>

                        {guru.keterangan_mengajar && (
                            <div className="mt-4 p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:info" className="text-sky-600" />
                                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Keterangan Mengajar</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{guru.keterangan_mengajar}</p>
                            </div>
                        )}
                    </Card>

                    {/* Keuangan */}
                    <Card title="Informasi Rekening" description="Data bank untuk penyaluran honor">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900 text-white rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:building-2" className="text-slate-300" />
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bank</span>
                                </div>
                                <p className="text-lg font-extrabold">{guru.bank || '-'}</p>
                                <p className="text-xs text-slate-400 mt-1">Nama bank penerima</p>
                            </div>
                            <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:credit-card" className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Rekening</span>
                                </div>
                                <p className="text-lg font-mono font-bold text-slate-900 tracking-wide">{guru.nomor_rekening || '-'}</p>
                                <p className="text-xs text-slate-400 mt-1">Pastikan nomor benar sebelum pembayaran</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
                            <Icon icon="lucide:shield-check" className="text-amber-600 text-base mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                <b>Tunjangan Khusus:</b> {formatCurrency(Number(guru.tunjangan_khusus))} — Hanya Admin yang dapat mengubah nominal ini. Guru melihat sebagai informasi read-only di profilnya.
                            </p>
                        </div>
                    </Card>

                    {/* Login Info */}
                    {guru.user ? (
                        <Card title="Akun Login" description="Informasi akun yang digunakan guru untuk login">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="lucide:mail" className="text-emerald-600 text-base" />
                                        <span className="text-xs font-semibold text-emerald-700">Email</span>
                                    </div>
                                    <p className="text-sm font-extrabold text-emerald-900 break-all">{guru.user.email}</p>
                                </div>
                                <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="lucide:shield" className="text-sky-600 text-base" />
                                        <span className="text-xs font-semibold text-sky-700">Role</span>
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900">Guru</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-start gap-2">
                                    <Icon icon="lucide:info" className="text-slate-400 text-base mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-500">Password dapat direset melalui tombol <span className="font-semibold">Reset Password</span> di pojok kanan atas. Password baru akan ditampilkan sekali setelah reset.</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <div className="text-center py-8">
                                <Icon icon="lucide:alert-circle" className="text-3xl text-amber-400 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-slate-800">Belum Memiliki Akun Login</p>
                                <p className="text-xs text-slate-500 mt-1">Edit data guru untuk menambahkan akun login.</p>
                            </div>
                        </Card>
                    )}

                    {/* Salary History */}
                    <Card title="Riwayat Penggajian Guru" description="Daftar seluruh sesi dan honor yang telah disalurkan">
                        {guru.penggajians && guru.penggajians.length > 0 ? (
                            <div className="overflow-x-auto -mx-6 px-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Periode</TableHead>
                                            <TableHead>Sesi</TableHead>
                                            <TableHead>Transport</TableHead>
                                            <TableHead>Honor</TableHead>
                                            <TableHead>Total Diterima</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {guru.penggajians.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>
                                                    <Badge>{p.periode}</Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-700">{p.jumlah_sesi} sesi</TableCell>
                                                <TableCell className="text-slate-600">{p.transport?.jenis ?? '-'}</TableCell>
                                                <TableCell className="text-slate-600">{formatCurrency(p.honor)}</TableCell>
                                                <TableCell>
                                                    <span className="font-extrabold text-slate-900">{formatCurrency(p.total)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={route('penggajian.show', p.id)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-block" title="Lihat Slip">
                                                        <Icon icon="lucide:eye" className="text-base" />
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <Icon icon="lucide:file-text" className="text-2xl" />
                                </div>
                                <p className="text-sm font-semibold text-slate-800">Belum Ada Riwayat Penggajian</p>
                                <p className="text-xs text-slate-500 mt-1">Guru ini belum memiliki catatan penggajian.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
