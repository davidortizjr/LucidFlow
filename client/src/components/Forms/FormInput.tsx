interface FormInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    error?: string;
}

export default function FormInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
    error,
}: FormInputProps) {
    return (
        <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-200 mb-2">
                {label}
                {required && <span className="text-error">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-surface-container dark:bg-slate-700 text-on-surface dark:text-slate-100 rounded-lg px-4 py-2.5 outline-none text-sm placeholder-on-surface-variant dark:placeholder-slate-400 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 border border-outline-variant dark:border-slate-600 transition"
                required={required}
            />
            {error && <p className="text-xs text-error dark:text-red-400 mt-1">{error}</p>}
        </div>
    );
}
