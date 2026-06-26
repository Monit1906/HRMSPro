import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type UserRole = "Admin" | "HR Manager" | "Employee";

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  employeeId?: string; // links to Employee record
  locationPermission?: boolean; // can check-in without assigned branch location
  dailyHoursTarget?: number;    // hours target (default 8)
}

// Built-in system users — Admin & HR Manager cannot be deleted
export const SYSTEM_USERS: AppUser[] = [
  { id: "su_admin", username: "admin",   name: "System Admin",  role: "Admin",      email: "admin@company.com",  locationPermission: true, dailyHoursTarget: 8 },
  { id: "su_hr",    username: "hrmanager", name: "HR Manager",  role: "HR Manager", email: "hr@company.com",     locationPermission: true, dailyHoursTarget: 8 },
];

export const DEFAULT_PASSWORDS: Record<string, string> = {
  su_admin: "admin@123",
  su_hr:    "hr@123",
};

const PASSWORDS_KEY   = "hrms_passwords";
const SESSION_KEY     = "hrms_session";
const USER_KEY        = "hrms_current_user_id";
const EMP_USERS_KEY   = "hrms_employee_users"; // dynamically added by HR/Admin

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

export function getEmployeeUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(EMP_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveEmployeeUsers(users: AppUser[]) {
  localStorage.setItem(EMP_USERS_KEY, JSON.stringify(users));
}

export function getAllUsers(): AppUser[] {
  return [...SYSTEM_USERS, ...getEmployeeUsers()];
}

const PERMISSIONS: Record<UserRole, string[]> = {
  Admin:        ["manage_employees","approve_leave","process_payroll","view_reports","manage_settings","delete","reset_passwords","reset_data","manage_users"],
  "HR Manager": ["manage_employees","approve_leave","process_payroll","view_reports","reset_passwords","manage_users"],
  Employee:     [],
};

interface RoleContextValue {
  user: AppUser;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  can: (action: string) => boolean;
  verifyPassword: (userId: string, password: string) => boolean;
  setUserPassword: (targetUserId: string, newPassword: string) => boolean;
  createEmployeeUser: (user: Omit<AppUser, "id"> & { password: string }) => { success: boolean; error?: string };
  updateEmployeeUser: (userId: string, updates: Partial<AppUser>) => boolean;
  deleteEmployeeUser: (userId: string) => boolean;
  getAllUsers: () => AppUser[];
  refreshUser: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser>(() => {
    const savedId = localStorage.getItem(USER_KEY);
    if (savedId) {
      const all = getAllUsers();
      const found = all.find((u) => u.id === savedId);
      if (found) return found;
    }
    return SYSTEM_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === "1";
  });

  const refreshUser = useCallback(() => {
    const savedId = localStorage.getItem(USER_KEY);
    if (savedId) {
      const all = getAllUsers();
      const found = all.find((u) => u.id === savedId);
      if (found) setUserState(found);
    }
  }, []);

  const login = useCallback((username: string, password: string): { success: boolean; error?: string } => {
    const all = getAllUsers();
    const found = all.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!found) return { success: false, error: "Username not found" };
    const passwords = getPasswords();
    const stored = passwords[found.id] ?? DEFAULT_PASSWORDS[found.id];
    if (!stored) return { success: false, error: "Account not set up — contact HR" };
    if (password !== stored) return { success: false, error: "Incorrect password" };
    setUserState(found);
    setIsAuthenticated(true);
    localStorage.setItem(USER_KEY, found.id);
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
    return !!(stored && password === stored);
  }, []);

  const setUserPassword = useCallback((targetUserId: string, newPassword: string): boolean => {
    if (!PERMISSIONS[user.role]?.includes("reset_passwords")) return false;
    const passwords = getPasswords();
    passwords[targetUserId] = newPassword;
    savePasswords(passwords);
    return true;
  }, [user.role]);

  const createEmployeeUser = useCallback((userData: Omit<AppUser, "id"> & { password: string }): { success: boolean; error?: string } => {
    if (!PERMISSIONS[user.role]?.includes("manage_users")) return { success: false, error: "No permission" };
    const all = getAllUsers();
    if (all.some((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: "Username already exists" };
    }
    const newUser: AppUser = {
      id: `emp_user_${Date.now()}`,
      username: userData.username,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      employeeId: userData.employeeId,
      locationPermission: userData.locationPermission ?? false,
      dailyHoursTarget: userData.dailyHoursTarget ?? 8,
    };
    const empUsers = getEmployeeUsers();
    empUsers.push(newUser);
    saveEmployeeUsers(empUsers);
    const passwords = getPasswords();
    passwords[newUser.id] = userData.password;
    savePasswords(passwords);
    return { success: true };
  }, [user.role]);

  const updateEmployeeUser = useCallback((userId: string, updates: Partial<AppUser>): boolean => {
    if (!PERMISSIONS[user.role]?.includes("manage_users")) return false;
    const empUsers = getEmployeeUsers();
    const idx = empUsers.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    empUsers[idx] = { ...empUsers[idx], ...updates };
    saveEmployeeUsers(empUsers);
    // If updating current user, refresh
    if (userId === user.id) {
      setUserState(empUsers[idx]);
    }
    return true;
  }, [user.role, user.id]);

  const deleteEmployeeUser = useCallback((userId: string): boolean => {
    if (!PERMISSIONS[user.role]?.includes("manage_users")) return false;
    const empUsers = getEmployeeUsers();
    saveEmployeeUsers(empUsers.filter((u) => u.id !== userId));
    const passwords = getPasswords();
    delete passwords[userId];
    savePasswords(passwords);
    return true;
  }, [user.role]);

  const getAllUsersCallback = useCallback(() => getAllUsers(), []);

  return (
    <RoleContext.Provider value={{
      user, isAuthenticated,
      login, logout, can,
      verifyPassword, setUserPassword,
      createEmployeeUser, updateEmployeeUser, deleteEmployeeUser,
      getAllUsers: getAllUsersCallback,
      refreshUser,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
