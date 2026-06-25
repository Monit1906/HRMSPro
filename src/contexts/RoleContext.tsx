import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type UserRole = "Admin" | "HR Manager" | "Employee";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export const USERS: AppUser[] = [
  { id: "2", name: "Priya Patel",     role: "Admin",      email: "priya@techcorp.com" },
  { id: "3", name: "Emily Rodriguez", role: "HR Manager", email: "emily@techcorp.com" },
  { id: "1", name: "Rahul Sharma",    role: "Employee",   email: "rahul@techcorp.com" },
];

export const DEFAULT_PASSWORDS: Record<string, string> = {
  "2": "admin123",
  "3": "hr123",
  "1": "emp123",
};

const PASSWORDS_KEY = "hrms_passwords";
const SESSION_KEY   = "hrms_session";
const USER_KEY      = "hrms_current_user_id";

function getPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { ...DEFAULT_PASSWORDS };
}

function savePasswords(v: Record<string, string>) {
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(v));
}

const PERMISSIONS: Record<UserRole, string[]> = {
  Admin:        ["manage_employees","approve_leave","process_payroll","view_reports","manage_settings","delete","reset_passwords","reset_data"],
  "HR Manager": ["manage_employees","approve_leave","process_payroll","view_reports","reset_passwords"],
  Employee:     [],
};

interface RoleContextValue {
  user: AppUser;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  can: (action: string) => boolean;
  verifyPassword: (userId: string, password: string) => boolean;
  setUserPassword: (targetUserId: string, newPassword: string) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser>(() => {
    const savedId = localStorage.getItem(USER_KEY);
    return USERS.find((u) => u.id === savedId) ?? USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === "1";
  });

  const login = useCallback((userId: string, password: string): { success: boolean; error?: string } => {
    const found = USERS.find((u) => u.id === userId);
    if (!found) return { success: false, error: "User not found" };
    const passwords = getPasswords();
    const stored = passwords[userId] ?? DEFAULT_PASSWORDS[userId];
    if (password !== stored) return { success: false, error: "Incorrect password" };
    setUserState(found);
    setIsAuthenticated(true);
    localStorage.setItem(USER_KEY, userId);
    localStorage.setItem(SESSION_KEY, "1");
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const can = useCallback((action: string) => {
    return PERMISSIONS[user.role]?.includes(action) ?? false;
  }, [user.role]);

  const verifyPassword = useCallback((userId: string, password: string) => {
    const passwords = getPasswords();
    const stored = passwords[userId] ?? DEFAULT_PASSWORDS[userId];
    return password === stored;
  }, []);

  const setUserPassword = useCallback((targetUserId: string, newPassword: string): boolean => {
    if (!PERMISSIONS[user.role]?.includes("reset_passwords")) return false;
    const passwords = getPasswords();
    passwords[targetUserId] = newPassword;
    savePasswords(passwords);
    return true;
  }, [user.role]);

  return (
    <RoleContext.Provider value={{ user, isAuthenticated, login, logout, can, verifyPassword, setUserPassword }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
