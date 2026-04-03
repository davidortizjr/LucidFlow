interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    loading?: boolean;
}

export default function BaseModal({
    isOpen,
    onClose,
    title,
    children,
    loading,
}: BaseModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 ring-1 ring-outline-variant/20 dark:ring-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-on-surface dark:text-slate-100">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
