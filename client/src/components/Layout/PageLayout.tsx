interface PageLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    breadcrumb?: Array<{ label: string; href?: string }>;
}

export default function PageLayout({
    children,
    title,
    subtitle,
    breadcrumb,
}: PageLayoutProps) {
    return (
        <main className="md:ml-64 pt-16 bg-background text-on-surface dark:bg-slate-950 dark:text-slate-100">
            <div className="px-6 pb-12 pt-8">
                {(title || breadcrumb) && (
                    <header className="mb-8">
                        {breadcrumb && (
                            <nav className="flex items-center gap-2 text-xs font-semibold text-outline dark:text-slate-400 mb-2 uppercase tracking-widest">
                                {breadcrumb.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        {index > 0 && (
                                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                                        )}
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </nav>
                        )}
                        {title && (
                            <h1 className="text-5xl font-extrabold font-manrope tracking-tighter text-on-surface dark:text-white">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-on-surface-variant dark:text-slate-400 mt-2">
                                {subtitle}
                            </p>
                        )}
                    </header>
                )}
                {children}
            </div>
        </main>
    );
}
