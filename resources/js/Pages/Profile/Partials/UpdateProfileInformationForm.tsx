import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { FormEventHandler } from 'react';
import { User } from '@/types';

interface UpdateProfileInformationProps {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: UpdateProfileInformationProps) {
    const { props } = usePage<{ auth: { user: User } }>();
    const user = props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={`card-modern overflow-hidden ${className}`}>
            <header className="px-5 sm:px-7 py-5 sm:py-6 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40 flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)] shrink-0">
                    <Icon icon="lucide:user-round" className="text-lg" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-[-0.015em] text-slate-900 leading-5">
                        Profile Information
                    </h2>

                    <p className="mt-1 text-[13px] leading-5 text-slate-500 font-medium break-words">
                        Update your account's profile information and email
                        address.
                    </p>
                </div>
            </header>

            <div className="p-5 sm:p-7">
            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full input-modern"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full input-modern"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                        <p className="text-sm text-amber-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ms-1 rounded-md text-sm font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700">
                                <Icon icon="lucide:check-circle-2" className="text-base" />
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                            <Icon icon="lucide:check-circle-2" className="text-base" />
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
            </div>
        </section>
    );
}
