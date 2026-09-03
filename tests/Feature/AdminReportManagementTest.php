<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReportManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_search_filter_and_archive_only_their_own_reports(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $other = User::factory()->create(['role' => 'admin']);
        $report = Report::create(['report_number' => 'RPT-SEARCH', 'created_by' => $admin->id, 'type' => 'sales', 'title' => 'Penjualan September', 'admin_note' => 'Catatan kopi', 'summary_data' => [], 'status' => 'generated', 'generated_at' => now()]);
        Report::create(['report_number' => 'RPT-OTHER', 'created_by' => $other->id, 'type' => 'sales', 'title' => 'Lain', 'summary_data' => [], 'status' => 'generated', 'generated_at' => now()]);

        $this->actingAs($admin)->get(route('admin.reports.index', ['search' => 'kopi']))
            ->assertInertia(fn ($page) => $page->where('reports.data.0.report_number', 'RPT-SEARCH'));
        $this->actingAs($admin)->post(route('admin.reports.archive', $report))->assertRedirect();
        $this->assertNotNull($report->fresh()->archived_at);
        $this->actingAs($other)->post(route('admin.reports.archive', $report))->assertForbidden();
    }
}
