import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, LocateFixed } from 'lucide-react';
import { useState } from 'react';

const localPhoneNumber = (phone = '') => {
    const digits = String(phone).replace(/\D/g, '');
    const localDigits = digits.startsWith('62') ? digits.slice(2) : digits.replace(/^0+/, '');
    const remainingDigits = localDigits.slice(3);
    const groups = remainingDigits.match(/.{1,4}/g) ?? [];

    return [localDigits.slice(0, 3), ...groups].filter(Boolean).join('-');
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: localPhoneNumber(user.phone),
            address: user.address ?? '',
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    const fillAddressFromCurrentLocation = () => {
        setLocationError('');

        if (!navigator.geolocation) {
            setLocationError('Browser ini tidak mendukung penggunaan lokasi saat ini.');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const response = await window.axios.post(route('checkout.current-location'), {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });

                    setData('address', response.data.address);
                } catch (error) {
                    setLocationError(error.response?.data?.message || 'Lokasi saat ini tidak dapat diubah menjadi alamat.');
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                setLocationLoading(false);
                setLocationError('Izin lokasi diperlukan untuk menggunakan lokasi saat ini.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
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

                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center rounded-l-xl border-r border-[#2C1E16]/15 bg-[#FFF5EA] px-3 text-sm font-bold text-[#B86632]">+62</span>
                        <TextInput
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            className="block w-full rounded-xl border-[#2C1E16]/15 bg-[#FDFBF7] pl-14 focus:border-[#D4813E] focus:ring-[#D4813E]"
                            value={data.phone}
                            onChange={(e) => setData('phone', localPhoneNumber(e.target.value))}
                            autoComplete="tel-national"
                            placeholder="8123456789"
                        />
                    </div>

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <InputLabel className="text-[#2C1E16]" htmlFor="address" value="Alamat utama" />
                        <button
                            type="button"
                            onClick={fillAddressFromCurrentLocation}
                            disabled={locationLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF5EA] px-2.5 py-1.5 text-xs font-bold text-[#B86632] transition hover:bg-[#FFE9D2] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {locationLoading ? <LoaderCircle className="animate-spin" size={14} /> : <LocateFixed size={14} />}
                            {locationLoading ? 'Mendeteksi lokasi...' : 'Gunakan lokasi saat ini'}
                        </button>
                    </div>

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
                    {locationError && <p className="mt-2 text-xs font-medium text-red-600">{locationError}</p>}
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
