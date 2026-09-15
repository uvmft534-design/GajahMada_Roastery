import { Head } from '@inertiajs/react';
import AdminBackButton from '@/Components/AdminBackButton';
import ReportPresentation from '@/Components/ReportPresentation';
import AdminPanelNav from '@/Components/AdminPanelNav';

export default function ReportShow({ report, presentation, statusLabels }) {
  return <><AdminPanelNav active="reports"/><main className="min-h-screen bg-[#FDFBF7] p-4 text-[#2C1E16] sm:p-8 md:p-12"><section className="mx-auto max-w-4xl rounded-2xl bg-white p-5 shadow-sm sm:p-7"><Head title={report.title}/><AdminBackButton href={route('admin.reports.index')} label="Kembali ke Laporan"/><h1 className="mt-5 text-2xl font-bold">{presentation.title}</h1><p className="mt-1 text-sm text-[#2C1E16]/60">{report.report_number} · {presentation.period} · {statusLabels[report.status]}</p><div className="mt-4 flex flex-wrap gap-3"><a href={route('admin.reports.pdf', report.id)} className="rounded-lg border px-3 py-2">Download PDF</a><a href={route('admin.reports.excel', report.id)} className="rounded-lg border px-3 py-2">Download Excel</a></div><ReportPresentation presentation={presentation}/></section></main></>;
}
