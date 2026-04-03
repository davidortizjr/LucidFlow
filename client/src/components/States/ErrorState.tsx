interface ErrorStateProps {
    error: string | null;
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function ErrorState({
    error,
    title = "Error",
    actionLabel,
    onAction,
}: ErrorStateProps) {
    if (!error) return null;

    return (
        <div className="bg-error-container dark:bg-red-900/30 border border-error dark:border-red-700 text-on-error-container dark:text-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined flex-shrink-0">error</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm mt-1 break-words">{error}</p>
                </div>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="ml-auto px-3 py-1 text-sm font-medium bg-error dark:bg-red-700 hover:bg-error/90 dark:hover:bg-red-600 rounded transition flex-shrink-0"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
