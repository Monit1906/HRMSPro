import { useMemo } from "react";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Clock, Receipt, ClipboardList, Gift, ChevronRight, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { getEmployees, getLeaveApplications, getAttendance, getPayroll, getHolidays, getExpenseClaims } from "@/lib/mockData";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
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

  const deptHeadcount = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => { map[e.department] = (map[e.department] || 0) + 1; });
    return Object.entries(map).map(([dept, count]) => ({ dept: dept.split(" ")[0], count }));
  }, [employees]);

  const attendanceTrend = [
    { day: "Mon", rate: 91 }, { day: "Tue", rate: 88 }, { day: "Wed", rate: 94 },
    { day: "Thu", rate: 90 }, { day: "Fri", rate: 87 }, { day: "Sat", rate: 45 }, { day: "Sun", rate: 10 },
  ];

  const quickActions = [
    { title: "Add Employee", desc: "Onboard new team member", icon: Users, color: "text-blue-600 bg-blue-50", action: () => navigate("/employees/add") },
    { title: "Process Payroll", desc: "Run monthly salary", icon: DollarSign, color: "text-green-600 bg-green-50", action: () => navigate("/payroll/process") },
    { title: "Leave Approvals", desc: `${pendingLeaves} pending`, icon: Calendar, color: "text-orange-600 bg-orange-50", action: () => navigate("/leave/applications") },
    { title: "Expense Claims", desc: `${pendingExpenses} pending`, icon: Receipt, color: "text-purple-600 bg-purple-50", action: () => navigate("/expenses") },
    { title: "Attendance", desc: "Check in / out", icon: ClipboardList, color: "text-teal-600 bg-teal-50", action: () => navigate("/attendance/checkin") },
    { title: "Reports", desc: "View analytics", icon: TrendingUp, color: "text-rose-600 bg-rose-50", action: () => navigate("/reports") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Live</Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Employees" value={employees.length} sub={`${activeEmployees} active · ${employees.filter((e) => e.status === "On Leave").length} on leave`} icon={<Users className="h-4 w-4" />} onClick={() => navigate("/employees")} />
        <div>
          <StatCard title="Present Today" value={todayPresent} sub={`${todayAbsent} absent · ${attendanceRate}% rate`} icon={<UserCheck className="h-4 w-4" />} onClick={() => navigate("/attendance")} />
          <Progress value={attendanceRate} className="h-1 mt-1 rounded-none" />
        </div>
        <StatCard title="Pending Approvals" value={pendingLeaves + pendingExpenses} sub={`${pendingLeaves} leaves · ${pendingExpenses} expenses`} icon={<Clock className="h-4 w-4" />} iconClass="bg-orange-50 text-orange-600" onClick={() => navigate("/leave/applications")} />
        <StatCard title="Payroll Processed" value={`$${(totalPayroll / 1000).toFixed(0)}k`} sub="Total net payout" icon={<DollarSign className="h-4 w-4" />} iconClass="bg-green-50 text-green-600" onClick={() => navigate("/payroll")} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">This Week's Attendance</CardTitle>
              <CardDescription className="text-xs">Daily attendance rate %</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate("/reports")}>Full Report<ChevronRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
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

        {/* Dept Headcount */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Headcount by Dept</CardTitle>
            <CardDescription className="text-xs">Active employees distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={deptHeadcount} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${item.type === "leave" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                        {item.type === "leave" ? <Calendar className="h-3.5 w-3.5" /> : <Receipt className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Holidays */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingHolidays.length > 0 ? upcomingHolidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" · "}{Math.ceil((new Date(h.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days away
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{h.type}</Badge>
                </div>
              )) : <p className="text-xs text-muted-foreground">No upcoming holidays</p>}
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => navigate("/calendar/holidays")}>View All Holidays</Button>
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
                      <div className="h-7 w-7 rounded-full bg-pink-100 flex items-center justify-center text-xs font-semibold text-pink-600">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
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
