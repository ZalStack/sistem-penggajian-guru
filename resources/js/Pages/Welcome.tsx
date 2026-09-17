import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

interface WelcomeProps {
    auth: { user?: { name: string } };
    canLogin: boolean;
    canRegister: boolean;
}

const features = [
    {
        icon: 'lucide:users',
        title: 'Manajemen Data Guru',
        desc: 'Kelola data guru lengkap dengan NIP, mata pelajaran (IPA & MTK), jenjang pendidikan, dan penetapan grade.',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-600',
        borderClass: 'group-hover:border-blue-200',
    },
    {
        icon: 'lucide:award',
        title: 'Struktur Grade & Honor',
        desc: 'Standarisasi tarif honor per sesi berdasarkan grade kualifikasi pengajar secara fleksibel dan transparan.',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-600',
        borderClass: 'group-hover:border-purple-200',
    },
    {
        icon: 'lucide:car',
        title: 'Tunjangan Transportasi',
        desc: 'Pengaturan biaya transport mengajar untuk sesi Online, Mengajar Dalam Kota, hingga Luar Kota.',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-600',
        borderClass: 'group-hover:border-emerald-200',
    },
    {
        icon: 'lucide:calculator',
        title: 'Kalkulasi Gaji Otomatis',
        desc: 'Perhitungan honor mengajar dan tunjangan transport secara akurat dengan pencegahan duplikasi data per periode.',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-600',
        borderClass: 'group-hover:border-amber-200',
    },
    {
        icon: 'lucide:printer',
        title: 'Slip Gaji & Cetak Cepat',
        desc: 'Format cetak slip gaji siap cetak per guru dengan rincian honor, tunjangan, dan kolom pengesahan.',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-600',
        borderClass: 'group-hover:border-sky-200',
    },
    {
        icon: 'lucide:file-text',
        title: 'Laporan & Ekspor Dokumen',
        desc: 'Filter rekapitulasi penggajian berdasarkan periode, grade, mapel, serta ekspor format PDF resmi.',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-600',
        borderClass: 'group-hover:border-rose-200',
    },
];

export default function Welcome({ auth, canLogin }: WelcomeProps) {
    return (
        <>
            <Head title="SIGURU - Sistem Informasi Penggajian Guru KPM Pusat" />
            <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-gray-900 selection:text-white">
                {/* Top Navigation */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-sm">
                                <Icon icon="lucide:graduation-cap" className="text-xl" />
                            </div>
                            <div>
                                <span className="text-lg font-bold tracking-tight text-gray-900 block leading-tight">SIGURU</span>
                                <span className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold">KPM Pusat</span>
                            </div>
                        </div>

                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition shadow-sm"
                                >
                                    <Icon icon="lucide:layout-dashboard" className="text-base" />
                                    <span>Buka Dashboard</span>
                                </Link>
                            ) : canLogin ? (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition shadow-sm"
                                >
                                    <Icon icon="lucide:log-in" className="text-base" />
                                    <span>Masuk Admin</span>
                                </Link>
                            ) : null}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1">
                    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.gray.100),white)] opacity-60" />
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 mb-8">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Tahun Ajaran 2026/2027 &bull; Sistem Penggajian Terpadu
                            </div>

                            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                                Kelola Penggajian Guru KPM Pusat Secara{' '}
                                <span className="underline decoration-gray-300 underline-offset-8">Akurat & Efisien</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                                Solusi otomasi perhitungan honor mengajar, tunjangan transport, cetak slip gaji, dan rekapitulasi laporan keuangan pengajar dalam satu platform modern.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                                    >
                                        <Icon icon="lucide:arrow-right" className="text-lg" />
                                        <span>Masuk ke Dashboard</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                                    >
                                        <Icon icon="lucide:log-in" className="text-lg" />
                                        <span>Masuk ke Sistem</span>
                                    </Link>
                                )}
                            </div>

                            {/* Stat highlights */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 text-left">
                                <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
                                    <p className="text-xs font-semibold uppercase text-gray-400">Akuntabel</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">Grade Terpadu</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Honor otomatis terstandar</p>
                                </div>
                                <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
                                    <p className="text-xs font-semibold uppercase text-gray-400">Fleksibel</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">Multi Transport</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Online & Tatap Muka</p>
                                </div>
                                <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
                                    <p className="text-xs font-semibold uppercase text-gray-400">Dokumentasi</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">Slip Resmi</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Format siap cetak</p>
                                </div>
                                <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm">
                                    <p className="text-xs font-semibold uppercase text-gray-400">Pelaporan</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">Ekspor PDF</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Rekap per periode</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section className="bg-gray-50 border-t border-gray-100 py-20 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center max-w-2xl mx-auto mb-14">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Fitur Utama</h2>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                    Semua Kebutuhan Penggajian Pengajar di Satu Tempat
                                </h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Dirancang untuk ketelitian dan kemudahan bendahara operasional KPM Pusat
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {features.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className={`group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${feature.borderClass}`}
                                    >
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bgClass} ${feature.textClass}`}
                                        >
                                            <Icon icon={feature.icon} className="text-2xl" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1.5 text-base">{feature.title}</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center text-white text-[10px]">
                                <Icon icon="lucide:graduation-cap" />
                            </div>
                            <span className="font-semibold text-gray-900">SIGURU &bull; KPM Pusat</span>
                        </div>
                        <p>&copy; {new Date().getFullYear()} SIGURU &mdash; Sistem Informasi Penggajian Guru KPM Pusat</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
