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

export interface Guru {
    id: number;
    nama: string;
    grade_id: number;
    mapel: 'IPA' | 'MTK';
    jenjang: string | null;
    domisili: string | null;
    nomor_telepon: string | null;
    tunjangan_khusus: number | string;
    bank: string | null;
    nomor_rekening: string | null;
    keterangan_mengajar: string | null;
    user_id: number | null;
    grade?: Grade;
    user?: { id: number; email: string; name: string } | null;
    penggajians?: Penggajian[];
    created_at: string;
    updated_at: string;
}

export interface Penggajian {
    id: number;
    guru_id: number;
    periode: string;
    jumlah_sesi: number;
    jumlah_hadir: number;
    total_jam: number;
    transport_id: number;
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
    latitude: number;
    longitude: number;
    radius: number;
    sessions_count?: number;
    created_at: string;
    updated_at: string;
}

export interface TeachingSession {
    id: number;
    guru_id: number;
    location_id: number;
    transport_id: number;
    mapel: 'IPA' | 'MTK';
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_sesi: number;
    guru?: Guru;
    location?: Location;
    transport?: Transport;
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
    status: 'valid' | 'tidak_valid' | 'belum_checkin' | 'belum_checkout';
    tanggal: string;
    guru?: Guru;
    session?: TeachingSession;
    created_at: string;
    updated_at: string;
}

export interface Perizinan {
    id: number;
    guru_id: number;
    jenis: 'izin' | 'sakit' | 'cuti';
    tanggal_mulai: string;
    tanggal_selesai: string;
    alasan: string;
    status: 'pending' | 'disetujui' | 'ditolak';
    catatan_admin: string | null;
    guru?: Guru;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: number;
    user_id: number;
    judul: string;
    pesan: string;
    tipe: 'info' | 'success' | 'warning' | 'error';
    kategori: 'sistem' | 'absensi' | 'perizinan' | 'gaji' | 'sesi';
    dibaca: boolean;
    dibaca_pada: string | null;
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
