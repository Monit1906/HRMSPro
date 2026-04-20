import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getEmployees, setEmployees } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function EmployeeList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const employees = getEmployees();

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const handleDelete = useCallback(
    (id: string) => {
      setEmployees(employees.filter((e) => e.id !== id));
      toast.success("Employee deleted successfully");
    },
    [employees]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Employees" description="Manage your organisation's workforce">
        <Button onClick={() => navigate("/employees/add")} className="gap-2">
          <Plus className="h-4 w-4" />Add Employee
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                <TableCell>
                  <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-muted-foreground">{emp.phone}</p>
                </TableCell>
                <TableCell className="text-sm">{emp.email}</TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>{emp.designation}</TableCell>
                <TableCell>{emp.branch}</TableCell>
                <TableCell><StatusBadge status={emp.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/employees/${emp.id}`)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/employees/${emp.id}`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(emp.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <EmptyState colSpan={8} message="No employees found" action={<Button size="sm" variant="outline" onClick={() => navigate("/employees/add")}>Add your first employee</Button>} />
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
