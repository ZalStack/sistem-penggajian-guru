import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/ui/stat-card';
import { Card } from '@/Components/ui/card';
import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface GuruPerGrade {
    kode: string;
    count: number;
    honor: string;
}

interface DashboardProps {
    totalGuru: number;
    totalGrade: number;
    totalPenggajian: number;
    totalHonor: number;
    guruPerGrade: GuruPerGrade[];
    periode: string;
}

export default function Dashboard({ totalGuru, totalGrade, totalPenggajian, totalHonor, guruPerGrade, periode }: DashboardProps) {
    const [selectedPeriode, setSelectedPeriode] = useState(periode);

    const handlePeriodeChange = (value: string) => {
        setSelectedPeriode(value);
        router.get(route('dashboard'), { periode: value }, { preserveState: true, replace: true });
    };

    const maxGuruCount = Math.max(...guruPerGrade.map((g) => g.count), 1);

    // Format human readable periode
    const formatPeriodeName = (p: string) => {
        if (!p) return '';
        const [year, month] = p.split('-');
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Ringkasan" />

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-lg mb-8">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-white/90 mb-3">
                        <Icon icon="lucide:sparkles" className="text-amber-400 text-sm" />
                        Tahun Ajaran 2026/2027 &mdash; KPM Pusat
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Selamat Datang di Portal SIGURU
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal leading-relaxed">
                        Sistem Informasi Penggajian Guru KPM Pusat. Pantau alokasi honor guru, frekuensi sesi, dan rekapitulasi penggajian secara akurat dan real-time.
                    </p>
                </div>
                <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
                    <Icon icon="lucide:graduation-cap" className="w-64 h-64 text-white" />
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                    title="Total Guru Aktif"
                    value={totalGuru}
                    icon="lucide:users"
                    color="blue"
                    description="Seluruh guru terdaftar"
                />
                <StatCard
                    title="Total Grade Honor"
                    value={totalGrade}
                    icon="lucide:award"
                    color="purple"
                    description="Kategori grade honor"
                />
                <StatCard
                    title="Data Penggajian"
                    value={totalPenggajian}
                    icon="lucide:file-check"
                    color="green"
                    description={`Periode ${formatPeriodeName(periode)}`}
                />
                <StatCard
                    title="Total Honor Disalurkan"
                    value={formatCurrency(totalHonor)}
                    icon="lucide:banknote"
                    color="amber"
                    description={`Periode ${formatPeriodeName(periode)}`}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Guru per Grade Section */}
                <div className="lg:col-span-2">
                    <Card
                        title="Distribusi Guru Berdasarkan Grade"
                        description="Data sebaran guru pada masing-masing grade honorarium"
                    >
                        {guruPerGrade.length > 0 ? (
                            <div className="space-y-4">
                                {guruPerGrade.map((g) => {
                                    const percentage = Math.round((g.count / (totalGuru || 1)) * 100);
                                    return (
                                        <div
                                            key={g.kode}
                                            className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 hover:bg-white hover:border-slate-200 transition-all shadow-2xs"
                                        >
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
                                                        {g.kode}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">Grade {g.kode}</p>
                                                        <p className="text-xs text-slate-500">Honor: Rp {g.honor}/sesi</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-base font-bold text-slate-900">{g.count}</span>
                                                    <span className="text-xs text-slate-400 ml-1">guru ({percentage}%)</span>
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max((g.count / maxGuruCount) * 100, g.count > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <Icon icon="lucide:users" className="text-2xl" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-800">Belum Ada Data Guru</h4>
                                <p className="text-xs text-slate-500 mt-1">Tambahkan data guru untuk melihat sebaran per grade.</p>
                                <div className="mt-4">
                                    <Link
                                        href={route('guru.create')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                                    >
                                        <Icon icon="lucide:plus" /> Tambah Guru Sekarang
                                    </Link>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Sidebar: Filter Periode & Quick Actions */}
                <div className="space-y-6">
                    <Card title="Filter Periode Aktif" description="Ubah periode ringkasan penggajian">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Pilih Bulan & Tahun
                                </label>
                                <div className="relative">
                                    <input
                                        type="month"
                                        value={selectedPeriode}
                                        onChange={(e) => handlePeriodeChange(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Menampilkan data: <strong className="text-slate-700">{formatPeriodeName(selectedPeriode)}</strong>
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                                    Aksi Cepat
                                </h4>
                                <div className="space-y-2.5">
                                    <Link
                                        href={route('penggajian.create')}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-150 shadow-sm group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon icon="lucide:plus-circle" className="text-lg" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">Input Penggajian Baru</p>
                                            <p className="text-[11px] text-slate-300">Hitung sesi & honor guru</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href={route('guru.index')}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-150 shadow-2xs group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon icon="lucide:users" className="text-lg" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">Kelola Data Guru</p>
                                            <p className="text-[11px] text-slate-400">Daftar guru, grade & mapel</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href={route('laporan.index')}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-150 shadow-2xs group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon icon="lucide:file-text" className="text-lg" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">Lihat Rekap & Laporan</p>
                                            <p className="text-[11px] text-slate-400">Export PDF & cetak rekap</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
