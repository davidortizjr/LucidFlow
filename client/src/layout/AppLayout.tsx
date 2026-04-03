import { Outlet } from "react-router-dom";
import MobileNavBar from "../components/Layout/MobileNavBar";
import SideNavBar from "../components/Layout/SideNavBar";
import TopNavBar from "../components/Layout/TopNavBar";

export default function AppLayout() {
  return (
    <div className="bg-surface-container-lowest text-on-surface font-sans antialiased">
      <SideNavBar />
      <TopNavBar />
      <MobileNavBar />
      <Outlet />
    </div>
  );
}

