<?php

namespace App\Services;

use App\Models\Report;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportExportService
{
    public function pdf(Report $report): Response
    {
        return Pdf::loadView('reports.pdf', ['report' => $report, 'presentation' => $this->presentation($report)])->download($report->report_number.'.pdf');
    }

    public function excel(Report $report): Response
    {
        $presentation = $this->presentation($report);
        $sheet = (new Spreadsheet)->getActiveSheet();
        $sheet->setTitle('Laporan')->setCellValue('A1', 'Kopi Gajahmada Roastery')->setCellValue('A2', $presentation['title'])->setCellValue('A3', 'Nomor: '.$report->report_number)->setCellValue('A4', 'Periode: '.$presentation['period'])->setCellValue('A5', 'Dibuat: '.optional($report->generated_at)->format('d M Y H:i'));
        $row = 7;
        foreach ($presentation['summary'] as $label => $value) {
            $sheet->setCellValue("A{$row}", $label)->setCellValue("B{$row}", $value);
            $row++;
        }
        $row += 2;
        $column = 'A';
        foreach ($presentation['headers'] as $header) {
            $sheet->setCellValue("{$column}{$row}", $header);
            $column++;
        }
        foreach ($presentation['rows'] as $values) {
            $row++;
            $column = 'A';
            foreach ($values as $value) {
                $sheet->setCellValue("{$column}{$row}", $value);
                $column++;
            }
        }
        foreach (range('A', chr(64 + max(2, count($presentation['headers'])))) as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        $writer = new Xlsx($sheet->getParent());

        return response()->streamDownload(fn () => $writer->save('php://output'), $report->report_number.'.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    public function presentation(Report $report): array
    {
        $data = $report->summary_data ?? [];
        $money = fn ($value) => 'Rp '.number_format((int) $value, 0, ',', '.');
        $period = $report->period_start ? $report->period_start->format('d M Y').' – '.$report->period_end->format('d M Y') : 'Snapshot persediaan';

        return match ($report->type) {
            'sales' => ['title' => 'Laporan Penjualan', 'period' => $period, 'summary' => ['Total Pesanan Dibayar' => $data['total_orders'] ?? 0, 'Total Produk Terjual' => $data['total_items_sold'] ?? 0, 'Total Pendapatan' => $money($data['total_revenue'] ?? 0), 'Rata-rata Nilai Pesanan' => $money($data['average_order_value'] ?? 0)], 'headers' => ['Produk', 'Jumlah Terjual', 'Total Penjualan'], 'rows' => collect($data['products'] ?? [])->map(fn ($p) => [$p['product_name'], $p['quantity'], $money($p['total'])])->all()],
            'orders' => ['title' => 'Laporan Pesanan', 'period' => $period, 'summary' => ['Total Pesanan' => $data['total_orders'] ?? 0], 'headers' => ['Status', 'Jumlah'], 'rows' => $this->statusRows($data['statuses'] ?? [])],
            'payments' => ['title' => 'Laporan Pembayaran', 'period' => $period, 'summary' => ['Belum Dibayar' => $data['unpaid_count'] ?? 0, 'Menunggu Konfirmasi' => $data['pending_confirmation_count'] ?? 0, 'Dibayar' => $data['paid_count'] ?? 0, 'Ditolak' => $data['rejected_count'] ?? 0, 'Total Pembayaran Berhasil' => $money($data['total_paid_amount'] ?? 0)], 'headers' => [], 'rows' => []],
            'deliveries' => ['title' => 'Laporan Pengiriman', 'period' => $period, 'summary' => ['Total Request Pickup' => $data['pickup_requested'] ?? 0, 'Total Dijemput' => $data['picked_up'] ?? 0, 'Total Dalam Pengiriman' => $data['shipped'] ?? 0, 'Total Sampai' => $data['delivered'] ?? 0, 'Total Selesai' => $data['completed_deliveries'] ?? 0, 'Kurir Ditugaskan' => $data['assigned_couriers_count'] ?? 0], 'headers' => [], 'rows' => []],
            default => ['title' => 'Laporan Persediaan', 'period' => $period, 'summary' => ['Total Produk' => $data['total_products'] ?? 0, 'Total Unit Stock' => $data['total_stock_units'] ?? 0, 'Stock Menipis' => $data['low_stock_products'] ?? 0, 'Stock Habis' => $data['out_of_stock_products'] ?? 0], 'headers' => ['Produk', 'Stock'], 'rows' => collect($data['products'] ?? [])->map(fn ($p) => [$p['product_name'], $p['current_stock']])->all()],
        };
    }

    private function statusRows(array $statuses): array
    {
        $labels = ['awaiting_payment' => 'Menunggu Pembayaran', 'processing' => 'Diproses', 'packed' => 'Sudah Dikemas', 'pickup_requested' => 'Menunggu Pickup', 'picked_up' => 'Dijemput Kurir', 'shipped' => 'Dalam Pengiriman', 'delivered' => 'Sampai Tujuan', 'completed' => 'Selesai', 'cancelled' => 'Dibatalkan'];

        return collect($labels)->map(fn ($label, $status) => [$label, $statuses[$status] ?? 0])->values()->all();
    }
}
