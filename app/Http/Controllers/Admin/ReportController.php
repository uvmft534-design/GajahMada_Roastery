<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Services\ReportExportService;
use App\Services\ReportGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private readonly ReportGeneratorService $generator) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Reports/Index', ['reports' => $request->user()->createdReports()->latest('generated_at')->get(), 'statusLabels' => $this->labels()]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Reports/Form', ['types' => $this->types()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $report = DB::transaction(fn () => $request->user()->createdReports()->create($data + ['report_number' => $this->number(), 'summary_data' => $this->generator->generate($data['type'], $data['period_start'] ?? null, $data['period_end'] ?? null), 'generated_at' => now(), 'status' => 'generated']));

        return redirect()->route('admin.reports.show', $report)->with('success', 'Laporan berhasil dibuat.');
    }

    public function show(Report $report, ReportExportService $exports): Response
    {
        $this->authorize('view', $report);

        return Inertia::render('Admin/Reports/Show', ['report' => $report->load(['creator:id,name', 'reviewer:id,name']), 'presentation' => $exports->presentation($report), 'statusLabels' => $this->labels()]);
    }

    public function pdf(Report $report, ReportExportService $exports)
    {
        $this->authorize('view', $report);

        return $exports->pdf($report->load('creator'));
    }

    public function excel(Report $report, ReportExportService $exports)
    {
        $this->authorize('view', $report);

        return $exports->excel($report->load('creator'));
    }

    private function validated(Request $request): array
    {
        $data = $request->validate(['type' => ['required', 'in:'.implode(',', Report::TYPES)], 'period_start' => ['nullable', 'date', 'required_unless:type,inventory'], 'period_end' => ['nullable', 'date', 'required_unless:type,inventory', 'after_or_equal:period_start'], 'admin_note' => ['nullable', 'string', 'max:5000']]);
        if ($data['type'] === 'inventory') {
            $data['period_start'] = null;
            $data['period_end'] = null;
        } $data['title'] = $this->types()[$data['type']];

        return $data;
    }

    private function number(): string
    {
        do {
            $number = 'RPT-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
        } while (Report::where('report_number', $number)->exists());

        return $number;
    }

    private function types(): array
    {
        return ['sales' => 'Laporan Penjualan', 'orders' => 'Laporan Pesanan', 'payments' => 'Laporan Pembayaran', 'deliveries' => 'Laporan Pengiriman', 'inventory' => 'Laporan Persediaan'];
    }

    private function labels(): array
    {
        return ['generated' => 'Dibuat', 'reviewed' => 'Sudah Diperiksa'];
    }
}
