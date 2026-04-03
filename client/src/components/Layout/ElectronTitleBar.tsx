import { useState, useEffect } from 'react';

declare global {
    interface Window {
        electron?: {
            platform: string;
            windowControls?: {
                minimize?: () => void;
                maximize?: () => void;
                close?: () => void;
                isMaximized?: () => Promise<boolean>;
            };
        };
    }
}

export default function ElectronTitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const checkMaximized = async () => {
            if (window.electron?.windowControls?.isMaximized) {
                const maximized = await window.electron.windowControls.isMaximized();
                setIsMaximized(maximized || false);
            }
        };
        checkMaximized();
    }, []);

    const handleMaximize = () => {
        window.electron?.windowControls?.maximize?.();
        setIsMaximized(!isMaximized);
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-surface-container to-surface-container-low border-b border-outline-variant flex items-center justify-between px-4 select-none z-50"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Left section - Logo/Title */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center flex-shrink-0">
                    <span
                        className="material-symbols-outlined text-on-primary text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        architecture
                    </span>
                </div>
                <div className="flex flex-col min-w-0">
                    <h1 className="text-sm font-bold text-on-surface truncate">LucidFlow</h1>
                    <p className="text-xs text-on-surface-variant truncate">Project Management</p>
                </div>
            </div>

            {/* Right section - Window controls */}
            <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {/* Minimize button */}
                <button
                    onClick={() => window.electron?.windowControls?.minimize?.()}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                    title="Minimize"
                >
                    <span className="material-symbols-outlined text-lg">minimize</span>
                </button>

                {/* Maximize/Restore button */}
                <button
                    onClick={handleMaximize}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                    title={isMaximized ? 'Restore' : 'Maximize'}
                >
                    <span className="material-symbols-outlined text-lg">
                        {isMaximized ? 'close_fullscreen' : 'open_in_full'}
                    </span>
                </button>

                {/* Close button */}
                <button
                    onClick={() => window.electron?.windowControls?.close?.()}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-error-container transition-colors text-on-surface-variant hover:text-on-error-container"
                    title="Close"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        </div>
    );
}
