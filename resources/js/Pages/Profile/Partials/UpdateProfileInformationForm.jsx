import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            address: user.address ?? '',
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-[#2C1E16]">Data profil</h2>
                <p className="mt-1 text-sm text-[#2C1E16]/60">Pastikan data ini selalu terbaru.</p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel className="text-[#2C1E16]" htmlFor="name" value="Nama" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full rounded-xl border-[#2C1E16]/15 bg-[#FDFBF7] focus:border-[#D4813E] focus:ring-[#D4813E]"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel className="text-[#2C1E16]" htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full rounded-xl border-[#2C1E16]/15 bg-[#FDFBF7] focus:border-[#D4813E] focus:ring-[#D4813E]"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel className="text-[#2C1E16]" htmlFor="phone" value="Nomor telepon" />

                    <TextInput
                        id="phone"
                        type="tel"
                        className="mt-1 block w-full rounded-xl border-[#2C1E16]/15 bg-[#FDFBF7] focus:border-[#D4813E] focus:ring-[#D4813E]"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        autoComplete="tel"
                        placeholder="+62"
                    />

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div>
                    <InputLabel className="text-[#2C1E16]" htmlFor="address" value="Alamat utama" />

                    <textarea
                        id="address"
                        rows="4"
                        className="mt-1 block w-full resize-none rounded-xl border border-[#2C1E16]/15 bg-[#FDFBF7] px-3 py-2 text-sm text-[#2C1E16] shadow-sm outline-none transition focus:border-[#D4813E] focus:ring-1 focus:ring-[#D4813E]"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        autoComplete="street-address"
                        placeholder="Silahkan masukan alamat lengkap"
                    />

                    <InputError className="mt-2" message={errors.address} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton className="rounded-full bg-[#D4813E] px-5 py-3 normal-case tracking-normal hover:bg-[#b86b30] focus:bg-[#b86b30]" disabled={processing}>Simpan perubahan</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Perubahan tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
