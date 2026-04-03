interface FormSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    error?: string;
}

export default function FormSelect({
    label,
    value,
    onChange,
    options,
    required,
    error,
}: FormSelectProps) {
    return (
        <div>
            <label className="block text-sm font-semibold text-on-surface dark:text-slate-200 mb-2">
                {label}
                {required && <span className="text-error">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-surface-container dark:bg-slate-700 text-on-surface dark:text-slate-100 rounded-lg px-4 py-2.5 outline-none text-sm border border-outline-variant dark:border-slate-600 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 cursor-pointer transition"
                required={required}
            >
                <option value="">Select an option</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-error dark:text-red-400 mt-1">{error}</p>}
        </div>
    );
}
