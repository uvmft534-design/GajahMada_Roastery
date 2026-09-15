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
        $filters = $request->validate(['search' => 'nullable|string|max:255', 'type' => 'nullable|in:'.implode(',', Report::TYPES), 'status' => 'nullable|in:generated,reviewed', 'archive' => 'nullable|in:active,archived,all', 'generated_from' => 'nullable|date', 'generated_to' => 'nullable|date|after_or_equal:generated_from', 'period_from' => 'nullable|date', 'period_to' => 'nullable|date|after_or_equal:period_from']);
        $query = $request->user()->createdReports()->latest('generated_at');
        $query->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query->where('report_number', 'like', "%{$search}%")->orWhere('title', 'like', "%{$search}%")->orWhere('admin_note', 'like', "%{$search}%")));
        $query->when($filters['type'] ?? null, fn ($query, $type) => $query->where('type', $type));
        $query->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status));
        $archive = $filters['archive'] ?? 'active';
        if ($archive === 'active') {
            $query->whereNull('archived_at');
        }
        if ($archive === 'archived') {
            $query->whereNotNull('archived_at');
        }
        $query->when($filters['generated_from'] ?? null, fn ($query, $date) => $query->whereDate('generated_at', '>=', $date));
        $query->when($filters['generated_to'] ?? null, fn ($query, $date) => $query->whereDate('generated_at', '<=', $date));
        $query->when($filters['period_from'] ?? null, fn ($query, $date) => $query->whereDate('period_end', '>=', $date));
        $query->when($filters['period_to'] ?? null, fn ($query, $date) => $query->whereDate('period_start', '<=', $date));

        return Inertia::render('Admin/Reports/Index', ['reports' => $query->paginate(15)->withQueryString(), 'filters' => $filters + ['archive' => $archive], 'statusLabels' => $this->labels(), 'types' => $this->types()]);
    }

    public function archive(Request $request, Report $report): RedirectResponse
    {
        $this->authorize('view', $report);
        $report->update(['archived_at' => now(), 'archived_by' => $request->user()->id]);

        return back()->with('success', 'Laporan diarsipkan.');
    }

    public function restore(Report $report): RedirectResponse
    {
        $this->authorize('view', $report);
        $report->update(['archived_at' => null, 'archived_by' => null]);

        return back()->with('success', 'Laporan dipulihkan.');
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
        return ['sales' => 'Laporan Penjualan', 'orders' => 'Laporan Pesanan', 'payments' => 'Laporan Pembayaran', 'deliveries' => 'Laporan Pengiriman', 'inventory' => 'Laporan Persediaan', 'complaints' => 'Laporan Komplain'];
    }

    private function labels(): array
    {
        return ['generated' => 'Dibuat', 'reviewed' => 'Sudah Diperiksa'];
    }
}
