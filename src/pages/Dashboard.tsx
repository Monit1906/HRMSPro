import { useMemo } from "react";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Receipt, ClipboardList, Gift, ChevronRight, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { getEmployees, getLeaveApplications, getAttendance, getPayroll, getHolidays, getExpenseClaims, getDepartments } from "@/lib/mockData";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line, Legend,
} from "recharts";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const employees = getEmployees();
  const leaveApplications = getLeaveApplications();
  const attendance = getAttendance();
  const payroll = getPayroll();
  const holidays = getHolidays();
  const expenseClaims = getExpenseClaims();
  const departments = getDepartments();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const activeEmployees = employees.filter((e) => e.status === "Active").length;
  const todayPresent = attendance.filter((a) => a.status === "Present").length;
  const todayAbsent = attendance.filter((a) => a.status === "Absent").length;
  const pendingLeaves = leaveApplications.filter((l) => l.status === "Pending").length;
  const pendingExpenses = expenseClaims.filter((c) => c.status === "Pending").length;
  const totalPayroll = payroll.reduce((s, p) => s + p.netSalary, 0);
  const attendanceRate = employees.length > 0 ? Math.round((todayPresent / Math.max(employees.length, 1)) * 100) : 0;

  const upcomingHolidays = holidays
    .filter((h) => h.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const birthdayEmployees = employees.filter((e) => {
    if (!e.dateOfBirth) return false;
    const dob = new Date(e.dateOfBirth);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    return thisYear >= today && thisYear <= weekEnd;
  });

  const recentActivity = [
    ...leaveApplications.slice(-3).map((l) => ({ type: "leave" as const, name: l.employeeName, detail: `${l.leaveType} — ${l.days} day(s)`, status: l.status, date: l.appliedOn })),
    ...expenseClaims.slice(-2).map((c) => ({ type: "expense" as const, name: c.employeeName, detail: `${c.category} — $${c.amount.toLocaleString()}`, status: c.status, date: c.submittedOn })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  // Department headcount bar chart
  const deptHeadcount = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => { map[e.department] = (map[e.department] || 0) + 1; });
    return Object.entries(map).map(([dept, count]) => ({ dept: dept.split(" ")[0], count }));
  }, [employees]);

  // 6-month headcount trend (simulated growth)
  const headcountTrend = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
    }
    const base = Math.max(employees.length - 5, 1);
    return months.map((m, i) => ({
      month: m,
      headcount: base + i,
      active: Math.max(base + i - 1, 1),
    }));
  }, [employees, today]);

  // Department-wise salary heatmap data
  const deptSalary = useMemo(() => {
    return departments.map((dept) => {
      const deptEmps = employees.filter((e) => e.department === dept.name);
      const deptPayroll = payroll.filter((p) => deptEmps.some((e) => e.id === p.employeeId));
      const totalNet = deptPayroll.reduce((s, p) => s + p.netSalary, 0);
      const avgNet = deptPayroll.length > 0 ? Math.round(totalNet / deptPayroll.length) : 0;
      return {
        dept: dept.name.split(" ")[0],
        fullName: dept.name,
        totalNet,
        avgNet,
        headcount: deptEmps.length,
      };
    }).filter((d) => d.totalNet > 0 || d.headcount > 0);
  }, [departments, employees, payroll]);

  const attendanceTrend = [
    { day: "Mon", rate: 91 }, { day: "Tue", rate: 88 }, { day: "Wed", rate: 94 },
    { day: "Thu", rate: 90 }, { day: "Fri", rate: 87 }, { day: "Sat", rate: 45 }, { day: "Sun", rate: 10 },
  ];

  const quickActions = [
    { title: "Add Employee", desc: "Onboard new team member", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", action: () => navigate("/employees/add") },
    { title: "Process Payroll", desc: "Run monthly salary", icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-900/20", action: () => navigate("/payroll/process") },
    { title: "Leave Approvals", desc: `${pendingLeaves} pending`, icon: Calendar, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", action: () => navigate("/leave/applications") },
    { title: "Expense Claims", desc: `${pendingExpenses} pending`, icon: Receipt, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", action: () => navigate("/expenses") },
    { title: "Attendance", desc: "Check in / out", icon: ClipboardList, color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20", action: () => navigate("/attendance/checkin") },
    { title: "Reports", desc: "View analytics", icon: TrendingUp, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20", action: () => navigate("/reports") },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Live
        </Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Total Employees" value={employees.length} sub={`${activeEmployees} active · ${employees.filter((e) => e.status === "On Leave").length} on leave`} icon={<Users className="h-4 w-4" />} onClick={() => navigate("/employees")} />
        <div>
          <StatCard title="Present Today" value={todayPresent} sub={`${todayAbsent} absent · ${attendanceRate}% rate`} icon={<UserCheck className="h-4 w-4" />} onClick={() => navigate("/attendance")} />
          <Progress value={attendanceRate} className="h-1 mt-1 rounded-none" />
        </div>
        <StatCard title="Pending Approvals" value={pendingLeaves + pendingExpenses} sub={`${pendingLeaves} leaves · ${pendingExpenses} expenses`} icon={<DollarSign className="h-4 w-4" />} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" onClick={() => navigate("/leave/applications")} />
        <StatCard title="Payroll Processed" value={`$${(totalPayroll / 1000).toFixed(0)}k`} sub="Total net payout" icon={<DollarSign className="h-4 w-4" />} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" onClick={() => navigate("/payroll")} />
      </div>

      {/* Charts Row 1: Attendance trend + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">This Week's Attendance</CardTitle>
              <CardDescription className="text-xs">Daily attendance rate %</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate("/reports")}>Full Report<ChevronRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={attendanceTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs><linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} />
                <Area type="monotone" dataKey="rate" stroke="#14b8a6" fill="url(#attGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Headcount by Dept</CardTitle>
            <CardDescription className="text-xs">Active employees distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={deptHeadcount} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" />Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button key={action.title} onClick={action.action} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left">
                <div className={`p-1.5 rounded-md shrink-0 ${action.color}`}><action.icon className="h-3.5 w-3.5" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: 6-month headcount trend + dept salary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 6-month headcount trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">6-Month Headcount Trend</CardTitle>
            <CardDescription className="text-xs">Total vs Active employees</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={headcountTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="headcount" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="active" name="Active" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department salary heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dept-wise Salary Distribution</CardTitle>
            <CardDescription className="text-xs">Total net payout by department</CardDescription>
          </CardHeader>
          <CardContent>
            {deptSalary.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={deptSalary} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Total Net"]}
                    labelFormatter={(label) => deptSalary.find((d) => d.dept === label)?.fullName || label}
                  />
                  <Bar dataKey="totalNet" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No payroll data yet. <button className="text-primary underline" onClick={() => navigate("/payroll/process")}>Process payroll</button></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 ${item.type === "leave" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" : "bg-purple-100 text-purple-600 dark:bg-purple-900/30"}`}>
                        {item.type === "leave" ? <Calendar className="h-3.5 w-3.5" /> : <Receipt className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} className="shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-3 sm:space-y-4">
          {/* Upcoming Holidays */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingHolidays.length > 0 ? upcomingHolidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" · "}{Math.ceil((new Date(h.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 ml-1">{h.type}</Badge>
                </div>
              )) : <p className="text-xs text-muted-foreground">No upcoming holidays</p>}
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => navigate("/calendar/holidays")}>View All</Button>
            </CardContent>
          </Card>

          {/* Birthdays */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Gift className="h-4 w-4 text-pink-500" />Birthdays This Week</CardTitle>
            </CardHeader>
            <CardContent>
              {birthdayEmployees.length > 0 ? (
                <div className="space-y-2">
                  {birthdayEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xs font-semibold text-pink-600 dark:text-pink-400 shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(today.getFullYear(), new Date(emp.dateOfBirth).getMonth(), new Date(emp.dateOfBirth).getDate())
                            .toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No birthdays this week</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
