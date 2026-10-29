export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'guru';
    guru_id: number | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Grade {
    id: number;
    kode_grade: string;
    honor_per_sesi: number;
    gurus_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Transport {
    id: number;
    jenis: string;
    biaya: number;
    penggajians_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Program {
    id: number;
    nama: string;
    deskripsi: string | null;
    gurus_count?: number;
    sessions_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Guru {
    id: number;
    nama: string;
    grade_id: number;
    mapel: 'IPA' | 'MTK';
    jenjang: string | null;
    domisili: string | null;
    alamat: string | null;
    riwayat_pendidikan: string | null;
    pendidikan_terakhir: string | null;
    lama_mengajar: number | null;
    riwayat_mengajar: string | null;
    tanggal_bergabung: string | null;
    nomor_telepon: string | null;
    tunjangan_khusus: number | string;
    grade_kode?: string | null;
    honor_per_sesi?: number | null;
    bank: string | null;
    nomor_rekening: string | null;
    keterangan_mengajar: string | null;
    user_id: number | null;
    grade?: Grade;
    programs?: Program[];
    program_names?: string[];
    user?: { id: number; email: string; name: string } | null;
    penggajians?: Penggajian[];
    total_sesi?: number;
    total_hadir?: number;
    total_honor?: number;
    created_at: string;
    updated_at: string;
}

export interface PenggajianRincian {
    program_id: number | null;
    program: string;
    transport_id: number | null;
    transport: string;
    jumlah_sesi: number;
    jumlah_hadir: number;
    honor: number;
    transport_biaya: number;
    total: number;
}

export interface Penggajian {
    id: number;
    guru_id: number;
    periode: string;
    jumlah_sesi: number;
    jumlah_hadir: number;
    total_jam: number;
    transport_id: number | null;
    tunjangan_khusus: number;
    detail: PenggajianRincian[] | null;
    honor: number;
    total_transport: number;
    total: number;
    status_bayar: 'belum_dibayar' | 'sudah_dibayar';
    guru?: Guru;
    transport?: Transport;
    created_at: string;
    updated_at: string;
}

export interface Location {
    id: number;
    nama_lokasi: string;
    alamat: string | null;
    latitude: number;
    longitude: number;
    radius: number;
    sessions_count?: number;
    gurus?: Guru[];
    created_at: string;
    updated_at: string;
}

export type SessionStatus = 'dijadwalkan' | 'selesai' | 'dibatalkan';

export interface TeachingSession {
    id: number;
    guru_id: number;
    location_id: number;
    transport_id: number;
    program_id: number | null;
    mapel: 'IPA' | 'MTK';
    status: SessionStatus;
    catatan: string | null;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_sesi: number;
    guru?: Guru;
    location?: Location;
    transport?: Transport;
    program?: Program | null;
    created_at: string;
    updated_at: string;
}

export interface Attendance {
    id: number;
    guru_id: number;
    session_id: number;
    checkin_time: string | null;
    checkin_lat: number | null;
    checkin_lng: number | null;
    checkin_accuracy: number | null;
    checkout_time: string | null;
    checkout_lat: number | null;
    checkout_lng: number | null;
    checkout_accuracy: number | null;
    durasi: number;
    status: 'valid' | 'tidak_valid' | 'belum_checkin' | 'belum_checkout' | 'izin' | 'menunggu';
    tanggal: string;
    guru?: Guru;
    session?: TeachingSession;
    created_at: string;
    updated_at: string;
}

export interface Perizinan {
    id: number;
    guru_id: number;
    session_id: number | null;
    jenis: 'izin' | 'sakit' | 'cuti';
    tanggal_mulai: string;
    tanggal_selesai: string;
    alasan: string;
    status: 'pending' | 'disetujui' | 'ditolak';
    catatan_admin: string | null;
    jumlah_sesi_terdampak?: number;
    guru?: Guru;
    session?: TeachingSession | null;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: number;
    user_id: number;
    judul: string;
    pesan: string;
    tipe: 'info' | 'success' | 'warning' | 'error';
    kategori: 'sistem' | 'absensi' | 'perizinan' | 'gaji' | 'sesi' | 'sunnah';
    dibaca: boolean;
    dibaca_pada: string | null;
    created_at: string;
    updated_at: string;
}

export type SunnahStatusApproval = 'pending' | 'approved' | 'rejected';

export interface SunnahGuruChecklistItem {
    key: string;
    label: string;
    icon: string;
    poin: number;
    has_jamaah: boolean;
    checked: boolean;
    berjamaah: boolean | null;
}

export interface SunnahGuru {
    id: number;
    guru_id: number;
    tanggal: string;
    total_poin: number;
    poin_sholat_wajib: number;
    jumlah_sholat_dikerjakan: number;
    jumlah_sholat_berjamaah: number;
    status_approval: SunnahStatusApproval;
    status_label: string;
    catatan: string | null;
    approved_by: string | null;
    approved_at: string | null;
    guru?: Guru;
    created_at: string;
    updated_at: string;
}

export interface PageProps {
    auth: {
        user: User & { role: string };
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
