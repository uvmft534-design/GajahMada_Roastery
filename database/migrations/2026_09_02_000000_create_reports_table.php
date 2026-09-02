<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_number')->unique();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->text('admin_note')->nullable();
            $table->json('summary_data')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();
            $table->index(['created_by', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
