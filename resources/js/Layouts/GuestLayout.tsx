import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

export default function GuestLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left - brand panel */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-2v2h4v-2h-2zm0-30V0h-2v4h-2v2h4V4h-2zM6 34v-4H4v4H2v2h4v-2H6zM6 4V0H4v4H2v2h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                    <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[80px]" />
                </div>

                <div className="relative z-10 flex flex-col w-full px-12 xl:px-16 py-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                            <Icon icon="lucide:graduation-cap" className="text-slate-900 text-[22px]" />
                        </div>
                        <div>
                            <p className="text-white font-[800] tracking-[-0.02em] leading-none">SIGURU</p>
                            <p className="text-white/60 text-[11px] font-[600] tracking-[0.08em] uppercase leading-none mt-0.5">KPM Pusat</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[520px] py-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-[11px] font-[700] tracking-[0.06em] uppercase w-fit">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Tahun Ajaran 2026/27 • Live
                        </div>
                        <h1 className="text-[42px] font-[800] tracking-[-0.04em] leading-[0.95] text-white mt-6">
                            Sistem Penggajian Guru <span className="bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">Terpadu</span>
                        </h1>
                        <p className="text-[16px] leading-6 text-white/60 mt-4 font-[450]">
                            Kelola absensi GPS, honor per sesi, tunjangan transport, dan slip gaji dalam satu platform modern yang akurat & efisien.
                        </p>

                        <div className="mt-10 grid grid-cols-1 gap-3">
                            {[
                                { icon: 'lucide:map-pin', title: 'Absensi berbasis GPS', desc: 'Validasi radius lokasi & akurasi real-time' },
                                { icon: 'lucide:calculator', title: 'Hitung otomatis', desc: 'Honor + transport + tunjangan khusus' },
                                { icon: 'lucide:file-check', title: 'Slip & laporan PDF', desc: 'Ekspor resmi siap cetak & audit' },
                            ].map(f => (
                                <div key={f.title} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Icon icon={f.icon} className="text-white/80 text-[16px]" />
                                    </div>
                                    <div>
                                        <p className="text-white text-[13px] font-[700] leading-none">{f.title}</p>
                                        <p className="text-white/60 text-[12px] leading-none mt-1">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-white/40 text-[11px] font-[500]">
                        <span>© {new Date().getFullYear()} SIGURU</span>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span>KPM Pusat • Pendidikan Berkualitas</span>
                    </div>
                </div>
            </div>

            {/* Right - form */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
                    <div className="w-full max-w-[420px] animate-slide-up">
                        <div className="lg:hidden flex flex-col items-center text-center mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                                <Icon icon="lucide:graduation-cap" className="text-white text-[22px]" />
                            </div>
                            <h1 className="text-[22px] font-[800] tracking-[-0.03em] text-slate-900 mt-4">SIGURU</h1>
                            <p className="text-[12px] font-[600] tracking-[0.06em] uppercase text-slate-500">KPM Pusat • Sistem Penggajian Guru</p>
                        </div>

                        <div className="bg-white rounded-[24px] border border-slate-200/70 shadow-float p-7 sm:p-8">
                            {children}
                        </div>

                        <p className="text-center text-[11px] font-[500] text-slate-400 mt-6">
                            Butuh bantuan? Hubungi admin KPM Pusat
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
