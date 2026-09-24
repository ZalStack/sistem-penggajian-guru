<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GuruExcelSeeder extends Seeder
{
    /**
     * Data exactly as copied from Excel (109 rows).
     * Columns: Nama, Grade, Domisili, Tunjangan (Rp...), No Rek, Ket Mengajar
     * Mapel default IPA, Jenjang null, Bank null.
     */
    private array $rows = [
        ['nama' => 'Angelina Indrayana Amd.AK, S.T.P', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => 'Rp10,000.00', 'norek' => '7064265060', 'ket' => ''],
        ['nama' => 'Anis Kurniasih, S.Si', 'grade' => 'A2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2853887450', 'ket' => ''],
        ['nama' => 'Arief Prasetiyono', 'grade' => 'C2', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '7137403557', 'ket' => ''],
        ['nama' => 'Asep, S.Pd.I', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '3879813110', 'ket' => ''],
        ['nama' => 'Dian Damaiyanti S.Pd', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '6313038930', 'ket' => ''],
        ['nama' => 'Dra. Nursahedah', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7188729538', 'ket' => ''],
        ['nama' => 'Emelinny Iskandar S.Si', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => 'Rp5,000.00', 'norek' => '7190317794', 'ket' => ''],
        ['nama' => 'Faiq Shidqy Ar Ridho', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '6980031320', 'ket' => ''],
        ['nama' => 'Fiqri Nugraha, M.Pd', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7096906522', 'ket' => ''],
        ['nama' => 'Ghita Intanprameswari', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => 'Rp5,000.00', 'norek' => '9711184960', 'ket' => ''],
        ['nama' => 'Ghita Putri Amalia S', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7301748218', 'ket' => ''],
        ['nama' => 'Indra Riadi S.Pd', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => 'Rp7,000.00', 'norek' => '4172539590', 'ket' => ''],
        ['nama' => "Khaerun Mu'min,S.Pd", 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '6922915350', 'ket' => ''],
        ['nama' => 'Lelli Rose Diana', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '3167638510', 'ket' => ''],
        ['nama' => 'Lia Ambarwati S.Si', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7173629731', 'ket' => ''],
        ['nama' => 'Lulu Maulidah S.Pd', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => 'Rp12,000.00', 'norek' => '3137871060', 'ket' => ''],
        ['nama' => 'Maudika Pamela Fiorenza', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7200780218', 'ket' => ''],
        ['nama' => 'Muhammad Febriadi Firmansyah', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => 'Rp2,000.00', 'norek' => '8966027760', 'ket' => ''],
        ['nama' => 'Nuristanto, S.Pd', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7241537565', 'ket' => ''],
        ['nama' => 'Okka Novia Tama S.Pd', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7229538734', 'ket' => ''],
        ['nama' => 'Petrawati', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7098618807', 'ket' => ''],
        ['nama' => 'Priyo Handoko', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '3139276770', 'ket' => ''],
        ['nama' => 'Rian Ardiansyah', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '8682398150', 'ket' => ''],
        ['nama' => 'Rizkiana Aggayhlin', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7140497201', 'ket' => ''],
        ['nama' => 'Sariyanto', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7230095129', 'ket' => ''],
        ['nama' => 'Shanti Dewi', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7002697429', 'ket' => ''],
        ['nama' => 'Siti Nurwinas', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7083825825', 'ket' => ''],
        ['nama' => 'Sri Herawati', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7002683363', 'ket' => ''],
        ['nama' => 'Suhardi Prayitno', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => 'Staff', 'ket' => ''],
        ['nama' => 'Usman', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7200812168', 'ket' => ''],
        ['nama' => 'Vivi Amelia', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2889357410', 'ket' => ''],
        ['nama' => 'Winda Dwi Aulia', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7220979077', 'ket' => ''],
        ['nama' => 'Alfin Saputra Prabumi', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '409501008943504', 'ket' => ''],
        ['nama' => 'Alif Maulida', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7346109388', 'ket' => ''],
        ['nama' => 'Kokom Komariah', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7180859653', 'ket' => ''],
        ['nama' => 'Moh. Abdul Kholis', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7284266263', 'ket' => ''],
        ['nama' => 'Nurul Hikmah', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => 'Rp5,000.00', 'norek' => '7284273529', 'ket' => ''],
        ['nama' => 'Peggy Nurida Asri', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => 'Staff', 'ket' => ''],
        ['nama' => 'Rany Gustriany', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '901579979230', 'ket' => ''],
        ['nama' => 'Intan Kurnia Lestari', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '1640005255304', 'ket' => ''],
        ['nama' => 'Dewi Ratna Sari', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '9679957010', 'ket' => ''],
        ['nama' => 'Khadijah Sakinah', 'grade' => 'C2', 'domisili' => 'Kudus Jateng', 'tunjangan' => '', 'norek' => '7262563884', 'ket' => ''],
        ['nama' => 'Raden Rahayuningati', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '3903070260', 'ket' => ''],
        ['nama' => 'Revina Chandra Moutique', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => 'Rp5,000.00', 'norek' => '7346840198', 'ket' => ''],
        ['nama' => 'Ummy Permata Hakim', 'grade' => 'C2', 'domisili' => 'Lampung', 'tunjangan' => '', 'norek' => '2940681432', 'ket' => ''],
        ['nama' => 'Desy Reswati', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7002778698', 'ket' => ''],
        ['nama' => 'Abdul Aziz Nurussadad', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7227361365', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Andri Imam Munandar', 'grade' => 'A2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Andy Aryowibowo', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => '7111030833', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Anis Kurniasih', 'grade' => 'A2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2853887450', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Ardianto', 'grade' => 'B1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Ayunda Sriwahyuningrum, M.Pd.', 'grade' => 'A2', 'domisili' => 'Bekasi', 'tunjangan' => '', 'norek' => '6865816070', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Dadan Abdul Kohar', 'grade' => 'A2', 'domisili' => 'Bekasi', 'tunjangan' => '', 'norek' => '8100247030', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Dedi Wahyudi', 'grade' => 'B1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Desi Diana, M.Pd', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '480001009629532', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Dody Adyansyah, M.Pd', 'grade' => 'B2', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '7950198230', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Dyah Sista Raharjanti', 'grade' => 'A2', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '7984654240', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Edy Kurniawan', 'grade' => 'B1', 'domisili' => 'Surabaya', 'tunjangan' => '', 'norek' => '1030691675', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Ferdianto', 'grade' => 'A2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Indra Riadi S.Pd.', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => 'Rp7,000.00', 'norek' => '4172539590', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Khomsalia Denmasti Harun, S.Pd', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => 'Staff', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Kumulus Krestiwi', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => '743601008967507', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Lia Ambarwati', 'grade' => 'C1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7173629731', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Muchammad Fachri', 'grade' => 'A1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Rafika Septiany', 'grade' => 'B2', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '042801036100507', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Ryky Tunggal Saputra Aji', 'grade' => 'A1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Sasanti Tri Utami', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => '2731601595', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Shodiq Fathoni, S.Pd.', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => 'Tidak Aktif', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Siti Alpiyah', 'grade' => 'B1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Siti Maesaroh', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Isna Nur Fajriah', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Thyeadi Tungson', 'grade' => 'A1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Vega Oktaviana', 'grade' => 'B1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '2832093060', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Wilda Fadliyah, S.Pd', 'grade' => 'B2', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '1030010214076', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Devira Cahaya Yunita', 'grade' => 'B1', 'domisili' => 'Surabaya', 'tunjangan' => '', 'norek' => '618201020453532', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Ita Handayani', 'grade' => 'B1', 'domisili' => 'Surabaya', 'tunjangan' => '', 'norek' => '7369364671', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Anwar', 'grade' => 'B1', 'domisili' => '-', 'tunjangan' => '', 'norek' => '7183848757', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Januar Ahmad Faried', 'grade' => 'C1', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '2003756420', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Tomi Agustian', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '7350628856', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Saidi Amin', 'grade' => 'B1', 'domisili' => 'Surabaya', 'tunjangan' => '', 'norek' => '2995880230', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Arisna Dwi Hapsari', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => 'Staff', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Dian Manggar Sari', 'grade' => 'B1', 'domisili' => 'Surabaya', 'tunjangan' => '', 'norek' => '7033792101', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Bambang Hadi Prayitno', 'grade' => 'B1', 'domisili' => 'Surabaya', 'tunjangan' => '', 'norek' => '0017865277', 'ket' => 'Pengajar Kelas Khusus Online'],
        ['nama' => 'Anita Rohman', 'grade' => 'B2', 'domisili' => 'Bandung', 'tunjangan' => '', 'norek' => '13701144407505', 'ket' => 'Pengajar SPPO Bandung'],
        ['nama' => 'Farah Salsabila', 'grade' => 'B2', 'domisili' => 'Bandung', 'tunjangan' => '', 'norek' => '412001037096533', 'ket' => 'Pengajar SPPO Bandung'],
        ['nama' => 'Yati Marlena', 'grade' => 'C2', 'domisili' => 'Bandung', 'tunjangan' => '', 'norek' => '61253718100', 'ket' => 'Pengajar SPPO Bandung'],
        ['nama' => 'Yuli F', 'grade' => 'C2', 'domisili' => 'Bandung', 'tunjangan' => '', 'norek' => '15060425100', 'ket' => 'Pengajar SPPO Bandung'],
        ['nama' => 'Yuni Arisandi Sanmas', 'grade' => 'C1', 'domisili' => 'Bandung', 'tunjangan' => '', 'norek' => '326701031286505', 'ket' => 'Pengajar SPPO Bandung'],
        ['nama' => 'Annisa Fauziah', 'grade' => 'C1', 'domisili' => 'Bandung', 'tunjangan' => '', 'norek' => '0850843725', 'ket' => 'Pengajar SPPO Bandung'],
        ['nama' => 'Fitriani Wahyu Setyaningrum', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => '7080258172', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Hartono', 'grade' => 'C2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '1570004618519', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Indana Zahra Qanita, S.Pd', 'grade' => 'B2', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '7236297448', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Muhammad Hardiyanto, S.Pd', 'grade' => 'B2', 'domisili' => 'Bekasi', 'tunjangan' => '', 'norek' => '3139230150', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Purbowarsito', 'grade' => 'B1', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '2889344190', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Restu, S.Pd.', 'grade' => 'C1', 'domisili' => 'Bekasi', 'tunjangan' => '', 'norek' => '7202540688', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Riana Sari', 'grade' => 'B2', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '7110779498', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Sapto Prio Wawan Hadi Wibowo', 'grade' => 'B2', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => '7080258172', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Sutriati', 'grade' => 'A1', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '3142987490', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Wasno', 'grade' => 'B2', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '7103214933', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Lintang Nawangsari', 'grade' => 'C1', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '1032848218', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Wilda Septiana', 'grade' => 'B2', 'domisili' => 'Tangerang', 'tunjangan' => '', 'norek' => '1232139184', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Shobahul Chair', 'grade' => 'C1', 'domisili' => 'Depok', 'tunjangan' => 'Rp10,000.00', 'norek' => '8527807500', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Halinda Erika Putri', 'grade' => 'B2', 'domisili' => 'Bekasi', 'tunjangan' => '', 'norek' => '7361577587', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Salma Nur Adibah', 'grade' => 'C1', 'domisili' => 'Jakarta', 'tunjangan' => 'Rp6,000.00', 'norek' => '331901024364533', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Supomo', 'grade' => 'B2', 'domisili' => 'Bogor', 'tunjangan' => '', 'norek' => '1330142355', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Livia Elsa', 'grade' => 'B2', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '7363199229', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Lala Komalasari', 'grade' => 'C1', 'domisili' => 'Jakarta', 'tunjangan' => '', 'norek' => '7029727745', 'ket' => 'Pengajar Berbakat C Jakarta'],
        ['nama' => 'Reno Khoerudin Mufid, S.Pd', 'grade' => 'C1', 'domisili' => 'Bekasi', 'tunjangan' => 'Rp7,000.00', 'norek' => '7206472981', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
        ['nama' => 'Dinny Nur Fajriyah, S.Pd', 'grade' => 'B2', 'domisili' => 'Depok', 'tunjangan' => '', 'norek' => '7142979548', 'ket' => 'Pengajar Kelas Khusus Offline Rawamangun'],
    ];

    private function parseTunjangan(?string $value): float
    {
        if (empty($value)) return 0;
        $clean = str_replace(['Rp', ',', ' '], '', $value);
        return is_numeric($clean) ? (float) $clean : 0;
    }

    private function generateEmail(string $nama, array &$used): string
    {
        // Remove gelar dan karakter non-huruf, buat slug dot
        $clean = preg_replace('/\b(Amd\.AK|S\.T\.P|S\.Si|S\.Pd\.I|S\.Pd|M\.Pd|Dra\.?|S\.T|M\.Pd\.|Am\.d\.AK)\b\.?/i', '', $nama);
        $clean = preg_replace('/[^a-zA-Z\s]/', ' ', $clean);
        $clean = preg_replace('/\s+/', ' ', trim($clean));
        $parts = explode(' ', strtolower($clean));
        $parts = array_filter($parts, fn($p) => strlen($p) > 1);
        $parts = array_values(array_slice($parts, 0, 2));
        if (count($parts) === 0) $parts = ['guru'];
        if (count($parts) === 1) $parts[] = 'guru';
        $base = implode('.', $parts);
        $base = preg_replace('/[^a-z0-9.]/', '', $base);
        $base = trim($base, '.');
        if (empty($base)) $base = 'guru';
        $email = $base . '@siguru.com';
        $counter = 2;
        while (isset($used[$email]) || User::where('email', $email)->exists()) {
            $email = $base . $counter . '@siguru.com';
            $counter++;
        }
        $used[$email] = true;
        return $email;
    }

    public function run(): void
    {
        $gradeMap = Grade::pluck('id', 'kode_grade')->toArray();
        // Ensure grades exist
        if (empty($gradeMap)) {
            $this->command->warn('Grades table kosong, buat default A1-C2 dahulu.');
            return;
        }

        $usedEmails = [];
        // Preload existing emails to avoid collision
        foreach (User::pluck('email')->toArray() as $e) {
            $usedEmails[strtolower($e)] = true;
        }

        DB::transaction(function () use ($gradeMap, &$usedEmails) {
            $created = 0;
            $skipped = 0;
            foreach ($this->rows as $idx => $row) {
                $nama = trim($row['nama']);
                $gradeKode = trim($row['grade']);
                $gradeId = $gradeMap[$gradeKode] ?? null;
                if (!$gradeId) {
                    $this->command->warn("Baris ".($idx+1)." grade {$gradeKode} tidak ditemukan untuk {$nama}, dilewati.");
                    $skipped++;
                    continue;
                }

                $domisili = trim($row['domisili']);
                if ($domisili === '' || $domisili === '-') $domisili = null;

                $tunjangan = $this->parseTunjangan($row['tunjangan']);
                $norek = trim($row['norek']);
                // Biarkan 'Staff' / 'Tidak Aktif' apa adanya sesuai Excel, jika kosong null
                if ($norek === '') $norek = null;

                $ket = trim($row['ket']);
                if ($ket === '') $ket = null;

                // Cek duplikat persis nama+grade+norek+ket (untuk Anis kembar)
                $exists = Guru::where('nama', $nama)
                    ->where('grade_id', $gradeId)
                    ->where('nomor_rekening', $norek)
                    ->where('keterangan_mengajar', $ket)
                    ->first();
                if ($exists) {
                    // Pastikan user exists
                    if (!$exists->user) {
                        $email = $this->generateEmail($nama, $usedEmails);
                        $user = User::create([
                            'name' => $nama,
                            'email' => $email,
                            'password' => Hash::make('password'),
                            'role' => 'guru',
                            'guru_id' => $exists->id,
                        ]);
                        $exists->update(['user_id' => $user->id]);
                    }
                    $skipped++;
                    continue;
                }

                $email = $this->generateEmail($nama, $usedEmails);

                $guru = Guru::create([
                    'nama' => $nama,
                    'grade_id' => $gradeId,
                    'mapel' => 'IPA', // default, not in Excel
                    'jenjang' => null,
                    'domisili' => $domisili,
                    'nomor_telepon' => null,
                    'tunjangan_khusus' => $tunjangan,
                    'bank' => null,
                    'nomor_rekening' => $norek,
                    'keterangan_mengajar' => $ket,
                    'user_id' => null,
                ]);

                $user = User::create([
                    'name' => $nama,
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'role' => 'guru',
                    'guru_id' => $guru->id,
                ]);

                $guru->update(['user_id' => $user->id]);
                $created++;
            }
            $this->command->info("GuruExcelSeeder selesai: {$created} guru baru dibuat, {$skipped} dilewati/duplikat.");
        });
    }
}
