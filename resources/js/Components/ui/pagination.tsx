import { Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
}

export default function Pagination({ links }: PaginationProps) {
    if (links.length <= 3) return null;

    return (
        <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
                Halaman {links.findIndex(l => l.active) + 1} dari {links.length - 2}
            </div>
            <div className="flex items-center gap-1">
                {links.map((link, index) => (
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            className={`px-3 py-2 text-sm rounded-xl transition-colors ${
                                link.active
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            preserveScroll
                        >
                            {link.label === '&laquo; Previous' ? (
                                <Icon icon="lucide:chevron-left" />
                            ) : link.label === 'Next &raquo;' ? (
                                <Icon icon="lucide:chevron-right" />
                            ) : (
                                link.label
                            )}
                        </Link>
                    ) : (
                        <span key={index} className="px-3 py-2 text-sm text-gray-300">
                            {link.label === '&laquo; Previous' ? (
                                <Icon icon="lucide:chevron-left" />
                            ) : link.label === 'Next &raquo;' ? (
                                <Icon icon="lucide:chevron-right" />
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
