import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useRef, FormEventHandler } from 'react';

interface UpdatePasswordFormProps {
    className?: string;
}

export default function UpdatePasswordForm({ className = '' }: UpdatePasswordFormProps) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (pageErrors) => {
                if (pageErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (pageErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={`card-modern overflow-hidden ${className}`}>
            <header className="px-5 sm:px-7 py-5 sm:py-6 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40 flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)] shrink-0">
                    <Icon icon="lucide:lock-keyhole" className="text-lg" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-[-0.015em] text-slate-900 leading-5">
                        Update Password
                    </h2>

                    <p className="mt-1 text-[13px] leading-5 text-slate-500 font-medium break-words">
                        Ensure your account is using a long, random password to
                        stay secure.
                    </p>
                </div>
            </header>

            <div className="p-5 sm:p-7">
            <form onSubmit={updatePassword} className="space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                    />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full input-modern"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full input-modern"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full input-modern"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

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
