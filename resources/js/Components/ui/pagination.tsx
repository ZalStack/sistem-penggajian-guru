import { Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
    from?: number;
    to?: number;
    total?: number;
}

export default function Pagination({ links, from, to, total }: PaginationProps) {
    if (links.length <= 3) return null;

    const currentPage = links.findIndex(l => l.active) + 1;
    const totalPages = links.length - 2;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/60">
            <div className="text-[12.5px] font-[500] text-slate-500 order-2 sm:order-1">
                {from !== undefined && to !== undefined && total !== undefined ? (
                    <>Menampilkan <span className="font-[700] text-slate-900">{from}–{to}</span> dari <span className="font-[700] text-slate-900">{total}</span></>
                ) : (
                    <>Halaman <span className="font-[700] text-slate-900">{currentPage}</span> dari <span className="font-[700] text-slate-900">{totalPages}</span></>
                )}
            </div>
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                {links.map((link, index) => (
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            className={`min-w-[36px] h-9 inline-flex items-center justify-center px-2.5 text-[13px] font-[600] rounded-xl transition-all duration-200 ${
                                link.active
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm'
                            }`}
                            preserveScroll
                        >
                            {link.label === '&laquo; Previous' ? (
                                <Icon icon="lucide:chevron-left" className="text-[16px]" />
                            ) : link.label === 'Next &raquo;' ? (
                                <Icon icon="lucide:chevron-right" className="text-[16px]" />
                            ) : (
                                link.label
                            )}
                        </Link>
                    ) : (
                        <span key={index} className="min-w-[36px] h-9 inline-flex items-center justify-center px-2.5 text-[13px] text-slate-300">
                            {link.label === '&laquo; Previous' ? (
                                <Icon icon="lucide:chevron-left" className="text-[16px]" />
                            ) : link.label === 'Next &raquo;' ? (
                                <Icon icon="lucide:chevron-right" className="text-[16px]" />
                            ) : (
                                link.label
                            )}
                        </span>
                    )
                ))}
            </div>
        </div>
    );
}
