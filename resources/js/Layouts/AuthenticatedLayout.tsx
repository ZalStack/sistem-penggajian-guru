import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import FlashMessage from '@/Components/ui/flash-message';
import { Link, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState, ReactNode } from 'react';

interface AuthenticatedLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

const navItems = [
    { href: 'dashboard', pattern: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard' },
    { href: 'guru.index', pattern: 'guru.*', label: 'Data Guru', icon: 'lucide:users' },
    { href: 'grade.index', pattern: 'grade.*', label: 'Grade & Honor', icon: 'lucide:award' },
    { href: 'transport.index', pattern: 'transport.*', label: 'Transport', icon: 'lucide:car' },
    { href: 'penggajian.index', pattern: 'penggajian.*', label: 'Penggajian', icon: 'lucide:calculator' },
    { href: 'laporan.index', pattern: 'laporan.*', label: 'Laporan & Rekap', icon: 'lucide:file-text' },
];

export default function AuthenticatedLayout({ header, children }: AuthenticatedLayoutProps) {
    const { props } = usePage<{
        auth: { user: { name: string; email: string } };
        flash?: { success?: string; error?: string; warning?: string; info?: string };
    }>();
    const user = props.auth.user;
    const flash = props.flash;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarDesktop, setSidebarDesktop] = useState(true);

    const userInitials = (user?.name || 'A')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    // Determine current section title
    const activeItem = navItems.find((item) => route().current(item.pattern));

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarDesktop ? 'lg:w-64' : 'lg:w-20'
                } ${mobileOpen ? 'w-72 translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 shadow-sm'}`}
            >
                <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
                    <Link
                        href={route('dashboard')}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 transition-opacity hover:opacity-85 ${!sidebarDesktop && 'lg:justify-center lg:w-full'}`}
                    >
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Icon icon="lucide:graduation-cap" className="text-white text-xl" />
                        </div>
                        {(sidebarDesktop || mobileOpen) && (
                            <div className="min-w-0">
                                <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                                    SIGURU
                                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        v2
                                    </span>
                                </span>
                                <span className="text-[11px] text-slate-400 block leading-none font-medium truncate">
                                    KPM Pusat 2026/2027
                                </span>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Tutup menu"
                    >
                        <Icon icon="lucide:x" className="text-xl" />
                    </button>
                </div>

                <div className="flex flex-col justify-between h-[calc(100vh-4rem)] p-3 overflow-y-auto">
                    <nav className="space-y-1.5">
                        <div className={`px-3 pt-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${!sidebarDesktop && 'lg:hidden'}`}>
                            Menu Utama
                        </div>
                        {navItems.map((item) => {
                            const isActive = route().current(item.pattern);
                            return (
                                <Link
                                    key={item.href}
                                    href={route(item.href)}
                                    onClick={() => setMobileOpen(false)}
                                    title={!sidebarDesktop ? item.label : undefined}
                                    className={`group flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    } ${!sidebarDesktop ? 'lg:justify-center lg:px-2' : ''}`}
                                >
                                    <Icon
                                        icon={item.icon}
                                        className={`text-lg flex-shrink-0 transition-transform group-hover:scale-110 ${
                                            isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                                        }`}
                                    />
                                    {(sidebarDesktop || mobileOpen) && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom user profile teaser in sidebar */}
                    {(sidebarDesktop || mobileOpen) && (
                        <div className="pt-4 border-t border-slate-100">
                            <Link
                                href={route('profile.edit')}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 transition-colors group"
                            >
                                <div className="w-9 h-9 bg-slate-200/80 text-slate-700 font-semibold rounded-lg flex items-center justify-center text-xs flex-shrink-0">
                                    {userInitials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-slate-950">
                                        {user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                </div>
                                <Icon icon="lucide:settings" className="text-slate-400 text-sm flex-shrink-0" />
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile backdrop overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${sidebarDesktop ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-shadow">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Buka menu navigasi"
                            >
                                <Icon icon="lucide:menu" className="text-xl" />
                            </button>
                            <button
                                onClick={() => setSidebarDesktop(!sidebarDesktop)}
                                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                aria-label="Toggle sidebar desktop"
                            >
                                <Icon icon={sidebarDesktop ? 'lucide:panel-left-close' : 'lucide:panel-left'} className="text-lg" />
                            </button>

                            {/* Section indicator */}
                            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
                                <Link href={route('dashboard')} className="hover:text-slate-700 transition-colors">SIGURU</Link>
                                <Icon icon="lucide:chevron-right" className="text-slate-300 text-xs" />
                                <span className="text-slate-700 font-semibold">{activeItem?.label || 'Aplikasi'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Profile Dropdown */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center gap-2.5 py-1.5 pl-2 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-slate-200/70 shadow-2xs">
                                        <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {userInitials}
                                        </div>
                                        <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                                            {user.name}
                                        </span>
                                        <Icon icon="lucide:chevron-down" className="text-slate-400 text-xs" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="56">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-xs text-slate-400 font-medium">Masuk sebagai</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2 text-xs">
                                        <Icon icon="lucide:user" className="text-sm" /> Pengaturan Profil
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700">
                                        <Icon icon="lucide:log-out" className="text-sm" /> Keluar Akun
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Flash Messages Container */}
                <div className="px-4 sm:px-6 lg:px-8 pt-4 space-y-2.5">
                    {flash?.success && <FlashMessage type="success" message={flash.success} />}
                    {flash?.error && <FlashMessage type="error" message={flash.error} />}
                    {flash?.warning && <FlashMessage type="warning" message={flash.warning} />}
                    {flash?.info && <FlashMessage type="info" message={flash.info} />}
                </div>

                {/* Main Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
