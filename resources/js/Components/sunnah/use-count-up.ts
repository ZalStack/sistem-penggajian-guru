import { useEffect, useRef, useState } from 'react';

/**
 * Animasi count-up untuk angka poin. Nilai awal tidak dianimasikan agar
 * angka langsung tampil benar saat halaman pertama kali dimuat.
 */
export function useCountUp(target: number, duration = 800): number {
    const [value, setValue] = useState(target);
    const valueRef = useRef(target);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        const from = valueRef.current;

        if (from === target) {
            return;
        }

        let frame = 0;
        const startedAt = performance.now();

        const tick = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = Math.round(from + (target - from) * eased);

            valueRef.current = next;
            setValue(next);

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
}
