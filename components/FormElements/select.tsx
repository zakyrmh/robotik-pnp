"use client";

import { ChevronUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import { useEffect, useId, useState } from "react";

type PropsType = {
  label: string;
  items: { value: string; label: string }[];
  prefixIcon?: React.ReactNode;
  className?: string;
  required?: boolean;
  /**
   * Jika parent memberikan `value` (bukan undefined/null) maka Select
   * akan berperilaku controlled. Jika tidak, Select akan menggunakan defaultValue (uncontrolled).
   */
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
};

export function Select({
  items,
  label,
  defaultValue,
  placeholder,
  prefixIcon,
  className,
  required,
  value,
  onChange,
  disabled
}: PropsType) {
  const id = useId();

  // mode: controlled jika parent mengirim value (bukan undefined / null)
  const isControlled = value != null;

  // inisialisasi flag styling apakah sudah ada pilihan
  const initialSelected = isControlled
    ? Boolean(value && value !== "")
    : Boolean(defaultValue && defaultValue !== "");

  const [isOptionSelected, setIsOptionSelected] = useState(initialSelected);

  // sinkronisasi bila parent mengubah `value` pada mode controlled
  useEffect(() => {
    if (isControlled) {
      setIsOptionSelected(Boolean(value && value !== ""));
    }
  }, [value, isControlled]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsOptionSelected(true);
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={id}
        className="text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
        {required && <span className="ml-1 select-none text-red">*</span>}
      </label>

      <div className="relative mt-2">
        {prefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {prefixIcon}
          </div>
        )}

        <select
          id={id}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-lg border border-stroke bg-transparent px-5.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary [&>option]:text-dark-5 dark:[&>option]:text-dark-6",
            isOptionSelected && "text-dark dark:text-white",
            prefixIcon && "pl-11.5",
          )}
          // kirim hanya satu dari kedua props berikut berdasarkan mode
          {...(isControlled
            ? { value: value ?? "" } // controlled: value diberikan (pastikan bukan undefined)
            : { defaultValue: defaultValue ?? "" } // uncontrolled: defaultValue disediakan
          )}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <ChevronUpIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-180" />
      </div>
    </div>
  );
}
