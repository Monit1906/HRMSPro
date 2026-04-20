import { useState, useMemo, useCallback } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAttendance, getEmployees } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const STATUS_COLORS: Record<string, string> = {
  Present: "bg-green-100 text-green-700",
  Absent: "bg-red-100 text-red-700",
  "Half Day": "bg-yellow-100 text-yellow-700",
  "On Leave": "bg-blue-100 text-blue-700",
  Weekend: "bg-gray-100 text-gray-600",
  Holiday: "bg-purple-100 text-purple-700",
};

export default function AttendanceList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const attendance = getAttendance();
  const employees = getEmployees();

  const stats = useMemo(() => {
    const present = attendance.filter((r) => r.status === "Present").length;
    const absent = attendance.filter((r) => r.status === "Absent").length;
    const onLeave = attendance.filter((r) => r.status === "On Leave").length;
    const withHours = attendance.filter((r) => r.workHours);
    const avgHours = withHours.reduce((s, r) => s + (r.workHours || 0), 0) / (withHours.length || 1);
    return { present, absent, onLeave, avgHours };
  }, [attendance]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return attendance.filter((r) => {
      const matchSearch = r.employeeName.toLowerCase().includes(q) || r.branch.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchEmp = selectedEmployee === "all" || r.employeeId === selectedEmployee;
      return matchSearch && matchStatus && matchEmp;
    });
  }, [attendance, searchQuery, statusFilter, selectedEmployee]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [calMonth]);

  const getDayRecords = useCallback((day: number | null) => {
    if (!day) return [];
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance.filter((r) => r.date === dateStr && (selectedEmployee === "all" || r.employeeId === selectedEmployee));
  }, [attendance, calMonth, selectedEmployee]);

  const getDayColor = (records: typeof attendance) => {
    if (!records.length) return "";
    if (records.every((r) => r.status === "Present")) return "bg-green-100 text-green-800 border-green-200";
    if (records.some((r) => r.status === "Absent")) return "bg-red-100 text-red-800 border-red-200";
    if (records.some((r) => r.status === "On Leave")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (records.some((r) => r.status === "Half Day")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const handleExport = useCallback(() => {
    exportCsv(
      [["Employee","Date","Check In","Check Out","Work Hours","Branch","Status"],
       ...filteredRecords.map((r) => [r.employeeName, r.date, r.checkIn || "", r.checkOut || "", r.workHours?.toFixed(1) || "", r.branch, r.status])],
      "attendance"
    );
  }, [filteredRecords]);

  const prevMonth = useCallback(() => setCalMonth((p) => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }), []);
  const nextMonth = useCallback(() => setCalMonth((p) => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Attendance Records" description="Track employee attendance and work hours">
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Present" value={stats.present} />
        <StatCard title="Absent" value={stats.absent} />
        <StatCard title="On Leave" value={stats.onLeave} />
        <StatCard title="Avg Hours" value={`${stats.avgHours.toFixed(1)}h`} />
      </div>

      <Tabs defaultValue="records">
        <TabsList><TabsTrigger value="records">Records Table</TabsTrigger><TabsTrigger value="calendar">Monthly Calendar</TabsTrigger></TabsList>

        <TabsContent value="records" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["Present","Absent","Half Day","On Leave","Weekend","Holiday"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead><TableHead>Work Hours</TableHead><TableHead>Branch</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employeeName}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</TableCell>
                    <TableCell>{r.checkIn || "—"}</TableCell>
                    <TableCell>{r.checkOut || "—"}</TableCell>
                    <TableCell className={r.workHours ? (r.workHours >= 8 ? "text-green-700" : "text-orange-600") : ""}>{r.workHours ? `${r.workHours.toFixed(1)}h` : "—"}</TableCell>
                    <TableCell>{r.branch}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 && <EmptyState colSpan={7} message="No records found" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <p className="font-semibold min-w-[160px] text-center">{MONTH_NAMES[calMonth.month]} {calMonth.year}</p>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-wrap text-xs">
            {[{l:"Present",c:"bg-green-100 text-green-800"},{l:"Absent",c:"bg-red-100 text-red-800"},{l:"On Leave",c:"bg-blue-100 text-blue-800"},{l:"Half Day",c:"bg-yellow-100 text-yellow-800"}].map((x) => (
              <span key={x.l} className={`px-2 py-0.5 rounded-full ${x.c}`}>{x.l}</span>
            ))}
          </div>
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const records = getDayRecords(day);
                  const colorCls = getDayColor(records);
                  const isToday = day === new Date().getDate() && calMonth.month === new Date().getMonth() && calMonth.year === new Date().getFullYear();
                  return (
                    <div key={idx} className={`min-h-[60px] rounded border text-xs p-1 ${colorCls || "border-transparent"} ${isToday ? "ring-2 ring-primary" : ""}`}>
                      {day && (
                        <>
                          <span className={`font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                          <div className="mt-0.5 space-y-0.5">
                            {records.slice(0, 2).map((r) => (
                              <p key={r.id} className="truncate text-[10px]">{selectedEmployee === "all" ? r.employeeName.split(" ")[0] : r.status}</p>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
