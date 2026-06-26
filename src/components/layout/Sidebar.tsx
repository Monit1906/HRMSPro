import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Settings, Calendar, ClipboardList,
  DollarSign, FileText, FileCheck, UserCircle,
  TrendingUp, Briefcase, Receipt, Clock, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin","HR Manager","Employee"] },
  { name: "Employees", href: "/employees", icon: Users, roles: ["Admin","HR Manager"] },
  {
    name: "Setup", icon: Settings, roles: ["Admin","HR Manager"],
    children: [
      { name: "Departments", href: "/setup/departments" },
      { name: "Designations", href: "/setup/designations" },
      { name: "Branches", href: "/setup/branches" },
    ],
  },
  {
    name: "Leave Management", icon: Calendar, roles: ["Admin","HR Manager"],
    children: [
      { name: "Leave Types", href: "/leave/types" },
      { name: "Applications", href: "/leave/applications" },
      { name: "Leave Balance", href: "/leave/balance" },
    ],
  },
  {
    name: "Attendance", icon: ClipboardList, roles: ["Admin","HR Manager","Employee"],
    children: [
      { name: "Attendance Records", href: "/attendance" },
      { name: "Check In/Out", href: "/attendance/checkin" },
    ],
  },
  {
    name: "Calendar", icon: FileCheck, roles: ["Admin","HR Manager"],
    children: [
      { name: "Holidays", href: "/calendar/holidays" },
      { name: "Week-off Config", href: "/calendar/weekoff" },
    ],
  },
  {
    name: "Payroll", icon: DollarSign, roles: ["Admin","HR Manager"],
    children: [
      { name: "Payroll List", href: "/payroll" },
      { name: "Process Payroll", href: "/payroll/process" },
      { name: "₹ Indian Payroll Sheet", href: "/payroll/sheet" },
      { name: "Payroll Masters", href: "/payroll/masters" },
    ],
  },
  { name: "Employee Portal", href: "/portal", icon: UserCircle, roles: ["Admin","HR Manager","Employee"] },
  { name: "Performance", href: "/performance", icon: TrendingUp, roles: ["Admin","HR Manager"] },
  { name: "Recruitment", href: "/recruitment", icon: Briefcase, roles: ["Admin","HR Manager"] },
  { name: "Expense Claims", href: "/expenses", icon: Receipt, roles: ["Admin","HR Manager"] },
  { name: "Shift Management", href: "/shifts", icon: Clock, roles: ["Admin","HR Manager"] },
  {
    name: "Reports", icon: FileText, roles: ["Admin","HR Manager"],
    children: [
      { name: "Analytics Dashboard", href: "/reports" },
      { name: "₹ Branch Payroll Summary", href: "/reports/payroll-summary" },
    ],
  },
  { name: "User Management", href: "/settings/users", icon: ShieldCheck, roles: ["Admin","HR Manager"] },
  { name: "Company Settings", href: "/settings", icon: Settings, roles: ["Admin"] },
] as const;

type NavItem = {
  name: string;
  href?: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  children?: { name: string; href: string; roles?: string[] }[];
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block px-3 py-2 text-sm rounded-md transition-colors",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

const rootLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

function Sidebar() {
  const { user } = useRole();
  const role = user.role;

  return (
    <nav className="py-4 px-2 space-y-0.5">
      {(navigation as unknown as NavItem[]).map((item) => {
        if (item.roles && !item.roles.includes(role)) return null;

        if (item.children) {
          const visibleChildren = item.children.filter(
            (c) => !("roles" in c) || !c.roles || c.roles.includes(role)
          );
          if (visibleChildren.length === 0) return null;
          return (
            <div key={item.name} className="space-y-0.5">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </div>
              <div className="pl-5 space-y-0.5">
                {visibleChildren.map((child) => (
                  <NavLink key={child.href} to={child.href} className={linkClass} end>
                    {child.name}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        }

        return (
          <NavLink
            key={item.name}
            to={item.href!}
            className={rootLinkClass}
            end={item.href === "/"}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.name}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default memo(Sidebar);
