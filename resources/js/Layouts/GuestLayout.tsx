import { Icon } from '@iconify/react';
import { ReactNode } from 'react';

const APP_NAME = 'SATU GURU KPM';
const APP_TAGLINE = 'Sistem Informasi Administrasi Terpadu Guru KPM';

export default function GuestLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left — dark brand panel */}
            <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col"
                style={{ background: 'linear-gradient(160deg, #0f1117 0%, #131720 60%, #1a1f2e 100%)' }}>
                {/* Ambient glow layers */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />

                <div className="relative z-10 flex flex-col w-full px-12 xl:px-16 py-12 h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                            <Icon icon="tabler:school" className="text-white text-[20px]" />
                        </div>
                        <div>
                            <p className="text-white font-extrabold tracking-wider text-[15px] leading-tight uppercase">{APP_NAME}</p>
                            <p className="text-indigo-200/80 text-[10.5px] font-medium leading-tight mt-0.5">KPM</p>
                        </div>
                    </div>

                    {/* Hero content */}
                    <div className="flex-1 flex flex-col justify-center max-w-[480px] py-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold tracking-wide mb-6">
                            <Icon icon="tabler:shield-check" className="text-[14px]" />
                            Akses Karyawan Resmi
                        </div>
                        <h1 className="text-[34px] xl:text-[38px] font-extrabold tracking-tight leading-[1.1] text-white">
                            Sistem Informasi Administrasi Terpadu{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300">
                                Guru KPM
                            </span>
                        </h1>
                        <p className="text-[15px] leading-relaxed text-slate-400 mt-4">
                            Kelola data guru, jadwal mengajar, presensi berbasis GPS, honor per sesi, hingga slip gaji dalam satu sistem terpadu.
                        </p>

                        <div className="mt-10 space-y-3">
                            {[
                                { icon: 'tabler:users', title: 'Profil guru lengkap', desc: 'Program mengajar, pendidikan & riwayat honor' },
                                { icon: 'tabler:calendar-week', title: 'Jadwal & sesi mengajar', desc: 'Tampilan mingguan dengan status sesi yang jelas' },
                                { icon: 'tabler:fingerprint', title: 'Presensi berbasis GPS', desc: 'Validasi radius lokasi & akurasi perangkat' },
                                { icon: 'tabler:cash', title: 'Honor transparan', desc: 'Rekap per guru & periode yang dapat ditelusuri' },
                            ].map(f => (
                                <div key={f.title} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                                    <span className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
                                        <Icon icon={f.icon} className="text-indigo-300 text-[18px]" />
                                    </span>
                                    <div>
                                        <p className="text-white text-[13px] font-semibold leading-tight">{f.title}</p>
                                        <p className="text-slate-500 text-[12px] leading-tight mt-0.5">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-slate-600 text-[11px] font-medium">
                        © {new Date().getFullYear()} {APP_NAME} · KPM
                    </p>
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
                    <div className="w-full max-w-[420px]">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex flex-col items-center text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Icon icon="tabler:school" className="text-white text-[26px]" />
                            </div>
                            <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 mt-4">{APP_NAME}</h1>
                            <p className="text-[12px] font-semibold tracking-widest uppercase text-indigo-500 mt-1">{APP_TAGLINE}</p>
                        </div>

                        {/* Form card */}
                        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
                            <div className="p-7 sm:p-8">
                                {children}
                            </div>
                        </div>

                        <p className="text-center text-[11.5px] font-medium text-slate-400 mt-5">
                            Butuh bantuan? Hubungi admin KPM
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
