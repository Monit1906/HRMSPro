import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { initializeMockData } from "@/lib/mockData";

interface LayoutProps { children: ReactNode }

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const isCheckInPage = pathname === "/attendance/checkin";

  // Run once on mount — idempotent
  useEffect(() => { initializeMockData(); }, []);

  if (isCheckInPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 shrink-0 border-r overflow-y-auto">
        <Sidebar />
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
