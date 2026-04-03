import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import StatsPanel from "../components/Dashboard/StatsPanel";
import CalendarPanel from "../components/Dashboard/CalendarPanel";
import ActivityPanel from "../components/Dashboard/ActivityPanel";

export default function DashboardPage() {
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  const handleAddEvent = () => {
    setFabOpen(false);
    navigate("/calendar?modal=create-event");
  };

  const handleCreateTicket = () => {
    setFabOpen(false);
    navigate("/boards?modal=create-ticket");
  };

  const handleCreateDocumentation = () => {
    setFabOpen(false);
    navigate("/code-docs?modal=create-documentation");
  };

  useLayoutEffect(() => {
    if (!dashboardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" } });

      timeline
        .from(".dashboard-hero", {
          y: 24,
          opacity: 0,
          duration: 0.6,
        })
        .from(
          ".dashboard-panel",
          {
            y: 20,
            opacity: 0,
            duration: 0.55,
            stagger: 0.12,
          },
          "-=0.25"
        )
        .from(
          ".dashboard-fab",
          {
            scale: 0.75,
            y: 18,
            opacity: 0,
            duration: 0.45,
            ease: "back.out(1.7)",
          },
          "-=0.2"
        );

      localStorage.setItem("dashboardAnimationShown", "true");
    }, dashboardRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <main ref={dashboardRef} className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
        <div className="px-6 pb-12 pt-8">
          <header className="dashboard-hero mb-8 mt-8">
            <h2 className="font-manrope text-5xl font-extrabold text-on-surface tracking-tighter mb-2">Good morning, Team.</h2>
            <p className="text-on-surface-variant max-w-lg leading-relaxed">Your workspace is structured and ready. You have 3 deadlines approaching in the next 48 hours.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="dashboard-panel md:col-span-4">
              <StatsPanel />
            </div>
            <div className="md:col-span-8 space-y-6">
              <div className="dashboard-panel">
                <CalendarPanel />
              </div>
              <div className="dashboard-panel">
                <ActivityPanel />
              </div>
            </div>
          </div>
        </div>

        {/* FAB Menu */}
        <div className="dashboard-fab fixed right-6 bottom-20 md:bottom-8 z-50">
          {/* Menu items */}
          {fabOpen && (
            <>
              <button
                onClick={handleAddEvent}
                className="absolute right-0 bottom-20 flex items-center gap-3 bg-surface-container-lowest rounded-lg p-3 shadow-lg ring-1 ring-outline-variant/20 hover:shadow-xl transition-all z-40 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
              >
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <span className="text-sm font-semibold text-on-surface whitespace-nowrap">Create Event</span>
              </button>
              <button
                onClick={handleCreateTicket}
                className="absolute right-0 bottom-35 flex items-center gap-3 bg-surface-container-lowest rounded-lg p-3 shadow-lg ring-1 ring-outline-variant/20 hover:shadow-xl transition-all z-30 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
              >
                <span className="material-symbols-outlined text-primary">assignment</span>
                <span className="text-sm font-semibold text-on-surface whitespace-nowrap">Create Ticket</span>
              </button>

              <button
                onClick={handleCreateDocumentation}
                className="absolute right-0 bottom-50 flex items-center gap-3 bg-surface-container-lowest rounded-lg p-3 shadow-lg ring-1 ring-outline-variant/20 hover:shadow-xl transition-all z-30 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
              >
                <span className="material-symbols-outlined text-primary">assignment</span>
                <span className="text-sm font-semibold text-on-surface whitespace-nowrap">Create Documentation</span>
              </button>

              {/* Overlay */}
              <div
                className="fixed inset-0 z-20 animate-in fade-in duration-200"
                onClick={() => setFabOpen(false)}
              />
            </>
          )}

          {/* FAB Button */}
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className={`relative bg-gradient-to-br from-[#2b3896] to-[#4551af] text-white p-4 rounded-full shadow-2xl shadow-indigo-400/40 active:scale-90 transition-transform z-50 ${fabOpen ? "scale-110" : ""
              }`}
          >
            <span className={`material-symbols-outlined transition-transform duration-300 ${fabOpen ? "rotate-45" : ""}`}>add</span>
          </button>
        </div>
      </main>

    </>
  );
}

