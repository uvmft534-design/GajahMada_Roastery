<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
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
        return Inertia::render('Admin/Reports/Index', ['reports' => $request->user()->createdReports()->latest()->get(), 'statusLabels' => $this->statusLabels()]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Reports/Form', ['report' => null, 'types' => $this->types(), 'statusLabels' => $this->statusLabels()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $report = $request->user()->createdReports()->create($data + ['report_number' => $this->number(), 'status' => 'draft']);

        return redirect()->route('admin.reports.show', $report)->with('success', 'Draft laporan dibuat.');
    }

    public function show(Request $request, Report $report): Response
    {
        $this->authorize('view', $report);

        return Inertia::render('Admin/Reports/Show', ['report' => $report->load(['creator:id,name', 'reviewer:id,name']), 'preview' => in_array($report->status, Report::EDITABLE_STATUSES, true) ? $this->generator->generate($report->type, $report->period_start?->toDateString(), $report->period_end?->toDateString()) : null, 'types' => $this->types(), 'statusLabels' => $this->statusLabels()]);
    }

    public function update(Request $request, Report $report): RedirectResponse
    {
        $this->authorize('update', $report);
        $report->update($this->validated($request));

        return back()->with('success', 'Draft laporan diperbarui.');
    }

    public function preview(Request $request): Response
    {
        $data = $this->validated($request);

        return Inertia::render('Admin/Reports/Preview', ['form' => $data, 'preview' => $this->generator->generate($data['type'], $data['period_start'] ?? null, $data['period_end'] ?? null), 'types' => $this->types()]);
    }

    public function submit(Request $request, Report $report): RedirectResponse
    {
        $this->authorize('submit', $report);
        DB::transaction(function () use ($report): void {
            $locked = Report::lockForUpdate()->findOrFail($report->id);
            abort_unless(in_array($locked->status, Report::EDITABLE_STATUSES, true), 422, 'Laporan tidak dapat dikirim pada status ini.');
            $locked->update(['summary_data' => $this->generator->generate($locked->type, $locked->period_start?->toDateString(), $locked->period_end?->toDateString()), 'generated_at' => now(), 'submitted_at' => now(), 'status' => 'submitted', 'reviewed_by' => null, 'reviewed_at' => null, 'review_note' => null]);
        });

        return back()->with('success', 'Laporan telah dikirim ke Super Admin.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate(['type' => ['required', 'in:'.implode(',', Report::TYPES)], 'period_start' => ['nullable', 'date', 'required_unless:type,inventory'], 'period_end' => ['nullable', 'date', 'required_unless:type,inventory', 'after_or_equal:period_start'], 'title' => ['nullable', 'string', 'max:255'], 'admin_note' => ['nullable', 'string', 'max:5000']]);
        if ($data['type'] === 'inventory') {
            $data['period_start'] = null;
            $data['period_end'] = null;
        }
        $data['title'] = filled($data['title'] ?? null) ? $data['title'] : $this->types()[$data['type']];

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

    private function statusLabels(): array
    {
        return ['draft' => 'Draft', 'submitted' => 'Menunggu Review', 'revision_requested' => 'Perlu Revisi', 'approved' => 'Disetujui', 'rejected' => 'Ditolak'];
    }
}
