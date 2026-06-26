import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  getEmployees, setEmployees, getDepartments, getDesignations, getBranches,
  getSalaryStructures, type SalaryStructure,
} from "@/lib/mockData";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

function calcFromStructure(annualCTC: number, s: SalaryStructure) {
  const monthly  = annualCTC / 12;
  const basic    = (monthly * s.basicPercent) / 100;
  const hra      = (monthly * s.hraPercent) / 100;
  const da       = (monthly * s.daPercent) / 100;
  const special  = (monthly * s.specialAllowancePercent) / 100;
  const pf       = Math.min((basic * s.pfPercent) / 100, 1800);
  const gross    = basic + hra + da + special;
  return { basic, hra, da, special, pf, gross, monthly };
}

export default function EmployeeAdd() {
  const navigate = useNavigate();
  const departments      = getDepartments();
  const designations     = getDesignations();
  const branches         = getBranches();
  const salaryStructures = getSalaryStructures();
  const employees        = getEmployees();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", department: "",
    designation: "", branch: "", dateOfJoining: "", dateOfBirth: "",
    gender: "", address: "", emergencyContact: "", bloodGroup: "",
  });

  const [salaryForm, setSalaryForm] = useState({
    structureId: "",
    annualCTC: 0,
    monthlySalary: 0,
  });

  const upd     = useCallback((field: string, value: string) => setForm((p) => ({ ...p, [field]: value })), []);
  const updSal  = useCallback((field: string, value: string | number) => setSalaryForm((p) => ({ ...p, [field]: value })), []);

  const selectedStructure = salaryStructures.find((s) => s.id === salaryForm.structureId);
  const autoCalc = selectedStructure && salaryForm.annualCTC > 0
    ? calcFromStructure(salaryForm.annualCTC, selectedStructure)
    : null;

  const handleApplyStructure = useCallback(() => {
    if (!autoCalc) return;
    updSal("monthlySalary", Math.round(autoCalc.monthly));
    toast.success("Salary computed from CTC");
  }, [autoCalc, updSal]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee = {
      id: String(Date.now()),
      employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      ...form,
      status: "Active" as const,
      reportingManagers: [],
      monthlySalary: salaryForm.monthlySalary || undefined,
      salaryStructureId: salaryForm.structureId || undefined,
      annualCTC: salaryForm.annualCTC || undefined,
    };
    setEmployees([...employees, newEmployee]);
    toast.success(`Employee ${form.firstName} ${form.lastName} added successfully`);
    navigate("/employees");
  }, [form, employees, salaryForm, navigate]);

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

            {/* Salary Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Salary Configuration
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">Optional</span>
                </CardTitle>
                <CardDescription>Link a salary structure and CTC for payroll auto-processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Salary Structure</Label>
                  <Select value={salaryForm.structureId} onValueChange={(v) => updSal("structureId", v)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Select structure (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {salaryStructures.length > 0
                        ? salaryStructures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                        : <SelectItem value="__none" disabled>No structures configured — add in Payroll → Process</SelectItem>
                      }
                    </SelectContent>
                  </Select>
                </div>

                {salaryForm.structureId && (
                  <>
                    <div>
                      <Label>Annual CTC (₹)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          className="h-9 flex-1"
                          placeholder="e.g. 600000"
                          value={salaryForm.annualCTC || ""}
                          onChange={(e) => updSal("annualCTC", parseFloat(e.target.value) || 0)}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleApplyStructure} className="gap-1 h-9">
                          <Calculator className="h-3.5 w-3.5" />Compute
                        </Button>
                      </div>
                    </div>

                    {autoCalc && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
                        <p className="font-semibold text-sm mb-2">Salary Breakdown (Monthly)</p>
                        {[
                          ["Basic", autoCalc.basic],
                          ["HRA", autoCalc.hra],
                          ["DA", autoCalc.da],
                          ["Special Allow.", autoCalc.special],
                        ].map(([l, v]) => (
                          <div key={l as string} className="flex justify-between">
                            <span className="text-muted-foreground">{l}</span>
                            <span>₹{Math.round(v as number).toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        <Separator className="my-1" />
                        <div className="flex justify-between font-semibold text-sm">
                          <span>Gross Monthly</span>
                          <span className="text-primary">₹{Math.round(autoCalc.gross).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>PF (capped ₹1800)</span>
                          <span>-₹{Math.round(autoCalc.pf).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Label>Monthly Salary (₹)</Label>
                  <Input
                    type="number"
                    className="mt-1 h-9"
                    placeholder="Or enter directly"
                    value={salaryForm.monthlySalary || ""}
                    onChange={(e) => updSal("monthlySalary", parseFloat(e.target.value) || 0)}
                  />
                  {salaryForm.monthlySalary > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />Annual: ₹{(salaryForm.monthlySalary * 12).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
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
