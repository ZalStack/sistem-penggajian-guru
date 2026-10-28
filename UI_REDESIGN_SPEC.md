# Satu Guru KPM — Design Spec: Rombak UI/UX Indigo–Violet (Modern SaaS)

Spesifikasi wajib untuk semua halaman React/Inertia di project ini.
**Fondasi (tailwind.config.js, resources/css/app.css, components di `Components/ui/*`, `Layouts/*`) SUDAH selesai dirombak — jangan ubah file-file itu.**

## 1. Identitas Visual

- **Primary**: gradient `from-indigo-600 to-violet-600` (via `bg-gradient-to-r` / `bg-gradient-to-br`).
- **Sidebar & panel gelap**: identitas indigo–violet (sudah ditangani layout).
- **Background halaman**: `bg-slate-50` + `mesh-gradient` (sudah dari layout).
- **Netral teks**: heading/nilai pakai `text-slate-900`, body `text-slate-600/70`, muted `text-slate-500`.
- **Semantic**: success=emerald, warning=amber, danger=rose — TETAP.
- Sudah tidak ada lagi aksen `bg-slate-900` sebagai warna utama/brand.

## 2. Aturan Penggantian Warna (mapping)

| Lama (monokrom) | Baru (brand) |
|---|---|
| `bg-slate-900 text-white` (tombol/chip/ikon/Avatar/aktif) | `bg-gradient-to-r from-indigo-600 to-violet-600 text-white` (chip kecil: `bg-gradient-to-br from-indigo-500 to-violet-600`) |
| `hover:bg-slate-800` / `hover:bg-slate-700` | `hover:from-indigo-700 hover:to-violet-700` |
| `border-slate-900` pada badge solid | `border-transparent` |
| `ring-slate-900/10`, `focus:ring-slate-900/[0.06]` | `ring-indigo-500/25`, `focus:ring-indigo-500/25` |
| `focus:border-slate-300/400` | `focus:border-indigo-400` |
| `bg-sky-50/500`, `text-sky-600/700`, `border-sky-200` (sebagai aksen) | `bg-indigo-50`, `text-indigo-600/700`, `border-indigo-200` |
| `hover:bg-slate-50` (baris/kartu interaktif) | `hover:bg-indigo-50/50` atau `hover:border-indigo-200` |
| Panel abu netral `bg-slate-50 border-slate-200` yang ingin dihidupkan | `bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100` |
| Icon chip monokrom (`bg-slate-100 text-slate-500`) | `bg-gradient-to-br from-indigo-500 to-violet-500 text-white` atau tint `bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100` |
| `shadow-md shadow-slate-900/10` | `shadow-[0_6px_16px_-6px_rgba(99,102,241,0.7)]` atau `shadow-brand` |

**TETAP DIPAKAI (jangan diganti):** `text-slate-900` untuk judul/nilai, warna semantic emerald/amber/rose, `border-slate-200` untuk pemisah netral netral.

## 3. Class Helper yang tersedia (dari app.css / tailwind.config)

- Tombol: `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-danger` `.btn-success`
- Kartu: `.card-modern` `.card-modern-hover` `.card-elevated` `.card-interactive` `.stat-card`
- Form: `.input-modern` `.select-modern`
- Lain: `.badge-base` `.table-wrapper` `.page-header` `.page-title` `.page-subtitle` `.section-title` `.empty-state-icon` `.mesh-gradient` `.grid-pattern` `.bg-brand-gradient` `.text-brand-gradient` `.animate-fade-in` `.animate-slide-up` `.scrollbar-thin` `.scrollbar-none`
- Shadow token: `shadow-soft` `shadow-card` `shadow-elevated` `shadow-float` `shadow-glow` `shadow-brand` `shadow-brand-lg`
- Background image: `bg-brand-gradient` `bg-brand-gradient-soft` `bg-sidebar-gradient` `bg-hero-gradient`

## 4. Komponen React yang tersedia (JANGAN diubah, gunakan seperti adanya)

- `Components/ui/button` — default export `Button`, props: `variant` (`default|secondary|outline|ghost|danger|success|warning`), `size` (`sm|default|lg|icon`), `processing`, `as="a"`.
- `Components/ui/badge` — `Badge` default export, props: `variant` (`default|neutral|success|warning|danger|info|outline`), `size` (`sm|md`), `dot`. `neutral` = gradient brand.
- `Components/ui/stat-card` — `StatCard`, props: `color` (`slate|neutral|accent|success|warning|danger` + alias `blue|green|amber|purple|...`), `trend`.
- `Components/ui/card` — named export `Card` (props `title`, `description`, `headerAction`, `noPadding`, `variant`).
- `Components/ui/input` (`Input`), `select` (`Select`), `modal` (`Modal`), `table` (`Table, TableHeader, TableBody, TableRow, TableHead, TableCell`), `pagination` (`Pagination`), `empty-state` (`EmptyState`), `flash-message`.
- Layout `AuthenticatedLayout` & `GuestLayout` sudah final.

## 5. Requirement Responsive (Wajib semua halaman)

1. Page header: `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`.
2. Judul halaman: `page-title` (class sudah `text-[24px] sm:text-[28px]`) + `page-subtitle`.
3. Grid kartu: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4 gap-4 lg:gap-5` — cek breakpoint tiap kasus (stat: `grid-cols-2 lg:grid-cols-4`).
4. Toolbar/filter: `flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap` — input/select pencarian `w-full sm:w-auto sm:min-w-[220px]` atau `flex-1`.
5. Grup tombol aksi: `flex flex-wrap items-center gap-2`.
6. Tabel: **wajib** bisa di-scroll horizontal di mobile. Gunakan komponen `Table` (sudah punya `overflow-x-auto`) atau bungkus `div.overflow-x-auto` + `min-w-[720px]` untuk tabelnya. Alternatif bagus: di mobile tampilkan kartu (lihat pola `md:hidden` card list + `hidden md:block` tabel) bila struktur data mendukung.
7. Konten panjang: teks judul panjang pakai `truncate`/`break-words`; jangan biarkan overflow.
8. Padding container: biarkan layout yang atur; jangan tambah padding aneh.
9. Ukuran teks: header kecil `text-[11px] sm:text-[12px]`, angka besar jangan sampai overflow (`break-words`/`text-lg sm:text-2xl`).
10. Elemen yang hanya layar besar (mis. info tanggal di pojok): sembunyikan di mobile (`hidden lg:flex`).

## 6. Aturan Keras

- **JANGAN ubah logika**: props, interface, state, handler, route, query params, payload, key data — semua identik.
- **JANGAN hapus** fitur/isi/teks penting; perbaikan copy Bahasa Indonesia diperbolehkan selama tidak mengubah makna.
- **JANGAN** menambah dependency baru.
- **JANGAN** mengedit file di luar daftar tugas Anda (terutama `Components/ui/*`, `Layouts/*`, `tailwind.config.js`, `app.css`) — fondasi sudah final.
- Struktur JSX harus tetap valid (tag berpasangan), pastikan file tetap kompilasi.
- Konsisten: gunakan utilitas gap (bukan margin antar elemen), hindari inline style kecuali untuk data dinamis (width progress, warna dinamis).
- Dark mode TIDAK diminta — jangan tambahkan `dark:` variants.
