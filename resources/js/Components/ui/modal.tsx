import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { ReactNode } from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    children: ReactNode;
}

const maxWidths: Record<string, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
};

export default function Modal({ show, onClose, maxWidth = 'md', children }: ModalProps) {
    return (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClose={onClose}>
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[8px]" />
                </TransitionChild>
                <TransitionChild
                    enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.96]" enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.96]"
                >
                    <DialogPanel className={`relative w-full bg-white rounded-[20px] shadow-float max-h-[90vh] overflow-auto overscroll-contain ${maxWidths[maxWidth]} animate-scale-in`}>
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
