import { Head, useForm, usePage } from '@inertiajs/react';
import { Edit3, Plus, Trash2, Truck, X } from 'lucide-react';
import { useState } from 'react';
import AdminBackButton from '@/Components/AdminBackButton';
import AdminPanelNav from '@/Components/AdminPanelNav';

const emptyMethod = { name: '', type: '', description: '', delivery_fee: '' };

export default function ShippingMethodsIndex({ shippingMethods = [] }) {
  const { flash = {} } = usePage().props;
  const [editingMethod, setEditingMethod] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { data, setData, post, delete: destroy, processing, errors, reset, clearErrors } = useForm(emptyMethod);

  const openCreate = () => {
    setEditingMethod(null);
    reset();
    clearErrors();
    setModalOpen(true);
  };

  const openEdit = (method) => {
    setEditingMethod(method);
    setData({ name: method.name ?? '', type: method.type ?? '', description: method.description ?? '', delivery_fee: method.delivery_fee ?? '' });
    clearErrors();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMethod(null);
  };

  const submit = (event) => {
    event.preventDefault();
    post(editingMethod ? route('admin.shipping-methods.update', editingMethod.id) : route('admin.shipping-methods.store'), {
      preserveScroll: true,
      onSuccess: closeModal,
    });
  };

  const remove = (method) => {
    if (window.confirm(`Hapus metode pengiriman ${method.name}?`)) {
      destroy(route('admin.shipping-methods.destroy', method.id), { preserveScroll: true });
    }
  };

  return <>
    <Head title="Metode Pengiriman" />
    <AdminPanelNav active="shipping-methods" />
    <main className="min-h-screen bg-[#FDFBF7] p-4 text-[#2C1E16] sm:p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-[#2C1E16]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#B86632]">Pengaturan operasional</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.035em]">Metode Pengiriman</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#2C1E16]/60">Kelola pilihan layanan pengiriman beserta jenis dan penjelasannya untuk operasional toko.</p>
          </div>
          <div className="flex flex-wrap gap-3"><AdminBackButton href={route('admin.dashboard')} label="Kembali ke Ringkasan" /><button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D4813E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B86632]"><Plus size={17} /> Tambah Metode</button></div>
        </div>

        {flash.success && <p role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{flash.success}</p>}

        <section className="mt-6 overflow-hidden rounded-3xl border border-[#2C1E16]/10 bg-white shadow-[0_18px_50px_rgba(44,30,22,.06)]">
          <div className="flex items-center gap-3 border-b border-[#2C1E16]/10 px-5 py-5 sm:px-7"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFE9D2] text-[#B86632]"><Truck size={20} /></span><div><h2 className="font-bold">Daftar metode pengiriman</h2><p className="text-xs text-[#2C1E16]/55">{shippingMethods.length} metode tersimpan</p></div></div>
          {shippingMethods.length === 0 ? <div className="px-6 py-16 text-center"><Truck className="mx-auto text-[#D4813E]" size={34} /><h3 className="mt-4 text-lg font-bold">Belum ada metode pengiriman</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#2C1E16]/60">Tambahkan metode pertama, misalnya Pengiriman Reguler atau Instant.</p><button type="button" onClick={openCreate} className="mt-6 rounded-xl bg-[#2C1E16] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B86632]">Tambah metode</button></div> : <div className="divide-y divide-[#2C1E16]/10">{shippingMethods.map((method) => <article key={method.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{method.name}</h3><span className="rounded-full bg-[#FFE9D2] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#9A4F1D]">{method.type}</span><span className="text-sm font-bold text-[#B86632]">Rp {Number(method.delivery_fee || 0).toLocaleString('id-ID')}</span></div><p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#2C1E16]/65">{method.description || 'Belum ada deskripsi.'}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => openEdit(method)} className="inline-flex items-center gap-2 rounded-xl border border-[#2C1E16]/15 px-3 py-2 text-xs font-bold transition hover:border-[#D4813E] hover:bg-[#FFF5EA] hover:text-[#B86632]"><Edit3 size={15} /> Ubah</button><button type="button" onClick={() => remove(method)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"><Trash2 size={15} /> Hapus</button></div></article>)}</div>}
        </section>
      </div>
    </main>

    {modalOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#2C1E16]/50 p-4" role="dialog" aria-modal="true" aria-labelledby="shipping-method-dialog-title"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#B86632]">Metode pengiriman</p><h2 id="shipping-method-dialog-title" className="mt-1 text-2xl font-bold">{editingMethod ? 'Ubah metode' : 'Tambah metode baru'}</h2></div><button type="button" onClick={closeModal} className="rounded-full p-2 text-[#2C1E16]/60 hover:bg-[#FFF5EA]"><X size={19} /></button></div><div className="mt-6 space-y-5"><Field label="Nama metode" error={errors.name}><input autoFocus value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Contoh: Pengiriman Reguler" /></Field><Field label="Jenis pengiriman" error={errors.type}><input value={data.type} onChange={(event) => setData('type', event.target.value)} placeholder="Contoh: Reguler, Instant, Same Day" /></Field><Field label="Tarif pengiriman (Rp)" error={errors.delivery_fee}><input type="number" min="0" value={data.delivery_fee} onChange={(event) => setData('delivery_fee', event.target.value)} placeholder="Contoh: 25000" /></Field><Field label="Deskripsi" error={errors.description}><textarea rows="4" value={data.description} onChange={(event) => setData('description', event.target.value)} placeholder="Jelaskan estimasi, cakupan, atau ketentuan layanan ini." /></Field></div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-xl border border-[#2C1E16]/15 px-4 py-2.5 text-sm font-bold hover:bg-[#FDFBF7]">Batal</button><button disabled={processing} className="rounded-xl bg-[#D4813E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B86632] disabled:opacity-60">{processing ? 'Menyimpan...' : editingMethod ? 'Simpan Perubahan' : 'Tambah Metode'}</button></div></form></div>}
  </>;
}

function Field({ label, error, children }) {
  return <label className="block"><span className="text-xs font-bold uppercase tracking-[.12em] text-[#2C1E16]/60">{label}</span>{children.type === 'textarea' ? <textarea {...children.props} className="mt-2 w-full resize-none rounded-xl border border-[#2C1E16]/15 bg-[#FDFBF7] px-3 py-3 text-sm outline-none transition focus:border-[#D4813E] focus:ring-0" /> : <input {...children.props} className="mt-2 w-full rounded-xl border border-[#2C1E16]/15 bg-[#FDFBF7] px-3 py-3 text-sm outline-none transition focus:border-[#D4813E] focus:ring-0" />}{error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}</label>;
}
