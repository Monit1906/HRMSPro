import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type UserRole = "Admin" | "HR Manager" | "Employee";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

const USERS: AppUser[] = [
  { id: "2", name: "Priya Patel",     role: "Admin",      email: "priya@techcorp.com" },
  { id: "3", name: "Emily Rodriguez", role: "HR Manager", email: "emily@techcorp.com" },
  { id: "1", name: "Rahul Sharma",    role: "Employee",   email: "rahul@techcorp.com" },
];

interface RoleContextValue {
  user: AppUser;
  setUser: (u: AppUser) => void;
  can: (action: "manage_employees" | "approve_leave" | "process_payroll" | "view_reports" | "manage_settings" | "delete") => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const PERMISSIONS: Record<UserRole, string[]> = {
  Admin:       ["manage_employees","approve_leave","process_payroll","view_reports","manage_settings","delete"],
  "HR Manager":["manage_employees","approve_leave","process_payroll","view_reports"],
  Employee:    [],
};

const STORAGE_KEY = "hrms_current_user_id";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    return USERS.find((u) => u.id === savedId) ?? USERS[1]; // default HR Manager
  });

  const setUser = useCallback((u: AppUser) => {
    setUserState(u);
    localStorage.setItem(STORAGE_KEY, u.id);
  }, []);

  const can = useCallback((action: string) => {
    return PERMISSIONS[user.role]?.includes(action) ?? false;
  }, [user.role]);

  return <RoleContext.Provider value={{ user, setUser, can }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

export { USERS };
