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
}

const DEFAULT_STYLE: ProgramStyle = {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    card: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
};

const STYLE_BY_SLUG: Record<string, ProgramStyle> = {
    'kelas-khusus': {
        badge: 'bg-violet-100 text-violet-700 ring-violet-200',
        card: 'bg-violet-50 border-violet-200',
        dot: 'bg-violet-500',
    },
    'reguler-bogor': {
        badge: 'bg-sky-100 text-sky-700 ring-sky-200',
        card: 'bg-sky-50 border-sky-200',
        dot: 'bg-sky-500',
    },
    'reguler-lainnya': {
        badge: 'bg-amber-100 text-amber-700 ring-amber-200',
        card: 'bg-amber-50 border-amber-200',
        dot: 'bg-amber-500',
    },
    'kelas-online': {
        badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        card: 'bg-emerald-50 border-emerald-200',
        dot: 'bg-emerald-500',
    },
};

const STYLE_BY_NAMA: Record<string, ProgramStyle> = {
    'kelas khusus': STYLE_BY_SLUG['kelas-khusus'],
    'reguler bogor': STYLE_BY_SLUG['reguler-bogor'],
    'reguler lainnya': STYLE_BY_SLUG['reguler-lainnya'],
    'kelas online': STYLE_BY_SLUG['kelas-online'],
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

    return STYLE_BY_NAMA[nama] ?? STYLE_BY_SLUG[slugify(program)] ?? DEFAULT_STYLE;
}

/** Badge ringkas berisi titik warna + nama program. */
export function programBadgeClasses(program?: string | null): string {
    return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${programStyle(program).badge}`;
}
