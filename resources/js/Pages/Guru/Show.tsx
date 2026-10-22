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

            <div className="page-header animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href={route('guru.index')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors shadow-sm shrink-0"
                    >
                        <Icon icon="lucide:arrow-left" className="text-lg" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="page-title truncate">Detail Profil Guru</h1>
                        <p className="page-subtitle">Informasi lengkap penugasan, kontak & keuangan</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {guru.user && (
                        <button
                            onClick={handleResetPassword}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-[0_4px_10px_-4px_rgba(217,119,6,0.6)]"
                        >
                            <Icon icon="lucide:key-round" /> Reset Password
                        </button>
                    )}
                    <Link
                        href={route('guru.edit', guru.id)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)] hover:shadow-[0_10px_22px_-6px_rgba(124,58,237,0.65)]"
                    >
                        <Icon icon="lucide:pencil" /> Edit Data
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Profile */}
                <Card className="lg:col-span-1 h-fit">
                    <div className="text-center pb-2">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-5 font-bold text-3xl shadow-[0_12px_28px_-10px_rgba(99,102,241,0.8)]">
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
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
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
                                    <p className="text-[11px] font-medium text-slate-400">Kelas yang Diajar</p>
                                    <p className="text-sm font-semibold text-slate-900">{guru.jenjang ?? '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                                    <Icon icon="lucide:calendar-heart" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-400">Bergabung di KPM</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {guru.tanggal_bergabung
                                            ? new Date(guru.tanggal_bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : '-'}
                                    </p>
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

                            <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-4px_rgba(99,102,241,0.7)]">
                                    <Icon icon="lucide:gift" className="text-base" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-indigo-500">Tunjangan Khusus</p>
                                    <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1 flex-wrap">
                                        {Number(guru.tunjangan_khusus) > 0 ? formatCurrency(Number(guru.tunjangan_khusus)) : 'Rp 0'}
                                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">Admin Only</span>
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
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kota Domisili</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{guru.domisili || '-'}</p>
                                {!guru.domisili && <p className="text-xs text-slate-400">Belum diisi</p>}
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:phone" className="text-emerald-600 text-base" />
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Nomor WA</span>
                                </div>
                                <p className="text-sm font-bold text-emerald-900">{guru.nomor_telepon || '-'}</p>
                                {guru.nomor_telepon && (
                                    <a href={`https://wa.me/${guru.nomor_telepon.replace(/[^0-9]/g, '')}`} target="_blank" className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1 mt-1">
                                        <Icon icon="lucide:message-circle" /> Chat WhatsApp
                                    </a>
                                )}
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:mail" className="text-indigo-600 text-base" />
                                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Email Login</span>
                                </div>
                                <p className="text-sm font-bold text-slate-900 break-all">{guru.user?.email ?? '-'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:graduation-cap" className="text-slate-600 text-base" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas yang Diajar</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{guru.jenjang || '-'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:home" className="text-slate-600 text-base" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{guru.alamat || '-'}</p>
                                {!guru.alamat && <p className="text-xs text-slate-400">Belum diisi</p>}
                            </div>
                        </div>

                        {guru.riwayat_pendidikan && (
                            <div className="mt-4 p-4 bg-violet-50/60 rounded-xl border border-violet-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:graduation-cap" className="text-violet-600" />
                                    <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Riwayat Pendidikan</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{guru.riwayat_pendidikan}</p>
                            </div>
                        )}

                        {guru.keterangan_mengajar && (
                            <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50/70 to-violet-50/50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:info" className="text-indigo-500" />
                                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Keterangan Mengajar</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{guru.keterangan_mengajar}</p>
                            </div>
                        )}
                    </Card>

                    {/* Keuangan */}
                    <Card title="Informasi Rekening" description="Data bank untuk penyaluran honor">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl shadow-[0_8px_20px_-8px_rgba(99,102,241,0.7)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:building-2" className="text-indigo-200" />
                                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Bank</span>
                                </div>
                                <p className="text-lg font-extrabold break-words">{guru.bank || '-'}</p>
                                <p className="text-xs text-indigo-200/80 mt-1">Nama bank penerima</p>
                            </div>
                            <div className="p-4 bg-white border-2 border-indigo-100 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="lucide:credit-card" className="text-indigo-500" />
                                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Nomor Rekening</span>
                                </div>
                                <p className="text-lg font-mono font-bold text-slate-900 tracking-wide break-all">{guru.nomor_rekening || '-'}</p>
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
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="lucide:shield" className="text-indigo-600 text-base" />
                                        <span className="text-xs font-semibold text-indigo-700">Role</span>
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
                                <div className="empty-state-icon !w-14 !h-14 !rounded-2xl">
                                    <Icon icon="lucide:alert-circle" className="text-2xl text-amber-500" />
                                </div>
                                <p className="text-sm font-semibold text-slate-800">Belum Memiliki Akun Login</p>
                                <p className="text-xs text-slate-500 mt-1">Edit data guru untuk menambahkan akun login.</p>
                            </div>
                        </Card>
                    )}

                    {/* Salary History */}
                    <Card title="Riwayat Penggajian Guru" description="Daftar seluruh sesi dan honor yang telah disalurkan">
                        {guru.penggajians && guru.penggajians.length > 0 ? (
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
                                                <Link href={route('penggajian.show', p.id)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block" title="Lihat Slip">
                                                    <Icon icon="lucide:eye" className="text-base" />
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <div className="empty-state-icon !w-14 !h-14 !rounded-2xl">
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
