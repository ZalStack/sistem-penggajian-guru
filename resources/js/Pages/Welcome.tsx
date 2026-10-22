import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

const features = [
    { icon: 'lucide:users', title: 'Manajemen Guru Lengkap', desc: 'Data guru, NIP, domisili, kontak, grade, mapel, hingga rekening & tunjangan khusus.', color: 'blue' },
    { icon: 'lucide:award', title: 'Grade & Honor Transparan', desc: 'Tarif per sesi terstandarisasi, fleksibel, dan audit-friendly.', color: 'violet' },
    { icon: 'lucide:car-front', title: 'Transportasi Fleksibel', desc: 'Online, Dalam Kota, Luar Kota — otomatis terhitung.', color: 'emerald' },
    { icon: 'lucide:calculator', title: 'Kalkulasi Otomatis', desc: 'Honor × sesi + transport + tunjangan, anti-duplikasi periode.', color: 'amber' },
    { icon: 'lucide:receipt', title: 'Slip Gaji Digital', desc: 'Slip siap cetak dengan rincian lengkap & pengesahan.', color: 'fuchsia' },
    { icon: 'lucide:bar-chart-3', title: 'Laporan & Ekspor', desc: 'Filter per periode/grade/mapel, ekspor PDF & Excel.', color: 'rose' },
];

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-200' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', ring: 'ring-fuchsia-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-200' },
};

