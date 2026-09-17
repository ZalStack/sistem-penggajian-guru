<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\GuruController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\PenggajianController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => app()->version(),
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::match(['patch', 'put'], '/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('guru', GuruController::class)->except(['edit']);
    Route::get('guru/{guru}/edit', [GuruController::class, 'edit'])->name('guru.edit');

    Route::post('grade', [GradeController::class, 'store'])->name('grade.store');
    Route::put('grade/{grade}', [GradeController::class, 'update'])->name('grade.update');
    Route::delete('grade/{grade}', [GradeController::class, 'destroy'])->name('grade.destroy');
    Route::get('grade', [GradeController::class, 'index'])->name('grade.index');

    Route::post('transport', [TransportController::class, 'store'])->name('transport.store');
    Route::put('transport/{transport}', [TransportController::class, 'update'])->name('transport.update');
    Route::delete('transport/{transport}', [TransportController::class, 'destroy'])->name('transport.destroy');
    Route::get('transport', [TransportController::class, 'index'])->name('transport.index');

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

require __DIR__.'/auth.php';
