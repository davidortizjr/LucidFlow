interface CardPanelProps {
    title: string;
    icon?: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}

export default function CardPanel({
    title,
    icon,
    children,
    className = "",
    headerAction,
}: CardPanelProps) {
    return (
        <div className={`bg-surface-container-low dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-outline-variant dark:border-slate-700 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {icon && <span className="material-symbols-outlined text-primary dark:text-blue-400">{icon}</span>}
                    <h3 className="font-manrope font-bold text-on-surface dark:text-slate-100">{title}</h3>
                </div>
                {headerAction}
            </div>
            {children}
        </div>
    );
}
