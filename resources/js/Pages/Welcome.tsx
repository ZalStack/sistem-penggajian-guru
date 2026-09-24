import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

const features = [
    { icon: 'lucide:users', title: 'Manajemen Guru Lengkap', desc: 'Data guru, NIP, domisili, kontak, grade, mapel, hingga rekening & tunjangan khusus.', color: 'blue' },
    { icon: 'lucide:award', title: 'Grade & Honor Transparan', desc: 'Tarif per sesi terstandarisasi, fleksibel, dan audit-friendly.', color: 'violet' },
    { icon: 'lucide:car-front', title: 'Transportasi Fleksibel', desc: 'Online, Dalam Kota, Luar Kota — otomatis terhitung.', color: 'emerald' },
    { icon: 'lucide:calculator', title: 'Kalkulasi Otomatis', desc: 'Honor × sesi + transport + tunjangan, anti-duplikasi periode.', color: 'amber' },
    { icon: 'lucide:receipt', title: 'Slip Gaji Digital', desc: 'Slip siap cetak dengan rincian lengkap & pengesahan.', color: 'sky' },
    { icon: 'lucide:bar-chart-3', title: 'Laporan & Ekspor', desc: 'Filter per periode/grade/mapel, ekspor PDF & Excel.', color: 'rose' },
];

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200' },
    violet: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-200' },
};

