import { Outlet } from "react-router-dom";

import { Sidebar } from "../components/shared/Sidebar";
import { Topbar } from "../components/shared/Topbar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 pt-8 pb-24 md:px-10 md:py-10">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
