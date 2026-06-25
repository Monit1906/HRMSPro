import { useMemo } from "react";
import {
  Users, UserCheck, Calendar, DollarSign, TrendingUp, Receipt,
  ClipboardList, Gift, ChevronRight, Zap, Clock, CheckCircle, XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  getEmployees, getLeaveApplications, getAttendance, getPayroll,
  getHolidays, getExpenseClaims, getDepartments,
} from "@/lib/mockData";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, BarChart, Bar, LineChart, Line, Legend,
} from "recharts";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useRole } from "@/contexts/RoleContext";
import { formatDate } from "@/lib/utils";

// ─── Employee Personal Dashboard ─────────────────────────────────────────────
function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useRole();
  const today = new Date().toISOString().split("T")[0];

  const employees       = getEmployees();
  const myEmployee      = employees.find((e) => e.id === user.id);
  const attendance      = getAttendance();
  const leaves          = getLeaveApplications();
  const payroll         = getPayroll();
  const holidays        = getHolidays();

  const myAttendance   = useMemo(() => attendance.filter((a) => a.employeeId === user.id).sort((a, b) => b.date.localeCompare(a.date)), [attendance, user.id]);
  const myLeaves       = useMemo(() => leaves.filter((l) => l.employeeId === user.id), [leaves, user.id]);
  const myPayroll      = useMemo(() => payroll.filter((p) => p.employeeId === user.id).sort((a, b) => b.month.localeCompare(a.month)), [payroll, user.id]);
  const todayRecord    = myAttendance.find((a) => a.date === today);
  const latestPayslip  = myPayroll[0];
  const pendingLeaves  = myLeaves.filter((l) => l.status === "Pending").length;
  const approvedDays   = myLeaves.filter((l) => l.status === "Approved").reduce((s, l) => s + l.days, 0);

  const monthPresent = useMemo(() => {
    const monthStr = today.slice(0, 7);
    return myAttendance.filter((a) => a.date.startsWith(monthStr) && a.status === "Present").length;
  }, [myAttendance, today]);

  const upcomingHolidays = useMemo(() =>
    holidays.filter((h) => h.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
    [holidays, today]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : "Evening";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Good {greeting}, {myEmployee?.firstName || user.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/attendance/checkin")} className="gap-1.5">
            <Clock className="h-4 w-4" />Check In / Out
          </Button>
          <Button size="sm" onClick={() => navigate("/portal")} className="gap-1.5">
            <Calendar className="h-4 w-4" />Apply Leave
          </Button>
        </div>
      </div>

      {/* Personal KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Present This Month" value={monthPresent} sub="days this month" icon={<UserCheck className="h-4 w-4" />} />
        <div>
          <StatCard
            title="Today's Status"
            value={todayRecord ? todayRecord.status : "Not marked"}
            sub={todayRecord?.checkIn ? `In: ${todayRecord.checkIn}${todayRecord.checkOut ? ` · Out: ${todayRecord.checkOut}` : ""}` : "No check-in yet"}
          />
        </div>
        <StatCard
          title="Leave Balance"
          value={`${approvedDays} days taken`}
          sub={`${pendingLeaves} pending request(s)`}
          icon={<Calendar className="h-4 w-4" />}
          onClick={() => navigate("/portal")}
        />
        <StatCard
          title="Latest Payslip"
          value={latestPayslip ? `₹${latestPayslip.netSalary.toLocaleString("en-IN")}` : "—"}
          sub={latestPayslip ? new Date(latestPayslip.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "No payslip yet"}
          icon={<DollarSign className="h-4 w-4" />}
          onClick={() => navigate("/portal")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's attendance card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" />Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {todayRecord ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {todayRecord.status === "Present"
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : <XCircle className="h-5 w-5 text-red-500" />}
                  <StatusBadge status={todayRecord.status} />
                </div>
                {todayRecord.checkIn && (
                  <div className="grid grid-cols-2 gap-2 bg-muted rounded p-2 text-xs">
                    <div><p className="text-muted-foreground">Check In</p><p className="font-semibold">{todayRecord.checkIn}</p></div>
                    {todayRecord.checkOut && <div><p className="text-muted-foreground">Check Out</p><p className="font-semibold">{todayRecord.checkOut}</p></div>}
                    {todayRecord.workHours && (
                      <div className="col-span-2">
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="text-muted-foreground">Progress (8h)</span>
                          <span className="font-medium">{todayRecord.workHours.toFixed(1)}h</span>
                        </div>
                        <Progress value={Math.min(100, (todayRecord.workHours / 8) * 100)} className="h-1.5" />
                      </div>
                    )}
                  </div>
                )}
                {!todayRecord.checkOut && (
                  <Button size="sm" className="w-full" onClick={() => navigate("/attendance/checkin")}>Check Out Now</Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-sm text-muted-foreground">You haven't checked in today</p>
                <Button size="sm" className="gap-2" onClick={() => navigate("/attendance/checkin")}>
                  <Clock className="h-4 w-4" />Go to Check-In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent attendance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">My Recent Attendance</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => navigate("/portal")}>View All <ChevronRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            {myAttendance.length > 0 ? (
              <div className="space-y-2">
                {myAttendance.slice(0, 6).map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{new Date(rec.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
                      {rec.checkIn && <p className="text-xs text-muted-foreground">{rec.checkIn} → {rec.checkOut || "—"}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.workHours && <span className="text-xs text-muted-foreground">{rec.workHours.toFixed(1)}h</span>}
                      <StatusBadge status={rec.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No attendance records yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Leaves */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">My Leave Applications</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => navigate("/portal")}>
              Apply Leave <ChevronRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {myLeaves.length > 0 ? (
              <div className="space-y-2">
                {myLeaves.slice(0, 4).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{l.leaveType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(l.startDate)} · {l.days} day(s)</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No leave applications yet</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming holidays + Payslips */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingHolidays.length > 0 ? upcomingHolidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{h.type}</Badge>
                </div>
              )) : <p className="text-xs text-muted-foreground">No upcoming holidays</p>}
            </CardContent>
          </Card>

          {latestPayslip && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Latest Payslip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{new Date(latestPayslip.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Salary</span>
                  <span className="font-bold text-primary">₹{latestPayslip.netSalary.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={latestPayslip.status} />
                </div>
                <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => navigate("/portal")}>View All Payslips</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin / HR Company Dashboard ────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const employees      = getEmployees();
  const leaveApps      = getLeaveApplications();
  const attendance     = getAttendance();
  const payroll        = getPayroll();
  const holidays       = getHolidays();
  const expenseClaims  = getExpenseClaims();
  const departments    = getDepartments();

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const activeEmployees  = employees.filter((e) => e.status === "Active").length;
  const todayPresent     = attendance.filter((a) => a.date === todayStr && a.status === "Present").length;
  const todayAbsent      = attendance.filter((a) => a.date === todayStr && a.status === "Absent").length;
  const pendingLeaves    = leaveApps.filter((l) => l.status === "Pending").length;
  const pendingExpenses  = expenseClaims.filter((c) => c.status === "Pending").length;
  const totalPayroll     = payroll.reduce((s, p) => s + p.netSalary, 0);
  const attendanceRate   = employees.length > 0 ? Math.round((todayPresent / Math.max(employees.length, 1)) * 100) : 0;

  const upcomingHolidays = holidays.filter((h) => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const birthdayEmployees = employees.filter((e) => {
    if (!e.dateOfBirth) return false;
    const dob = new Date(e.dateOfBirth);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    return thisYear >= today && thisYear <= weekEnd;
  });

  const recentActivity = [
    ...leaveApps.slice(-3).map((l) => ({ type: "leave" as const, name: l.employeeName, detail: `${l.leaveType} — ${l.days} day(s)`, status: l.status, date: l.appliedOn })),
    ...expenseClaims.slice(-2).map((c) => ({ type: "expense" as const, name: c.employeeName, detail: `${c.category} — ₹${c.amount.toLocaleString("en-IN")}`, status: c.status, date: c.submittedOn })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const deptHeadcount = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => { map[e.department] = (map[e.department] || 0) + 1; });
    return Object.entries(map).map(([dept, count]) => ({ dept: dept.split(" ")[0], count }));
  }, [employees]);

  const headcountTrend = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
    }
    const base = Math.max(employees.length - 5, 1);
    return months.map((m, i) => ({ month: m, headcount: base + i, active: Math.max(base + i - 1, 1) }));
  }, [employees, today]);

  const deptSalary = useMemo(() => departments.map((dept) => {
    const deptEmps   = employees.filter((e) => e.department === dept.name);
    const deptPayroll = payroll.filter((p) => deptEmps.some((e) => e.id === p.employeeId));
    const totalNet   = deptPayroll.reduce((s, p) => s + p.netSalary, 0);
    return { dept: dept.name.split(" ")[0], fullName: dept.name, totalNet, headcount: deptEmps.length };
  }).filter((d) => d.totalNet > 0 || d.headcount > 0), [departments, employees, payroll]);

  const quickActions = [
    { title: "Add Employee",    desc: "Onboard new member",       icon: Users,       color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",     action: () => navigate("/employees/add") },
    { title: "Process Payroll", desc: "Run monthly salary",       icon: DollarSign,  color: "text-green-600 bg-green-50 dark:bg-green-900/20",  action: () => navigate("/payroll/process") },
    { title: "Leave Approvals", desc: `${pendingLeaves} pending`, icon: Calendar,    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", action: () => navigate("/leave/applications") },
    { title: "Expense Claims",  desc: `${pendingExpenses} pending`,icon: Receipt,    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", action: () => navigate("/expenses") },
    { title: "Attendance",      desc: "Check in / out",           icon: ClipboardList,color:"text-teal-600 bg-teal-50 dark:bg-teal-900/20",      action: () => navigate("/attendance/checkin") },
    { title: "Reports",         desc: "View analytics",           icon: TrendingUp,  color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",     action: () => navigate("/reports") },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Live
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Total Employees" value={employees.length} sub={`${activeEmployees} active · ${employees.filter((e) => e.status === "On Leave").length} on leave`} icon={<Users className="h-4 w-4" />} onClick={() => navigate("/employees")} />
        <div>
          <StatCard title="Present Today" value={todayPresent} sub={`${todayAbsent} absent · ${attendanceRate}% rate`} icon={<UserCheck className="h-4 w-4" />} onClick={() => navigate("/attendance")} />
          <Progress value={attendanceRate} className="h-1 mt-1 rounded-none" />
        </div>
        <StatCard title="Pending Approvals" value={pendingLeaves + pendingExpenses} sub={`${pendingLeaves} leaves · ${pendingExpenses} expenses`} icon={<Calendar className="h-4 w-4" />} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" onClick={() => navigate("/leave/applications")} />
        <StatCard title="Total Payroll" value={`₹${(totalPayroll / 1000).toFixed(0)}k`} sub="Net payout processed" icon={<DollarSign className="h-4 w-4" />} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" onClick={() => navigate("/payroll")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div><CardTitle className="text-sm">Headcount by Dept</CardTitle><CardDescription className="text-xs">Active employees</CardDescription></div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate("/reports")}>Reports<ChevronRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            {deptHeadcount.length > 0 ? (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={deptHeadcount} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Add employees to see headcount</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">6-Month Headcount</CardTitle><CardDescription className="text-xs">Total vs Active</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={headcountTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="headcount" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="active" name="Active" stroke="#14b8a6" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" />Quick Actions</CardTitle></CardHeader>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dept-wise Salary</CardTitle><CardDescription className="text-xs">Net payout by department</CardDescription></CardHeader>
          <CardContent>
            {deptSalary.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={deptSalary} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Net"]} labelFormatter={(l) => deptSalary.find((d) => d.dept === l)?.fullName || l} />
                  <Bar dataKey="totalNet" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                <button className="text-primary underline" onClick={() => navigate("/payroll/process")}>Process payroll</button>&nbsp;to see data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Holidays</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingHolidays.length > 0 ? upcomingHolidays.map((h) => (
              <div key={h.id} className="flex justify-between items-center text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {Math.ceil((new Date(h.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0 ml-1">{h.type}</Badge>
              </div>
            )) : <p className="text-xs text-muted-foreground">No upcoming holidays configured</p>}
            <Button variant="ghost" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => navigate("/calendar/holidays")}>Manage Holidays</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Gift className="h-4 w-4 text-pink-500" />Birthdays This Week</CardTitle></CardHeader>
          <CardContent>
            {birthdayEmployees.length > 0 ? (
              <div className="space-y-2">
                {birthdayEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xs font-semibold text-pink-600 shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(today.getFullYear(), new Date(emp.dateOfBirth).getMonth(), new Date(emp.dateOfBirth).getDate()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">No birthdays this week</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useRole();
  if (user.role === "Employee") return <EmployeeDashboard />;
  return <AdminDashboard />;
}
