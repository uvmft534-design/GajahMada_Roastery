<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Services\ReportExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminReportController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->value();

        return Inertia::render('SuperAdmin/Reports/Index', ['reports' => Report::with('creator:id,name')->when($status, fn ($query) => $query->where('status', $status))->latest('generated_at')->get(), 'filters' => ['status' => $status], 'statusLabels' => $this->labels()]);
    }

    public function show(Report $report, ReportExportService $exports): Response
    {
        return Inertia::render('SuperAdmin/Reports/Show', ['report' => $report->load(['creator:id,name', 'reviewer:id,name']), 'presentation' => $exports->presentation($report), 'statusLabels' => $this->labels()]);
    }

    public function review(Request $request, Report $report): RedirectResponse
    {
        $this->authorize('review', $report);
        DB::transaction(function () use ($request, $report): void {
            $locked = Report::lockForUpdate()->findOrFail($report->id);
            abort_if($locked->status !== 'generated', 422, 'Laporan ini sudah diperiksa.');
            $locked->update(['status' => 'reviewed', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        });

        return back()->with('success', 'Laporan ditandai sudah diperiksa.');
    }

    public function pdf(Report $report, ReportExportService $exports)
    {
        return $exports->pdf($report->load('creator'));
    }

    public function excel(Report $report, ReportExportService $exports)
    {
        return $exports->excel($report->load('creator'));
    }

    private function labels(): array
    {
        return ['generated' => 'Dibuat', 'reviewed' => 'Sudah Diperiksa'];
    }
}
