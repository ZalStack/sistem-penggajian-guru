/**
 * Pemetaan warna untuk setiap program / jenis kelas yang diajar guru.
 *
 * Dipakai di seluruh tampilan admin agar kartu & label kelas khusus,
 * reguler Bogor, reguler lainnya, dan kelas online mudah dibedakan
 * secara sekilas tanpa membaca teksnya.
 */

export interface ProgramStyle {
    /** Kelas Tailwind untuk badge / chip. */
    badge: string;
    /** Kelas Tailwind untuk kartu (background + border). */
    card: string;
    /** Kelas Tailwind untuk dot / indicator kecil. */
    dot: string;
    /** Kelas Tailwind untuk border kartu single card (Full border tebal terlihat jelas). */
    border: string;
    /** Kelas border aksen samping kiri / strip tebal. */
    borderAccent: string;
    /** Kelas Tailwind untuk border saat hover kartu. */
    borderHover: string;
    /** Kelas teks aksen judul / sub-info. */
    textAccent: string;
    /** Kelas background halus / soft tinted bg. */
    bgSoft: string;
    /** Warna hex primer untuk indikator atau aksen inline. */
    hexColor: string;
}

const DEFAULT_STYLE: ProgramStyle = {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    card: 'bg-slate-50 border-slate-300',
    dot: 'bg-slate-500',
    border: 'border-2 border-slate-300',
    borderAccent: 'border-l-slate-500',
    borderHover: 'hover:border-slate-400',
    textAccent: 'text-slate-700',
    bgSoft: 'bg-slate-50/50',
    hexColor: '#64748b',
};

const STYLE_BY_SLUG: Record<string, ProgramStyle> = {
    'kelas-khusus': {
        badge: 'bg-violet-100 text-violet-800 ring-violet-300',
        card: 'bg-violet-50/40 border-violet-500',
        dot: 'bg-violet-600',
        border: 'border-2 border-violet-500 shadow-[0_4px_16px_-4px_rgba(139,92,246,0.25)]',
        borderAccent: 'border-l-violet-600',
        borderHover: 'hover:border-violet-600 hover:shadow-card',
        textAccent: 'text-violet-700',
        bgSoft: 'bg-violet-50/50',
        hexColor: '#7c3aed',
    },
    'reguler-bogor': {
        badge: 'bg-sky-100 text-sky-800 ring-sky-300',
        card: 'bg-sky-50/40 border-sky-500',
        dot: 'bg-sky-600',
        border: 'border-2 border-sky-500 shadow-[0_4px_16px_-4px_rgba(2,132,199,0.25)]',
        borderAccent: 'border-l-sky-600',
        borderHover: 'hover:border-sky-600 hover:shadow-card',
        textAccent: 'text-sky-700',
        bgSoft: 'bg-sky-50/50',
        hexColor: '#0284c7',
    },
    'reguler-lainnya': {
        badge: 'bg-amber-100 text-amber-800 ring-amber-300',
        card: 'bg-amber-50/40 border-amber-500',
        dot: 'bg-amber-600',
        border: 'border-2 border-amber-500 shadow-[0_4px_16px_-4px_rgba(217,119,6,0.25)]',
        borderAccent: 'border-l-amber-600',
        borderHover: 'hover:border-amber-600 hover:shadow-card',
        textAccent: 'text-amber-700',
        bgSoft: 'bg-amber-50/50',
        hexColor: '#d97706',
    },
    'kelas-online': {
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
        card: 'bg-emerald-50/40 border-emerald-500',
        dot: 'bg-emerald-600',
        border: 'border-2 border-emerald-500 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.25)]',
        borderAccent: 'border-l-emerald-600',
        borderHover: 'hover:border-emerald-600 hover:shadow-card',
        textAccent: 'text-emerald-700',
        bgSoft: 'bg-emerald-50/50',
        hexColor: '#059669',
    },
    'olimpiade': {
        badge: 'bg-rose-100 text-rose-800 ring-rose-300',
        card: 'bg-rose-50/40 border-rose-500',
        dot: 'bg-rose-600',
        border: 'border-2 border-rose-500 shadow-[0_4px_16px_-4px_rgba(225,29,72,0.25)]',
        borderAccent: 'border-l-rose-600',
        borderHover: 'hover:border-rose-600 hover:shadow-card',
        textAccent: 'text-rose-700',
        bgSoft: 'bg-rose-50/50',
        hexColor: '#e11d48',
    },
};

const STYLE_BY_NAMA: Record<string, ProgramStyle> = {
    'kelas khusus': STYLE_BY_SLUG['kelas-khusus'],
    'reguler bogor': STYLE_BY_SLUG['reguler-bogor'],
    'reguler lainnya': STYLE_BY_SLUG['reguler-lainnya'],
    'kelas online': STYLE_BY_SLUG['kelas-online'],
    'olimpiade': STYLE_BY_SLUG['olimpiade'],
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
}

/**
 * Gaya warna untuk sebuah program. Nama program yang tidak dikenal
 * jatuh ke gaya netral (abu-abu) agar tetap konsisten.
 */
export function programStyle(program?: string | null): ProgramStyle {
    if (!program) {
        return DEFAULT_STYLE;
    }

    const nama = program.toLowerCase().trim();
    const slug = slugify(program);

    return STYLE_BY_NAMA[nama] ?? STYLE_BY_SLUG[slug] ?? DEFAULT_STYLE;
}

/** Badge ringkas berisi titik warna + nama program. */
export function programBadgeClasses(program?: string | null): string {
    return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${programStyle(program).badge}`;
}
