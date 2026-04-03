interface LoadingStateProps {
    title?: string;
    count?: number;
    className?: string;
}

export default function LoadingState({
    title,
    count = 3,
    className = "",
}: LoadingStateProps) {
    return (
        <div className={className}>
            {title && (
                <div className="mb-4">
                    <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-1/3 animate-pulse"></div>
                </div>
            )}
            <div className="space-y-4">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="bg-surface-container-low dark:bg-slate-700 p-4 rounded-lg animate-pulse">
                        <div className="h-4 bg-slate-400 dark:bg-slate-600 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-slate-400 dark:bg-slate-600 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
