import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';

interface YearPickerProps {
    value?: string | number;
    onChange?: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
    align?: 'left' | 'right';
    allowCurrent?: boolean;
}

export default function YearPicker({
    value = '',
    onChange,
    placeholder = 'Tahun',
    disabled = false,
    align = 'left',
    allowCurrent = false,
}: YearPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentYear = new Date().getFullYear();

    const isSekarang = String(value || '').toLowerCase() === 'sekarang';
    const displayValue = isSekarang ? 'Sekarang' : (value || '');

    const parsedYear = useMemo(() => {
        const num = parseInt(String(value), 10);
        return !isNaN(num) && num > 1900 ? num : currentYear;
    }, [value, currentYear]);

    const [decadeStart, setDecadeStart] = useState(() => Math.floor(parsedYear / 10) * 10);

    const decadeYears = useMemo(() => {
        const list: number[] = [];
        for (let i = 0; i < 10; i++) {
            list.push(decadeStart + i);
        }
        return list;
    }, [decadeStart]);

    const toggleOpen = () => {
        if (disabled) return;
        if (!isOpen) {
            setDecadeStart(Math.floor(parsedYear / 10) * 10);
        }
        setIsOpen(!isOpen);
    };

    const selectYear = (yr: number | '' | 'sekarang') => {
        onChange?.(yr ? String(yr) : '');
        setIsOpen(false);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (allowCurrent && raw.toLowerCase().startsWith('sek')) {
            onChange?.('sekarang');
            return;
        }
        const val = raw.replace(/\D/g, '').slice(0, 4);
        onChange?.(val);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative flex items-center">
                <input
                    type="text"
                    inputMode={allowCurrent && isSekarang ? 'text' : 'numeric'}
                    maxLength={allowCurrent ? 8 : 4}
                    value={displayValue}
                    onChange={onInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-2.5 pr-6 py-2 rounded-xl border text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition disabled:bg-slate-100 disabled:cursor-not-allowed ${
                        isSekarang
                            ? 'border-emerald-300 bg-emerald-50/70 text-emerald-700 font-bold'
                            : 'border-slate-300 bg-white text-slate-800 font-mono'
                    }`}
                />
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleOpen();
                    }}
                    disabled={disabled}
                    className="absolute right-1 text-slate-400 hover:text-blue-600 p-1 rounded-md transition disabled:cursor-not-allowed cursor-pointer"
                    title="Pilih Tahun"
                >
                    <Icon icon="tabler:calendar" className="text-[14px]" />
                </button>
            </div>

            {isOpen && (
                <div
                    className={`absolute mt-1 w-56 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 text-xs ${
                        align === 'right' ? 'right-0' : 'left-0'
                    }`}
                >
                    {/* Tombol Sekarang di dalam Date/Year Picker jika allowCurrent aktif */}
                    {allowCurrent && (
                        <div className="pb-1.5 mb-1.5 border-b border-slate-100">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    selectYear('sekarang');
                                }}
                                className={`w-full py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    isSekarang
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                <span>Sekarang</span>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDecadeStart((prev) => prev - 10);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Dekade Sebelumnya"
                        >
                            &larr;
                        </button>
                        <span className="font-bold text-slate-700 font-mono text-[11px]">
                            {decadeStart} – {decadeStart + 9}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDecadeStart((prev) => prev + 10);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Dekade Berikutnya"
                        >
                            &rarr;
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                        {decadeYears.map((yr) => {
                            const isSelected = String(value) === String(yr);
                            const isCurrent = yr === currentYear;
                            return (
                                <button
                                    key={yr}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectYear(yr);
                                    }}
                                    className={`py-1 px-1.5 text-center font-mono rounded-lg transition cursor-pointer text-xs ${
                                        isSelected
                                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                                            : isCurrent
                                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {yr}
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectYear(currentYear);
                            }}
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                            Tahun Ini ({currentYear})
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectYear('');
                            }}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                            Kosongkan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
