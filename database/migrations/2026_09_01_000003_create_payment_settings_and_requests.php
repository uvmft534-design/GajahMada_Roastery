<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payment_settings')) {
            Schema::create('payment_settings', function (Blueprint $table) {
                $table->id();
                $table->string('bank_name', 100);
                $table->string('account_name');
                $table->string('account_number', 100);
                $table->boolean('is_active')->default(false)->index();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('payment_setting_change_requests')) {
            Schema::create('payment_setting_change_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->foreignId('current_payment_setting_id')->nullable();
                $table->foreign('current_payment_setting_id', 'pscr_current_setting_fk')->references('id')->on('payment_settings')->nullOnDelete();
                $table->string('proposed_bank_name', 100);
                $table->string('proposed_account_name');
                $table->string('proposed_account_number', 100);
                $table->text('reason');
                $table->string('status')->default('pending')->index();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('review_note')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_bank_name', 100)->nullable()->after('va_number');
            $table->string('payment_account_name')->nullable()->after('payment_bank_name');
            $table->text('payment_review_note')->nullable()->after('payment_proof');
            $table->foreignId('payment_reviewed_by')->nullable()->after('payment_review_note')->constrained('users')->nullOnDelete();
            $table->timestamp('payment_reviewed_at')->nullable()->after('payment_reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_reviewed_by');
            $table->dropColumn(['payment_bank_name', 'payment_account_name', 'payment_review_note', 'payment_reviewed_at']);
        });
        Schema::dropIfExists('payment_setting_change_requests');
        Schema::dropIfExists('payment_settings');
    }
};
