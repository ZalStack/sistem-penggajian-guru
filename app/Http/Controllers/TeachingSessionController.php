<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Location;
use App\Models\Material;
use App\Models\Notification;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Support\Tanggal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeachingSessionController extends Controller
{
    public function index(Request $request)
    {
        // 1. Ekstrak parameter bulan, tahun, dan filter
        $month = (int) $request->input('month', 0);
        $year = (int) $request->input('year', 0);

        if (! empty($request->input('periode'))) {
            $periode = (string) $request->input('periode');
            $year = (int) substr($periode, 0, 4);
            $month = (int) substr($periode, 5, 2);
        }

        if ($month < 1 || $month > 12) {
            $month = (int) now()->month;
        }
        if ($year < 2020 || $year > 2100) {
            $year = (int) now()->year;
        }

        $kelasFilter = $request->input('kelas');
        $bidangFilter = $request->input('bidang', $request->input('mapel'));
        $pekanFilter = $request->input('pekan');
        $statusFilter = $request->input('status', $request->input('filter_status'));
        $teacherFilter = $request->input('teacher_id', $request->input('filter_guru'));
        $programFilter = $request->input('filter_program');
        $search = trim((string) $request->input('search', ''));
        $currentPekan = min(4, (int) ceil(now()->day / 7));

        $teachers = Guru::with(['grade', 'programs', 'user'])->orderBy('nama')->get();
        $materials = Material::latest()->get();
        $locations = Location::orderBy('nama_lokasi')->get();
        $transports = Transport::orderBy('jenis')->get();
        $programs = Program::orderBy('urutan')->orderBy('nama')->get();

        // 2. Query data sesi mengajar
        $query = TeachingSession::with(['guru.grade', 'guru.programs', 'guru.user', 'location', 'transport', 'program', 'material', 'attendances'])
            ->whereMonth('tanggal', $month)
            ->whereYear('tanggal', $year);

        if (! empty($kelasFilter)) {
            $query->where(function ($q) use ($kelasFilter) {
                $q->where('kelas', $kelasFilter)
                    ->orWhereHas('program', fn ($pq) => $pq->where('nama', $kelasFilter));
            });
        }

        if (! empty($programFilter)) {
            $query->where('program_id', $programFilter);
        }

        if (! empty($bidangFilter)) {
            $query->where('mapel', $bidangFilter);
        }

        if (! empty($pekanFilter)) {
            $query->where('pekan', (int) $pekanFilter);
        }

        if (! empty($teacherFilter)) {
            $query->where('guru_id', (int) $teacherFilter);
        }

        if ($statusFilter === 'berlangsung') {
            $query->whereExists(function ($sub) {
                $sub->selectRaw('1')
                    ->from('attendances')
                    ->whereColumn('attendances.session_id', 'teaching_sessions.id')
                    ->whereNotNull('attendances.checkin_time')
                    ->whereNull('attendances.checkout_time');
            });
        } elseif (! empty($statusFilter) && in_array($statusFilter, ['dijadwalkan', 'selesai', 'dibatalkan'])) {
            $query->where('status', $statusFilter);
        }

        if (! empty($search)) {
            $escaped = addcslashes($search, '%_\\');
            $query->where(function ($sub) use ($escaped) {
                $sub->whereHas('guru', fn ($gq) => $gq->where('nama', 'like', "%{$escaped}%"))
                    ->orWhereHas('location', fn ($lq) => $lq->where('nama_lokasi', 'like', "%{$escaped}%"))
                    ->orWhere('kelas', 'like', "%{$escaped}%")
                    ->orWhere('bahan_ajar', 'like', "%{$escaped}%");
            });
        }

        // Urutkan default data sesi: sesi terbaru di atas (descending)
        $schedules = $query
            ->orderByRaw('CASE WHEN tanggal IS NULL THEN 1 ELSE 0 END, tanggal DESC')
            ->orderByDesc('pekan')
            ->orderByDesc('id')
            ->get();

        $schedules->transform(function ($schedule) use ($currentPekan) {
            $schedule->is_current_pekan = (int) $schedule->pekan === (int) $currentPekan;
            $schedule->session_date = $schedule->tanggal ? $schedule->tanggal->format('Y-m-d') : null;
            if (empty($schedule->session_time) && $schedule->jam_mulai && $schedule->jam_selesai) {
                $schedule->session_time = $schedule->jam_mulai->format('H:i').' - '.$schedule->jam_selesai->format('H:i');
            }
            $schedule->teacher_id = $schedule->guru_id;
            $schedule->teacher = $schedule->guru;
            $schedule->bidang = $schedule->mapel;
            $schedule->question = $schedule->material;

            return $schedule;
        });

        // Paginated sessions untuk kompatibilitas tampilan lama bila diperlukan
        $paginatedSessions = (clone $query)->paginate(15)->withQueryString();

        return Inertia::render('Admin/Sessions/Index', [
            'sessions' => $paginatedSessions,
            'schedules' => $schedules,
            'teachers' => $teachers,
            'gurus' => $teachers,
            'materials' => $materials,
            'questions' => $materials,
            'locations' => $locations,
            'transports' => $transports,
            'programs' => $programs,
            'month' => $month,
            'year' => $year,
            'currentPekan' => $currentPekan,
            'filters' => [
                'month' => $month,
                'year' => $year,
                'kelas' => $kelasFilter,
                'bidang' => $bidangFilter,
                'pekan' => $pekanFilter,
                'status' => $statusFilter,
                'filter_guru' => $teacherFilter,
                'teacher_id' => $teacherFilter,
                'filter_program' => $programFilter,
                'search' => $search,
                'periode' => sprintf('%04d-%02d', $year, $month),
            ],
            'questionUploadText' => 'Admin menyiapkan & mengunggah materi sebelum hari Minggu (maksimal Minggu pukul 23:59 WIB). Guru menerima dan dapat mengakses materi mulai hari Minggu pada pekan berjalan.',
        ]);
    }

    /**
     * Sistem alarm anti-bentrok jadwal:
     * 1. Duplikasi persis: Guru, Kelas/Program, Tanggal, dan Jam yang sama
     * 2. Kelas yang sama pada hari & jam yang sama sudah diisi guru lain
     * 3. Guru yang sama terploting di jam yang sama pada kelas berbeda
     */
    private function checkScheduleConflict(
        int $guruId,
        ?int $ignoreSessionId,
        ?string $tanggal,
        ?string $sessionTime,
        ?string $jamMulai,
        ?string $jamSelesai,
        ?string $kelas,
        ?int $programId = null
    ): ?string {
        $guru = Guru::with('user')->find($guruId);
        $guruName = $guru?->nama ?: ($guru?->user?->name ?: "Guru #{$guruId}");

        // Cek apakah guru ditugaskan di program tersebut jika program_id diberikan
        if ($programId) {
            $guruWithProg = Guru::with('programs')->find($guruId);
            if ($guruWithProg && ! $guruWithProg->programs->contains('id', (int) $programId)) {
                return 'Guru ini tidak memiliki penugasan pada kelas/program tersebut. Pilih kelas yang menjadi plotingan guru.';
            }
        }

        if (! empty($tanggal)) {
            $formattedDate = Carbon::parse($tanggal)->locale('id')->isoFormat('D MMMM Y');

            // 1. Pengecekan duplikat: Guru, Kelas/Program, Tanggal
            if (! empty($programId)) {
                $dupProg = TeachingSession::with('program')
                    ->where('guru_id', $guruId)
                    ->where('program_id', $programId)
                    ->whereDate('tanggal', $tanggal)
                    ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                    ->when($ignoreSessionId, fn ($q) => $q->where('id', '!=', $ignoreSessionId))
                    ->first();

                if ($dupProg) {
                    $progName = $dupProg->program?->nama ?: 'program tersebut';

                    return "Alarm bentrok: guru sudah terploting di kelas & hari yang sama ({$progName}). Batalkan sesi lama terlebih dahulu sebelum menyimpan sesi baru.";
                }
            }

            if (! empty($kelas)) {
                $dupQuery = TeachingSession::where('guru_id', $guruId)
                    ->where('kelas', $kelas)
                    ->whereDate('tanggal', $tanggal)
                    ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                    ->when($ignoreSessionId, fn ($q) => $q->where('id', '!=', $ignoreSessionId));

                if (! empty($sessionTime)) {
                    $dupQuery->where('session_time', $sessionTime);
                } elseif (! empty($jamMulai) && ! empty($jamSelesai)) {
                    $dupQuery->where('jam_mulai', '<', $jamSelesai)->where('jam_selesai', '>', $jamMulai);
                }

                $dup = $dupQuery->first();
                if ($dup) {
                    $timeStr = $dup->session_time ? " ({$dup->session_time})" : ($dup->jam_mulai ? " ({$dup->jam_mulai->format('H:i')}-{$dup->jam_selesai->format('H:i')})" : '');

                    return "Peringatan Anti-Bentrok: {$guruName} sudah memiliki jadwal di {$kelas} pada {$formattedDate}{$timeStr}. Batalkan atau ubah sesi lama terlebih dahulu.";
                }
            }

            // 2. Kelas yang sama pada hari & jam yang sama sudah diisi guru lain
            if (! empty($kelas) || ! empty($programId)) {
                $conflictKelasQuery = TeachingSession::with(['guru.user', 'program'])
                    ->whereDate('tanggal', $tanggal)
                    ->where('guru_id', '!=', $guruId)
                    ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                    ->when($ignoreSessionId, fn ($q) => $q->where('id', '!=', $ignoreSessionId));

                if (! empty($programId)) {
                    $conflictKelasQuery->where('program_id', $programId);
                } elseif (! empty($kelas)) {
                    $conflictKelasQuery->where(function ($q) use ($kelas) {
                        $q->where('kelas', $kelas)
                            ->orWhereHas('program', fn ($pq) => $pq->where('nama', $kelas));
                    });
                }

                if (! empty($sessionTime) || (! empty($jamMulai) && ! empty($jamSelesai))) {
                    $conflictKelasQuery->where(function ($q) use ($sessionTime, $jamMulai, $jamSelesai) {
                        if ($sessionTime) {
                            $q->where('session_time', $sessionTime);
                        }
                        if ($jamMulai && $jamSelesai) {
                            $q->orWhere(function ($sub) use ($jamMulai, $jamSelesai) {
                                $sub->where('jam_mulai', '<', $jamSelesai)
                                    ->where('jam_selesai', '>', $jamMulai);
                            });
                        }
                    });
                }

                $conflictKelas = $conflictKelasQuery->first();
                if ($conflictKelas) {
                    $otherName = $conflictKelas->guru?->nama ?: ($conflictKelas->guru?->user?->name ?: 'Guru Lain');
                    $timeStr = $conflictKelas->session_time ? " ({$conflictKelas->session_time})" : ($conflictKelas->jam_mulai ? " ({$conflictKelas->jam_mulai->format('H:i')}-{$conflictKelas->jam_selesai->format('H:i')})" : '');
                    $kLabel = $kelas ?: ($conflictKelas->program?->nama ?: 'kelas');

                    return "Peringatan Anti-Bentrok: {$kLabel} pada hari {$formattedDate}{$timeStr} sudah diisi oleh {$otherName}. Batalkan sesi lama terlebih dahulu.";
                }
            }

            // 3. Guru yang sama terploting di jam yang sama pada kelas berbeda (overlap)
            if (! empty($sessionTime) || (! empty($jamMulai) && ! empty($jamSelesai))) {
                $conflictTimeQuery = TeachingSession::with('program')
                    ->where('guru_id', $guruId)
                    ->whereDate('tanggal', $tanggal)
                    ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                    ->when($ignoreSessionId, fn ($q) => $q->where('id', '!=', $ignoreSessionId));

                if (! empty($kelas)) {
                    $conflictTimeQuery->where(fn ($q) => $q->whereNull('kelas')->orWhere('kelas', '!=', $kelas));
                } elseif (! empty($programId)) {
                    $conflictTimeQuery->where(fn ($q) => $q->whereNull('program_id')->orWhere('program_id', '!=', $programId));
                }

                if (! empty($sessionTime)) {
                    $conflictTimeQuery->where('session_time', $sessionTime);
                }
                if ($jamMulai && $jamSelesai) {
                    $conflictTimeQuery->orWhere(function ($sub) use ($guruId, $tanggal, $ignoreSessionId, $jamMulai, $jamSelesai) {
                        $sub->where('guru_id', $guruId)
                            ->whereDate('tanggal', $tanggal)
                            ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
                            ->when($ignoreSessionId, fn ($q) => $q->where('id', '!=', $ignoreSessionId))
                            ->where('jam_mulai', '<', $jamSelesai)
                            ->where('jam_selesai', '>', $jamMulai);
                    });
                }

                $conflictTime = $conflictTimeQuery->first();
                if ($conflictTime) {
                    $cKelas = $conflictTime->kelas ?: ($conflictTime->program?->nama ?: 'kelas lain');
                    $tDisplay = $sessionTime ?: "{$jamMulai} - {$jamSelesai}";

                    return "Peringatan Anti-Bentrok: {$guruName} sudah terjadwal pada jam {$tDisplay} di {$cKelas} ({$formattedDate}).";
                }
            }
        }

        return null;
    }

    /**
     * Upload materi bahan ajar PDF langsung dari menu ploting
     */
    public function uploadMaterial(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf|max:10240',
            'subject' => 'nullable|string|max:100',
            'pekan' => 'nullable|string|max:50',
            'kelas' => 'nullable|string|max:50',
            'level' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ], [
            'file.required' => 'Berkas PDF materi wajib diunggah.',
            'file.mimes' => 'Format file materi harus berformat PDF.',
            'file.max' => 'Ukuran file PDF maksimal 10 MB.',
        ]);

        $file = $request->file('file');
        $path = $file->store('materials', 'public');
        $fileName = str_replace(['"', "\r", "\n"], '', $file->getClientOriginalName());

        $material = Material::create([
            'uploaded_by' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_path' => $path,
            'file_name' => $fileName,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'subject' => $validated['subject'] ?? null,
            'pekan' => $validated['pekan'] ?? null,
            'kelas' => $validated['kelas'] ?? null,
            'level' => $validated['level'] ?? null,
            'status' => 'approved',
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Materi PDF '{$material->title}' berhasil diunggah.",
                'material' => $material,
                'question' => $material,
            ]);
        }

        return back()->with('success', "Materi PDF \"{$material->title}\" berhasil diunggah.")
            ->with('uploaded_material_id', $material->id)
            ->with('uploaded_question_id', $material->id);
    }

    public function store(Request $request)
    {
        // Standarisasi input pekan
        if (is_string($request->input('pekan')) && preg_match('/^Pekan\s*(\d)$/i', trim($request->input('pekan')), $matches)) {
            $request->merge(['pekan' => (int) $matches[1]]);
        }

        $guruId = $request->input('guru_id', $request->input('teacher_id'));
        if ($guruId) {
            $request->merge(['guru_id' => (int) $guruId, 'teacher_id' => (int) $guruId]);
        }

        // Dukungan bulk weeks (Siklus 2 Pekan atau 4 Pekan)
        $weeksInput = $request->input('weeks', $request->input('cycles'));
        if (is_array($weeksInput) && count($weeksInput) > 0) {
            $validated = $request->validate([
                'guru_id' => 'required|exists:gurus,id',
                'month' => 'nullable|integer|min:1|max:12',
                'year' => 'nullable|integer|min:2020|max:2100',
                'kelas' => 'nullable|string|max:50',
                'level' => 'nullable|string|max:100',
                'bidang' => 'nullable|string|max:100',
            ]);

            $month = (int) ($validated['month'] ?? now()->month);
            $year = (int) ($validated['year'] ?? now()->year);
            $defaultLocId = Location::first()?->id ?? 1;
            $defaultTransId = Transport::first()?->id ?? 1;

            // Validasi anti-bentrok untuk setiap entri pekan
            foreach ($weeksInput as $idx => $weekData) {
                if (! is_array($weekData)) {
                    continue;
                }
                $pekan = (int) ($weekData['pekan'] ?? ($idx + 1));
                if ($pekan < 1 || $pekan > 4) {
                    continue;
                }
                $kelas = $weekData['kelas'] ?? ($validated['kelas'] ?? null);
                $sessionDate = ! empty($weekData['session_date']) ? $weekData['session_date'] : ($weekData['tanggal'] ?? null);
                $sessionTime = ! empty($weekData['session_time']) ? $weekData['session_time'] : null;
                $weekId = ! empty($weekData['id']) ? (int) $weekData['id'] : null;

                [$jamMulai, $jamSelesai] = $this->parseTimeRange($sessionTime, $weekData['jam_mulai'] ?? null, $weekData['jam_selesai'] ?? null);

                $conflict = $this->checkScheduleConflict(
                    (int) $validated['guru_id'],
                    $weekId,
                    $sessionDate,
                    $sessionTime,
                    $jamMulai,
                    $jamSelesai,
                    $kelas
                );

                if ($conflict) {
                    return back()->withErrors(['conflict' => $conflict, 'program_id' => $conflict, 'jam_mulai' => $conflict])
                        ->with('error', $conflict)
                        ->withInput();
                }
            }

            foreach ($weeksInput as $idx => $weekData) {
                if (! is_array($weekData)) {
                    continue;
                }
                $pekan = (int) ($weekData['pekan'] ?? ($idx + 1));
                if ($pekan < 1 || $pekan > 4) {
                    continue;
                }
                $kelas = $weekData['kelas'] ?? ($validated['kelas'] ?? null);
                $weekId = ! empty($weekData['id']) ? (int) $weekData['id'] : null;
                $sessionDate = ! empty($weekData['session_date']) ? $weekData['session_date'] : ($weekData['tanggal'] ?? null);
                $sessionTime = ! empty($weekData['session_time']) ? $weekData['session_time'] : null;
                $materialId = ! empty($weekData['material_id']) ? (int) $weekData['material_id'] : (! empty($weekData['question_id']) ? (int) $weekData['question_id'] : null);
                $bidang = $weekData['bidang'] ?? ($weekData['mapel'] ?? ($validated['bidang'] ?? 'MTK'));

                [$jamMulai, $jamSelesai] = $this->parseTimeRange($sessionTime, $weekData['jam_mulai'] ?? null, $weekData['jam_selesai'] ?? null);

                $program = Program::where('nama', $kelas)->orWhere('slug', strtolower(str_replace(' ', '-', (string) $kelas)))->first();
                $programId = $program?->id ?? $weekData['program_id'] ?? Program::first()?->id;

                $dataPayload = [
                    'guru_id' => $validated['guru_id'],
                    'location_id' => $weekData['location_id'] ?? $defaultLocId,
                    'transport_id' => $weekData['transport_id'] ?? $defaultTransId,
                    'program_id' => $programId,
                    'kelas' => $kelas,
                    'level' => $weekData['level'] ?? ($validated['level'] ?? null),
                    'mapel' => in_array($bidang, ['IPA', 'MTK']) ? $bidang : 'MTK',
                    'tanggal' => $sessionDate,
                    'pekan' => $pekan,
                    'session_time' => $sessionTime,
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'material_id' => $materialId,
                    'bahan_ajar' => $weekData['notes'] ?? ($weekData['catatan'] ?? null),
                    'jumlah_sesi' => 1,
                    'status' => TeachingSession::STATUS_DIJADWALKAN,
                    'is_active' => isset($weekData['is_active']) ? (bool) $weekData['is_active'] : true,
                    'catatan' => $weekData['notes'] ?? ($weekData['catatan'] ?? null),
                ];

                if ($weekId) {
                    $s = TeachingSession::find($weekId);
                    if ($s) {
                        $s->update($dataPayload);
                        continue;
                    }
                }

                $newSession = TeachingSession::create($dataPayload);
                $this->notifyGuruAboutSession($newSession, 'ditugaskan');
            }

            $countWeeks = count($weeksInput);

            return back()->with('success', "Ploting jadwal mengajar ({$countWeeks} sesi) berhasil disimpan.");
        }

        // Ploting Single Sesi Mengajar
        $defaultLocId = Location::first()?->id ?? 1;
        $defaultTransId = Transport::first()?->id ?? 1;

        $rules = [
            'guru_id' => 'required|exists:gurus,id',
            'location_id' => 'nullable|exists:locations,id',
            'transport_id' => 'nullable|exists:transports,id',
            'program_id' => 'nullable|exists:programs,id',
            'kelas' => 'nullable|string|max:50',
            'level' => 'nullable|string|max:100',
            'mapel' => 'nullable|string|max:100',
            'bidang' => 'nullable|string|max:100',
            'tanggal' => 'nullable|date',
            'session_date' => 'nullable|date',
            'session_time' => 'nullable|string|max:50',
            'jam_mulai' => 'nullable|string',
            'jam_selesai' => 'nullable|string',
            'pekan' => 'nullable|integer|min:1|max:53',
            'material_id' => 'nullable|exists:materials,id',
            'question_id' => 'nullable|exists:materials,id',
            'bahan_ajar' => 'nullable|string|max:1000',
            'material_pdf' => 'nullable|file|mimes:pdf|max:10240',
            'material_pdf_title' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'catatan' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
            'jumlah_sesi' => 'nullable|integer|min:1|max:10',
            'status' => 'nullable|in:dijadwalkan,selesai,dibatalkan',
        ];

        $validated = $request->validate($rules);

        $tanggal = $validated['session_date'] ?? ($validated['tanggal'] ?? today()->toDateString());
        $sessionTime = $validated['session_time'] ?? null;
        [$jamMulai, $jamSelesai] = $this->parseTimeRange($sessionTime, $validated['jam_mulai'] ?? null, $validated['jam_selesai'] ?? null);

        $materialId = ! empty($validated['material_id']) ? (int) $validated['material_id'] : (! empty($validated['question_id']) ? (int) $validated['question_id'] : null);

        // Jika ada unggahan PDF langsung dari form single ploting
        if ($request->hasFile('material_pdf')) {
            $pdfFile = $request->file('material_pdf');
            $pdfPath = $pdfFile->store('materials', 'public');
            $pdfTitle = $validated['material_pdf_title'] ?: pathinfo($pdfFile->getClientOriginalName(), PATHINFO_FILENAME);

            $newMat = Material::create([
                'uploaded_by' => auth()->id(),
                'title' => $pdfTitle,
                'file_path' => $pdfPath,
                'file_name' => $pdfFile->getClientOriginalName(),
                'file_type' => $pdfFile->getMimeType(),
                'file_size' => $pdfFile->getSize(),
                'subject' => $validated['bidang'] ?? ($validated['mapel'] ?? null),
                'pekan' => 'Pekan '.($validated['pekan'] ?? 1),
                'kelas' => $validated['kelas'] ?? null,
                'level' => $validated['level'] ?? null,
                'status' => 'approved',
            ]);
            $materialId = $newMat->id;
        }

        $kelas = $validated['kelas'] ?? null;
        $programId = $validated['program_id'] ?? null;
        if (! $programId && $kelas) {
            $prog = Program::where('nama', $kelas)->orWhere('slug', strtolower(str_replace(' ', '-', (string) $kelas)))->first();
            $programId = $prog?->id;
        }
        if (! $programId) {
            $programId = Program::first()?->id;
        }

        // Cek alarm anti-bentrok
        $conflict = $this->checkScheduleConflict(
            (int) $validated['guru_id'],
            null,
            $tanggal,
            $sessionTime,
            $jamMulai,
            $jamSelesai,
            $kelas,
            $validated['program_id'] ?? null
        );

        if ($conflict) {
            return back()->withErrors(['conflict' => $conflict, 'program_id' => $conflict, 'jam_mulai' => $conflict])
                ->with('error', $conflict)
                ->withInput();
        }

        $bidang = $validated['bidang'] ?? ($validated['mapel'] ?? 'MTK');
        $mapel = in_array(strtoupper((string) $bidang), ['IPA', 'MTK']) ? strtoupper((string) $bidang) : 'MTK';

        $session = TeachingSession::create([
            'guru_id' => $validated['guru_id'],
            'location_id' => $validated['location_id'] ?? $defaultLocId,
            'transport_id' => $validated['transport_id'] ?? $defaultTransId,
            'program_id' => $programId,
            'kelas' => $kelas,
            'level' => $validated['level'] ?? null,
            'mapel' => $mapel,
            'tanggal' => $tanggal,
            'pekan' => $validated['pekan'] ?? 1,
            'session_time' => $sessionTime,
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
            'material_id' => $materialId,
            'bahan_ajar' => $validated['bahan_ajar'] ?? ($validated['notes'] ?? null),
            'jumlah_sesi' => $validated['jumlah_sesi'] ?? 1,
            'status' => $validated['status'] ?? TeachingSession::STATUS_DIJADWALKAN,
            'is_active' => $validated['is_active'] ?? true,
            'catatan' => $validated['notes'] ?? ($validated['catatan'] ?? null),
        ]);

        $this->notifyGuruAboutSession($session, 'ditugaskan');

        return back()->with('success', 'Ploting jadwal sesi mengajar berhasil disimpan.');
    }

    public function update(Request $request, TeachingSession $session)
    {
        $guruId = $request->input('guru_id', $request->input('teacher_id', $session->guru_id));
        if ($guruId) {
            $request->merge(['guru_id' => (int) $guruId]);
        }

        $defaultLocId = $session->location_id ?: (Location::first()?->id ?? 1);
        $defaultTransId = $session->transport_id ?: (Transport::first()?->id ?? 1);

        $tanggal = $request->input('session_date', $request->input('tanggal', $session->tanggal?->format('Y-m-d')));
        $sessionTime = $request->input('session_time', $session->session_time);
        [$jamMulai, $jamSelesai] = $this->parseTimeRange($sessionTime, $request->input('jam_mulai', $session->jam_mulai?->format('H:i')), $request->input('jam_selesai', $session->jam_selesai?->format('H:i')));

        $kelas = $request->input('kelas', $session->kelas);
        $programId = $request->input('program_id', $session->program_id);

        $conflict = $this->checkScheduleConflict(
            (int) $guruId,
            $session->id,
            $tanggal,
            $sessionTime,
            $jamMulai,
            $jamSelesai,
            $kelas,
            $request->input('program_id') ? (int) $programId : null
        );

        if ($conflict) {
            return back()->withErrors(['conflict' => $conflict, 'program_id' => $conflict, 'jam_mulai' => $conflict])
                ->with('error', $conflict)
                ->withInput();
        }

        $bidang = $request->input('bidang', $request->input('mapel', $session->mapel));
        $mapel = in_array(strtoupper((string) $bidang), ['IPA', 'MTK']) ? strtoupper((string) $bidang) : $session->mapel;

        $materialId = $request->input('material_id', $request->input('question_id', $session->material_id));
        if ($request->hasFile('material_pdf')) {
            $pdfFile = $request->file('material_pdf');
            $pdfPath = $pdfFile->store('materials', 'public');
            $pdfTitle = $request->input('material_pdf_title') ?: pathinfo($pdfFile->getClientOriginalName(), PATHINFO_FILENAME);

            $newMat = Material::create([
                'uploaded_by' => auth()->id(),
                'title' => $pdfTitle,
                'file_path' => $pdfPath,
                'file_name' => $pdfFile->getClientOriginalName(),
                'file_type' => $pdfFile->getMimeType(),
                'file_size' => $pdfFile->getSize(),
                'subject' => $mapel,
                'pekan' => 'Pekan '.($request->input('pekan', $session->pekan) ?? 1),
                'kelas' => $kelas,
                'status' => 'approved',
            ]);
            $materialId = $newMat->id;
        }

        $guruBerubah = $session->guru_id !== (int) $guruId;

        $session->update([
            'guru_id' => (int) $guruId,
            'location_id' => $request->input('location_id', $defaultLocId),
            'transport_id' => $request->input('transport_id', $defaultTransId),
            'program_id' => $programId,
            'kelas' => $kelas,
            'level' => $request->input('level', $session->level),
            'mapel' => $mapel,
            'tanggal' => $tanggal,
            'pekan' => $request->input('pekan', $session->pekan),
            'session_time' => $sessionTime,
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
            'material_id' => $materialId,
            'bahan_ajar' => $request->input('bahan_ajar', $request->input('notes', $session->bahan_ajar)),
            'jumlah_sesi' => $request->input('jumlah_sesi', $session->jumlah_sesi),
            'status' => $request->input('status', $session->status),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $session->is_active,
            'catatan' => $request->input('notes', $request->input('catatan', $session->catatan)),
        ]);

        $this->notifyGuruAboutSession($session->fresh(), 'diperbarui', $guruBerubah);

        return back()->with('success', 'Sesi mengajar berhasil diperbarui.');
    }

    public function destroy(TeachingSession $session)
    {
        $attendanceCount = $session->attendances()->count();

        if ($attendanceCount > 0) {
            return back()->with('error', 'Sesi tidak dapat dihapus karena masih memiliki '.$attendanceCount.' data presensi. Gunakan status "Dibatalkan" bila sesi memang dibatalkan.');
        }

        if ($session->guru?->user) {
            $tgl = $session->tanggal ? Tanggal::tanggalPanjang($session->tanggal) : 'sesi';
            $jam = $session->jam_mulai ? $session->jam_mulai->format('H:i') : ($session->session_time ?: '');
            Notification::send(
                $session->guru->user,
                'Sesi Mengajar Dihapus',
                "Sesi mengajar pada {$tgl} {$jam} telah dihapus oleh admin.",
                'warning',
                'sesi'
            );
        }

        $session->delete();

        return back()->with('success', 'Ploting jadwal mengajar berhasil dihapus.');
    }

    /**
     * Ubah status aktif/nonaktif akun guru pekan ini
     */
    public function toggleTeacherActive(Request $request, Guru $guru)
    {
        $newStatus = true;
        if ($request->has('status')) {
            $newStatus = $request->input('status') === 'aktif';
        } elseif ($request->has('is_active_this_week')) {
            $newStatus = $request->boolean('is_active_this_week');
        } else {
            $newStatus = ! (bool) ($guru->is_active_this_week ?? true);
        }

        $guru->update([
            'is_active_this_week' => $newStatus,
        ]);

        $statusLabel = $newStatus ? 'Aktif' : 'Nonaktif';

        return back()->with('success', "Status akun guru berhasil diatur menjadi {$statusLabel}.");
    }

    /**
     * Helper parsing jam mulai & jam selesai
     *
     * @return array{0: string, 1: string}
     */
    private function parseTimeRange(?string $sessionTime, ?string $jamMulai, ?string $jamSelesai): array
    {
        if (! empty($jamMulai) && ! empty($jamSelesai)) {
            return [substr($jamMulai, 0, 5), substr($jamSelesai, 0, 5)];
        }

        if (! empty($sessionTime) && str_contains($sessionTime, '-')) {
            [$s, $e] = explode('-', $sessionTime, 2);
            $sClean = trim(preg_replace('/[^0-9:]/', '', $s));
            $eClean = trim(preg_replace('/[^0-9:]/', '', $e));

            $start = strlen($sClean) === 5 ? $sClean : '08:00';
            $end = strlen($eClean) === 5 ? $eClean : '09:30';

            return [$start, $end];
        }

        return ['08:00', '09:30'];
    }

    private function notifyGuruAboutSession(TeachingSession $session, string $aksi, bool $guruBerubah = false): void
    {
        $session->load(['guru.user', 'location', 'program']);

        $user = $session->guru?->user;

        if (! $user) {
            return;
        }

        $judul = match ($aksi) {
            'diperbarui' => $guruBerubah ? 'Penugasan Sesi Mengajar Baru' : 'Jadwal Sesi Mengajar Diperbarui',
            default => 'Penugasan Sesi Mengajar Baru',
        };

        $tglStr = $session->tanggal ? Tanggal::tanggalPanjang($session->tanggal) : 'sesi';
        $jamStr = $session->jam_mulai && $session->jam_selesai
            ? $session->jam_mulai->format('H:i').'-'.$session->jam_selesai->format('H:i')
            : ($session->session_time ?: '');

        $pesan = 'Anda '.$aksi.' sesi mengajar '.$tglStr
            .($jamStr ? ' pukul '.$jamStr : '')
            .($session->location ? ' di '.$session->location->nama_lokasi : '')
            .($session->program ? ' — '.$session->program->nama : ($session->kelas ? ' — '.$session->kelas : ''))
            .'. Status: '.ucfirst($session->status).'.'.($session->catatan ? ' Catatan: '.$session->catatan : '');

        Notification::send($user, $judul, $pesan, 'info', 'sesi');
    }
}
