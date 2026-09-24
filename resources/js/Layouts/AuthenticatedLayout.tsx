import Dropdown from '@/Components/Dropdown';
import FlashMessage from '@/Components/ui/flash-message';
import { Link, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState, ReactNode } from 'react';

interface AuthenticatedLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

const adminNavGroups = [
    {
        title: 'Utama',
        items: [
            { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard', desc: 'Ringkasan' },
            { href: 'guru.index', pattern: 'guru.*', label: 'Data Guru', icon: 'lucide:users', desc: 'Kelola pengajar' },
        ]
    },
    {
        title: 'Operasional',
        items: [
            { href: 'grade.index', pattern: 'grade.*', label: 'Grade & Honor', icon: 'lucide:award', desc: 'Tarif per sesi' },
            { href: 'transport.index', pattern: 'transport.*', label: 'Transport', icon: 'lucide:car-front', desc: 'Biaya transport' },
            { href: 'location.index', pattern: 'location.*', label: 'Lokasi Absensi', icon: 'lucide:map-pinned', desc: 'GPS radius' },
            { href: 'session.index', pattern: 'session.*', label: 'Sesi Mengajar', icon: 'lucide:calendar-days', desc: 'Jadwal' },
            { href: 'attendance.index', pattern: 'attendance.*', label: 'Rekap Absensi', icon: 'lucide:clipboard-check', desc: 'Kehadiran' },
            { href: 'perizinan.index', pattern: 'perizinan.*', label: 'Perizinan', icon: 'lucide:shield-check', desc: 'Izin & cuti' },
        ]
    },
    {
        title: 'Keuangan',
        items: [
            { href: 'salary.index', pattern: 'salary.*', label: 'Penggajian', icon: 'lucide:wallet', desc: 'Hitung & bayar' },
            { href: 'laporan.index', pattern: 'laporan.*', label: 'Laporan', icon: 'lucide:bar-chart-3', desc: 'Rekap & ekspor' },
        ]
    },
    {
        title: 'Sistem',
        items: [
            { href: 'notifications.index', pattern: 'notifications.*', label: 'Notifikasi', icon: 'lucide:bell-ring', desc: 'Pemberitahuan' },
        ]
    }
];

const guruNavItems = [
    { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard' },
    { href: 'my-attendance', pattern: 'my-attendance.*', label: 'Absensi Hari Ini', icon: 'lucide:clipboard-check' },
    { href: 'my-perizinan', pattern: 'my-perizinan.*', label: 'Perizinan', icon: 'lucide:shield-check' },
    { href: 'my-salary', pattern: 'my-salary.*', label: 'Slip Gaji', icon: 'lucide:banknote' },
    { href: 'notifications.index', pattern: 'notifications.*', label: 'Notifikasi', icon: 'lucide:bell' },
];

const guruBottomNav = [
    { href: 'dashboard', pattern: 'dashboard', label: 'Beranda', icon: 'lucide:layout-dashboard' },
    { href: 'my-attendance', pattern: 'my-attendance.*', label: 'Absensi', icon: 'lucide:clipboard-check' },
    { href: 'my-perizinan', pattern: 'my-perizinan.*', label: 'Perizinan', icon: 'lucide:shield-check' },
    { href: 'my-salary', pattern: 'my-salary.*', label: 'Gaji', icon: 'lucide:banknote' },
    { href: 'profile.edit', pattern: 'profile.*', label: 'Profil', icon: 'lucide:user' },
];

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const { props } = usePage<{
        auth: { user: { name: string; email: string; role: string } };
        flash?: { success?: string; error?: string; warning?: string; info?: string };
        unreadNotifications?: number;
    }>();
    const user = props.auth.user;
    const flash = props.flash;
    const unreadCount = props.unreadNotifications ?? 0;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const isAdmin = user?.role === 'admin';
    const flatAdminItems = adminNavGroups.flatMap(g => g.items);
    const navItems = isAdmin ? flatAdminItems : guruNavItems;
    const activeItem = navItems.find((item) => route().current(item.pattern));

    const initials = (user?.name || 'A').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
            {/* Sidebar - Admin */}
            <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/70 flex-col transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}>
                {/* Logo */}
                <div className={`h-[68px] px-5 flex items-center gap-3 border-b border-slate-100 shrink-0 ${collapsed ? 'justify-center px-2' : ''}`}>
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-md">
                        <Icon icon="lucide:graduation-cap" className="text-white text-[20px]" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-[800] tracking-[-0.03em] text-slate-900">SIGURU</span>
                                <span className="text-[9px] font-[700] tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-md bg-slate-900 text-white">KPM</span>
                            </div>
                            <p className="text-[11px] font-[500] text-slate-500 leading-none mt-0.5">Pusat • TA 2026/27</p>
                        </div>
                    )}
                </div>

                {/* Nav - scrollable */}
                <div className="flex-1 overflow-y-auto scrollbar-thin py-6">
                    {isAdmin ? (
                        <div className="space-y-6 px-3">
                            {adminNavGroups.map(group => (
                                <div key={group.title}>
                                    {!collapsed && <p className="px-3 mb-2.5 text-[11px] font-[700] tracking-[0.08em] text-slate-400 uppercase">{group.title}</p>}
                                    <div className="space-y-1">
                                        {group.items.map(item => {
                                            const active = route().current(item.pattern);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={route(item.href)}
                                                    title={collapsed ? item.label : undefined}
                                                    className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'} ${active ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                                >
                                                    {active && !collapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/80 rounded-full -ml-px" />}
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'} ${collapsed ? 'w-9 h-9' : ''}`}>
                                                        <Icon icon={item.icon} className="text-[16px]" />
                                                    </div>
                                                    {!collapsed && (
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-[13.5px] font-[600] tracking-[-0.01em] leading-none ${active ? 'text-white' : 'text-slate-700'}`}>{item.label}</p>
                                                            <p className={`text-[11px] font-[450] leading-none mt-1 ${active ? 'text-white/60' : 'text-slate-400'}`}>{item.desc}</p>
                                                        </div>
                                                    )}
                                                    {active && !collapsed && <Icon icon="lucide:chevron-right" className="text-white/40 text-[14px] shrink-0" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 space-y-1">
                            {!collapsed && <p className="px-3 mb-3 text-[11px] font-[700] tracking-[0.08em] text-slate-400 uppercase">Menu Guru</p>}
                            {guruNavItems.map(item => {
                                const active = route().current(item.pattern);
                                return (
                                    <Link key={item.href} href={route(item.href)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-[600] transition-colors ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                                        <Icon icon={item.icon} className="text-[18px] shrink-0" />
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Collapse toggle & user */}
                <div className="p-3 border-t border-slate-100 space-y-3 shrink-0">
                    <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/60">
                        <Icon icon={collapsed ? 'lucide:panel-right-open' : 'lucide:panel-left-close'} className="text-[16px]" />
                        {!collapsed && <span className="text-[12.5px] font-[600]">Ciutkan</span>}
                    </button>
                    <Link href={route('profile.edit')} className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all group ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-[800] text-[12px] shrink-0 shadow-sm">
                            {initials}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-[700] tracking-[-0.01em] text-slate-900 truncate">{user.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate leading-none mt-0.5">{user.email}</p>
                                </div>
                                <Icon icon="lucide:chevron-right" className="text-slate-400 group-hover:text-slate-600 text-[14px] shrink-0" />
                            </>
                        )}
                    </Link>
                </div>
            </aside>

            {/* Mobile sidebar */}
            <div className={`lg:hidden fixed inset-0 z-50 transition ${mobileOpen ? 'visible' : 'invisible'}`}>
                <div onClick={() => setMobileOpen(false)} className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
                <aside className={`absolute left-0 top-0 bottom-0 w-[300px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="h-[64px] px-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                            <Icon icon="lucide:graduation-cap" className="text-white text-[18px]" />
                        </div>
                        <div>
                            <p className="text-[15px] font-[800] tracking-tight">SIGURU</p>
                            <p className="text-[11px] text-slate-500 -mt-1">KPM Pusat</p>
                        </div>
                        <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 rounded-xl hover:bg-slate-100">
                            <Icon icon="lucide:x" className="text-[18px]" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {(isAdmin ? flatAdminItems : guruNavItems).map(item => {
                            const active = route().current(item.pattern);
                            return (
                                <Link key={item.href} href={route(item.href)} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl ${active ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                                    <Icon icon={item.icon} className="text-[18px]" />
                                    <span className="text-[14px] font-[600]">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </aside>
            </div>

            {/* Main */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[80px]' : 'lg:pl-[280px]'}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
                    <div className="flex items-center justify-between h-[72px] px-5 sm:px-8 lg:px-10 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                                <Icon icon="lucide:menu" className="text-[18px]" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2 text-[13px]">
                                <Link href={route('dashboard')} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                                    <Icon icon="lucide:home" className="text-[14px]" />
                                </Link>
                                <Icon icon="lucide:chevron-right" className="text-slate-300 text-[12px]" />
                                <span className="font-[700] tracking-[-0.01em] text-slate-900 truncate">{activeItem?.label || 'Dashboard'}</span>
                                <span className="hidden lg:inline-flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[11px] font-[600] tracking-[0.02em] uppercase">Live</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Search - desktop */}
                            <div className="hidden xl:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-500">
                                <Icon icon="lucide:search" className="text-[14px]" />
                                <span className="text-[12.5px] font-[500] pr-8">Cari guru, grade...</span>
                                <span className="text-[11px] font-[600] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">⌘K</span>
                            </div>

                            <Link href={route('notifications.index')} className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:shadow transition-all">
                                <Icon icon="lucide:bell" className="text-[18px]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-[800] rounded-full flex items-center justify-center ring-2 ring-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>

                            <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-slate-200">
                                <div className="text-right hidden lg:block">
                                    <p className="text-[13px] font-[700] leading-none tracking-[-0.01em] text-slate-900">{user.name}</p>
                                    <p className="text-[11px] font-[500] text-slate-500 leading-none mt-1">{isAdmin ? 'Administrator' : 'Guru'} • Online</p>
                                </div>
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-2 p-1 pr-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow hover:border-slate-300 transition-all">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-[800] text-[12px]">
                                                {initials}
                                            </div>
                                            <Icon icon="lucide:chevron-down" className="text-slate-400 text-[14px] hidden sm:block" />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content width="64">
                                        <div className="px-4 py-4">
                                            <p className="text-[11px] font-[700] tracking-[0.08em] text-slate-400 uppercase">Masuk sebagai</p>
                                            <p className="text-[14px] font-[700] tracking-[-0.01em] text-slate-900 mt-1 truncate">{user.name}</p>
                                            <p className="text-[12px] text-slate-500 truncate">{user.email}</p>
                                            <span className={`inline-flex mt-2 px-2 py-1 rounded-full text-[10px] font-[700] tracking-[0.06em] uppercase border ${isAdmin ? 'bg-slate-900 text-white border-slate-900' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>{isAdmin ? 'Administrator' : 'Guru'}</span>
                                        </div>
                                        <div className="py-2 border-t border-slate-100">
                                            <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><Icon icon="lucide:user" className="text-[14px] text-slate-600" /></span>
                                                <span className="text-[13px] font-[600]">Pengaturan Profil</span>
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 text-rose-600">
                                                <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><Icon icon="lucide:log-out" className="text-[14px] text-rose-600" /></span>
                                                <span className="text-[13px] font-[600]">Keluar Akun</span>
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Flash */}
                <div className="px-5 sm:px-8 lg:px-10 pt-6 sm:pt-8 space-y-4 w-full">
                    {flash?.success && <FlashMessage type="success" message={flash.success} />}
                    {(flash?.error || (props.errors as any)?.error) && <FlashMessage type="error" message={flash?.error || (props.errors as any)?.error} />}
                    {flash?.warning && <FlashMessage type="warning" message={flash.warning} />}
                    {flash?.info && <FlashMessage type="info" message={flash.info} />}
                </div>

                {/* Content — FULL WIDTH with generous breathing */}
                <main className={`flex-1 px-5 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-10 w-full ${!isAdmin ? 'pb-28 lg:pb-10' : ''}`}>
                    {children}
                </main>

                <footer className="hidden lg:block border-t border-slate-200/60 bg-white/50 px-5 sm:px-8 lg:px-10 py-4">
                    <div className="w-full flex items-center justify-between text-[11px] font-[500] text-slate-400">
                        <span>© {new Date().getFullYear()} SIGURU — KPM Pusat • Dibuat dengan ♥ untuk pendidikan</span>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Semua sistem berjalan normal</span>
                    </div>
                </footer>
            </div>

            {/* Guru bottom nav */}
            {!isAdmin && (
                <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/70 safe-area-pb shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-around h-[72px] px-2 max-w-lg mx-auto">
                        {guruBottomNav.map(item => {
                            const active = route().current(item.pattern);
                            return (
                                <Link key={item.href} href={route(item.href)} className="flex flex-col items-center gap-1 flex-1 py-2">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-400'}`}>
                                        <Icon icon={item.icon} className="text-[18px]" />
                                    </div>
                                    <span className={`text-[10px] font-[700] tracking-[0.02em] uppercase ${active ? 'text-slate-900' : 'text-slate-400'}`}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}
