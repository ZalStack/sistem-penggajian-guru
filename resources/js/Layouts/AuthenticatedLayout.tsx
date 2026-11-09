import Dropdown from '@/Components/Dropdown';
import FlashMessage from '@/Components/ui/flash-message';
import { Link, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState, useEffect, ReactNode } from 'react';

interface AuthenticatedLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

interface SharedApp {
    name?: string;
    tagline?: string;
}

/**
 * Avatar user — menampilkan foto profil bila ada, fallback ke inisial huruf.
 */
function UserAvatar({ src, initials, className }: { src?: string | null; initials: string; className?: string }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    const showFoto = Boolean(src) && !failed;

    return (
        <span className={`overflow-hidden flex items-center justify-center shrink-0 ${className ?? ''}`}>
            {showFoto ? (
                <img
                    src={src as string}
                    alt=""
                    onError={() => setFailed(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                initials
            )}
        </span>
    );
}

const adminNavGroups = [
    {
        title: 'Utama',
        items: [
            { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'tabler:layout-dashboard', desc: 'Ringkasan data' },
            { href: 'guru.index', pattern: 'guru.*', label: 'Data Guru', icon: 'tabler:users', desc: 'Profil & program' },
        ],
    },
    {
        title: 'Operasional',
        items: [
            { href: 'jadwal.index', pattern: 'jadwal.*', label: 'Jadwal Mengajar', icon: 'tabler:calendar-week', desc: 'Tampilan mingguan' },
            { href: 'session.index', pattern: 'session.*', label: 'Sesi Mengajar', icon: 'tabler:calendar-event', desc: 'Tugas & status' },
            { href: 'attendance.index', pattern: 'attendance.*', label: 'Rekap Absensi', icon: 'tabler:clipboard-check', desc: 'Kehadiran guru' },
            { href: 'sunnah-guru.index', pattern: 'sunnah-guru.*', label: '7SPS Guru', icon: 'tabler:moon-stars', desc: 'Amalan & approval' },
            { href: 'perizinan.index', pattern: 'perizinan.*', label: 'Perizinan Guru', icon: 'tabler:shield-check', desc: 'Izin & cuti' },
        ],
    },
    {
        title: 'Keuangan',
        items: [
            { href: 'penggajian.index', pattern: 'penggajian.*', label: 'Penggajian', icon: 'tabler:wallet', desc: 'Honor & pembayaran' },
            { href: 'laporan.index', pattern: 'laporan.*', label: 'Laporan', icon: 'tabler:chart-bar', desc: 'Rekap & ekspor' },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            { href: 'grade.index', pattern: 'grade.*', label: 'Grade & Honor', icon: 'tabler:award', desc: 'Tarif per sesi' },
            { href: 'location.index', pattern: 'location.*', label: 'Lokasi Mengajar', icon: 'tabler:map-pin', desc: 'Titik & radius GPS' },
            { href: 'transport.index', pattern: 'transport.*', label: 'Transport', icon: 'tabler:car', desc: 'Biaya transport' },
        ],
    },
    {
        title: 'Sistem',
        items: [
            { href: 'notifications.index', pattern: 'notifications.*', label: 'Notifikasi', icon: 'tabler:bell', desc: 'Pemberitahuan' },
        ],
    },
];

const guruNavItems = [
    { href: 'my-attendance', pattern: 'my-attendance.*', label: 'Riwayat Kehadiran', icon: 'tabler:clipboard-check', desc: 'Riwayat presensi dari SI ADIK-KK' },
    { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'tabler:layout-dashboard', desc: 'Ringkasan hari ini' },
    { href: 'jadwal.index', pattern: 'jadwal.*', label: 'Jadwal Mengajar', icon: 'tabler:calendar-week', desc: 'Agenda mingguan' },
    { href: 'my-sunnah.index', pattern: 'my-sunnah.*', label: 'Amalan 7SPS', icon: 'tabler:moon-stars', desc: 'Checklist & poin' },
    { href: 'my-perizinan', pattern: 'my-perizinan.*', label: 'Perizinan', icon: 'tabler:shield-check', desc: 'Ajukan izin' },
    { href: 'my-salary', pattern: 'my-salary.*', label: 'Slip Gaji', icon: 'tabler:cash', desc: 'Honor & slip' },
    { href: 'notifications.index', pattern: 'notifications.*', label: 'Notifikasi', icon: 'tabler:bell', desc: 'Pemberitahuan' },
];

const guruBottomNav = [
    { href: 'dashboard', pattern: 'dashboard', label: 'Beranda', icon: 'tabler:layout-dashboard' },
    { href: 'my-sunnah.index', pattern: 'my-sunnah.*', label: '7SPS', icon: 'tabler:moon-stars' },
    { href: 'my-attendance', pattern: 'my-attendance.*', label: 'Hadir', icon: 'tabler:clipboard-check' },
    { href: 'my-salary', pattern: 'my-salary.*', label: 'Gaji', icon: 'tabler:cash' },
    { href: 'profile.edit', pattern: 'profile.*', label: 'Profil', icon: 'tabler:user-circle' },
];

/* Nav item renderer — dark sidebar */
function NavList({ items, collapsed, onNavigate }: {
    items: typeof adminNavGroups[number]['items'];
    collapsed?: boolean;
    onNavigate?: () => void;
}) {
    return (
        <div className="space-y-1 px-2">
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
                                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-slate-300/70 hover:bg-white/8 hover:text-white'
                        }`}
                    >
                        {active && !collapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-full" />
                        )}
                        <span className={`flex items-center justify-center shrink-0 transition-colors rounded-lg ${
                            active
                                ? 'text-indigo-300'
                                : 'text-slate-400 group-hover:text-slate-200'
                        } ${collapsed ? 'w-9 h-9' : 'w-7 h-7'}`}>
                            <Icon icon={item.icon} className="text-[18px]" />
                        </span>
                        {!collapsed && (
                            <span className="min-w-0 flex-1">
                                <span className={`block text-[13px] font-semibold leading-tight ${active ? 'text-white' : ''}`}>{item.label}</span>
                                {item.desc && <span className={`block text-[11px] leading-none mt-0.5 ${active ? 'text-white/50' : 'text-slate-500'}`}>{item.desc}</span>}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const { props } = usePage<{
        app?: SharedApp;
        auth: { user: { name: string; email: string; role: string }; fotoUrl?: string | null };
        flash?: { success?: string; error?: string; warning?: string; info?: string };
        unreadNotifications?: number;
    }>();
    const user = props.auth.user;
    const fotoUrl = props.auth.fotoUrl;
    const flash = props.flash;
    const unreadCount = props.unreadNotifications ?? 0;
    const appName = props.app?.name || 'SATU GURU KPM';
    const appTagline = props.app?.tagline || 'Sistem Informasi Administrasi Terpadu Guru KPM';
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
            <div className={`h-[68px] flex items-center border-b border-white/10 shrink-0 ${isCollapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-950/40 ring-1 ring-white/20">
                    <Icon icon="tabler:school" className="text-white text-[20px]" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-black tracking-wider text-white truncate leading-tight uppercase">
                            SATU GURU KPM
                        </p>
                        <p className="text-[10px] font-semibold text-indigo-200/80 leading-none mt-1 truncate" title={appTagline}>
                            {appTagline || 'Sistem Informasi Administrasi Terpadu Guru KPM'}
                        </p>
                    </div>
                )}
                {forMobile && (
                    <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" aria-label="Tutup menu">
                        <Icon icon="tabler:x" className="text-[18px]" />
                    </button>
                )}
            </div>

            {/* Nav — scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
                {isAdmin ? (
                    <div className="space-y-5">
                        {adminNavGroups.map(group => (
                            <div key={group.title}>
                                {!isCollapsed && (
                                    <p className="px-4 mb-1.5 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">{group.title}</p>
                                )}
                                <NavList items={group.items} collapsed={isCollapsed} onNavigate={forMobile ? () => setMobileOpen(false) : undefined} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        {!isCollapsed && (
                            <p className="px-4 mb-1.5 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Menu Guru</p>
                        )}
                        <NavList items={guruNavItems} collapsed={isCollapsed} onNavigate={forMobile ? () => setMobileOpen(false) : undefined} />
                    </div>
                )}
            </div>

            {/* Bottom: collapse button + user */}
            <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
                {!forMobile && (
                    <button
                        onClick={() => setCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition-colors text-[12px] font-medium"
                        title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
                    >
                        <Icon icon={isCollapsed ? 'tabler:layout-sidebar-right-expand' : 'tabler:layout-sidebar-left-collapse'} className="text-[18px]" />
                        {!isCollapsed && <span>Ciutkan</span>}
                    </button>
                )}
                <Link href={route('profile.edit')} className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/8 transition-all group ${isCollapsed ? 'justify-center' : ''}`}>
                    <UserAvatar
                        src={fotoUrl}
                        initials={initials}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-300 font-extrabold text-[11px] ring-1 ring-white/10"
                    />
                    {!isCollapsed && (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12.5px] font-semibold text-white truncate leading-tight">{user.name}</span>
                                <span className="block text-[10.5px] text-slate-500 truncate leading-none mt-0.5">{isAdmin ? 'Administrator' : 'Guru'}</span>
                            </span>
                            <Icon icon="tabler:chevron-right" className="text-slate-600 group-hover:text-slate-400 text-[14px] shrink-0" />
                        </>
                    )}
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
            {/* Sidebar — desktop */}
            <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col transition-all duration-300 bg-sidebar-gradient border-r border-white/10 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
                <div className="relative flex flex-col h-full">{sidebarInner(collapsed)}</div>
            </aside>

            {/* Mobile sidebar overlay */}
            <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible'}`}>
                <div onClick={() => setMobileOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
                <aside className={`absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] flex flex-col transition-transform duration-300 bg-sidebar-gradient border-r border-white/10 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarInner(false, true)}
                </aside>
            </div>

            {/* Main content area */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 border-b border-slate-200/60 backdrop-blur-md shadow-xs">
                    <div className="flex items-center justify-between h-[64px] px-4 sm:px-6 lg:px-8 xl:px-10 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                aria-label="Buka menu"
                            >
                                <Icon icon="tabler:menu-2" className="text-[20px]" />
                            </button>
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[14.5px] font-bold text-slate-900 tracking-tight truncate">{activeItem?.label || 'Dashboard'}</span>
                                {activeItem?.desc && (
                                    <span className="hidden md:inline text-[12px] text-slate-400 truncate">· {activeItem.desc}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Notification bell */}
                            <Link
                                href={route('notifications.index')}
                                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                aria-label="Notifikasi"
                            >
                                <Icon icon="tabler:bell" className="text-[20px]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>

                            {/* User dropdown */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-[12.5px] font-bold leading-tight text-slate-900">{user.name}</p>
                                            <p className="text-[11px] text-slate-400 leading-tight">{isAdmin ? 'Administrator' : 'Guru'}</p>
                                        </div>
                                        <UserAvatar
                                            src={fotoUrl}
                                            initials={initials}
                                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-[11px] shadow-sm"
                                        />
                                        <Icon icon="tabler:chevron-down" className="text-slate-400 text-[14px] hidden sm:block" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="64">
                                    <div className="px-4 py-3 border-b border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50">
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Masuk sebagai</p>
                                        <p className="text-[13.5px] font-bold text-slate-900 mt-0.5 truncate">{user.name}</p>
                                        <p className="text-[11.5px] text-slate-500 truncate">{user.email}</p>
                                        <span className={`inline-flex mt-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                            {isAdmin ? 'Administrator' : 'Guru'}
                                        </span>
                                    </div>
                                    <div className="py-1">
                                        <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                <Icon icon="tabler:user" className="text-[15px] text-slate-600" />
                                            </span>
                                            <span className="text-[13px] font-semibold">Profil Saya</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('profile.edit') + '#ubah-kata-sandi'} className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                                <Icon icon="tabler:key" className="text-[15px] text-amber-600" />
                                            </span>
                                            <span className="text-[13px] font-semibold">Ubah Kata Sandi</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 text-rose-600 w-full">
                                            <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                                                <Icon icon="tabler:logout" className="text-[15px] text-rose-600" />
                                            </span>
                                            <span className="text-[13px] font-semibold">Keluar Akun</span>
                                        </Dropdown.Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Flash messages */}
                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 space-y-3 w-full">
                    {flash?.success && <FlashMessage type="success" message={flash.success} />}
                    {(flash?.error || (props.errors as any)?.error) && <FlashMessage type="error" message={flash?.error || (props.errors as any)?.error} />}
                    {flash?.warning && <FlashMessage type="warning" message={flash.warning} />}
                    {flash?.info && <FlashMessage type="info" message={flash.info} />}
                </div>

                {/* Page content */}
                <main className={`flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full ${!isAdmin ? 'pb-28 lg:pb-8' : 'pb-8'}`}>
                    {children}
                </main>

                <footer className="hidden lg:block border-t border-slate-200/60 bg-white/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5">
                    <div className="w-full flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span>© {new Date().getFullYear()} SATU GURU KPM — {appTagline}</span>
                    </div>
                </footer>
            </div>

            {/* Guru bottom nav (mobile) */}
            {!isAdmin && (
                <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-slate-200 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-around h-[64px] px-2 max-w-lg mx-auto">
                        {guruBottomNav.map(item => {
                            const active = route().current(item.pattern);
                            return (
                                <Link key={item.href} href={route(item.href)} className="flex flex-col items-center gap-1 flex-1 py-2 min-w-0">
                                    <span className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
                                        active
                                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-400/30'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}>
                                        <Icon icon={item.icon} className="text-[20px]" />
                                    </span>
                                    <span className={`text-[10px] font-bold tracking-wide truncate ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}
