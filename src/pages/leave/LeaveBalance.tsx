import { useState, useMemo, useCallback } from "react";
import { Search, BarChart3, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getEmployees, getLeaveApplications, getLeaveTypes, getLeaveBalances, ensureLeaveBalances, setLeaveBalances } from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const YEAR = new Date().getFullYear();

// ─── Allocation Editor (HR/Admin only) ───────────────────────────────────────
function AllocationEditor({ employeeId, employeeName, onClose }: { employeeId: string; employeeName: string; onClose: () => void }) {
  const leaveTypes = getLeaveTypes();
  ensureLeaveBalances(employeeId, YEAR);
  const [balances, setLocalBalances] = useState(() =>
    getLeaveBalances().filter((b) => b.employeeId === employeeId && b.year === YEAR)
  );

  const handleChange = (leaveTypeId: string, value: number) => {
    setLocalBalances((prev) => prev.map((b) => b.leaveTypeId === leaveTypeId ? { ...b, allotted: Math.max(0, value) } : b));
  };

  const handleSave = () => {
    const all = getLeaveBalances();
    const updated = all.map((b) => {
      const local = balances.find((lb) => lb.leaveTypeId === b.leaveTypeId && lb.employeeId === b.employeeId && lb.year === b.year);
      return local || b;
    });
    setLeaveBalances(updated);
    toast.success("Leave allocations saved");
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Leave Allocation — {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {leaveTypes.map((lt) => {
            const balance = balances.find((b) => b.leaveTypeId === lt.id);
            return (
              <div key={lt.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lt.color }} />
                  <Label className="text-sm">{lt.name}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{balance?.taken ?? 0} taken</span>
                  <Input
                    type="number" min="0" max="365"
                    className="w-20 h-8 text-sm text-center"
                    value={balance?.allotted ?? lt.annualAllocation ?? 12}
                    onChange={(e) => handleChange(lt.id, parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs text-muted-foreground">allotted</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Allocations</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Per-employee leave balance card ─────────────────────────────────────────
function EmployeeLeaveCard({ empId, empName, department, leaveTypes }: { empId: string; empName: string; department: string; leaveTypes: ReturnType<typeof getLeaveTypes> }) {
  ensureLeaveBalances(empId, YEAR);
  const balances = getLeaveBalances().filter((b) => b.employeeId === empId && b.year === YEAR);

  return (
    <div className="space-y-2">
      {balances.length === 0 ? (
        <p className="text-xs text-muted-foreground">No leave types</p>
      ) : (
        balances.map((b) => {
          const remaining = Math.max(0, b.allotted - b.taken);
          const pct = b.allotted > 0 ? Math.min(100, (b.taken / b.allotted) * 100) : 0;
          const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
          return (
            <div key={b.leaveTypeId} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: lt?.color || "#6b7280" }} />
                  <span className="font-medium">{b.leaveTypeName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{b.taken}d taken</span>
                  <span className={cn("font-semibold px-1.5 py-0.5 rounded text-[10px]",
                    remaining === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    remaining <= 2 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  )}>
                    {remaining}d left
                  </span>
                  <span className="text-muted-foreground/60">/{b.allotted}</span>
                </div>
              </div>
              <Progress value={pct} className={cn("h-1",
                pct >= 100 ? "[&>div]:bg-red-500" : pct > 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"
              )} />
            </div>
          );
        })
      )}
    </div>
  );
}

export default function LeaveBalance() {
  const { can, user } = useRole();
  const isEmployee = user.role === "Employee";
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [editingEmployee, setEditingEmployee] = useState<{ id: string; name: string } | null>(null);

  const employees = getEmployees();
  const leaveTypes = getLeaveTypes();
  const applications = getLeaveApplications();

  // For employees, show only their own balance
  const visibleEmployees = useMemo(() => {
    if (isEmployee) {
      return employees.filter((e) => e.id === user.employeeId || e.id === user.id);
    }
    return employees;
  }, [employees, isEmployee, user]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return visibleEmployees.filter((e) => {
      const matchSearch = !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [visibleEmployees, searchQuery, deptFilter]);

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);

  // Summary stats
  const totalDaysTaken = useMemo(() => applications.filter((a) => a.status === "Approved").reduce((s, a) => s + a.days, 0), [applications]);
  const pendingCount   = useMemo(() => applications.filter((a) => a.status === "Pending").length, [applications]);

  return (
    <div className="space-y-4">
      <PageHeader title={isEmployee ? "My Leave Balance" : "Leave Balance"} description="Annual leave allocation, taken days, and remaining balance per employee" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title={isEmployee ? "My Employees" : "Total Employees"} value={visibleEmployees.length} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard title="Leave Types" value={leaveTypes.length} />
        <StatCard title="Total Days Taken" value={totalDaysTaken} sub="approved" icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard title="Pending Requests" value={pendingCount} />
      </div>

      {!isEmployee && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cards view */}
      <div className="space-y-3">
        {filtered.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Employee info */}
                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{employee.firstName} {employee.lastName}</p>
                    <p className="text-xs text-muted-foreground">{employee.employeeId}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{employee.department || "—"}</Badge>
                  </div>
                </div>

                {/* Leave bars */}
                <div className="flex-1 min-w-0">
                  <EmployeeLeaveCard empId={employee.id} empName={`${employee.firstName} ${employee.lastName}`} department={employee.department} leaveTypes={leaveTypes} />
                </div>

                {/* Edit allocation (HR/Admin only) */}
                {can("manage_employees") && (
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-8"
                    onClick={() => setEditingEmployee({ id: employee.id, name: `${employee.firstName} ${employee.lastName}` })}>
                    Edit Allocation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No employees found</CardContent></Card>
        )}
      </div>

      {/* Table view for HR/Admin */}
      {!isEmployee && (
        <Card className="mt-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leave Summary Table</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  {leaveTypes.map((lt) => <TableHead key={lt.id} className="text-xs hidden sm:table-cell">{lt.name.split(" ")[0]}</TableHead>)}
                  <TableHead className="text-xs">Total Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => {
                  const empApps = applications.filter((a) => a.employeeId === emp.id && a.status === "Approved");
                  const totalTaken = empApps.reduce((s, a) => s + a.days, 0);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                      </TableCell>
                      <TableCell className="text-sm">{emp.department}</TableCell>
                      {leaveTypes.map((lt) => {
                        const days = empApps.filter((a) => a.leaveType === lt.name).reduce((s, a) => s + a.days, 0);
                        return <TableCell key={lt.id} className="text-sm hidden sm:table-cell">{days > 0 ? `${days}d` : "—"}</TableCell>;
                      })}
                      <TableCell><Badge variant={totalTaken > 20 ? "destructive" : "secondary"}>{totalTaken} days</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <EmptyState colSpan={3 + leaveTypes.length} message="No employees found" />}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Allocation Editor */}
      {editingEmployee && (
        <AllocationEditor
          employeeId={editingEmployee.id}
          employeeName={editingEmployee.name}
          onClose={() => { setEditingEmployee(null); }}
        />
      )}
    </div>
  );
}
