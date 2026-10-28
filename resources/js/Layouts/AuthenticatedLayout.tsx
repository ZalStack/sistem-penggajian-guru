import Dropdown from '@/Components/Dropdown';
import FlashMessage from '@/Components/ui/flash-message';
import { Link, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState, ReactNode } from 'react';

interface AuthenticatedLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

interface SharedApp {
    name?: string;
    tagline?: string;
}

const adminNavGroups = [
    {
        title: 'Utama',
        items: [
            { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard', desc: 'Ringkasan data' },
            { href: 'guru.index', pattern: 'guru.*', label: 'Data Guru', icon: 'lucide:users', desc: 'Profil & program' },
        ],
    },
    {
        title: 'Operasional',
        items: [
            { href: 'jadwal.index', pattern: 'jadwal.*', label: 'Jadwal Mengajar', icon: 'lucide:calendar-range', desc: 'Tampilan mingguan' },
            { href: 'session.index', pattern: 'session.*', label: 'Sesi Mengajar', icon: 'lucide:calendar-days', desc: 'Tugas & status' },
            { href: 'attendance.index', pattern: 'attendance.*', label: 'Rekap Absensi', icon: 'lucide:clipboard-check', desc: 'Kehadiran guru' },
            { href: 'perizinan.index', pattern: 'perizinan.*', label: 'Perizinan Guru', icon: 'lucide:shield-check', desc: 'Izin & cuti' },
        ],
    },
    {
        title: 'Keuangan',
        items: [
            { href: 'penggajian.index', pattern: 'penggajian.*', label: 'Penggajian', icon: 'lucide:wallet', desc: 'Honor & pembayaran' },
            { href: 'laporan.index', pattern: 'laporan.*', label: 'Laporan', icon: 'lucide:bar-chart-3', desc: 'Rekap & ekspor' },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            { href: 'grade.index', pattern: 'grade.*', label: 'Grade & Honor', icon: 'lucide:award', desc: 'Tarif per sesi' },
            { href: 'location.index', pattern: 'location.*', label: 'Lokasi Mengajar', icon: 'lucide:map-pinned', desc: 'Titik & radius GPS' },
            { href: 'transport.index', pattern: 'transport.*', label: 'Transport', icon: 'lucide:car-front', desc: 'Biaya transport' },
            { href: 'bahan-ajar.index', pattern: 'bahan-ajar.*', label: 'Bahan Ajar', icon: 'lucide:book-open', desc: 'Materi ajar' },
        ],
    },
    {
        title: 'Sistem',
        items: [
            { href: 'notifications.index', pattern: 'notifications.*', label: 'Notifikasi', icon: 'lucide:bell', desc: 'Pemberitahuan' },
        ],
    },
];

const guruNavItems = [
    { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard', desc: 'Ringkasan hari ini' },
    { href: 'jadwal.index', pattern: 'jadwal.*', label: 'Jadwal Mengajar', icon: 'lucide:calendar-range', desc: 'Agenda mingguan' },
    { href: 'my-attendance', pattern: 'my-attendance.*', label: 'Presensi', icon: 'lucide:clipboard-check', desc: 'Check-in GPS' },
    { href: 'my-bahan-ajar.index', pattern: 'my-bahan-ajar.*', label: 'Bahan Ajar', icon: 'lucide:book-open', desc: 'Materi ajar' },
    { href: 'my-perizinan', pattern: 'my-perizinan.*', label: 'Perizinan', icon: 'lucide:shield-check', desc: 'Ajukan izin' },
    { href: 'my-salary', pattern: 'my-salary.*', label: 'Slip Gaji', icon: 'lucide:banknote', desc: 'Honor & slip' },
    { href: 'notifications.index', pattern: 'notifications.*', label: 'Notifikasi', icon: 'lucide:bell', desc: 'Pemberitahuan' },
];

const guruBottomNav = [
    { href: 'dashboard', pattern: 'dashboard', label: 'Beranda', icon: 'lucide:layout-dashboard' },
    { href: 'jadwal.index', pattern: 'jadwal.*', label: 'Jadwal', icon: 'lucide:calendar-range' },
    { href: 'my-attendance', pattern: 'my-attendance.*', label: 'Presensi', icon: 'lucide:clipboard-check' },
    { href: 'my-salary', pattern: 'my-salary.*', label: 'Gaji', icon: 'lucide:banknote' },
    { href: 'profile.edit', pattern: 'profile.*', label: 'Profil', icon: 'lucide:user' },
];

/* Shared nav item renderer — dark sidebar (desktop + mobile) */
function NavList({ items, collapsed, onNavigate }: {
    items: typeof adminNavGroups[number]['items'];
    collapsed?: boolean;
    onNavigate?: () => void;
}) {
    return (
        <div className="space-y-6 px-3">
            {items.map((item) => {
                const active = route().current(item.pattern);
                return (
                    <Link
                        key={item.href}
                        href={route(item.href)}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'} ${
                            active
                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_8px_18px_-6px_rgba(99,102,241,0.75)]'
                                : 'text-indigo-100/70 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/90 rounded-full -ml-px" />}
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            active ? 'bg-white/20 text-white' : 'bg-white/10 text-indigo-200 group-hover:bg-white/20 group-hover:text-white'
                        } ${collapsed ? 'w-9 h-9' : ''}`}>
                            <Icon icon={item.icon} className="text-[16px]" />
                        </span>
                        {!collapsed && (
                            <span className="min-w-0 flex-1">
                                <span className={`block text-[13.5px] font-semibold tracking-[-0.01em] leading-none ${active ? 'text-white' : ''}`}>{item.label}</span>
                                {item.desc && <span className={`block text-[11px] leading-none mt-1 ${active ? 'text-white/70' : 'text-indigo-300/60'}`}>{item.desc}</span>}
                            </span>
                        )}
                        {active && !collapsed && <Icon icon="lucide:chevron-right" className="text-white/50 text-[14px] shrink-0" />}
                    </Link>
                );
            })}
        </div>
    );
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const { props } = usePage<{
        app?: SharedApp;
        auth: { user: { name: string; email: string; role: string } };
        flash?: { success?: string; error?: string; warning?: string; info?: string };
        unreadNotifications?: number;
    }>();
    const user = props.auth.user;
    const flash = props.flash;
    const unreadCount = props.unreadNotifications ?? 0;
    const appName = props.app?.name || 'Satu Guru KPM';
    const appTagline = props.app?.tagline || 'Sistem Administrasi Guru KPM';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const isAdmin = user?.role === 'admin';
    const flatAdminItems = adminNavGroups.flatMap(g => g.items);
    const navItems = isAdmin ? flatAdminItems : guruNavItems;
    const activeItem = navItems.find((item) => route().current(item.pattern));

    const initials = (user?.name || 'A').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

    const sidebarInner = (isCollapsed: boolean, forMobile = false) => (
        <>
            {/* Logo */}
            <div className={`h-[70px] px-5 flex items-center gap-3 border-b border-white/10 shrink-0 ${isCollapsed ? 'justify-center px-2' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_8px_18px_-6px_rgba(99,102,241,0.8)]">
                    <Icon icon="lucide:graduation-cap" className="text-white text-[21px]" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-extrabold tracking-[-0.03em] text-white truncate">{appName}</p>
                        <p className="text-[11px] font-medium text-indigo-300/70 leading-none mt-1 truncate">{appTagline}</p>
                    </div>
                )}
                {forMobile && (
                    <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 rounded-xl hover:bg-white/10 text-indigo-100" aria-label="Tutup menu">
                        <Icon icon="lucide:x" className="text-[18px]" />
                    </button>
                )}
            </div>

            {/* Nav — scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-thin py-6">
                {isAdmin ? (
                    <div className="space-y-6 px-3">
                        {adminNavGroups.map(group => (
                            <div key={group.title}>
                                {!isCollapsed && <p className="px-3 mb-2.5 text-[11px] font-bold tracking-[0.1em] text-indigo-300/50 uppercase">{group.title}</p>}
                                <NavList items={group.items} collapsed={isCollapsed} onNavigate={forMobile ? () => setMobileOpen(false) : undefined} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        {!isCollapsed && <p className="px-6 mb-3 text-[11px] font-bold tracking-[0.1em] text-indigo-300/50 uppercase">Menu Guru</p>}
                        <NavList items={guruNavItems} collapsed={isCollapsed} onNavigate={forMobile ? () => setMobileOpen(false) : undefined} />
                    </div>
                )}
            </div>

            {/* Collapse toggle & user */}
            <div className="p-3 border-t border-white/10 space-y-3 shrink-0">
                {!forMobile && (
                    <button
                        onClick={() => setCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-100 hover:text-white transition-colors border border-white/10"
                    >
                        <Icon icon={isCollapsed ? 'lucide:panel-right-open' : 'lucide:panel-left-close'} className="text-[16px]" />
                        {!isCollapsed && <span className="text-[12.5px] font-semibold">Ciutkan</span>}
                    </button>
                )}
                <Link href={route('profile.edit')} className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group ${isCollapsed ? 'justify-center' : ''}`}>
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-extrabold text-[12px] shrink-0 shadow-md">
                        {initials}
                    </span>
                    {!isCollapsed && (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-bold tracking-[-0.01em] text-white truncate">{user.name}</span>
                                <span className="block text-[11px] text-indigo-300/70 truncate leading-none mt-1">{isAdmin ? 'Administrator' : 'Guru'}</span>
                            </span>
                            <Icon icon="lucide:chevron-right" className="text-indigo-300/60 group-hover:text-white text-[14px] shrink-0" />
                        </>
                    )}
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white mesh-gradient">
            {/* Sidebar — desktop (dark indigo/violet) */}
            <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-40 bg-sidebar-gradient flex-col transition-all duration-300 ${collapsed ? 'w-[84px]' : 'w-[280px]'} shadow-[8px_0_30px_-16px_rgba(30,27,75,0.6)]`}>
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/15 to-transparent pointer-events-none" />
                <div className="relative flex flex-col h-full">{sidebarInner(collapsed)}</div>
            </aside>

            {/* Mobile sidebar (same dark identity) */}
            <div className={`lg:hidden fixed inset-0 z-50 transition ${mobileOpen ? 'visible' : 'invisible'}`}>
                <div onClick={() => setMobileOpen(false)} className={`absolute inset-0 bg-indigo-950/40 backdrop-blur-sm transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
                <aside className={`absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-sidebar-gradient flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
                    {sidebarInner(false, true)}
                </aside>
            </div>

            {/* Main */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[280px]'}`}>
                {/* Header — sticky */}
                <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-indigo-100/70 shadow-[0_1px_3px_rgba(79,70,229,0.05)]">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />
                    <div className="flex items-center justify-between h-[68px] px-4 sm:px-6 lg:px-8 xl:px-10 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50 shadow-sm" aria-label="Buka menu">
                                <Icon icon="lucide:menu" className="text-[18px]" />
                            </button>
                            <div className="flex items-center gap-2 text-[13px] min-w-0">
                                <span className="font-bold tracking-[-0.01em] text-slate-900 truncate">{activeItem?.label || 'Dashboard'}</span>
                                <span className="hidden lg:inline text-[11px] font-medium text-slate-400 truncate">— {activeItem?.desc || appName}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <Link href={route('notifications.index')} className="relative w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm hover:shadow transition-all" aria-label="Notifikasi">
                                <Icon icon="lucide:bell" className="text-[18px]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>

                            <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-indigo-100">
                                <div className="text-right hidden lg:block">
                                    <p className="text-[13px] font-bold leading-none tracking-[-0.01em] text-slate-900">{user.name}</p>
                                    <p className="text-[11px] font-medium text-slate-500 leading-none mt-1">{isAdmin ? 'Administrator' : 'Guru'}</p>
                                </div>
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-2 p-1 pr-2 rounded-full bg-white border border-indigo-100 shadow-sm hover:shadow hover:border-indigo-200 transition-all">
                                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-[12px] shadow-[0_4px_10px_-4px_rgba(99,102,241,0.8)]">
                                                {initials}
                                            </span>
                                            <Icon icon="lucide:chevron-down" className="text-indigo-400 text-[14px] hidden sm:block" />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content width="64">
                                        <div className="px-4 py-4 bg-gradient-to-br from-indigo-50/70 to-violet-50/50">
                                            <p className="text-[11px] font-bold tracking-[0.08em] text-indigo-400 uppercase">Masuk sebagai</p>
                                            <p className="text-[14px] font-bold tracking-[-0.01em] text-slate-900 mt-1 truncate">{user.name}</p>
                                            <p className="text-[12px] text-slate-500 truncate">{user.email}</p>
                                            <span className={`inline-flex mt-2 px-2 py-1 rounded-full text-[10px] font-bold tracking-[0.06em] uppercase border ${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{isAdmin ? 'Administrator' : 'Guru'}</span>
                                        </div>
                                        <div className="py-2 border-t border-slate-100">
                                            <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center"><Icon icon="lucide:user" className="text-[14px] text-indigo-600" /></span>
                                                <span className="text-[13px] font-semibold">Profil Saya</span>
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('profile.edit') + '#ubah-kata-sandi'} className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Icon icon="lucide:key-round" className="text-[14px] text-amber-600" /></span>
                                                <span className="text-[13px] font-semibold">Ubah Kata Sandi</span>
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 text-rose-600">
                                                <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><Icon icon="lucide:log-out" className="text-[14px] text-rose-600" /></span>
                                                <span className="text-[13px] font-semibold">Keluar Akun</span>
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Flash */}
                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 pt-5 sm:pt-6 space-y-4 w-full">
                    {flash?.success && <FlashMessage type="success" message={flash.success} />}
                    {(flash?.error || (props.errors as any)?.error) && <FlashMessage type="error" message={flash?.error || (props.errors as any)?.error} />}
                    {flash?.warning && <FlashMessage type="warning" message={flash.warning} />}
                    {flash?.info && <FlashMessage type="info" message={flash.info} />}
                </div>

                {/* Content */}
                <main className={`flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-7 lg:py-9 w-full ${!isAdmin ? 'pb-28 lg:pb-10' : 'pb-10'}`}>
                    {children}
                </main>

                <footer className="hidden lg:block border-t border-indigo-100/70 bg-white/60 px-6 lg:px-8 xl:px-10 py-4">
                    <div className="w-full flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span>© {new Date().getFullYear()} {appName} — {appTagline}</span>
                    </div>
                </footer>
            </div>

            {/* Guru bottom nav (mobile) */}
            {!isAdmin && (
                <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-indigo-100/70 safe-area-pb shadow-[0_-8px_24px_rgba(49,46,129,0.08)]">
                    <div className="flex items-center justify-around h-[70px] px-2 max-w-lg mx-auto">
                        {guruBottomNav.map(item => {
                            const active = route().current(item.pattern);
                            return (
                                <Link key={item.href} href={route(item.href)} className="flex flex-col items-center gap-1 flex-1 py-2 min-w-0">
                                    <span className={`w-10 h-9 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_6px_14px_-6px_rgba(99,102,241,0.8)] scale-105' : 'text-slate-400'}`}>
                                        <Icon icon={item.icon} className="text-[18px]" />
                                    </span>
                                    <span className={`text-[10px] font-bold tracking-[0.02em] uppercase truncate ${active ? 'text-indigo-700' : 'text-slate-400'}`}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}
