interface FormTextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    error?: string;
    className?: string;
}

export default function FormTextarea({
    label,
    value,
    onChange,
    placeholder,
    required,
    rows = 4,
    error,
    className,
}: FormTextareaProps) {
    return (
        <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-200 mb-2">
                {label}
                {required && <span className="text-error">*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`w-full bg-surface-container dark:bg-slate-700 text-on-surface dark:text-slate-100 rounded-lg px-4 py-2.5 outline-none text-sm placeholder-on-surface-variant dark:placeholder-slate-400 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 border border-outline-variant dark:border-slate-600 resize-none transition ${className || ""}`}
                required={required}
            />
            {error && <p className="text-xs text-error dark:text-red-400 mt-1">{error}</p>}
        </div>
    );
}
