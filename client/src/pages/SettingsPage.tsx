import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        messages: true,
        updates: true,
        announcements: false,
        mentions: true,
    });

    const [privacy, setPrivacy] = useState({
        showStatus: true,
        allowMessages: true,
        profileVisible: true,
    });

    const [appearance, setAppearance] = useState({
        theme: (localStorage.getItem("app-theme") || "light") as "light" | "dark" | "auto",
        compactMode: localStorage.getItem("app-compact") === "true",
        animationsEnabled: localStorage.getItem("app-animations") !== "false",
        sidebarWidth: parseInt(localStorage.getItem("app-sidebar-width") || "256"),
    });

    const [activeSection, setActiveSection] = useState<"notifications" | "privacy" | "account" | "appearance">("notifications");

    const containerRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const privacyRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);
    const appearanceRef = useRef<HTMLDivElement>(null);

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrivacyChange = (key: keyof typeof privacy) => {
        setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleThemeChange = (newTheme: "light" | "dark" | "auto") => {
        setAppearance((prev) => ({ ...prev, theme: newTheme }));
        localStorage.setItem("app-theme", newTheme);
    };

    const handleCompactModeToggle = () => {
        setAppearance((prev) => {
            const newValue = !prev.compactMode;
            localStorage.setItem("app-compact", String(newValue));
            return { ...prev, compactMode: newValue };
        });
    };

    const handleAnimationsToggle = () => {
        setAppearance((prev) => {
            const newValue = !prev.animationsEnabled;
            localStorage.setItem("app-animations", String(newValue));
            return { ...prev, animationsEnabled: newValue };
        });
    };

    const handleSidebarWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = parseInt(e.target.value);
        setAppearance((prev) => ({ ...prev, sidebarWidth: newWidth }));
        localStorage.setItem("app-sidebar-width", String(newWidth));
    };

    // Apply theme changes
    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute("data-theme", appearance.theme);

        if (appearance.theme === "auto") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            html.classList.toggle("dark", prefersDark);
        } else {
            html.classList.toggle("dark", appearance.theme === "dark");
        }
    }, [appearance.theme]);

    // Apply compact mode
    useEffect(() => {
        const html = document.documentElement;
        if (appearance.compactMode) {
            html.classList.add("compact-mode");
        } else {
            html.classList.remove("compact-mode");
        }
    }, [appearance.compactMode]);

    // Apply animations setting
    useEffect(() => {
        const html = document.documentElement;
        if (!appearance.animationsEnabled) {
            html.classList.add("reduce-motion");
            html.style.setProperty("--animation-duration", "0s");
        } else {
            html.classList.remove("reduce-motion");
            html.style.removeProperty("--animation-duration");
        }
    }, [appearance.animationsEnabled]);

    // Apply sidebar width
    useEffect(() => {
        document.documentElement.style.setProperty("--sidebar-width", `${appearance.sidebarWidth}px`);
    }, [appearance.sidebarWidth]);

    // Initialize theme on mount
    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute("data-theme", appearance.theme);

        if (appearance.theme === "auto") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            html.classList.toggle("dark", prefersDark);
        } else {
            html.classList.toggle("dark", appearance.theme === "dark");
        }

        if (appearance.compactMode) {
            html.classList.add("compact-mode");
        } else {
            html.classList.remove("compact-mode");
        }

        if (!appearance.animationsEnabled) {
            html.classList.add("reduce-motion");
        } else {
            html.classList.remove("reduce-motion");
        }

        document.documentElement.style.setProperty("--sidebar-width", `${appearance.sidebarWidth}px`);
    }, []);

    // Track which section is visible using Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.getAttribute("data-section");
                        if (sectionId) {
                            setActiveSection(sectionId as "notifications" | "privacy" | "account" | "appearance");
                        }
                    }
                });
            },
            { threshold: 0.3, rootMargin: "-100px 0px -66% 0px" }
        );

        if (notificationsRef.current) observer.observe(notificationsRef.current);
        if (privacyRef.current) observer.observe(privacyRef.current);
        if (accountRef.current) observer.observe(accountRef.current);
        if (appearanceRef.current) observer.observe(appearanceRef.current);

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current && containerRef.current) {
            gsap.to(window, {
                scrollTo: {
                    y: ref.current.offsetTop - 100,
                    autoKill: false,
                },
                duration: 0.6,
                ease: "power2.inOut",
            });
        }
    };

    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="px-6 pb-12 pt-8">
                <header className="mb-8 mt-8">
                    <h2 className="font-manrope text-5xl font-extrabold text-on-surface tracking-tighter mb-2">
                        Settings
                    </h2>
                    <p className="text-on-surface-variant max-w-lg leading-relaxed">
                        Manage your account preferences, notifications, and privacy settings.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Navigation Buttons - Left Side */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-4 space-y-1 sticky top-24">
                            <button
                                onClick={() => scrollToSection(notificationsRef)}
                                className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 text-left ${activeSection === "notifications"
                                    ? "bg-primary text-white hover:shadow-lg"
                                    : "bg-surface-container dark:bg-surface-container-highest text-on-surface dark:text-white hover:bg-surface-variant"
                                    }`}
                            >
                                Notifications
                            </button>
                            <button
                                onClick={() => scrollToSection(privacyRef)}
                                className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 text-left ${activeSection === "privacy"
                                    ? "bg-primary text-white hover:shadow-lg"
                                    : "bg-surface-container dark:bg-surface-container-highest text-on-surface dark:text-white hover:bg-surface-variant"
                                    }`}
                            >
                                Privacy
                            </button>
                            <button
                                onClick={() => scrollToSection(accountRef)}
                                className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 text-left ${activeSection === "account"
                                    ? "bg-primary text-white hover:shadow-lg"
                                    : "bg-surface-container dark:bg-surface-container-highest text-on-surface dark:text-white hover:bg-surface-variant"
                                    }`}
                            >
                                Account
                            </button>
                            <button
                                onClick={() => scrollToSection(appearanceRef)}
                                className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 text-left ${activeSection === "appearance"
                                    ? "bg-primary text-white hover:shadow-lg"
                                    : "bg-surface-container dark:bg-surface-container-highest text-on-surface dark:text-white hover:bg-surface-variant"
                                    }`}
                            >
                                Appearance
                            </button>
                        </div>
                    </div>

                    {/* Settings Content - Right Side */}
                    <div ref={containerRef} className="lg:col-span-3 space-y-8">
                        {/* Notifications Section */}
                        <div ref={notificationsRef} data-section="notifications" className="scroll-mt-24">
                            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                                        Notification Preferences
                                    </h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        Choose what notifications you want to receive
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { key: "messages" as const, label: "Messages", description: "Get notified when you receive messages" },
                                        { key: "updates" as const, label: "Updates", description: "Receive project and task updates" },
                                        { key: "announcements" as const, label: "Announcements", description: "Important announcements from the team" },
                                        { key: "mentions" as const, label: "Mentions", description: "Get notified when someone mentions you" },
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg">
                                            <div>
                                                <h4 className="font-semibold text-on-surface dark:text-white">{label}</h4>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">{description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleNotificationChange(key)}
                                                className={`relative w-12 h-7 rounded-full transition-colors ${notifications[key] ? "bg-primary" : "bg-surface-container-highest dark:bg-gray-600"
                                                    }`}
                                            >
                                                <div
                                                    className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${notifications[key] ? "translate-x-6" : "translate-x-1"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Privacy Section */}
                        <div ref={privacyRef} data-section="privacy" className="scroll-mt-24">
                            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                                        Privacy Settings
                                    </h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        Control your privacy and visibility on the platform
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { key: "showStatus" as const, label: "Show Online Status", description: "Let other users see when you're online" },
                                        { key: "allowMessages" as const, label: "Allow Direct Messages", description: "Enable receiving messages from team members" },
                                        { key: "profileVisible" as const, label: "Profile Visible", description: "Allow your profile to be viewed by team members" },
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg">
                                            <div>
                                                <h4 className="font-semibold text-on-surface dark:text-white">{label}</h4>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">{description}</p>
                                            </div>
                                            <button
                                                onClick={() => handlePrivacyChange(key)}
                                                className={`relative w-12 h-7 rounded-full transition-colors ${privacy[key] ? "bg-primary" : "bg-surface-container-highest dark:bg-gray-600"
                                                    }`}
                                            >
                                                <div
                                                    className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${privacy[key] ? "translate-x-6" : "translate-x-1"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Account Section */}
                        <div ref={accountRef} data-section="account" className="scroll-mt-24">
                            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                                        Account Settings
                                    </h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        Manage your account and security
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-on-surface dark:text-white">Change Password</h4>
                                            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Update your password regularly</p>
                                        </div>
                                        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:shadow-lg transition-all active:scale-95">
                                            Update
                                        </button>
                                    </div>

                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-on-surface dark:text-white">Two-Factor Authentication</h4>
                                            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Enhance your account security</p>
                                        </div>
                                        <button className="px-4 py-2 bg-surface-container-highest dark:bg-gray-600 text-on-surface-variant dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-surface-variant transition-all">
                                            Enable
                                        </button>
                                    </div>

                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-on-surface dark:text-white">Active Sessions</h4>
                                            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">View and manage your active sessions</p>
                                        </div>
                                        <button className="px-4 py-2 bg-surface-container-highest dark:bg-gray-600 text-on-surface-variant dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-surface-variant transition-all">
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Appearance Section */}
                        <div ref={appearanceRef} data-section="appearance" className="scroll-mt-24">
                            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface dark:text-white mb-2">
                                        Appearance Settings
                                    </h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        Customize how LucidFlow looks and feels
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg">
                                        <h4 className="font-semibold text-on-surface dark:text-white mb-3">Theme</h4>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleThemeChange("light")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${appearance.theme === "light"
                                                    ? "bg-primary text-on-primary"
                                                    : "bg-surface-container-highest dark:bg-gray-600 text-on-surface-variant dark:text-gray-200 hover:bg-surface-variant dark:hover:bg-gray-500"
                                                    }`}
                                            >
                                                Light
                                            </button>
                                            <button
                                                onClick={() => handleThemeChange("dark")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${appearance.theme === "dark"
                                                    ? "bg-primary text-on-primary"
                                                    : "bg-surface-container-highest dark:bg-gray-600 text-on-surface-variant dark:text-gray-200 hover:bg-surface-variant dark:hover:bg-gray-500"
                                                    }`}
                                            >
                                                Dark
                                            </button>
                                            <button
                                                onClick={() => handleThemeChange("auto")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${appearance.theme === "auto"
                                                    ? "bg-primary text-on-primary"
                                                    : "bg-surface-container-highest dark:bg-gray-600 text-on-surface-variant dark:text-gray-200 hover:bg-surface-variant dark:hover:bg-gray-500"
                                                    }`}
                                            >
                                                Auto
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg">
                                        <h4 className="font-semibold text-on-surface dark:text-white mb-3">Compact Mode</h4>
                                        <p className="text-xs text-on-surface-variant dark:text-gray-400 mb-3">Reduce spacing and font sizes for a more compact interface</p>
                                        <button
                                            onClick={handleCompactModeToggle}
                                            className={`relative w-12 h-7 rounded-full transition-colors ${appearance.compactMode ? "bg-primary" : "bg-surface-container-highest dark:bg-gray-600"
                                                }`}
                                        >
                                            <div
                                                className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${appearance.compactMode ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg">
                                        <h4 className="font-semibold text-on-surface dark:text-white mb-3">Animations</h4>
                                        <p className="text-xs text-on-surface-variant dark:text-gray-400 mb-3">Enable smooth transitions and animations</p>
                                        <button
                                            onClick={handleAnimationsToggle}
                                            className={`relative w-12 h-7 rounded-full transition-colors ${appearance.animationsEnabled ? "bg-primary" : "bg-surface-container-highest dark:bg-gray-600"
                                                }`}
                                        >
                                            <div
                                                className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${appearance.animationsEnabled ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="p-4 bg-surface-container dark:bg-surface-container-highest rounded-lg">
                                        <h4 className="font-semibold text-on-surface dark:text-white mb-3">Sidebar Width: {appearance.sidebarWidth}px</h4>
                                        <input
                                            type="range"
                                            min="200"
                                            max="350"
                                            value={appearance.sidebarWidth}
                                            onChange={handleSidebarWidthChange}
                                            className="w-full cursor-pointer"
                                        />
                                        <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-2">Adjust sidebar width for better visibility</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone - Always visible */}
                        <div className="bg-red-500/10 dark:bg-red-900/20 border border-red-500/30 dark:border-red-800/50 rounded-2xl p-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-red-600/80 dark:text-red-300/80">
                                    These actions cannot be undone. Please proceed with caution.
                                </p>
                            </div>

                            <button className="w-full px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors active:scale-95">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
