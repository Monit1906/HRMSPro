import { useState, useMemo, useCallback, useRef } from "react";
import { Search, Download, ChevronLeft, ChevronRight, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAttendance, setAttendance, getEmployees, type Attendance } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── CSV import types ─────────────────────────────────────────────────────────
interface ImportRow {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  valid: boolean;
  errors: string[];
  employeeName?: string;
}

function parseAttendanceCsv(text: string, employees: ReturnType<typeof getEmployees>): ImportRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  // Normalise header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);

  return lines.slice(1).map((line) => {
    const parts = line.split(",");
    const get = (idx: number) => (idx >= 0 ? (parts[idx] || "").trim() : "");

    const employeeId = get(col("employee_id")) || get(col("employeeid")) || get(col("emp_id"));
    const date       = get(col("date"));
    const checkIn    = get(col("check_in")) || get(col("checkin"));
    const checkOut   = get(col("check_out")) || get(col("checkout"));

    const errors: string[] = [];
    if (!employeeId) errors.push("Missing employee_id");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("Invalid date (use YYYY-MM-DD)");
    if (checkIn && !/^\d{2}:\d{2}$/.test(checkIn)) errors.push("Invalid check_in format (use HH:MM)");
    if (checkOut && !/^\d{2}:\d{2}$/.test(checkOut)) errors.push("Invalid check_out format (use HH:MM)");

    const emp = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
    if (employeeId && !emp) errors.push(`Employee ID not found: ${employeeId}`);

    return {
      employeeId,
      date,
      checkIn,
      checkOut,
      valid: errors.length === 0,
      errors,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
    };
  });
}

function rowToAttendance(row: ImportRow, employees: ReturnType<typeof getEmployees>): Attendance {
  const emp = employees.find((e) => e.employeeId === row.employeeId || e.id === row.employeeId)!;
  let workHours: number | undefined;
  if (row.checkIn && row.checkOut) {
    const [ih, im] = row.checkIn.split(":").map(Number);
    const [oh, om] = row.checkOut.split(":").map(Number);
    workHours = (oh * 60 + om - (ih * 60 + im)) / 60;
  }
  return {
    id: `import-${Date.now()}-${row.employeeId}-${row.date}`,
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    date: row.date,
    checkIn: row.checkIn || undefined,
    checkOut: row.checkOut || undefined,
    workHours,
    status: row.checkIn ? "Present" : "Absent",
    branch: emp.branch,
  };
}

