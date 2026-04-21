import { useState, useMemo, useCallback } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from "recharts";
import {
  getEmployees, getAttendance, getLeaveApplications, getPayroll,
  getDepartments, getBranches,
} from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

// ─── Filter Bar ───────────────────────────────────────────────────────────────
interface Filters {
  dateFrom: string;
  dateTo: string;
  branch: string;
  department: string;
}

function FilterBar({
  filters, onChange, branches, departments,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  branches: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const upd = (key: keyof Filters, v: string) => onChange({ ...filters, [key]: v });
  const clear = () => onChange({ dateFrom: "", dateTo: "", branch: "all", department: "all" });
  const isActive = filters.dateFrom || filters.dateTo || filters.branch !== "all" || filters.department !== "all";

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
            <Filter className="h-4 w-4" />Filters
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" className="h-8 w-36 text-sm" value={filters.dateFrom} onChange={(e) => upd("dateFrom", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" className="h-8 w-36 text-sm" value={filters.dateTo} onChange={(e) => upd("dateTo", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Branch</Label>
            <Select value={filters.branch} onValueChange={(v) => upd("branch", v)}>
              <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Department</Label>
            <Select value={filters.department} onValueChange={(v) => upd("department", v)}>
              <SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isActive && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clear}>Clear Filters</Button>
          )}
          {isActive && (
            <Badge variant="secondary" className="text-xs h-8 px-2 flex items-center">Filtered</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [filters, setFilters] = useState<Filters>({ dateFrom: "", dateTo: "", branch: "all", department: "all" });

  const allEmployees = getEmployees();
  const allAttendance = getAttendance();
  const allLeaves = getLeaveApplications();
  const allPayroll = getPayroll();
  const departments = getDepartments();
  const branches = getBranches();

  // ── Apply filters ──────────────────────────────────────────────────────────
  const employees = useMemo(() => {
    return allEmployees.filter((e) => {
      if (filters.branch !== "all" && e.branch !== filters.branch) return false;
      if (filters.department !== "all" && e.department !== filters.department) return false;
      return true;
    });
  }, [allEmployees, filters]);

  const empIds = useMemo(() => new Set(employees.map((e) => e.id)), [employees]);

  const attendance = useMemo(() => {
    return allAttendance.filter((a) => {
      if (!empIds.has(a.employeeId)) return false;
      if (filters.branch !== "all" && a.branch !== filters.branch) return false;
      if (filters.dateFrom && a.date < filters.dateFrom) return false;
      if (filters.dateTo && a.date > filters.dateTo) return false;
      return true;
    });
  }, [allAttendance, empIds, filters]);

  const leaveApplications = useMemo(() => {
    return allLeaves.filter((l) => {
      if (!empIds.has(l.employeeId)) return false;
      if (filters.dateFrom && l.startDate < filters.dateFrom) return false;
      if (filters.dateTo && l.endDate > filters.dateTo) return false;
      return true;
    });
  }, [allLeaves, empIds, filters]);

  const payroll = useMemo(() => {
    return allPayroll.filter((p) => {
      if (!empIds.has(p.employeeId)) return false;
      if (filters.dateFrom && p.month + "-01" < filters.dateFrom) return false;
      if (filters.dateTo && p.month + "-28" > filters.dateTo) return false;
      return true;
    });
  }, [allPayroll, empIds, filters]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const attStats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "Present").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const onLeave = attendance.filter((a) => a.status === "On Leave").length;
    const halfDay = attendance.filter((a) => a.status === "Half Day").length;
    const withHours = attendance.filter((a) => a.workHours);
    const avgHours = withHours.reduce((s, a) => s + (a.workHours || 0), 0) / (withHours.length || 1);
    return { present, absent, onLeave, halfDay, avgHours, rate: employees.length ? (present / (employees.length || 1)) * 100 : 0 };
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
    byDept: departments.map((d) => ({ name: d.name.split(" ")[0], fullName: d.name, count: employees.filter((e) => e.department === d.name).length })),
    byBranch: branches.map((b) => ({ name: b.name.split(" ")[0], count: employees.filter((e) => e.branch === b.name).length })),
  }), [employees, departments, branches]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const leaveByType = useMemo(() => {
    const map: Record<string, number> = {};
    leaveApplications.forEach((l) => { map[l.leaveType] = (map[l.leaveType] || 0) + l.days; });
    return Object.entries(map).map(([name, days]) => ({ name, days }));
  }, [leaveApplications]);

  const salaryByDept = useMemo(() => departments.map((d) => {
    const ids = employees.filter((e) => e.department === d.name).map((e) => e.id);
    return { name: d.name.split(" ")[0], fullName: d.name, total: payroll.filter((p) => ids.includes(p.employeeId)).reduce((s, p) => s + p.netSalary, 0) };
  }).filter((d) => d.total > 0), [departments, employees, payroll]);

  // Monthly attendance by date grouping from real data
  const monthlyAttendance = useMemo(() => {
    const monthMap: Record<string, { present: number; total: number }> = {};
    attendance.forEach((a) => {
      const month = a.date.slice(0, 7);
      if (!monthMap[month]) monthMap[month] = { present: 0, total: 0 };
      monthMap[month].total++;
      if (a.status === "Present") monthMap[month].present++;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, { present, total }]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      }));
  }, [attendance]);

  // Dept-wise attendance
  const deptAttendance = useMemo(() => departments.map((d) => {
    const ids = employees.filter((e) => e.department === d.name).map((e) => e.id);
    const present = attendance.filter((a) => ids.includes(a.employeeId) && a.status === "Present").length;
    return { name: d.name.split(" ")[0], fullName: d.name, present, total: ids.length };
  }), [departments, employees, attendance]);

  // Leave by employee
  const leaveByEmployee = useMemo(() => employees.map((emp) => {
    const apps = leaveApplications.filter((l) => l.employeeId === emp.id && l.status === "Approved");
    const total = apps.reduce((s, l) => s + l.days, 0);
    return { name: `${emp.firstName} ${emp.lastName}`, department: emp.department, total };
  }).filter((r) => r.total > 0).sort((a, b) => b.total - a.total), [employees, leaveApplications]);

  const handleExport = useCallback((data: unknown[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0] as object);
    exportCsv([keys, ...(data as Record<string, unknown>[]).map((r) => keys.map((k) => r[k] as string | number))], filename);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Reports & Analytics" description="Drill into attendance, leave, and payroll by period, branch, and department" />

      {/* Global Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} branches={branches} departments={departments} />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Employees (filtered)" value={employees.length} sub={`${empStats.active} active · ${empStats.onLeave} on leave`} />
        <StatCard title="Attendance Rate" value={`${attStats.rate.toFixed(1)}%`} sub={`Avg ${attStats.avgHours.toFixed(1)}h/day`} />
        <StatCard title="Pending Leaves" value={leaveStats.pending} sub={`${leaveStats.totalDays} days approved`} />
        <StatCard title="Total Payroll" value={`₹${payrollStats.totalNet.toLocaleString("en-IN")}`} sub={`Avg ₹${Math.round(payrollStats.avgSalary).toLocaleString("en-IN")}`} />
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="headcount">Headcount</TabsTrigger>
        </TabsList>

        {/* ── ATTENDANCE ── */}
        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Present", attStats.present, "text-green-600"],
              ["Absent", attStats.absent, "text-red-600"],
              ["On Leave", attStats.onLeave, "text-blue-600"],
              ["Half Day", attStats.halfDay, "text-yellow-600"],
            ].map(([l, v, c]) => (
              <Card key={l as string}><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend from real data */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Monthly Attendance Trend</CardTitle>
                  <CardDescription className="text-xs">Rate computed from actual attendance records</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(monthlyAttendance, "attendance-trend")}>
                  <Download className="h-3 w-3" />Export
                </Button>
              </CardHeader>
              <CardContent>
                {monthlyAttendance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={monthlyAttendance}>
                      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Rate"]} />
                      <Area type="monotone" dataKey="rate" stroke="#14b8a6" fill="url(#g1)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No attendance data for selected filters</div>
                )}
              </CardContent>
            </Card>

            {/* Dept-wise attendance */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Department-wise Attendance</CardTitle>
                  <CardDescription className="text-xs">Present count per department</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(deptAttendance, "dept-attendance")}>
                  <Download className="h-3 w-3" />Export
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={deptAttendance}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(l) => deptAttendance.find((d) => d.name === l)?.fullName || l} />
                    <Bar dataKey="present" name="Present" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Attendance Records</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(attendance, "attendance-records")}>
                <Download className="h-3 w-3" />Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead><TableHead>Date</TableHead>
                      <TableHead className="hidden sm:table-cell">In</TableHead>
                      <TableHead className="hidden sm:table-cell">Out</TableHead>
                      <TableHead className="hidden md:table-cell">Hours</TableHead>
                      <TableHead className="hidden lg:table-cell">Branch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 50).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm font-medium">{a.employeeName}</TableCell>
                        <TableCell className="text-sm">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{a.checkIn || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{a.checkOut || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{a.workHours ? `${a.workHours.toFixed(1)}h` : "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{a.branch}</TableCell>
                        <TableCell><StatusBadge status={a.status} /></TableCell>
                      </TableRow>
                    ))}
                    {attendance.length === 0 && <EmptyState colSpan={7} message="No attendance records for selected filters" />}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEAVE ── */}
        <TabsContent value="leave" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Pending Approval", leaveStats.pending, "text-orange-600"],
              ["Approved", leaveStats.approved, "text-green-600"],
              ["Rejected", leaveStats.rejected, "text-red-600"],
              ["Days Taken", leaveStats.totalDays, "text-blue-600"],
            ].map(([l, v, c]) => (
              <Card key={l as string}><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Days by Leave Type</CardTitle>
                <CardDescription className="text-xs">Total approved days per type</CardDescription>
              </CardHeader>
              <CardContent>
                {leaveByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={leaveByType} dataKey="days" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {leaveByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v} days`, "Days"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No leave data for selected filters</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">Leave by Employee</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(leaveByEmployee, "leave-by-employee")}>
                  <Download className="h-3 w-3" />Export
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-52 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="hidden sm:table-cell">Department</TableHead>
                        <TableHead>Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveByEmployee.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{r.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{r.department}</TableCell>
                          <TableCell><Badge variant="outline">{r.total} days</Badge></TableCell>
                        </TableRow>
                      ))}
                      {leaveByEmployee.length === 0 && <EmptyState colSpan={3} message="No approved leave in selected period" />}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All leave applications */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Leave Applications</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(leaveApplications, "leave-applications")}>
                <Download className="h-3 w-3" />Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead><TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">From</TableHead>
                      <TableHead className="hidden sm:table-cell">To</TableHead>
                      <TableHead>Days</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveApplications.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium text-sm">{l.employeeName}</TableCell>
                        <TableCell className="text-sm">{l.leaveType}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{new Date(l.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{new Date(l.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                        <TableCell className="text-sm">{l.days}</TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                      </TableRow>
                    ))}
                    {leaveApplications.length === 0 && <EmptyState colSpan={6} message="No leave applications for selected filters" />}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PAYROLL ── */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard title="Total Net Payout" value={`₹${payrollStats.totalNet.toLocaleString("en-IN")}`} />
            <StatCard title="Total Tax Deducted" value={`₹${payrollStats.totalTax.toLocaleString("en-IN")}`} />
            <StatCard title="Avg Net Salary" value={`₹${Math.round(payrollStats.avgSalary).toLocaleString("en-IN")}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Salary by Department</CardTitle>
                <CardDescription className="text-xs">Total net payout per department</CardDescription>
              </CardHeader>
              <CardContent>
                {salaryByDept.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={salaryByDept} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                      <Tooltip
                        formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Net Salary"]}
                        labelFormatter={(l) => salaryByDept.find((d) => d.name === l)?.fullName || l}
                      />
                      <Bar dataKey="total" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No payroll data for selected filters</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">Payroll Register</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(payroll, "payroll-register")}>
                  <Download className="h-3 w-3" />Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-52 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="hidden sm:table-cell">Month</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-sm">{p.employeeName}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{new Date(p.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}</TableCell>
                          <TableCell className="text-sm font-semibold">₹{p.netSalary.toLocaleString("en-IN")}</TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                        </TableRow>
                      ))}
                      {payroll.length === 0 && <EmptyState colSpan={4} message="No payroll data for selected filters" />}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── HEADCOUNT ── */}
        <TabsContent value="headcount" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Headcount by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={empStats.byDept}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(l) => empStats.byDept.find((d) => d.name === l)?.fullName || l} />
                    <Bar dataKey="count" name="Employees" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Headcount by Branch</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={empStats.byBranch}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employees" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Employee list */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Employee Directory ({employees.length})</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExport(employees.map((e) => ({ id: e.employeeId, name: `${e.firstName} ${e.lastName}`, dept: e.department, branch: e.branch, status: e.status })), "employees")}>
                <Download className="h-3 w-3" />Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead><TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead className="hidden md:table-cell">Branch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.employeeId}</TableCell>
                        <TableCell className="font-medium text-sm">{e.firstName} {e.lastName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{e.department}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{e.branch}</TableCell>
                        <TableCell><StatusBadge status={e.status} /></TableCell>
                      </TableRow>
                    ))}
                    {employees.length === 0 && <EmptyState colSpan={5} message="No employees for selected filters" />}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
