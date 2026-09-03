<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Existing snapshots remain available; only their obsolete workflow state is normalized.
        DB::table('reports')->where('status', '!=', 'reviewed')->update(['status' => 'generated']);
    }

    public function down(): void {}
};
