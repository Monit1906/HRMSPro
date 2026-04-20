import { useState, useMemo, useCallback } from "react";
import { Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { getEmployees, getAttendance, getLeaveApplications, getPayroll, getDepartments, getBranches } from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";

const COLORS = ["#14b8a6","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#10b981"];

export default function Reports() {
  const employees = getEmployees();
  const attendance = getAttendance();
  const leaveApplications = getLeaveApplications();
  const payroll = getPayroll();
  const departments = getDepartments();
  const branches = getBranches();

  const attStats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "Present").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const onLeave = attendance.filter((a) => a.status === "On Leave").length;
    const halfDay = attendance.filter((a) => a.status === "Half Day").length;
    const withHours = attendance.filter((a) => a.workHours);
    const avgHours = withHours.reduce((s, a) => s + (a.workHours || 0), 0) / (withHours.length || 1);
    return { present, absent, onLeave, halfDay, avgHours, rate: employees.length ? (present / employees.length) * 100 : 0 };
  }, [attendance, employees]);

  const leaveStats = useMemo(() => ({
    pending: leaveApplications.filter((l) => l.status === "Pending").length,
    approved: leaveApplications.filter((l) => l.status === "Approved").length,
    rejected: leaveApplications.filter((l) => l.status === "Rejected").length,
    totalDays: leaveApplications.filter((l) => l.status === "Approved").reduce((s, l) => s + l.days, 0),
  }), [leaveApplications]);

  const payrollStats = useMemo(() => ({
    totalNet: payroll.reduce((s, p) => s + p.netSalary, 0),
    totalTax: payroll.reduce((s, p) => s + p.tax, 0),
    avgSalary: payroll.length ? payroll.reduce((s, p) => s + p.netSalary, 0) / payroll.length : 0,
  }), [payroll]);

  const empStats = useMemo(() => ({
    active: employees.filter((e) => e.status === "Active").length,
    onLeave: employees.filter((e) => e.status === "On Leave").length,
    byDept: departments.map((d) => ({ name: d.name, count: employees.filter((e) => e.department === d.name).length })),
  }), [employees, departments]);

  const leaveByType = useMemo(() => {
    const map: Record<string, number> = {};
    leaveApplications.forEach((l) => { map[l.leaveType] = (map[l.leaveType] || 0) + l.days; });
    return Object.entries(map).map(([name, days]) => ({ name, days }));
  }, [leaveApplications]);

  const salaryByDept = useMemo(() => departments.map((d) => {
    const ids = employees.filter((e) => e.department === d.name).map((e) => e.id);
    return { name: d.name.split(" ")[0], total: payroll.filter((p) => ids.includes(p.employeeId)).reduce((s, p) => s + p.netSalary, 0) };
  }).filter((d) => d.total > 0), [departments, employees, payroll]);

  const monthlyTrend = [
    { month: "Oct", rate: 91 }, { month: "Nov", rate: 88 }, { month: "Dec", rate: 85 },
    { month: "Jan", rate: 92 }, { month: "Feb", rate: 94 }, { month: "Mar", rate: 90 },
  ];

  const handleExport = useCallback((data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    exportCsv([keys, ...data.map((r) => keys.map((k) => r[k] as string | number))], filename);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Reports & Analytics" description="Comprehensive workforce intelligence" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Employees" value={employees.length} sub={`${empStats.active} active`} />
        <StatCard title="Attendance Rate" value={`${attStats.rate.toFixed(1)}%`} sub={`Avg ${attStats.avgHours.toFixed(1)}h/day`} />
        <StatCard title="Pending Leaves" value={leaveStats.pending} sub={`${leaveStats.totalDays} days approved`} />
        <StatCard title="Total Payroll" value={`$${payrollStats.totalNet.toLocaleString()}`} sub={`Avg $${payrollStats.avgSalary.toLocaleString()}`} />
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="headcount">Headcount</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["Present", attStats.present, "text-green-600"],["Absent", attStats.absent, "text-red-600"],["On Leave", attStats.onLeave, "text-blue-600"],["Half Day", attStats.halfDay, "text-yellow-600"]].map(([l, v, c]) => (
              <Card key={l as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className={`text-2xl font-bold ${c}`}>{v}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div><CardTitle className="text-sm">Monthly Attendance Trend</CardTitle></div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleExport(monthlyTrend, "attendance-trend")}><Download className="h-3 w-3 mr-1" />Export</Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={monthlyTrend}>
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Rate"]} />
                    <Area type="monotone" dataKey="rate" stroke="#14b8a6" fill="url(#g1)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Attendance Sheet</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {attendance.slice(0, 15).map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">{a.employeeName}</TableCell>
                          <TableCell className="text-sm">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                          <TableCell className="text-sm">{a.checkIn || "—"}</TableCell>
                          <TableCell className="text-sm">{a.checkOut || "—"}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                        </TableRow>
                      ))}
                      {attendance.length === 0 && <EmptyState colSpan={5} message="No records" />}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["Pending", leaveStats.pending, "text-orange-600"],["Approved", leaveStats.approved, "text-green-600"],["Rejected", leaveStats.rejected, "text-red-600"],["Days Taken", leaveStats.totalDays, "text-blue-600"]].map(([l, v, c]) => (
              <Card key={l as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className={`text-2xl font-bold ${c}`}>{v}</p></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Days by Leave Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={leaveByType} dataKey="days" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {leaveByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} days`, "Days"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Salary by Department</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salaryByDept}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headcount" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Headcount by Department</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={empStats.byDept}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
