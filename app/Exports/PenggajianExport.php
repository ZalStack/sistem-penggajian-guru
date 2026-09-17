<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PenggajianExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    protected Collection $penggajians;

    protected int $row = 0;

    public function __construct(Collection $penggajians)
    {
        $this->penggajians = $penggajians;
    }

    public function collection(): Collection
    {
        return $this->penggajians;
    }

    public function headings(): array
    {
        return ['No', 'Nama Guru', 'Grade', 'Mapel', 'Periode', 'Sesi', 'Jenis Transport', 'Honor', 'Transport', 'Total Gaji'];
    }

    public function map($penggajian): array
    {
        $this->row++;

        return [
            $this->row,
            $penggajian->guru->nama ?? '-',
            $penggajian->guru->grade->kode_grade ?? '-',
            $penggajian->guru->mapel ?? '-',
            $penggajian->periode,
            $penggajian->jumlah_sesi,
            $penggajian->transport->jenis ?? '-',
            $penggajian->honor,
            $penggajian->total_transport,
            $penggajian->total,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $this->penggajians->count() + 1;

        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '111827']], 'alignment' => ['horizontal' => 'center', 'vertical' => 'center']],
            'A' => ['alignment' => ['horizontal' => 'center']],
            'F' => ['alignment' => ['horizontal' => 'center']],
            'H' => ['numFmt' => '#,##0', 'alignment' => ['horizontal' => 'right']],
            'I' => ['numFmt' => '#,##0', 'alignment' => ['horizontal' => 'right']],
            'J' => ['numFmt' => '#,##0', 'alignment' => ['horizontal' => 'right']],
            ($lastRow + 1) => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F3F4F6']]],
        ];
    }
}
