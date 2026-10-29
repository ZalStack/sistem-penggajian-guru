<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = [
        'user_id', 'judul', 'pesan', 'tipe', 'kategori', 'dibaca', 'dibaca_pada',
    ];

    protected function casts(): array
    {
        return [
            'dibaca' => 'boolean',
            'dibaca_pada' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        $this->update(['dibaca' => true, 'dibaca_pada' => now()]);
    }

    /**
     * Kirim notifikasi in-app ke satu pengguna.
     *
     * @param  'info'|'success'|'warning'|'error'  $tipe
     * @param  'sistem'|'absensi'|'perizinan'|'gaji'|'sesi'|'sunnah'  $kategori
     */
    public static function send(User $user, string $judul, string $pesan, string $tipe = 'info', string $kategori = 'sistem'): void
    {
        static::create([
            'user_id' => $user->id,
            'judul' => $judul,
            'pesan' => $pesan,
            'tipe' => $tipe,
            'kategori' => $kategori,
        ]);
    }

    /**
     * Kirim notifikasi ke semua pengguna dengan peran tertentu.
     *
     * @param  'admin'|'guru'  $role
     * @param  'info'|'success'|'warning'|'error'  $tipe
     * @param  'sistem'|'absensi'|'perizinan'|'gaji'|'sesi'|'sunnah'  $kategori
     */
    public static function sendToRole(string $role, string $judul, string $pesan, string $tipe = 'info', string $kategori = 'sistem'): void
    {
        $users = User::where('role', $role)->pluck('id');

        if ($users->isEmpty()) {
            return;
        }

        $rows = $users->map(fn (int $userId) => [
            'user_id' => $userId,
            'judul' => $judul,
            'pesan' => $pesan,
            'tipe' => $tipe,
            'kategori' => $kategori,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        static::insert($rows);
    }
}
