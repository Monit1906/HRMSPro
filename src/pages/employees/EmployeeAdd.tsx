import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getEmployees, setEmployees, getDepartments, getDesignations, getBranches,
} from "@/lib/mockData";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function EmployeeAdd() {
  const navigate = useNavigate();
  const departments  = getDepartments();
  const designations = getDesignations();
  const branches     = getBranches();
  const employees    = getEmployees();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", department: "",
    designation: "", branch: "", dateOfJoining: "", dateOfBirth: "",
    gender: "", address: "", emergencyContact: "", bloodGroup: "",
    monthlySalary: "",
  });

  const upd = useCallback((field: string, value: string) => setForm((p) => ({ ...p, [field]: value })), []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee = {
      id: String(Date.now()),
      employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      department: form.department,
      designation: form.designation,
      branch: form.branch,
      dateOfJoining: form.dateOfJoining,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      address: form.address,
      emergencyContact: form.emergencyContact,
      bloodGroup: form.bloodGroup,
      status: "Active" as const,
      reportingManagers: [],
      monthlySalary: form.monthlySalary ? parseFloat(form.monthlySalary) : undefined,
    };
    setEmployees([...employees, newEmployee]);
    toast.success(`Employee ${form.firstName} ${form.lastName} added successfully`);
    navigate("/employees");
  }, [form, employees, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Add New Employee</h1>
          <p className="text-sm text-muted-foreground">Fill in the employee details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Personal */}
          <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle><CardDescription>Basic employee details</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input className="mt-1 h-9" required value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} /></div>
                <div><Label>Last Name *</Label><Input className="mt-1 h-9" required value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email *</Label><Input type="email" className="mt-1 h-9" required value={form.email} onChange={(e) => upd("email", e.target.value)} /></div>
                <div><Label>Phone *</Label><Input className="mt-1 h-9" required value={form.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date of Birth *</Label><Input type="date" className="mt-1 h-9" required value={form.dateOfBirth} onChange={(e) => upd("dateOfBirth", e.target.value)} /></div>
                <div>
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => upd("gender", v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Address</Label><Textarea className="mt-1 resize-none" rows={2} value={form.address} onChange={(e) => upd("address", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Emergency Contact</Label><Input className="mt-1 h-9" value={form.emergencyContact} onChange={(e) => upd("emergencyContact", e.target.value)} /></div>
                <div>
                  <Label>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => upd("bloodGroup", v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Employment Details</CardTitle><CardDescription>Job and organisational info</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Department *</Label>
                  <Select value={form.department} onValueChange={(v) => upd("department", v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Designation *</Label>
                  <Select value={form.designation} onValueChange={(v) => upd("designation", v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {designations.filter((d) => !form.department || d.department === form.department).map((d) => <SelectItem key={d.id} value={d.title}>{d.title}</SelectItem>)}
                      {designations.filter((d) => !form.department || d.department === form.department).length === 0 && (
                        <SelectItem value="__none" disabled>No designations for this department</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Branch *</Label>
                  <Select value={form.branch} onValueChange={(v) => upd("branch", v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name} ({b.city})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Date of Joining *</Label><Input type="date" className="mt-1 h-9" required value={form.dateOfJoining} onChange={(e) => upd("dateOfJoining", e.target.value)} /></div>
              </CardContent>
            </Card>

            {/* Monthly Salary only */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salary</CardTitle>
                <CardDescription>Monthly salary for payroll calculation</CardDescription>
              </CardHeader>
              <CardContent>
                <Label>Monthly Salary (₹)</Label>
                <Input
                  type="number"
                  className="mt-1 h-9"
                  placeholder="e.g. 30000"
                  value={form.monthlySalary}
                  onChange={(e) => upd("monthlySalary", e.target.value)}
                />
                {form.monthlySalary && parseFloat(form.monthlySalary) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />Annual: ₹{(parseFloat(form.monthlySalary) * 12).toLocaleString("en-IN")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate("/employees")}>Cancel</Button>
          <Button type="submit" disabled={!form.firstName || !form.lastName || !form.email || !form.dateOfJoining}>
            Add Employee
          </Button>
        </div>
      </form>
    </div>
  );
}
