import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

const APP_NAME = 'Satu Guru KPM';
const APP_TAGLINE = 'Sistem Administrasi Guru KPM';

export default function GuestLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex bg-slate-50 mesh-gradient">
            {/* Left - brand panel (indigo/violet) */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-hero-gradient">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(129,140,248,0.35),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(167,139,250,0.32),transparent_45%)]" />
                    <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-2v2h4v-2h-2zm0-30V0h-2v4h-2v2h4V4h-2zM6 34v-4H4v4H2v2h4v-2H6zM6 4V0H4v4H2v2h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                    <div className="absolute -top-28 -right-24 w-[460px] h-[460px] bg-fuchsia-400/25 rounded-full blur-[90px]" />
                    <div className="absolute -bottom-32 -left-28 w-[560px] h-[560px] bg-indigo-400/25 rounded-full blur-[90px]" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-indigo-950/40 to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col w-full px-12 xl:px-16 py-12">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-indigo-950/30">
                            <Icon icon="lucide:graduation-cap" className="text-indigo-700 text-[23px]" />
                        </div>
                        <div>
                            <p className="text-white font-extrabold tracking-[-0.02em] leading-none text-[16px]">{APP_NAME}</p>
                            <p className="text-white/70 text-[11px] font-semibold tracking-[0.08em] uppercase leading-none mt-1">KPM</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[520px] py-12">
                        <h1 className="text-[40px] font-extrabold tracking-[-0.04em] leading-[1.02] text-white">
                            Sistem Administrasi{' '}
                            <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
                                Guru KPM
                            </span>
                        </h1>
                        <p className="text-[15px] leading-7 text-white/70 mt-4 font-medium">
                            Kelola data guru, jadwal mengajar, presensi berbasis GPS, honor per sesi, hingga slip gaji dalam satu sistem yang akurat dan mudah dipantau.
                        </p>

                        <div className="mt-10 grid grid-cols-1 gap-3">
                            {[
                                { icon: 'lucide:users', title: 'Profil guru lengkap', desc: 'Program mengajar, pendidikan, riwayat & honor per grade' },
                                { icon: 'lucide:calendar-range', title: 'Jadwal & sesi mengajar', desc: 'Tampilan mingguan dengan status sesi yang jelas' },
                                { icon: 'lucide:map-pin', title: 'Presensi berbasis GPS', desc: 'Validasi radius lokasi & akurasi perangkat' },
                                { icon: 'lucide:wallet', title: 'Honor transparan', desc: 'Rekap per guru & periode dengan rincian yang dapat ditelusuri' },
                            ].map(f => (
                                <div key={f.title} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.10] border border-white/15 backdrop-blur-md hover:bg-white/[0.16] transition-colors">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400/60 to-violet-400/60 flex items-center justify-center shrink-0 border border-white/20">
                                        <Icon icon={f.icon} className="text-white text-[17px]" />
                                    </span>
                                    <div>
                                        <p className="text-white text-[13px] font-bold leading-none">{f.title}</p>
                                        <p className="text-white/65 text-[12px] leading-none mt-1.5">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-white/50 text-[11px] font-medium">
                        <span>© {new Date().getFullYear()} {APP_NAME}</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span>KPM</span>
                    </div>
                </div>
            </div>

            {/* Right - form */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
                    <div className="w-full max-w-[420px] animate-slide-up">
                        <div className="lg:hidden flex flex-col items-center text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Icon icon="lucide:graduation-cap" className="text-white text-[26px]" />
                            </div>
                            <h1 className="text-[24px] font-extrabold tracking-[-0.03em] text-slate-900 mt-4">{APP_NAME}</h1>
                            <p className="text-[12px] font-semibold tracking-[0.06em] uppercase text-indigo-500">{APP_TAGLINE}</p>
                        </div>

                        <div className="relative bg-white rounded-[24px] border border-indigo-100/70 shadow-float p-7 sm:p-8 overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-gradient" />
                            {children}
                        </div>

                        <p className="text-center text-[11px] font-medium text-slate-400 mt-6">
                            Butuh bantuan? Hubungi admin KPM
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