// ─── Import Dialog ────────────────────────────────────────────────────────────
function ImportDialog({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (rows: ImportRow[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseAttendanceCsv(text, getEmployees());
      setPreview(rows);
      setStep("preview");
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const validRows = preview.filter((r) => r.valid);
  const invalidRows = preview.filter((r) => !r.valid);

  const handleCommit = useCallback(() => {
    onImport(validRows);
    setPreview([]);
    setStep("upload");
    onClose();
  }, [validRows, onImport, onClose]);

  const handleClose = useCallback(() => {
    setPreview([]);
    setStep("upload");
    onClose();
  }, [onClose]);

  const downloadTemplate = useCallback(() => {
    exportCsv(
      [["employee_id","date","check_in","check_out"],["EMP001","2026-04-20","09:00","18:00"],["EMP002","2026-04-20","09:15",""]],
      "attendance_import_template"
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Attendance from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: employee_id, date (YYYY-MM-DD), check_in (HH:MM), check_out (HH:MM)
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col gap-4 items-center py-8">
            <div className="border-2 border-dashed rounded-xl p-8 text-center w-full cursor-pointer hover:bg-muted transition-colors"
              onClick={() => fileRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Click to select CSV file</p>
              <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Download Template
            </Button>
          </div>
        )}

        {step === "preview" && (
          <>
            {/* Summary */}
            <div className="flex gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="h-4 w-4" />{validRows.length} valid rows
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="h-4 w-4" />{invalidRows.length} rows with errors (will be skipped)
                </div>
              )}
            </div>

            {invalidRows.length > 0 && (
              <Alert variant="destructive" className="shrink-0">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {invalidRows.slice(0, 3).map((r, i) => (
                    <div key={i}>Row {i + 1}: {r.errors.join(", ")}</div>
                  ))}
                  {invalidRows.length > 3 && <div>…and {invalidRows.length - 3} more</div>}
                </AlertDescription>
              </Alert>
            )}

            {/* Preview table */}
            <div className="overflow-auto flex-1 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i} className={!row.valid ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                      <TableCell className="font-mono text-xs">{row.employeeId}</TableCell>
                      <TableCell className="text-sm">{row.employeeName || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm">{row.date}</TableCell>
                      <TableCell className="text-sm">{row.checkIn || "—"}</TableCell>
                      <TableCell className="text-sm">{row.checkOut || "—"}</TableCell>
                      <TableCell>
                        {row.valid
                          ? <Badge className="bg-green-100 text-green-700 text-xs">Valid</Badge>
                          : <Badge variant="destructive" className="text-xs" title={row.errors.join(", ")}>Error</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between shrink-0">
              <Button variant="outline" onClick={() => setStep("upload")}>← Re-upload</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCommit} disabled={validRows.length === 0} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />Import {validRows.length} Records
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttendanceList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
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
    if (records.every((r) => r.status === "Present")) return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300";
    if (records.some((r) => r.status === "Absent")) return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
    if (records.some((r) => r.status === "On Leave")) return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    if (records.some((r) => r.status === "Half Day")) return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-muted text-muted-foreground";
  };

  const handleExport = useCallback(() => {
    exportCsv(
      [["Employee","Date","Check In","Check Out","Work Hours","Branch","Status"],
       ...filteredRecords.map((r) => [r.employeeName, r.date, r.checkIn || "", r.checkOut || "", r.workHours?.toFixed(1) || "", r.branch, r.status])],
      "attendance"
    );
  }, [filteredRecords]);

  const handleImport = useCallback((rows: ImportRow[]) => {
    const existing = getAttendance();
    const newRecords = rows.map((r) => rowToAttendance(r, employees));
    // Deduplicate by employeeId + date
    const existingKeys = new Set(existing.map((a) => `${a.employeeId}-${a.date}`));
    const toAdd = newRecords.filter((r) => !existingKeys.has(`${r.employeeId}-${r.date}`));
    setAttendance([...existing, ...toAdd]);
    // Force re-render by refreshing page state
    window.location.reload();
  }, [employees]);

  const prevMonth = useCallback(() => setCalMonth((p) => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }), []);
  const nextMonth = useCallback(() => setCalMonth((p) => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Attendance Records" description="Track employee attendance and work hours">
        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />Import CSV
        </Button>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />Export CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Present" value={stats.present} />
        <StatCard title="Absent" value={stats.absent} />
        <StatCard title="On Leave" value={stats.onLeave} />
        <StatCard title="Avg Hours" value={`${stats.avgHours.toFixed(1)}h`} />
      </div>

      <Tabs defaultValue="records">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="records" className="flex-1 sm:flex-none">Records Table</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 sm:flex-none">Monthly Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["Present","Absent","Half Day","On Leave","Weekend","Holiday"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Check In</TableHead>
                  <TableHead className="hidden sm:table-cell">Check Out</TableHead>
                  <TableHead className="hidden md:table-cell">Work Hours</TableHead>
                  <TableHead className="hidden lg:table-cell">Branch</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-sm">{r.employeeName}</TableCell>
                    <TableCell className="text-sm">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{r.checkIn || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{r.checkOut || "—"}</TableCell>
                    <TableCell className={`hidden md:table-cell text-sm ${r.workHours ? (r.workHours >= 8 ? "text-green-700 dark:text-green-400" : "text-orange-600") : ""}`}>
                      {r.workHours ? `${r.workHours.toFixed(1)}h` : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.branch}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 && <EmptyState colSpan={7} message="No records found" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-3 mt-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <p className="font-semibold min-w-[140px] text-center text-sm">{MONTH_NAMES[calMonth.month]} {calMonth.year}</p>
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
            {[{l:"Present",c:"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"},{l:"Absent",c:"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"},{l:"On Leave",c:"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"},{l:"Half Day",c:"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}].map((x) => (
              <span key={x.l} className={`px-2 py-0.5 rounded-full ${x.c}`}>{x.l}</span>
            ))}
          </div>

          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_LABELS.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, idx) => {
                  const records = getDayRecords(day);
                  const colorCls = getDayColor(records);
                  const isToday = day === new Date().getDate() && calMonth.month === new Date().getMonth() && calMonth.year === new Date().getFullYear();
                  return (
                    <div key={idx} className={`min-h-[48px] sm:min-h-[64px] rounded border text-xs p-1 ${colorCls || "border-transparent"} ${isToday ? "ring-2 ring-primary" : ""}`}>
                      {day && (
                        <>
                          <span className={`font-medium text-xs ${isToday ? "text-primary" : ""}`}>{day}</span>
                          <div className="mt-0.5 space-y-0.5 hidden sm:block">
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

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
    </div>
  );
}
