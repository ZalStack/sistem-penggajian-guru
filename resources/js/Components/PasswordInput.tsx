import Input from '@/Components/ui/input';
import { Icon } from '@iconify/react';
import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
}

/**
 * Field kata sandi dengan tombol tampil/sembunyikan (ikon mata).
 *
 * `type` sengaja dipegang di komponen ini sehingga nilai yang dikirim ke
 * server tetap selalu `password` — hanya tampilan yang berubah.
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ label, error, hint, icon, id, ...props }, ref) => {
        const [visible, setVisible] = useState(false);

        return (
            <Input
                ref={ref}
                id={id}
                label={label}
                error={error}
                hint={hint}
                type={visible ? 'text' : 'password'}
                icon={icon ?? <Icon icon="lucide:lock" className="text-[16px]" />}
                trailing={
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        tabIndex={0}
                        aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        aria-pressed={visible}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-colors"
                    >
                        <Icon icon={visible ? 'lucide:eye-off' : 'lucide:eye'} className="text-[16px]" />
                    </button>
                }
                {...props}
            />
        );
    }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
