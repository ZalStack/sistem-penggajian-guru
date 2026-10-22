import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useRef, useState, FormEventHandler } from 'react';

interface DeleteUserFormProps {
    className?: string;
}

export default function DeleteUserForm({ className = '' }: DeleteUserFormProps) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`card-modern overflow-hidden border-rose-200 ${className}`}>
            <header className="px-5 sm:px-7 py-5 sm:py-6 border-b border-rose-200 bg-rose-50 flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 ring-1 ring-rose-200 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:triangle-alert" className="text-lg" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-[-0.015em] text-rose-800 leading-5">
                        Delete Account
                    </h2>

                    <p className="mt-1 text-[13px] leading-5 text-rose-600/90 font-medium break-words">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Before deleting your
                        account, please download any data or information that
                        you wish to retain.
                    </p>
                </div>
            </header>

            <div className="p-5 sm:p-7 bg-white">
                <DangerButton className="gap-2" onClick={confirmUserDeletion}>
                    <Icon icon="lucide:trash-2" className="text-base" />
                    Delete Account
                </DangerButton>
            </div>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 ring-1 ring-rose-200 flex items-center justify-center shrink-0">
                            <Icon icon="lucide:triangle-alert" className="text-xl" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                Are you sure you want to delete your account?
                            </h2>

                            <p className="mt-1 text-sm text-slate-600">
                                Once your account is deleted, all of its
                                resources and data will be permanently deleted.
                                Please enter your password to confirm you would
                                like to permanently delete your account.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-full sm:w-3/4 input-modern"
                            isFocused
                            placeholder="Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>

                        <DangerButton className="gap-2" disabled={processing}>
                            <Icon icon="lucide:trash-2" className="text-base" />
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
