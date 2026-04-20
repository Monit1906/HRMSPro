import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployees, getLeaveApplications, getLeaveTypes } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";

export default function LeaveBalance() {
  const [searchQuery, setSearchQuery] = useState("");
  const employees = getEmployees();
  const applications = getLeaveApplications();
  const leaveTypes = getLeaveTypes();

  const employeeLeaveStats = useMemo(() => employees.map((employee) => {
    const empLeaves = applications.filter((a) => a.employeeId === employee.id && a.status === "Approved");
    const leavesByType = leaveTypes.map((type) => {
      const typeLeaves = empLeaves.filter((a) => a.leaveType === type.name);
      return { type: type.name, color: type.color, taken: typeLeaves.reduce((s, a) => s + a.days, 0) };
    });
    return { employee, totalDaysTaken: empLeaves.reduce((s, a) => s + a.days, 0), leavesByType };
  }), [employees, applications, leaveTypes]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employeeLeaveStats.filter((s) =>
      s.employee.firstName.toLowerCase().includes(q) ||
      s.employee.lastName.toLowerCase().includes(q) ||
      s.employee.employeeId.toLowerCase().includes(q)
    );
  }, [employeeLeaveStats, searchQuery]);

  const avgDaysTaken = employees.length > 0
    ? (employeeLeaveStats.reduce((s, e) => s + e.totalDaysTaken, 0) / employees.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-4">
      <PageHeader title="Leave Balance" description="Track employee leave utilisation and balances" />

      <div className="grid grid-cols-3 gap-3">
        <StatCard title="Total Employees" value={employees.length} />
        <StatCard title="Avg. Days Taken" value={avgDaysTaken} />
        <StatCard title="Leave Types" value={leaveTypes.length} />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Total Days Taken</TableHead><TableHead>Leave Breakdown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ employee, totalDaysTaken, leavesByType }) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                  <p className="text-xs text-muted-foreground">{employee.employeeId}</p>
                </TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell><span className="font-semibold">{totalDaysTaken} days</span></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {leavesByType.filter((lt) => lt.taken > 0).map((lt) => (
                      <span key={lt.type} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lt.color }} />
                        {lt.type}: {lt.taken}d
                      </span>
                    ))}
                    {leavesByType.filter((lt) => lt.taken > 0).length === 0 && <span className="text-xs text-muted-foreground">No leaves taken</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <EmptyState colSpan={4} message="No employees found" />}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
