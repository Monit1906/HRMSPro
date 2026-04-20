import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Settings, Calendar, ClipboardList,
  DollarSign, FileText, MapPin, FileCheck, UserCircle,
  TrendingUp, Briefcase, Receipt, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  {
    name: "Setup", icon: Settings,
    children: [
      { name: "Departments", href: "/setup/departments" },
      { name: "Designations", href: "/setup/designations" },
      { name: "Branches", href: "/setup/branches" },
    ],
  },
  {
    name: "Leave Management", icon: Calendar,
    children: [
      { name: "Leave Types", href: "/leave/types" },
      { name: "Applications", href: "/leave/applications" },
      { name: "Leave Balance", href: "/leave/balance" },
    ],
  },
  {
    name: "Attendance", icon: ClipboardList,
    children: [
      { name: "Attendance Records", href: "/attendance" },
      { name: "Check In/Out", href: "/attendance/checkin" },
    ],
  },
  {
    name: "Calendar", icon: FileCheck,
    children: [
      { name: "Holidays", href: "/calendar/holidays" },
      { name: "Week-off Config", href: "/calendar/weekoff" },
    ],
  },
  {
    name: "Payroll", icon: DollarSign,
    children: [
      { name: "Payroll List", href: "/payroll" },
      { name: "Process Payroll", href: "/payroll/process" },
      { name: "₹ Indian Payroll Sheet", href: "/payroll/sheet" },
      { name: "Payroll Masters", href: "/payroll/masters" },
    ],
  },
  { name: "Employee Portal", href: "/portal", icon: UserCircle },
  { name: "Performance", href: "/performance", icon: TrendingUp },
  { name: "Recruitment", href: "/recruitment", icon: Briefcase },
  { name: "Expense Claims", href: "/expenses", icon: Receipt },
  { name: "Shift Management", href: "/shifts", icon: Clock },
  {
    name: "Reports", icon: FileText,
    children: [
      { name: "Analytics Dashboard", href: "/reports" },
      { name: "₹ Branch Payroll Summary", href: "/reports/payroll-summary" },
    ],
  },
  { name: "Company Settings", href: "/settings", icon: Settings },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block px-3 py-2 text-sm rounded-md transition-colors",
    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

const rootLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

function Sidebar() {
  return (
    <nav className="py-4 px-2 space-y-1">
      {navigation.map((item) =>
        item.children ? (
          <div key={item.name} className="space-y-0.5">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <item.icon className="h-3.5 w-3.5" />
              {item.name}
            </div>
            <div className="pl-4 space-y-0.5">
              {item.children.map((child) => (
                <NavLink key={child.href} to={child.href} className={linkClass} end>
                  {child.name}
                </NavLink>
              ))}
            </div>
          </div>
        ) : (
          <NavLink key={item.name} to={item.href!} className={rootLinkClass} end={item.href === "/"}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.name}
          </NavLink>
        )
      )}
    </nav>
  );
}

export default memo(Sidebar);
