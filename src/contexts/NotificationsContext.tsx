import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { getLeaveApplications, getHolidays, getPayroll } from "@/lib/mockData";

export interface AppNotification {
  id: string;
  type: "leave" | "holiday" | "payroll";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);
const STORAGE_KEY = "hrms_notifications_read";

function buildNotifications(): AppNotification[] {
  const readIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const notifs: AppNotification[] = [];
  const today = new Date();

  // Pending leave approvals
  getLeaveApplications()
    .filter((l) => l.status === "Pending")
    .forEach((l) => {
      const id = `leave-${l.id}`;
      notifs.push({
        id, type: "leave",
        title: "Leave Approval Needed",
        message: `${l.employeeName} applied for ${l.days} day(s) of ${l.leaveType}`,
        timestamp: l.appliedOn,
        read: readIds.includes(id),
      });
    });

  // Upcoming holidays (next 14 days)
  getHolidays()
    .filter((h) => {
      const d = new Date(h.date);
      const diff = (d.getTime() - today.getTime()) / 86400000;
      return diff >= 0 && diff <= 14;
    })
    .slice(0, 3)
    .forEach((h) => {
      const id = `holiday-${h.id}`;
      const days = Math.ceil((new Date(h.date).getTime() - today.getTime()) / 86400000);
      notifs.push({
        id, type: "holiday",
        title: "Upcoming Holiday",
        message: `${h.name} in ${days} day${days === 1 ? "" : "s"}`,
        timestamp: h.date,
        read: readIds.includes(id),
      });
    });

  // Processed payroll (last 30 days)
  getPayroll()
    .filter((p) => p.status === "Processed" || p.status === "Paid")
    .slice(0, 2)
    .forEach((p) => {
      const id = `payroll-${p.id}`;
      notifs.push({
        id, type: "payroll",
        title: `Payroll ${p.status}`,
        message: `${p.employeeName} — ₹${p.netSalary.toLocaleString()} for ${new Date(p.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
        timestamp: p.processedOn || p.month,
        read: readIds.includes(id),
      });
    });

  return notifs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(buildNotifications);

  const refresh = useCallback(() => setNotifications(buildNotifications()), []);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      const readIds = updated.filter((n) => n.read).map((n) => n.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.map((n) => n.id)));
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
