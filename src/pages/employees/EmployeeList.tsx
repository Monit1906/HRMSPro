import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, Upload, Download, KeyRound, X, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { USERS } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEmployees, setEmployees, getDepartments, getDesignations, getBranches, Employee } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

// ─── CSV import types ──────────────────────────────────────────────────────────
const CSV_COLUMNS = ["firstName","lastName","email","phone","department","designation","branch","dateOfJoining","dateOfBirth","gender"] as const;
const REQUIRED_COLS = ["firstName","lastName","email"] as const;

interface CsvRow { data: Record<string, string>; errors: string[]; }

function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const raw = lines[0].split(",").map((h) => h.trim().replace(/["']/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const values: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line + ",") {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    const row: Record<string, string> = {};
    raw.forEach((h, i) => { row[h] = values[i] ?? ""; });
    const errors: string[] = [];
    REQUIRED_COLS.forEach((col) => { if (!row[col]) errors.push(`${col} is required`); });
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push("Invalid email");
    return { data: row, errors };
  });
}

// ─── Set Password dialog ──────────────────────────────────────────────────────
function SetPasswordDialog({
  open, onClose, targetName, targetId, onSave,
}: {
  open: boolean; onClose: () => void; targetName: string; targetId: string;
  onSave: (userId: string, newPwd: string) => void;
}) {
  const [newPwd, setNewPwd]     = useState("");
  const [confirmPwd, setConfirm] = useState("");
  const [err, setErr]           = useState("");

  const handleSave = () => {
    if (!newPwd) { setErr("Password cannot be empty"); return; }
    if (newPwd.length < 6) { setErr("Min 6 characters"); return; }
    if (newPwd !== confirmPwd) { setErr("Passwords do not match"); return; }
    onSave(targetId, newPwd);
    onClose();
    setNewPwd(""); setConfirm(""); setErr("");
  };

  // Map employee id to system user id (for users that exist in USERS list)
  // For employees not in USERS, we store password by employee id
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Set Password</DialogTitle>
          <DialogDescription>Set a new login password for <strong>{targetName}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>New Password</Label>
            <Input type="password" className="mt-1" value={newPwd} placeholder="Min 6 characters"
              onChange={(e) => { setNewPwd(e.target.value); setErr(""); }} />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" className="mt-1" value={confirmPwd} placeholder="Repeat password"
              onChange={(e) => { setConfirm(e.target.value); setErr(""); }} />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Set Password</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── CSV Import dialog ────────────────────────────────────────────────────────
function CsvImportDialog({
  open, onClose, onImport,
}: {
  open: boolean; onClose: () => void;
  onImport: (rows: Record<string, string>[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows]   = useState<CsvRow[]>([]);
  const [stage, setStage] = useState<"upload" | "preview">("upload");
  const departments  = getDepartments();
  const designations = getDesignations();
  const branches     = getBranches();

  const validRows   = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setStage("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const header = CSV_COLUMNS.join(",");
    const sample = "John,Doe,john.doe@company.com,9876543210,Engineering,Software Engineer,Head Office,2024-01-15,1995-05-20,Male";
    const blob = new Blob([header + "\n" + sample], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "employee_import_template.csv"; a.click();
  };

  const handleImport = () => {
    if (!validRows.length) return;
    onImport(validRows.map((r) => r.data));
    onClose();
    setRows([]); setStage("upload");
  };

  const reset = () => { setRows([]); setStage("upload"); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-4 w-4" />Import Employees from CSV</DialogTitle>
          <DialogDescription>Upload a CSV with employee data. Required: firstName, lastName, email.</DialogDescription>
        </DialogHeader>

        {stage === "upload" ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">Columns: {CSV_COLUMNS.join(", ")}</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />Download Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            {/* Summary */}
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="font-medium">{rows.length} rows parsed</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                <CheckCircle2 className="h-3 w-3" />{validRows.length} valid
              </Badge>
              {invalidRows.length > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1">
                  <AlertTriangle className="h-3 w-3" />{invalidRows.length} errors
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto" onClick={reset}>
                <X className="h-3 w-3 mr-1" />Change file
              </Button>
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden lg:table-cell">Designation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row.errors.length > 0 ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-sm">{row.data.firstname || row.data.firstName}</TableCell>
                      <TableCell className="text-sm">{row.data.lastname || row.data.lastName}</TableCell>
                      <TableCell className="text-sm">{row.data.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{row.data.phone || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{row.data.department || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{row.data.designation || "—"}</TableCell>
                      <TableCell>
                        {row.errors.length === 0 ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />OK</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600" title={row.errors.join("; ")}>
                            <AlertTriangle className="h-3.5 w-3.5" />{row.errors[0]}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                Import {validRows.length} Employee{validRows.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EmployeeList() {
  const navigate  = useNavigate();
  const { can, setUserPassword, user } = useRole();
  const [searchQuery, setSearchQuery]   = useState("");
  const [csvOpen, setCsvOpen]           = useState(false);
  const [pwdTarget, setPwdTarget]       = useState<{ id: string; name: string } | null>(null);

  const employees = getEmployees();

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) =>
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const handleDelete = useCallback((id: string) => {
    setEmployees(employees.filter((e) => e.id !== id));
    toast.success("Employee deleted");
  }, [employees]);

  const handleCsvImport = useCallback((rows: Record<string, string>[]) => {
    const departments  = getDepartments();
    const designations = getDesignations();
    const branches     = getBranches();
    const existing     = getEmployees();
    const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()));

    let added = 0; let skipped = 0;
    const newEmps: Employee[] = rows
      .filter((row) => {
        const email = (row.email || "").toLowerCase();
        if (existingEmails.has(email)) { skipped++; return false; }
        return true;
      })
      .map((row, i) => ({
        id: String(Date.now() + i),
        employeeId: `EMP${String(existing.length + added + i + 1).padStart(3, "0")}`,
        firstName: row.firstname || row.firstName || "",
        lastName:  row.lastname  || row.lastName  || "",
        email:     row.email || "",
        phone:     row.phone || "",
        fatherName: "",
        department: row.department || "",
        designation: row.designation || "",
        branch: row.branch || "",
        dateOfJoining: row.dateofjoining || row.dateOfJoining || new Date().toISOString().split("T")[0],
        dateOfBirth:   row.dateofbirth   || row.dateOfBirth   || "1990-01-01",
        status: "Active" as const,
        reportingManagers: [],
        address: "",
        emergencyContact: "",
        gender: row.gender || "",
      }));

    added = newEmps.length;
    setEmployees([...existing, ...newEmps]);
    const msg = skipped > 0 ? `Imported ${added}, skipped ${skipped} (duplicate email)` : `Imported ${added} employees`;
    toast.success(msg);
  }, []);

  const handleSetPassword = useCallback((targetId: string, newPwd: string) => {
    // Map employee ID to system user ID (for known system users)
    const systemUser = USERS.find((u) => u.id === targetId);
    const userId = systemUser ? systemUser.id : targetId;
    const ok = setUserPassword(userId, newPwd);
    if (ok) toast.success("Password updated successfully");
    else toast.error("You don't have permission to set passwords");
  }, [setUserPassword]);

  return (
    <div className="space-y-4">
      <PageHeader title="Employees" description="Manage your organisation's workforce">
        {can("manage_employees") && (
          <>
            <Button variant="outline" onClick={() => setCsvOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />Import CSV
            </Button>
            <Button onClick={() => navigate("/employees/add")} className="gap-2">
              <Plus className="h-4 w-4" />Add Employee
            </Button>
          </>
        )}
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emp ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-muted-foreground">{emp.designation || emp.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{emp.email}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{emp.department}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{emp.branch}</TableCell>
                <TableCell><StatusBadge status={emp.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/employees/${emp.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />View Details
                      </DropdownMenuItem>
                      {can("manage_employees") && (
                        <DropdownMenuItem onClick={() => navigate(`/employees/${emp.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />Edit Profile
                        </DropdownMenuItem>
                      )}
                      {can("reset_passwords") && (
                        <DropdownMenuItem onClick={() => setPwdTarget({ id: emp.id, name: `${emp.firstName} ${emp.lastName}` })}>
                          <KeyRound className="mr-2 h-4 w-4" />Set Password
                        </DropdownMenuItem>
                      )}
                      {can("delete") && (
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(emp.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <EmptyState colSpan={7} message="No employees found"
                action={
                  can("manage_employees") ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)} className="gap-1"><Upload className="h-3.5 w-3.5" />Import CSV</Button>
                      <Button size="sm" onClick={() => navigate("/employees/add")} className="gap-1"><Plus className="h-3.5 w-3.5" />Add Employee</Button>
                    </div>
                  ) : undefined
                }
              />
            )}
          </TableBody>
        </Table>
      </Card>

      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleCsvImport} />

      {pwdTarget && (
        <SetPasswordDialog
          open={!!pwdTarget}
          onClose={() => setPwdTarget(null)}
          targetName={pwdTarget.name}
          targetId={pwdTarget.id}
          onSave={handleSetPassword}
        />
      )}
    </div>
  );
}
