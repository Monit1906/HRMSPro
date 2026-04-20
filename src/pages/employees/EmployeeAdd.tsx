import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getEmployees, setEmployees, getDepartments, getDesignations, getBranches } from "@/lib/mockData";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function EmployeeAdd() {
  const navigate = useNavigate();
  const departments = getDepartments();
  const designations = getDesignations();
  const branches = getBranches();
  const employees = getEmployees();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", department: "",
    designation: "", branch: "", dateOfJoining: "", dateOfBirth: "",
    gender: "", address: "", emergencyContact: "", bloodGroup: "",
  });

  const upd = useCallback((field: string, value: string) => setForm((p) => ({ ...p, [field]: value })), []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee = {
      id: String(Date.now()),
      employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      ...form,
      status: "Active" as const,
      reportingManagers: [],
    };
    setEmployees([...employees, newEmployee]);
    toast.success("Employee added successfully");
    navigate("/employees");
  }, [form, employees, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Employee</h1>
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
                <div><Label>First Name *</Label><Input className="mt-1" required value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} /></div>
                <div><Label>Last Name *</Label><Input className="mt-1" required value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email *</Label><Input type="email" className="mt-1" required value={form.email} onChange={(e) => upd("email", e.target.value)} /></div>
                <div><Label>Phone *</Label><Input className="mt-1" required value={form.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date of Birth *</Label><Input type="date" className="mt-1" required value={form.dateOfBirth} onChange={(e) => upd("dateOfBirth", e.target.value)} /></div>
                <div>
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => upd("gender", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Address *</Label><Textarea className="mt-1" rows={2} required value={form.address} onChange={(e) => upd("address", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Emergency Contact *</Label><Input className="mt-1" required value={form.emergencyContact} onChange={(e) => upd("emergencyContact", e.target.value)} /></div>
                <div>
                  <Label>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => upd("bloodGroup", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment */}
          <Card>
            <CardHeader><CardTitle className="text-base">Employment Details</CardTitle><CardDescription>Job and organisational info</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Department *</Label>
                <Select value={form.department} onValueChange={(v) => upd("department", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Designation *</Label>
                <Select value={form.designation} onValueChange={(v) => upd("designation", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designations.filter((d) => !form.department || d.department === form.department).map((d) => <SelectItem key={d.id} value={d.title}>{d.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branch *</Label>
                <Select value={form.branch} onValueChange={(v) => upd("branch", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name} ({b.city})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date of Joining *</Label><Input type="date" className="mt-1" required value={form.dateOfJoining} onChange={(e) => upd("dateOfJoining", e.target.value)} /></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/employees")}>Cancel</Button>
          <Button type="submit">Add Employee</Button>
        </div>
      </form>
    </div>
  );
}
