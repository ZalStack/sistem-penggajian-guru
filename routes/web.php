<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\GuruController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\PenggajianController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TeachingSessionController;
use App\Http\Controllers\TransportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'laravelVersion' => app()->version(),
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::match(['patch', 'put'], '/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('checkin', [AttendanceController::class, 'checkin'])->name('checkin');
    Route::post('checkout', [AttendanceController::class, 'checkout'])->name('checkout');
    Route::get('my-attendance', [AttendanceController::class, 'guruAttendance'])->name('my-attendance');
    Route::get('my-salary', [SalaryController::class, 'guruSalary'])->name('my-salary');
    Route::get('my-salary/{penggajian}/payslip', [SalaryController::class, 'downloadPayslip'])->name('my-salary.payslip');

    Route::middleware('role:admin')->group(function () {
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

        Route::get('salary', [SalaryController::class, 'index'])->name('salary.index');
        Route::post('salary/calculate', [SalaryController::class, 'calculate'])->name('salary.calculate');
        Route::post('salary/{penggajian}/pay', [SalaryController::class, 'pay'])->name('salary.pay');
        Route::get('salary/{penggajian}/payslip', [SalaryController::class, 'downloadPayslip'])->name('salary.payslip');

        Route::get('penggajian', [PenggajianController::class, 'index'])->name('penggajian.index');
        Route::get('penggajian/create', [PenggajianController::class, 'create'])->name('penggajian.create');
        Route::post('penggajian', [PenggajianController::class, 'store'])->name('penggajian.store');
        Route::get('penggajian/{penggajian}', [PenggajianController::class, 'show'])->name('penggajian.show');
        Route::get('penggajian/{penggajian}/edit', [PenggajianController::class, 'edit'])->name('penggajian.edit');
        Route::put('penggajian/{penggajian}', [PenggajianController::class, 'update'])->name('penggajian.update');
        Route::delete('penggajian/{penggajian}', [PenggajianController::class, 'destroy'])->name('penggajian.destroy');

        Route::get('laporan', [LaporanController::class, 'index'])->name('laporan.index');
        Route::get('laporan/export-pdf', [LaporanController::class, 'exportPdf'])->name('laporan.exportPdf');
        Route::get('laporan/export-excel', [LaporanController::class, 'exportExcel'])->name('laporan.exportExcel');
    });
});

require __DIR__.'/auth.php';