export default function Welcome({ auth, canLogin }: { auth: { user?: { name: string } }; canLogin: boolean }) {
    return (
        <>
            <Head title="SIGURU — Sistem Penggajian Guru KPM Pusat" />
            <div className="min-h-screen flex flex-col bg-white selection:bg-indigo-600 selection:text-white">
                {/* Nav */}
                <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-indigo-100/60">
                    <div className="w-full px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
                                <Icon icon="lucide:graduation-cap" className="text-white text-[18px]" />
                            </div>
                            <div>
                                <p className="text-[15px] font-extrabold tracking-[-0.03em] leading-none text-slate-900">SIGURU</p>
                                <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-indigo-500 leading-none mt-0.5">KPM Pusat</p>
                            </div>
                            <span className="hidden sm:inline-flex ml-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold tracking-[0.04em] uppercase text-emerald-700 items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live • 2026/27
                            </span>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="hidden md:inline text-[12.5px] font-medium text-slate-500 mr-2">Sistem terpadu untuk KPM Pusat</span>
                            {auth.user ? (
                                <Link href={route('dashboard')} className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-brand hover:shadow-brand-lg hover:-translate-y-px transition-all">
                                    <Icon icon="lucide:layout-dashboard" /> Dashboard
                                </Link>
                            ) : canLogin ? (
                                <Link href={route('login')} className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-brand hover:shadow-brand-lg hover:-translate-y-px transition-all">
                                    Masuk <Icon icon="lucide:arrow-right" className="text-[14px]" />
                                </Link>
                            ) : null}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden bg-hero-gradient">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(129,140,248,0.35),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(167,139,250,0.32),transparent_45%)]" />
                        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-2v2h4v-2h-2zm0-30V0h-2v4h-2v2h4V4h-2zM6 34v-4H4v4H2v2h4v-2H6zM6 4V0H4v4H2v2h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                        <div className="absolute -top-28 -right-24 w-[460px] h-[460px] bg-fuchsia-400/25 rounded-full blur-[90px]" />
                        <div className="absolute -bottom-32 -left-28 w-[560px] h-[560px] bg-indigo-400/25 rounded-full blur-[90px]" />
                    </div>

                    <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16">
                        <div className="w-full max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm text-[11px] font-bold tracking-[0.06em] uppercase text-white/90">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Dipercaya KPM Pusat • Akurat & Efisien
                            </div>
                            <h1 className="text-[34px] sm:text-[54px] font-extrabold tracking-[-0.04em] leading-[0.98] text-white mt-6">
                                Kelola penggajian guru{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10 bg-gradient-to-r from-fuchsia-300 via-violet-300 to-indigo-200 bg-clip-text text-transparent">secara presisi</span>
                                    <span className="absolute bottom-1 left-0 right-0 h-3 bg-white/10 rounded-full -rotate-1 -z-0" />
                                </span>
                            </h1>
                            <p className="text-[15px] sm:text-[17px] leading-7 text-white/70 mt-5 font-medium max-w-2xl mx-auto">
                                Otomasi honor per sesi, tunjangan transport, tunjangan khusus, validasi GPS, slip digital, dan laporan ekspor — dalam satu platform yang <span className="font-bold text-white">cepat, transparan, dan dapat diaudit.</span>
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                                <Link href={route('login')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3.5 bg-white text-indigo-700 text-[14px] font-bold tracking-[-0.01em] rounded-xl hover:bg-indigo-50 shadow-[0_12px_28px_rgba(49,46,129,0.35)] hover:-translate-y-0.5 transition-all">
                                    <Icon icon="lucide:log-in" className="text-[18px]" /> Masuk ke Sistem
                                </Link>
                                <a href="#fitur" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3.5 bg-white/10 border border-white/25 text-white text-[14px] font-bold rounded-xl hover:bg-white/[0.18] backdrop-blur-sm transition-all">
                                    Lihat Fitur <Icon icon="lucide:arrow-down" />
                                </a>
                            </div>

                            {/* Trust bar */}
                            <div className="mt-10 p-4 sm:p-5 bg-white/[0.10] rounded-[20px] border border-white/15 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400/60 to-violet-400/60 border-2 border-white/40 flex items-center justify-center text-[10px] font-extrabold text-white">
                                                {String.fromCharCode(64+i)}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full bg-white border-2 border-white/40 flex items-center justify-center text-indigo-700 text-[10px] font-extrabold">+12</div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold text-white leading-none">Dipercaya 15+ guru KPM</p>
                                        <p className="text-[11px] text-white/60 leading-none mt-1.5">Operasional harian • Validasi GPS • Laporan keuangan</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-center">
                                    <div><p className="text-[18px] font-extrabold tracking-tight leading-none text-white">100%</p><p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Akurasi hitung</p></div>
                                    <div className="w-px h-8 bg-white/20" />
                                    <div><p className="text-[18px] font-extrabold tracking-tight leading-none text-white">&lt;1s</p><p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Respon hitung</p></div>
                                    <div className="w-px h-8 bg-white/20 hidden sm:block" />
                                    <div className="hidden sm:block"><p className="text-[18px] font-extrabold tracking-tight leading-none text-white">PDF</p><p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Slip & ekspor</p></div>
                                </div>
                            </div>
                        </div>

                        {/* Preview mock */}
                        <div className="mt-10 sm:mt-14 w-full max-w-5xl mx-auto">
                            <div className="relative rounded-[24px] bg-white border border-white/60 shadow-float overflow-hidden p-2 sm:p-3">
                                <div className="rounded-[16px] bg-slate-50 border border-slate-200/60 overflow-hidden">
                                    <div className="h-10 flex items-center gap-2 px-4 border-b border-slate-200/60 bg-white">
                                        <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400" /><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                                        <span className="ml-3 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Dashboard • SIGURU</span>
                                        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sinkron • Aman</span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6">
                                        {[
                                            { k: 'Total Guru', v: '24', sub: '+2 bulan ini', icon: 'lucide:users', c: 'blue' },
                                            { k: 'Sesi Bulan Ini', v: '182', sub: '12 sesi hari ini', icon: 'lucide:calendar-days', c: 'emerald' },
                                            { k: 'Guru Hadir', v: '18/24', sub: '75% kehadiran', icon: 'lucide:user-check', c: 'amber' },
                                            { k: 'Pengeluaran', v: 'Rp 18,4jt', sub: 'Bulan berjalan', icon: 'lucide:wallet', c: 'violet' },
                                        ].map(s => (
                                            <div key={s.k} className="bg-white rounded-2xl border border-indigo-100/70 p-4 text-left shadow-[0_1px_3px_rgba(79,70,229,0.06)]">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorMap[s.c].bg} ${colorMap[s.c].text} ring-1 ${colorMap[s.c].ring}`}>
                                                    <Icon icon={s.icon} className="text-[16px]" />
                                                </div>
                                                <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate-500 mt-3">{s.k}</p>
                                                <p className="text-[18px] font-extrabold tracking-tight text-slate-900 mt-1 break-words">{s.v}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">{s.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="fitur" className="py-14 sm:py-20 bg-white border-b border-indigo-100/60">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="w-full max-w-6xl mx-auto">
                            <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-indigo-600">Fitur Unggulan</p>
                            <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-[1.1] text-slate-900 mt-2">Semua kebutuhan penggajian dalam <span className="text-brand-gradient">satu tempat</span></h2>
                            <p className="text-[14px] leading-6 text-slate-600 mt-3 font-medium">Dirancang untuk bendahara & admin KPM Pusat — meminimalkan human error, mempercepat rekap, dan memastikan setiap sesi tercatat dengan benar.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
                            {features.map(f => {
                                const c = colorMap[f.color];
                                return (
                                    <div key={f.title} className="group relative bg-white rounded-[20px] border border-slate-200/70 p-6 hover:shadow-elevated hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${c.bg} ${c.text} ${c.ring} group-hover:scale-105 transition-transform`}>
                                            <Icon icon={f.icon} className="text-[20px]" />
                                        </div>
                                        <h3 className="text-[14px] font-bold tracking-[-0.01em] text-slate-900 mt-4">{f.title}</h3>
                                        <p className="text-[13px] leading-6 text-slate-600 mt-1.5 font-medium">{f.desc}</p>
                                        <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Pelajari <Icon icon="lucide:arrow-right" className="text-[12px]" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-12 sm:py-16 bg-slate-50 mesh-gradient">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-[24px] bg-hero-gradient p-7 sm:p-10 shadow-brand-lg">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(129,140,248,0.4),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(232,121,249,0.28),transparent_45%)]" />
                            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-fuchsia-400/25 rounded-full blur-3xl" />
                            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-white leading-tight">Siap mengelola penggajian lebih rapi?</h3>
                                    <p className="text-[13px] leading-6 text-white/70 mt-2 max-w-2xl">Masuk sekarang dan kelola data guru, sesi mengajar, absensi GPS, hingga slip gaji dalam workflow yang mulus di semua perangkat.</p>
                                </div>
                                <Link href={route('login')} className="w-full lg:w-auto shrink-0 inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3.5 bg-white text-indigo-700 text-[14px] font-extrabold rounded-xl hover:bg-indigo-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                    Masuk ke SIGURU <Icon icon="lucide:arrow-right" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-indigo-100/60 bg-white">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-medium text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-white"><Icon icon="lucide:graduation-cap" className="text-[14px]" /></div>
                            <span className="font-bold tracking-[-0.01em] text-slate-900">SIGURU • KPM Pusat</span>
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
