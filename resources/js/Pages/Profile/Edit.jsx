import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Coffee, Settings, ShieldCheck, Trash2 } from 'lucide-react';

function GooglePasswordSetup() {
    const { post, processing, recentlySuccessful, errors } = useForm({});

    const sendSetupLink = (event) => {
        event.preventDefault();
        post(route('password.setup-link'), { preserveScroll: true });
    };

    return <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <p className="font-bold text-[#2C1E16]">Akun terhubung dengan Google</p>
        <p className="mt-1 text-sm leading-relaxed text-[#2C1E16]/65">Anda tetap dapat masuk menggunakan Google. Jika belum pernah membuat kata sandi akun Roastery, atur kata sandi melalui email.</p>
        <form onSubmit={sendSetupLink} className="mt-4">
            <button type="submit" disabled={processing} className="rounded-full bg-[#D4813E] px-4 py-2 text-sm font-bold text-white hover:bg-[#b86b30] disabled:opacity-50">{processing ? 'Mengirim...' : 'Kirim Tautan Atur Password'}</button>
            {recentlySuccessful && <p className="mt-3 text-sm text-emerald-700">Tautan atur kata sandi telah dikirim ke email Anda.</p>}
            {errors.password_setup && <p className="mt-3 text-sm text-red-600">{errors.password_setup}</p>}
        </form>
    </div>;
}

export default function Edit({ mustVerifyEmail, status, googleLinked }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-[#2C1E16]">Profil Saya</h2>
            }
        >
            <Head title="Profile" />

            <div className="min-h-screen bg-[#FDFBF7] py-10 sm:py-14">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
                    <div className="relative overflow-hidden rounded-[2rem] bg-[#2C1E16] p-7 text-white shadow-xl sm:p-10">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4813E]/20" />
                        <div className="relative flex items-start gap-4">
                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#D4813E] shadow-lg shadow-black/20"><Coffee size={26} /></div>
                            <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#D4813E]">Akun Kopi Gajahmada</p><h1 className="mt-1 text-3xl font-bold">Kelola profil Anda</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">Perbarui data akun dan pengaturan keamanan Anda dalam satu tempat.</p></div>
                        </div>
                    </div>
                    <div className="rounded-[2rem] border border-[#2C1E16]/10 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-[#D4813E]"><Settings size={19} /></div><div><h2 className="font-bold">Informasi akun</h2><p className="text-sm text-[#2C1E16]/55">Nama dan email untuk pesanan Anda.</p></div></div>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="rounded-[2rem] border border-[#2C1E16]/10 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-[#D4813E]"><ShieldCheck size={19} /></div><div><h2 className="font-bold">Keamanan akun</h2><p className="text-sm text-[#2C1E16]/55">Gunakan kata sandi yang aman dan unik.</p></div></div>
                        {googleLinked && <GooglePasswordSetup />}
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="rounded-[2rem] border border-red-100 bg-red-50/40 p-6 shadow-sm sm:p-8">
                        <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-100 text-red-600"><Trash2 size={19} /></div><div><h2 className="font-bold text-[#2C1E16]">Hapus Akun</h2><p className="text-sm text-[#2C1E16]/55">Tindakan ini tidak dapat dibatalkan.</p></div></div>
                        <DeleteUserForm className="max-w-xl" googleLinked={googleLinked} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
