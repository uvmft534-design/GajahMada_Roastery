<?php

namespace App\Http\Controllers;

use App\Models\Report;
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

        return Inertia::render('SuperAdmin/Reports/Index', ['reports' => Report::with('creator:id,name')->when($status, fn ($query) => $query->where('status', $status))->latest('submitted_at')->get(), 'filters' => ['status' => $status], 'statusLabels' => $this->labels()]);
    }

    public function show(Report $report): Response
    {
        return Inertia::render('SuperAdmin/Reports/Show', ['report' => $report->load(['creator:id,name,email', 'reviewer:id,name']), 'statusLabels' => $this->labels()]);
    }

    public function review(Request $request, Report $report): RedirectResponse
    {
        $this->authorize('review', $report);
        $data = $request->validate(['action' => ['required', 'in:approve,revision,reject'], 'review_note' => ['nullable', 'string', 'max:5000']]);
        if (in_array($data['action'], ['revision', 'reject'], true) && blank($data['review_note'] ?? null)) {
            return back()->withErrors(['review_note' => 'Catatan review wajib diisi.']);
        }
        DB::transaction(function () use ($request, $report, $data): void {
            $locked = Report::lockForUpdate()->findOrFail($report->id);
            abort_if($locked->status !== 'submitted', 422, 'Laporan ini tidak lagi menunggu review.');
            $locked->update(['status' => ['approve' => 'approved', 'revision' => 'revision_requested', 'reject' => 'rejected'][$data['action']], 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'review_note' => $data['review_note'] ?? null]);
        });

        return back()->with('success', 'Review laporan berhasil disimpan.');
    }

    private function labels(): array
    {
        return ['draft' => 'Draft', 'submitted' => 'Menunggu Review', 'revision_requested' => 'Perlu Revisi', 'approved' => 'Disetujui', 'rejected' => 'Ditolak'];
    }
}