export default function Welcome({ auth, canLogin }: { auth: { user?: { name: string } }; canLogin: boolean }) {
    return (
        <>
            <Head title="SIGURU — Sistem Penggajian Guru KPM Pusat" />
            <div className="min-h-screen flex flex-col bg-white selection:bg-slate-900 selection:text-white">
                {/* Nav */}
                <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
                    <div className="w-full px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
                                <Icon icon="lucide:graduation-cap" className="text-white text-[18px]" />
                            </div>
                            <div>
                                <p className="text-[15px] font-[800] tracking-[-0.03em] leading-none text-slate-900">SIGURU</p>
                                <p className="text-[11px] font-[600] tracking-[0.06em] uppercase text-slate-500 leading-none mt-0.5">KPM Pusat</p>
                            </div>
                            <span className="hidden sm:inline-flex ml-2 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-[700] tracking-[0.04em] uppercase text-emerald-700 items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live • 2026/27
                            </span>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="hidden md:inline text-[12.5px] font-[500] text-slate-500 mr-2">Sistem terpadu untuk KPM Pusat</span>
                            {auth.user ? (
                                <Link href={route('dashboard')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[13px] font-[700] rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-px transition-all">
                                    <Icon icon="lucide:layout-dashboard" /> Dashboard
                                </Link>
                            ) : canLogin ? (
                                <Link href={route('login')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[13px] font-[700] rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-px transition-all">
                                    Masuk <Icon icon="lucide:arrow-right" className="text-[14px]" />
                                </Link>
                            ) : null}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 mesh-gradient" />
                    <div className="absolute inset-0 grid-pattern opacity-[0.3]" />
                    <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16">
                        <div className="w-full max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-soft text-[11px] font-[700] tracking-[0.06em] uppercase text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Dipercaya KPM Pusat • Akurat & Efisien
                            </div>
                            <h1 className="text-[34px] sm:text-[54px] font-[800] tracking-[-0.04em] leading-[0.95] text-slate-900 mt-6">
                                Kelola penggajian guru <span className="relative inline-block"><span className="relative z-10 bg-gradient-to-r from-sky-600 to-sky-600 bg-clip-text text-transparent">secara presisi</span><span className="absolute bottom-1 left-0 right-0 h-3 bg-sky-100 -rotate-1 -z-0" /></span>
                            </h1>
                            <p className="text-[15px] sm:text-[17px] leading-7 text-slate-600 mt-5 font-[450] max-w-2xl mx-auto">
                                Otomasi honor per sesi, tunjangan transport, tunjangan khusus, validasi GPS, slip digital, dan laporan ekspor — dalam satu platform yang <span className="font-[700] text-slate-900">cepat, transparan, dan dapat diaudit.</span>
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                                <Link href={route('login')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 text-white text-[14px] font-[700] tracking-[-0.01em] rounded-xl hover:bg-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition-all">
                                    <Icon icon="lucide:log-in" className="text-[18px]" /> Masuk ke Sistem
                                </Link>
                                <a href="#fitur" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 text-[14px] font-[700] rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow transition-all">
                                    Lihat Fitur <Icon icon="lucide:arrow-down" />
                                </a>
                            </div>

                            {/* Trust bar */}
                            <div className="mt-10 p-4 sm:p-5 bg-white rounded-[20px] border border-slate-200/70 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-[800] text-slate-600">
                                                {String.fromCharCode(64+i)}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white text-[10px] font-[800]">+12</div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-[700] text-slate-900 leading-none">Dipercaya 15+ guru KPM</p>
                                        <p className="text-[11px] text-slate-500 leading-none mt-1">Operasional harian • Validasi GPS • Laporan keuangan</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-center">
                                    <div><p className="text-[18px] font-[800] tracking-tight leading-none">100%</p><p className="text-[11px] font-[600] uppercase tracking-wide text-slate-500">Akurasi hitung</p></div>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div><p className="text-[18px] font-[800] tracking-tight leading-none">&lt;1s</p><p className="text-[11px] font-[600] uppercase tracking-wide text-slate-500">Respon hitung</p></div>
                                    <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                                    <div className="hidden sm:block"><p className="text-[18px] font-[800] tracking-tight leading-none">PDF</p><p className="text-[11px] font-[600] uppercase tracking-wide text-slate-500">Slip & ekspor</p></div>
                                </div>
                            </div>
                        </div>

                        {/* Preview mock */}
                        <div className="mt-10 sm:mt-14 w-full max-w-5xl mx-auto">
                            <div className="relative rounded-[24px] bg-white border border-slate-200/70 shadow-float overflow-hidden p-2 sm:p-3">
                                <div className="rounded-[16px] bg-slate-50 border border-slate-200/60 overflow-hidden">
                                    <div className="h-10 flex items-center gap-2 px-4 border-b border-slate-200/60 bg-white">
                                        <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400" /><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                                        <span className="ml-3 text-[11px] font-[600] tracking-wide text-slate-400 uppercase">Dashboard • SIGURU</span>
                                        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[11px] font-[600] text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sinkron • Aman</span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6">
                                        {[
                                            { k: 'Total Guru', v: '24', sub: '+2 bulan ini', icon: 'lucide:users', c: 'blue' },
                                            { k: 'Sesi Bulan Ini', v: '182', sub: '12 sesi hari ini', icon: 'lucide:calendar-days', c: 'emerald' },
                                            { k: 'Guru Hadir', v: '18/24', sub: '75% kehadiran', icon: 'lucide:user-check', c: 'amber' },
                                            { k: 'Pengeluaran', v: 'Rp 18,4jt', sub: 'Bulan berjalan', icon: 'lucide:wallet', c: 'violet' },
                                        ].map(s => (
                                            <div key={s.k} className="bg-white rounded-2xl border border-slate-200/60 p-4 text-left">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorMap[s.c].bg} ${colorMap[s.c].text} ring-1 ${colorMap[s.c].ring}`}>
                                                    <Icon icon={s.icon} className="text-[16px]" />
                                                </div>
                                                <p className="text-[11px] font-[700] tracking-[0.06em] uppercase text-slate-500 mt-3">{s.k}</p>
                                                <p className="text-[18px] font-[800] tracking-tight text-slate-900 mt-1">{s.v}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">{s.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="fitur" className="py-14 sm:py-20 bg-white border-y border-slate-200/60">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="w-full max-w-6xl mx-auto">
                            <p className="text-[11px] font-[800] tracking-[0.1em] uppercase text-sky-600">Fitur Unggulan</p>
                            <h2 className="text-[28px] sm:text-[34px] font-[800] tracking-[-0.03em] leading-[1.1] text-slate-900 mt-2">Semua kebutuhan penggajian dalam satu tempat</h2>
                            <p className="text-[14px] leading-6 text-slate-600 mt-3 font-[450]">Dirancang untuk bendahara & admin KPM Pusat — meminimalkan human error, mempercepat rekap, dan memastikan setiap sesi tercatat dengan benar.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
                            {features.map(f => {
                                const c = colorMap[f.color];
                                return (
                                    <div key={f.title} className="group relative bg-white rounded-[20px] border border-slate-200/70 p-6 hover:shadow-elevated hover:-translate-y-1 hover:border-slate-200 transition-all duration-300">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${c.bg} ${c.text} ${c.ring} group-hover:scale-105 transition-transform`}>
                                            <Icon icon={f.icon} className="text-[20px]" />
                                        </div>
                                        <h3 className="text-[14px] font-[700] tracking-[-0.01em] text-slate-900 mt-4">{f.title}</h3>
                                        <p className="text-[13px] leading-6 text-slate-600 mt-1.5 font-[450]">{f.desc}</p>
                                        <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-[600] text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Pelajari <Icon icon="lucide:arrow-right" className="text-[12px]" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-12 sm:py-16">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-[24px] bg-slate-900 p-7 sm:p-10">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-600/15 via-transparent to-sky-600/20" />
                            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-sky-500/20 rounded-full blur-3xl" />
                            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-[22px] sm:text-[26px] font-[800] tracking-[-0.02em] text-white leading-tight">Siap mengelola penggajian lebih rapi?</h3>
                                    <p className="text-[13px] leading-6 text-white/60 mt-2 max-w-2xl">Masuk sekarang dan kelola data guru, sesi mengajar, absensi GPS, hingga slip gaji dalam workflow yang mulus di semua perangkat.</p>
                                </div>
                                <Link href={route('login')} className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-900 text-[14px] font-[800] rounded-xl hover:bg-slate-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0">
                                    Masuk ke SIGURU <Icon icon="lucide:arrow-right" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-slate-200/60 bg-white">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-[500] text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white"><Icon icon="lucide:graduation-cap" className="text-[14px]" /></div>
                            <span className="font-[700] tracking-[-0.01em] text-slate-900">SIGURU • KPM Pusat</span>
                            <span className="hidden sm:inline text-slate-300">—</span>
                            <span>Sistem Penggajian Guru</span>
                        </div>
                        <span>© {new Date().getFullYear()} SIGURU • Dibuat untuk pendidikan yang lebih tertata</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
