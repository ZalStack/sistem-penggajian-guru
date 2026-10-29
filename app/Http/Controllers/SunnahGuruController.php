<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Notification;
use App\Models\Program;
use App\Models\SunnahGuru;
use App\Support\Tanggal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SunnahGuruController extends Controller
{
    /**
     * Halaman 7SPS untuk guru: checklist hari ini/kemarin + rekap bulan berjalan.
     */
    public function guruIndex(Request $request): Response
    {
        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return Inertia::render('Guru/SunnahGuru/Index', [
                'guru' => null,
                'poinConfig' => SunnahGuru::getPoinConfig(),
                'sholatWajibKeys' => SunnahGuru::getSholatWajibKeys(),
                'selectedDate' => today()->toDateString(),
                'today' => today()->toDateString(),
                'yesterday' => today()->subDay()->toDateString(),
                'selectedData' => null,
                'statistik' => [
                    'total_hari' => 0,
                    'total_poin' => 0,
                    'rata_rata' => 0,
                    'tertinggi' => 0,
                ],
                'riwayat' => [],
                'catatanTerbaru' => [],
                'monthLabel' => Tanggal::format(today(), 'F Y'),
            ]);
        }

        $guru->load(['grade', 'programs']);

        $selectedDate = $this->resolveSelectedDate($request);

        $selectedData = SunnahGuru::with('approvedBy')
            ->where('guru_id', $guru->id)
            ->whereDate('tanggal', $selectedDate)
            ->first();

        $monthStart = $selectedDate->copy()->startOfMonth();
        $monthEnd = $selectedDate->copy()->endOfMonth();

        $monthlyData = SunnahGuru::where('guru_id', $guru->id)
            ->whereDate('tanggal', '>=', $monthStart->toDateString())
            ->whereDate('tanggal', '<=', $monthEnd->toDateString())
            ->orderBy('tanggal')
            ->get()
            ->keyBy(fn (SunnahGuru $item) => $item->tanggal->toDateString());

        $totalPoin = (int) $monthlyData->sum('total_poin');

        $riwayat = [];
        for ($day = 1; $day <= $monthEnd->day; $day++) {
            $date = $monthStart->copy()->day($day);
            /** @var SunnahGuru|null $entry */
            $entry = $monthlyData->get($date->toDateString());

            $riwayat[] = [
                'iso' => $date->toDateString(),
                'tanggal' => $date->format('d/m'),
                'hari' => $day,
                'poin' => (int) ($entry?->total_poin ?? 0),
                'status' => $entry?->status_label ?? 'Belum',
                'status_approval' => $entry?->status_approval ?? 'empty',
                'is_today' => $date->isToday(),
                'is_selected' => $date->isSameDay($selectedDate),
            ];
        }

        $catatanTerbaru = SunnahGuru::where('guru_id', $guru->id)
            ->whereNotNull('catatan')
            ->where('catatan', '!=', '')
            ->whereDate('tanggal', '>=', $monthStart->toDateString())
            ->whereDate('tanggal', '<=', $monthEnd->toDateString())
            ->orderByDesc('tanggal')
            ->limit(3)
            ->get()
            ->map(fn (SunnahGuru $item) => [
                'id' => $item->id,
                'tanggal' => Tanggal::format($item->tanggal, 'd M Y'),
                'status' => $item->status_label,
                'status_approval' => $item->status_approval,
                'catatan' => $item->catatan,
            ])
            ->values()
            ->all();

        return Inertia::render('Guru/SunnahGuru/Index', [
            'guru' => [
                'id' => $guru->id,
                'nama' => $guru->nama,
                'kode_grade' => $guru->grade?->kode_grade,
                'programs' => $guru->programs->pluck('nama')->values()->all(),
            ],
            'poinConfig' => SunnahGuru::getPoinConfig(),
            'sholatWajibKeys' => SunnahGuru::getSholatWajibKeys(),
            'selectedDate' => $selectedDate->toDateString(),
            'today' => today()->toDateString(),
            'yesterday' => today()->subDay()->toDateString(),
            'selectedData' => $selectedData ? $this->presentDailyRecord($selectedData) : null,
            'statistik' => [
                'total_hari' => (int) $monthlyData->count(),
                'total_poin' => $totalPoin,
                'rata_rata' => $monthlyData->count() > 0 ? round($totalPoin / $monthlyData->count(), 1) : 0,
                'tertinggi' => (int) ($monthlyData->max('total_poin') ?? 0),
            ],
            'riwayat' => $riwayat,
            'catatanTerbaru' => $catatanTerbaru,
            'monthLabel' => Tanggal::format($selectedDate, 'F Y'),
        ]);
    }

    /**
     * Simpan checklist 7SPS milik guru yang sedang login.
     *
     * Hanya boleh mengisi hari ini atau kemarin, dan data yang sudah
     * disetujui admin terkunci dari perubahan.
     */
    public function save(Request $request): JsonResponse
    {
        $guru = $request->user()->guru;

        if (! $guru) {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini belum terhubung dengan data guru.',
            ], 422);
        }

        $request->validate([
            'tanggal' => 'required|date',
            'fields' => 'required|array',
            'fields.*' => 'boolean',
        ]);

        $tanggal = Carbon::parse($request->input('tanggal'))->startOfDay();
        $today = today();
        $yesterday = today()->subDay();

        if (! $tanggal->isSameDay($today) && ! $tanggal->isSameDay($yesterday)) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist hanya dapat diisi untuk hari ini atau kemarin.',
            ], 422);
        }

        $record = SunnahGuru::where('guru_id', $guru->id)
            ->whereDate('tanggal', $tanggal->toDateString())
            ->first();

        if (! $record) {
            $record = new SunnahGuru([
                'guru_id' => $guru->id,
                'tanggal' => $tanggal->toDateString(),
            ]);
        }

        $isNew = ! $record->exists;
        $wasRejected = $record->exists && $record->status_approval === SunnahGuru::STATUS_REJECTED;

        if ($record->exists && $record->isApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist tanggal ini sudah disetujui admin dan tidak dapat diubah lagi.',
            ], 403);
        }

        $config = SunnahGuru::getPoinConfig();
        $validFields = array_merge(array_keys($config), SunnahGuru::getJamaahFields());

        foreach ($validFields as $field) {
            $record->{$field} = false;
        }

        foreach ($request->input('fields', []) as $field => $value) {
            if (in_array($field, $validFields, true)) {
                $record->{$field} = (bool) $value;
            }
        }

        $currentData = [];
        foreach ($validFields as $field) {
            $currentData[$field] = (bool) $record->{$field};
        }

        $record->total_poin = SunnahGuru::calculateTotalPoin($currentData);
        $record->status_approval = SunnahGuru::STATUS_PENDING;
        $record->approved_by = null;
        $record->approved_at = null;
        $record->save();

        if ($isNew || $wasRejected) {
            $this->notifyAdminsAboutSubmission($record->fresh(), $guru, $wasRejected);
        }

        return response()->json([
            'success' => true,
            'message' => 'Checklist 7SPS berhasil disimpan.',
            'data' => [
                'total_poin' => $record->total_poin,
                'poin_sholat_wajib' => $record->poin_sholat_wajib,
                'jumlah_sholat_dikerjakan' => $record->jumlah_sholat_dikerjakan,
                'jumlah_sholat_berjamaah' => $record->jumlah_sholat_berjamaah,
                'status_approval' => $record->status_approval,
                'status_label' => $record->status_label,
                'tanggal' => $record->tanggal->toDateString(),
            ],
        ]);
    }

    /**
     * Monitoring & approval 7SPS seluruh guru.
     */
    public function adminIndex(Request $request): Response
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_program' => 'nullable|integer|exists:programs,id',
            'status' => 'nullable|in:pending,approved,rejected',
        ]);

        $periode = $validated['periode'] ?? now()->format('Y-m');
        $periodeDate = Carbon::createFromFormat('Y-m', $periode)->startOfMonth();

        $startDate = ! empty($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : $periodeDate->copy()->startOfMonth();

        $endDate = ! empty($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : $periodeDate->copy()->endOfMonth();

        $query = SunnahGuru::with(['guru.grade', 'guru.programs'])
            ->whereDate('tanggal', '>=', $startDate->toDateString())
            ->whereDate('tanggal', '<=', $endDate->toDateString())
            ->when($validated['filter_guru'] ?? null, fn ($q, $guruId) => $q->where('guru_id', $guruId))
            ->when($validated['filter_program'] ?? null, fn ($q, $programId) => $q->whereHas(
                'guru.programs',
                fn ($programQuery) => $programQuery->where('programs.id', $programId)
            ))
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status_approval', $status));

        $statistikRow = (clone $query)->toBase()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status_approval = 'pending' THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status_approval = 'approved' THEN 1 ELSE 0 END) as approved")
            ->selectRaw("SUM(CASE WHEN status_approval = 'rejected' THEN 1 ELSE 0 END) as rejected")
            ->selectRaw('COALESCE(SUM(total_poin), 0) as total_poin')
            ->first();

        $records = (clone $query)
            ->orderByDesc('tanggal')
            ->orderBy('guru_id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/SunnahGuru/Index', [
            'records' => $records->through(fn (SunnahGuru $record) => [
                'id' => $record->id,
                'tanggal' => Tanggal::format($record->tanggal, 'd/m/Y'),
                'tanggal_iso' => $record->tanggal->toDateString(),
                'total_poin' => $record->total_poin,
                'status_approval' => $record->status_approval,
                'status_label' => $record->status_label,
                'catatan' => $record->catatan,
                'guru' => [
                    'id' => $record->guru?->id,
                    'nama' => $record->guru?->nama ?? '-',
                    'kode_grade' => $record->guru?->grade?->kode_grade ?? '-',
                    'programs' => $record->guru?->programs?->pluck('nama')->values()->all() ?? [],
                ],
            ]),
            'gurus' => Guru::with('grade')->orderBy('nama')->get(['id', 'nama', 'grade_id']),
            'programs' => Program::orderBy('urutan')->get(['id', 'nama']),
            'statistik' => [
                'total' => (int) $statistikRow->total,
                'pending' => (int) $statistikRow->pending,
                'approved' => (int) $statistikRow->approved,
                'rejected' => (int) $statistikRow->rejected,
                'total_poin' => (int) $statistikRow->total_poin,
            ],
            'filters' => [
                'periode' => $periode,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'filter_guru' => $validated['filter_guru'] ?? '',
                'filter_program' => $validated['filter_program'] ?? '',
                'status' => $validated['status'] ?? '',
            ],
            'periodeDefault' => now()->format('Y-m'),
        ]);
    }

    /**
     * Detail checklist satu guru untuk kebutuhan approval admin.
     */
    public function detail(SunnahGuru $sunnahGuru): Response
    {
        $sunnahGuru->load(['guru.grade', 'guru.programs', 'approvedBy']);
        $config = SunnahGuru::getPoinConfig();

        $checklist = collect($config)
            ->map(fn (array $item, string $key) => [
                'key' => $key,
                'label' => $item['label'],
                'icon' => $item['icon'],
                'poin' => $item['poin'],
                'has_jamaah' => $item['has_jamaah'],
                'checked' => (bool) $sunnahGuru->{$key},
                'berjamaah' => $item['has_jamaah'] ? (bool) $sunnahGuru->{$key.'_berjamaah'} : null,
            ])
            ->values()
            ->all();

        return Inertia::render('Admin/SunnahGuru/Show', [
            'record' => [
                'id' => $sunnahGuru->id,
                'tanggal' => Tanggal::label($sunnahGuru->tanggal),
                'tanggal_iso' => $sunnahGuru->tanggal->toDateString(),
                'total_poin' => $sunnahGuru->total_poin,
                'poin_sholat_wajib' => $sunnahGuru->poin_sholat_wajib,
                'jumlah_sholat_dikerjakan' => $sunnahGuru->jumlah_sholat_dikerjakan,
                'jumlah_sholat_berjamaah' => $sunnahGuru->jumlah_sholat_berjamaah,
                'status_approval' => $sunnahGuru->status_approval,
                'status_label' => $sunnahGuru->status_label,
                'catatan' => $sunnahGuru->catatan,
                'approved_by' => $sunnahGuru->approvedBy?->name,
                'approved_at' => $sunnahGuru->approved_at
                    ? Tanggal::format($sunnahGuru->approved_at, 'd M Y, H:i')
                    : null,
                'guru' => [
                    'id' => $sunnahGuru->guru?->id,
                    'nama' => $sunnahGuru->guru?->nama ?? '-',
                    'kode_grade' => $sunnahGuru->guru?->grade?->kode_grade ?? '-',
                    'programs' => $sunnahGuru->guru?->programs?->pluck('nama')->values()->all() ?? [],
                ],
                'checklist' => $checklist,
            ],
        ]);
    }

    /**
     * Ubah status approval satu catatan 7SPS.
     */
    public function approve(Request $request, SunnahGuru $sunnahGuru)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $status = $validated['status'];
        $catatan = $validated['catatan'] ?? null;

        $sunnahGuru->update([
            'status_approval' => $status,
            'catatan' => $catatan,
            'approved_by' => $status === SunnahGuru::STATUS_PENDING ? null : Auth::id(),
            'approved_at' => $status === SunnahGuru::STATUS_PENDING ? null : now(),
        ]);

        $this->notifyGuruAboutDecision($sunnahGuru->fresh(), $catatan);

        $label = $sunnahGuru->fresh()->status_label;

        return back()->with('success', "Status 7SPS berhasil diubah menjadi {$label}.");
    }

    /**
     * Approval massal untuk banyak catatan 7SPS sekaligus.
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:sunnah_gurus,id',
            'target_status' => 'required|in:pending,approved,rejected',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $status = $validated['target_status'];
        $catatan = $validated['catatan'] ?? null;

        $records = SunnahGuru::with('guru')
            ->whereIn('id', $validated['ids'])
            ->get();

        foreach ($records as $record) {
            $record->update([
                'status_approval' => $status,
                'catatan' => $catatan,
                'approved_by' => $status === SunnahGuru::STATUS_PENDING ? null : Auth::id(),
                'approved_at' => $status === SunnahGuru::STATUS_PENDING ? null : now(),
            ]);

            $this->notifyGuruAboutDecision($record->fresh(), $catatan);
        }

        return back()->with(
            'success',
            $records->count().' data 7SPS berhasil diubah menjadi '.match ($status) {
                SunnahGuru::STATUS_APPROVED => 'Disetujui',
                SunnahGuru::STATUS_REJECTED => 'Ditolak',
                default => 'Menunggu',
            }.' secara massal.'
        );
    }

    private function resolveSelectedDate(Request $request): Carbon
    {
        $today = today();
        $yesterday = today()->subDay();

        if (! $request->filled('tanggal')) {
            return $today;
        }

        $requested = Carbon::parse($request->input('tanggal'))->startOfDay();

        if ($requested->isSameDay($today) || $requested->isSameDay($yesterday)) {
            return $requested;
        }

        return $today;
    }

    /**
     * @return array<string, mixed>
     */
    private function presentDailyRecord(SunnahGuru $record): array
    {
        $data = [
            'id' => $record->id,
            'tanggal' => $record->tanggal->toDateString(),
            'total_poin' => $record->total_poin,
            'poin_sholat_wajib' => $record->poin_sholat_wajib,
            'jumlah_sholat_dikerjakan' => $record->jumlah_sholat_dikerjakan,
            'jumlah_sholat_berjamaah' => $record->jumlah_sholat_berjamaah,
            'status_approval' => $record->status_approval,
            'status_label' => $record->status_label,
            'catatan' => $record->catatan,
            'approved_by' => $record->approvedBy?->name,
            'approved_at' => $record->approved_at
                ? Tanggal::format($record->approved_at, 'd M Y, H:i')
                : null,
        ];

        foreach (SunnahGuru::getChecklistFields() as $field) {
            $data[$field] = (bool) $record->{$field};
        }

        foreach (SunnahGuru::getJamaahFields() as $field) {
            $data[$field] = (bool) $record->{$field};
        }

        return $data;
    }

    private function notifyAdminsAboutSubmission(SunnahGuru $record, Guru $guru, bool $resubmitted): void
    {
        $prefix = $resubmitted ? 'Checklist 7SPS Diperbarui' : 'Checklist 7SPS Baru';

        Notification::sendToRole(
            'admin',
            $prefix,
            ($guru->nama ?? 'Seorang guru').' mengisi 7SPS tanggal '
                .Tanggal::format($record->tanggal, 'd F Y')
                .' dengan '.$record->total_poin.' poin. Menunggu approval.',
            'info',
            'sunnah'
        );
    }

    private function notifyGuruAboutDecision(SunnahGuru $record, ?string $catatan): void
    {
        $user = $record->guru?->user;

        if (! $user) {
            $record->loadMissing('guru.user');
            $user = $record->guru?->user;
        }

        if (! $user) {
            return;
        }

        $label = $record->status_label;
        $tanggal = Tanggal::format($record->tanggal, 'd F Y');

        $message = "Checklist 7SPS tanggal {$tanggal} telah {$label} oleh admin.";

        if (! empty($catatan)) {
            $message .= ' Catatan: '.$catatan;
        }

        $tipe = match ($record->status_approval) {
            SunnahGuru::STATUS_APPROVED => 'success',
            SunnahGuru::STATUS_REJECTED => 'warning',
            default => 'info',
        };

        Notification::send(
            $user,
            "Status Checklist 7SPS {$label}",
            $message,
            $tipe,
            'sunnah'
        );
    }
}
