<?php

use App\Http\Controllers\Api\OpenApiDocsController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\GradeController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PayrollController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SalaryController;
use App\Http\Controllers\Api\V1\ScheduleController;
use App\Http\Controllers\Api\V1\TeacherController;
use App\Http\Controllers\Api\V1\TeachingMaterialController;
use App\Http\Controllers\Api\V1\TeachingSessionController;
use App\Http\Controllers\Api\V1\TransportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Documentation
|--------------------------------------------------------------------------
| Interactive OpenAPI documentation (HTML) and the raw OpenAPI document.
*/
Route::get('/docs', [OpenApiDocsController::class, 'show'])->name('api.docs');
Route::get('/openapi.json', [OpenApiDocsController::class, 'spec'])->name('api.spec');

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| Convention:
|  - Every GET endpoint is public EXCEPT endpoints that depend on the
|    authenticated user's identity or expose sensitive data (marked
|    "auth:sanctum" below).
|  - Every POST / PUT / PATCH / DELETE endpoint requires a Sanctum token.
*/
Route::prefix('v1')->name('api.v1.')->group(function () {

    /*
    |----------------------------------------------------------------------
    | Authentication
    |----------------------------------------------------------------------
    */
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('auth.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
    });

    /*
    |----------------------------------------------------------------------
    | Public catalogue endpoints (GET, no token required)
    |----------------------------------------------------------------------
    */
    Route::get('grades', [GradeController::class, 'index'])->name('grades.index');
    Route::get('grades/{grade}', [GradeController::class, 'show'])->name('grades.show');

    Route::get('transports', [TransportController::class, 'index'])->name('transports.index');
    Route::get('transports/{transport}', [TransportController::class, 'show'])->name('transports.show');

    Route::get('locations', [LocationController::class, 'index'])->name('locations.index');
    Route::get('locations/{location}', [LocationController::class, 'show'])->name('locations.show');

    Route::get('teachers', [TeacherController::class, 'index'])->name('teachers.index');
    Route::get('teachers/options', [TeacherController::class, 'options'])
        ->middleware('role:admin')
        ->name('teachers.options');
    Route::get('teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');

    Route::get('teaching-sessions', [TeachingSessionController::class, 'index'])->name('teaching-sessions.index');
    Route::get('teaching-sessions/options', [TeachingSessionController::class, 'options'])->name('teaching-sessions.options');
    Route::get('teaching-sessions/{session}', [TeachingSessionController::class, 'show'])->name('teaching-sessions.show');

    Route::get('teaching-materials', [TeachingMaterialController::class, 'index'])->name('teaching-materials.index');
    Route::get('teaching-materials/{material}', [TeachingMaterialController::class, 'show'])->name('teaching-materials.show');

    /*
    |----------------------------------------------------------------------
    | Authenticated endpoints (any role)
    |----------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('schedules', [ScheduleController::class, 'index'])->name('schedules');

        Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::get('notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');

        Route::get('teaching-materials/{material}/download', [TeachingMaterialController::class, 'download'])->name('teaching-materials.download');

        /*
        |----------------------------------------------------------------------
        | External integration (SI ADIK-KK sync)
        |----------------------------------------------------------------------
        */
        Route::post('attendances/sync-from-adik', [AttendanceController::class, 'syncFromAdik'])->name('attendances.sync-from-adik');
        Route::delete('attendances/sync-from-adik', [AttendanceController::class, 'syncFromAdik'])->name('attendances.sync-from-adik.delete');

        /*
        |----------------------------------------------------------------------
        | Teacher (guru) actions
        |----------------------------------------------------------------------
        */
        Route::middleware('role:guru')->group(function () {
            Route::get('attendances/mine', [AttendanceController::class, 'mine'])->name('attendances.mine');
            Route::post('attendances/check-in', [AttendanceController::class, 'checkIn'])
                ->middleware('throttle:10,1')
                ->name('attendances.check-in');
            Route::post('attendances/check-out', [AttendanceController::class, 'checkOut'])
                ->middleware('throttle:10,1')
                ->name('attendances.check-out');

            Route::get('leave-requests/mine', [LeaveRequestController::class, 'mine'])->name('leave-requests.mine');
            Route::post('leave-requests', [LeaveRequestController::class, 'store'])->name('leave-requests.store');

            Route::get('salaries/mine', [SalaryController::class, 'mine'])->name('salaries.mine');
            Route::get('salaries/mine/{salary}/payslip', [SalaryController::class, 'myPayslip'])->name('salaries.my-payslip');
        });

        /*
        |----------------------------------------------------------------------
        | Admin actions
        |----------------------------------------------------------------------
        */
        Route::middleware('role:admin')->group(function () {

            // Teachers
            Route::get('teachers/credentials/export', [TeacherController::class, 'exportCredentials'])->name('teachers.export-credentials');
            Route::post('teachers', [TeacherController::class, 'store'])->name('teachers.store');
            Route::put('teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
            Route::delete('teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
            Route::post('teachers/{teacher}/reset-password', [TeacherController::class, 'resetPassword'])->name('teachers.reset-password');

            // Grades
            Route::post('grades', [GradeController::class, 'store'])->name('grades.store');
            Route::put('grades/{grade}', [GradeController::class, 'update'])->name('grades.update');
            Route::delete('grades/{grade}', [GradeController::class, 'destroy'])->name('grades.destroy');

            // Transports
            Route::post('transports', [TransportController::class, 'store'])->name('transports.store');
            Route::put('transports/{transport}', [TransportController::class, 'update'])->name('transports.update');
            Route::delete('transports/{transport}', [TransportController::class, 'destroy'])->name('transports.destroy');

            // Locations
            Route::post('locations', [LocationController::class, 'store'])->name('locations.store');
            Route::put('locations/{location}', [LocationController::class, 'update'])->name('locations.update');
            Route::delete('locations/{location}', [LocationController::class, 'destroy'])->name('locations.destroy');

            // Teaching sessions
            Route::post('teaching-sessions', [TeachingSessionController::class, 'store'])->name('teaching-sessions.store');
            Route::put('teaching-sessions/{session}', [TeachingSessionController::class, 'update'])->name('teaching-sessions.update');
            Route::delete('teaching-sessions/{session}', [TeachingSessionController::class, 'destroy'])->name('teaching-sessions.destroy');

            // Attendance recap
            Route::get('attendances', [AttendanceController::class, 'index'])->name('attendances.index');
            Route::get('attendances/options', [AttendanceController::class, 'options'])->name('attendances.options');

            // Leave requests
            Route::get('leave-requests', [LeaveRequestController::class, 'index'])->name('leave-requests.index');
            Route::put('leave-requests/{perizinan}', [LeaveRequestController::class, 'update'])->name('leave-requests.update');

            // Salaries
            Route::get('salaries', [SalaryController::class, 'index'])->name('salaries.index');
            Route::post('salaries/calculate', [SalaryController::class, 'calculate'])
                ->middleware('throttle:1,60')
                ->name('salaries.calculate');
            Route::post('salaries/{salary}/pay', [SalaryController::class, 'pay'])->name('salaries.pay');
            Route::get('salaries/{salary}/payslip', [SalaryController::class, 'payslip'])->name('salaries.payslip');

            // Payroll records
            Route::get('payroll', [PayrollController::class, 'index'])->name('payroll.index');
            Route::get('payroll/options', [PayrollController::class, 'options'])->name('payroll.options');
            Route::get('payroll/{payroll}', [PayrollController::class, 'show'])->name('payroll.show');
            Route::post('payroll', [PayrollController::class, 'store'])->name('payroll.store');
            Route::put('payroll/{payroll}', [PayrollController::class, 'update'])->name('payroll.update');
            Route::delete('payroll/{payroll}', [PayrollController::class, 'destroy'])->name('payroll.destroy');

            // Teaching materials management
            Route::post('teaching-materials', [TeachingMaterialController::class, 'store'])->name('teaching-materials.store');
            Route::put('teaching-materials/{material}', [TeachingMaterialController::class, 'update'])->name('teaching-materials.update');
            Route::delete('teaching-materials/{material}', [TeachingMaterialController::class, 'destroy'])->name('teaching-materials.destroy');

            // Reports
            Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
            Route::get('reports/export-pdf', [ReportController::class, 'exportPdf'])->name('reports.export-pdf');
            Route::get('reports/export-excel', [ReportController::class, 'exportExcel'])->name('reports.export-excel');
        });
    });
});
