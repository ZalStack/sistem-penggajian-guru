<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BahanAjarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\GuruController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerizinanController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SunnahGuruController;
use App\Http\Controllers\TeachingSessionController;
use App\Http\Controllers\TransportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::match(['patch', 'put'], '/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('my-attendance', [AttendanceController::class, 'guruAttendance'])->name('my-attendance');
    Route::get('my-perizinan', [PerizinanController::class, 'guruIndex'])->name('my-perizinan');
    Route::post('my-perizinan', [PerizinanController::class, 'guruStore'])->name('my-perizinan.store');
    Route::get('my-salary', [SalaryController::class, 'guruSalary'])->name('my-salary');
    Route::get('my-salary/{penggajian}/payslip', [SalaryController::class, 'downloadPayslip'])->name('my-salary.payslip');

    // Amalan 7SPS — checklist guru (hari ini & kemarin)
    Route::get('my-sunnah', [SunnahGuruController::class, 'guruIndex'])->name('my-sunnah.index');
    Route::post('my-sunnah', [SunnahGuruController::class, 'save'])->name('my-sunnah.save');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');

    // Bahan Ajar — akses guru (lihat & unduh)
    Route::get('my-bahan-ajar', [BahanAjarController::class, 'guruIndex'])->name('my-bahan-ajar.index');
    Route::get('my-bahan-ajar/{bahanAjar}/download', [BahanAjarController::class, 'download'])->name('my-bahan-ajar.download');

    // Jadwal Mingguan — admin & guru (role-aware di controller)
    Route::get('jadwal', [JadwalController::class, 'index'])->name('jadwal.index');
    Route::redirect('jadwal-bulanan', '/jadwal');

    Route::middleware('role:admin')->group(function () {
        // Bahan Ajar — kelola admin (upload/edit/hapus/unduh)
        Route::get('bahan-ajar', [BahanAjarController::class, 'index'])->name('bahan-ajar.index');
        Route::post('bahan-ajar', [BahanAjarController::class, 'store'])->name('bahan-ajar.store');
        Route::put('bahan-ajar/{bahanAjar}', [BahanAjarController::class, 'update'])->name('bahan-ajar.update');
        Route::delete('bahan-ajar/{bahanAjar}', [BahanAjarController::class, 'destroy'])->name('bahan-ajar.destroy');
        Route::get('bahan-ajar/{bahanAjar}/download', [BahanAjarController::class, 'download'])->name('bahan-ajar.download');

        Route::get('guru/export-credentials-pdf', [GuruController::class, 'exportCredentialsPdf'])->name('guru.exportCredentialsPdf');
        Route::resource('guru', GuruController::class)->except(['edit']);
        Route::get('guru/{guru}/edit', [GuruController::class, 'edit'])->name('guru.edit');
        Route::post('guru/{guru}/reset-password', [GuruController::class, 'resetPassword'])->name('guru.resetPassword');

        Route::post('grade', [GradeController::class, 'store'])->name('grade.store');
        Route::put('grade/{grade}', [GradeController::class, 'update'])->name('grade.update');
        Route::delete('grade/{grade}', [GradeController::class, 'destroy'])->name('grade.destroy');
        Route::get('grade', [GradeController::class, 'index'])->name('grade.index');

        Route::post('transport', [TransportController::class, 'store'])->name('transport.store');
        Route::put('transport/{transport}', [TransportController::class, 'update'])->name('transport.update');
        Route::delete('transport/{transport}', [TransportController::class, 'destroy'])->name('transport.destroy');
        Route::get('transport', [TransportController::class, 'index'])->name('transport.index');

        Route::get('location', [LocationController::class, 'index'])->name('location.index');
        Route::post('location', [LocationController::class, 'store'])->name('location.store');
        Route::put('location/{location}', [LocationController::class, 'update'])->name('location.update');
        Route::delete('location/{location}', [LocationController::class, 'destroy'])->name('location.destroy');

        Route::get('session', [TeachingSessionController::class, 'index'])->name('session.index');
        Route::post('session', [TeachingSessionController::class, 'store'])->name('session.store');
        Route::put('session/{session}', [TeachingSessionController::class, 'update'])->name('session.update');
        Route::delete('session/{session}', [TeachingSessionController::class, 'destroy'])->name('session.destroy');

        Route::get('attendance', [AttendanceController::class, 'adminRecap'])->name('attendance.index');

        Route::get('perizinan', [PerizinanController::class, 'adminIndex'])->name('perizinan.index');
        Route::put('perizinan/{perizinan}', [PerizinanController::class, 'adminUpdate'])->name('perizinan.update');

        // Amalan 7SPS — monitoring & approval admin
        Route::get('sunnah-guru', [SunnahGuruController::class, 'adminIndex'])->name('sunnah-guru.index');
        Route::post('sunnah-guru/bulk-approval', [SunnahGuruController::class, 'bulkApprove'])->name('sunnah-guru.bulk-approve');
        Route::get('sunnah-guru/{sunnahGuru}', [SunnahGuruController::class, 'detail'])->name('sunnah-guru.show');
        Route::put('sunnah-guru/{sunnahGuru}/approval', [SunnahGuruController::class, 'approve'])->name('sunnah-guru.approve');

        // Penggajian — rekap honor per guru & periode (dihitung dari presensi tervalidasi)
        Route::get('penggajian', [SalaryController::class, 'index'])->name('penggajian.index');
        Route::post('penggajian/calculate', [SalaryController::class, 'calculate'])->name('penggajian.calculate')->middleware('throttle:1,60');
        Route::post('penggajian/{penggajian}/pay', [SalaryController::class, 'pay'])->name('penggajian.pay');
        Route::get('penggajian/{penggajian}/payslip', [SalaryController::class, 'downloadPayslip'])->name('penggajian.payslip');

        Route::get('laporan', [LaporanController::class, 'index'])->name('laporan.index');
        Route::get('laporan/export-pdf', [LaporanController::class, 'exportPdf'])->name('laporan.exportPdf');
        Route::get('laporan/export-excel', [LaporanController::class, 'exportExcel'])->name('laporan.exportExcel');
    });
});

require __DIR__.'/auth.php';
