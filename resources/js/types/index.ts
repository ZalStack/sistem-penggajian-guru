export interface User {
    id: number;
    name: string;
    email: string;
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
    grade?: Grade;
    penggajians?: Penggajian[];
    created_at: string;
    updated_at: string;
}

export interface Penggajian {
    id: number;
    guru_id: number;
    periode: string;
    jumlah_sesi: number;
    transport_id: number;
    honor: number;
    total_transport: number;
    total: number;
    guru?: Guru;
    transport?: Transport;
    created_at: string;
    updated_at: string;
}

export interface DashboardData {
    totalGuru: number;
    totalGrade: number;
    totalPenggajian: number;
    totalHonor: number;
    guruPerGrade: {
        kode: string;
        count: number;
        honor: string;
    }[];
    periode: string;
}

export interface PageProps {
    auth: {
        user: User;
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
