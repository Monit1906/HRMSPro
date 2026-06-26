import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  getEmployees, getPayroll, setPayroll, getSalaryStructures, setSalaryStructures,
  type SalaryStructure,
} from "@/lib/mockData";
import { toast } from "sonner";

function calcFromStructure(ctc: number, s: SalaryStructure) {
  const monthly = ctc / 12;
  const basic   = (monthly * s.basicPercent) / 100;
  const hra     = (monthly * s.hraPercent) / 100;
  const da      = (monthly * s.daPercent) / 100;
  const special = (monthly * s.specialAllowancePercent) / 100;
  const pf      = Math.min((basic * s.pfPercent) / 100, 1800);
  const pt      = s.professionalTax;
  const gross   = basic + hra + da + special;
  const taxable = gross - pf - pt;
  const tax     = taxable > 10000 ? taxable * 0.1 : taxable > 5000 ? taxable * 0.05 : 0;
  const net     = gross - pf - pt - tax;
  return { basic, hra, da, special, pf, pt, tax, net, gross };
}

// ─── Component toggles ─────────────────────────────────────────────────────
type CompKey = "hra" | "da" | "specialAllowance" | "allowances" | "deductions" | "providentFund" | "professionalTax" | "tax";

const COMP_LABELS: { key: CompKey; label: string; isDeduction?: boolean }[] = [
  { key: "hra",             label: "HRA" },
  { key: "da",              label: "DA" },
  { key: "specialAllowance",label: "Special Allowance" },
  { key: "allowances",      label: "Other Allowances" },
  { key: "deductions",      label: "Deductions",       isDeduction: true },
  { key: "providentFund",   label: "Provident Fund",   isDeduction: true },
  { key: "professionalTax", label: "Professional Tax", isDeduction: true },
  { key: "tax",             label: "Income Tax",       isDeduction: true },
];

export default function PayrollProcess() {
  const navigate = useNavigate();
  const employees        = getEmployees();
  const payrollRecords   = getPayroll();
  const salaryStructures = getSalaryStructures();

  const [form, setForm] = useState({
    employeeId: "", month: "", structureId: "", ctc: 0,
    basicSalary: 0, hra: 0, da: 0, specialAllowance: 0,
    allowances: 0, deductions: 0, providentFund: 0, professionalTax: 200, tax: 0,
  });

  // Which components are enabled (checked)
  const [enabled, setEnabled] = useState<Record<CompKey, boolean>>({
    hra: true, da: true, specialAllowance: true, allowances: false,
    deductions: false, providentFund: true, professionalTax: true, tax: true,
  });

  const [bulkMonth, setBulkMonth]           = useState("");
  const [bulkStructureId, setBulkStructureId] = useState("");
  const [bulkCTC, setBulkCTC]               = useState(0);
  const [bulkPreview, setBulkPreview]       = useState<{ employeeId: string; name: string; net: number; gross: number }[]>([]);

  // New structure form
  const [newStruct, setNewStruct] = useState<Omit<SalaryStructure, "id">>({
    name: "", basicPercent: 50, hraPercent: 20, daPercent: 10,
    specialAllowancePercent: 20, pfPercent: 12, professionalTax: 200,
  });

  const upd = useCallback((k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v })), []);
  const toggleComp = useCallback((k: CompKey) => setEnabled((p) => ({ ...p, [k]: !p[k] })), []);

  const selectedStructure = salaryStructures.find((s) => s.id === form.structureId);
  const autoCalc = selectedStructure && form.ctc > 0 ? calcFromStructure(form.ctc, selectedStructure) : null;

  // Net salary computation with enabled checks
  const grossSalary = form.basicSalary
    + (enabled.hra ? form.hra : 0)
    + (enabled.da ? form.da : 0)
    + (enabled.specialAllowance ? form.specialAllowance : 0)
    + (enabled.allowances ? form.allowances : 0);

  const totalDeductions = (enabled.deductions ? form.deductions : 0)
    + (enabled.providentFund ? form.providentFund : 0)
    + (enabled.professionalTax ? form.professionalTax : 0)
    + (enabled.tax ? form.tax : 0);

  const netSalary = grossSalary - totalDeductions;

  const applyStructure = useCallback(() => {
    if (!autoCalc) return;
    setForm((p) => ({
      ...p,
      basicSalary: Math.round(autoCalc.basic),
      hra: Math.round(autoCalc.hra),
      da: Math.round(autoCalc.da),
      specialAllowance: Math.round(autoCalc.special),
      allowances: 0,
      deductions: 0,
      providentFund: Math.round(autoCalc.pf),
      professionalTax: autoCalc.pt,
      tax: Math.round(autoCalc.tax),
    }));
    toast.success("Structure applied — review and adjust as needed");
  }, [autoCalc]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === form.employeeId);
    if (!emp) { toast.error("Select an employee"); return; }
    if (!form.month) { toast.error("Select a month"); return; }
    const struct = salaryStructures.find((s) => s.id === form.structureId);
    const entry = {
      id: String(Date.now()),
      employeeId: form.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      month: form.month,
      basicSalary: form.basicSalary,
      hra: enabled.hra ? form.hra : 0,
      da: enabled.da ? form.da : 0,
      specialAllowance: enabled.specialAllowance ? form.specialAllowance : 0,
      allowances: (enabled.hra ? form.hra : 0) + (enabled.da ? form.da : 0) + (enabled.specialAllowance ? form.specialAllowance : 0) + (enabled.allowances ? form.allowances : 0),
      deductions: enabled.deductions ? form.deductions : 0,
      providentFund: enabled.providentFund ? form.providentFund : 0,
      professionalTax: enabled.professionalTax ? form.professionalTax : 0,
      tax: enabled.tax ? form.tax : 0,
      netSalary,
      status: "Processed" as const,
      processedOn: new Date().toISOString(),
      salaryStructure: struct?.name,
    };
    setPayroll([...payrollRecords, entry]);
    toast.success(`Payroll processed for ${emp.firstName} ${emp.lastName}`);
    navigate("/payroll");
  }, [form, enabled, employees, payrollRecords, salaryStructures, netSalary, navigate]);

  const generateBulkPreview = useCallback(() => {
    if (!bulkMonth || !bulkStructureId || !bulkCTC) { toast.error("Fill month, structure, and CTC"); return; }
    const struct = salaryStructures.find((s) => s.id === bulkStructureId);
    if (!struct) return;
    setBulkPreview(employees.map((emp) => {
      const c = calcFromStructure(bulkCTC, struct);
      return { employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, net: Math.round(c.net), gross: Math.round(c.gross) };
    }));
  }, [bulkMonth, bulkStructureId, bulkCTC, salaryStructures, employees]);

  const processBulk = useCallback(() => {
    if (!bulkPreview.length) return;
    const struct = salaryStructures.find((s) => s.id === bulkStructureId)!;
    const newEntries = bulkPreview.map((p) => {
      const c = calcFromStructure(bulkCTC, struct);
      return {
        id: String(Date.now() + Math.random()),
        employeeId: p.employeeId, employeeName: p.name, month: bulkMonth,
        basicSalary: Math.round(c.basic), hra: Math.round(c.hra), da: Math.round(c.da),
        specialAllowance: Math.round(c.special),
        allowances: Math.round(c.hra + c.da + c.special),
        deductions: 0, providentFund: Math.round(c.pf),
        professionalTax: c.pt, tax: Math.round(c.tax),
        netSalary: Math.round(c.net),
        status: "Processed" as const,
        processedOn: new Date().toISOString(),
        salaryStructure: struct.name,
      };
    });
    setPayroll([...payrollRecords, ...newEntries]);
    toast.success(`Bulk payroll processed for ${newEntries.length} employees`);
    navigate("/payroll");
  }, [bulkPreview, bulkCTC, bulkMonth, bulkStructureId, salaryStructures, payrollRecords, navigate]);

  const addStructure = useCallback(() => {
    if (!newStruct.name.trim()) { toast.error("Enter a structure name"); return; }
    const s: SalaryStructure = { ...newStruct, id: String(Date.now()) };
    setSalaryStructures([...salaryStructures, s]);
    toast.success("Salary structure added");
    setNewStruct({ name: "", basicPercent: 50, hraPercent: 20, daPercent: 10, specialAllowancePercent: 20, pfPercent: 12, professionalTax: 200 });
  }, [newStruct, salaryStructures]);

  const deleteStructure = useCallback((id: string) => {
    setSalaryStructures(salaryStructures.filter((s) => s.id !== id));
    toast.success("Structure deleted");
  }, [salaryStructures]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/payroll")}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-xl sm:text-2xl font-bold">Process Payroll</h1><p className="text-sm text-muted-foreground">Single or bulk salary processing</p></div>
      </div>

      <Tabs defaultValue="single">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="single">Single Employee</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Processing</TabsTrigger>
          <TabsTrigger value="structures">Salary Structures</TabsTrigger>
        </TabsList>

        {/* ── SINGLE ── */}
        <TabsContent value="single" className="mt-4">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Employee & Period</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Employee *</Label>
                        <Select value={form.employeeId} onValueChange={(v) => {
                          upd("employeeId", v);
                          // Auto-load employee salary if set
                          const emp = employees.find((e) => e.id === v);
                          if (emp?.monthlySalary) upd("basicSalary", emp.monthlySalary);
                          if (emp?.salaryStructureId) upd("structureId", emp.salaryStructureId);
                          if (emp?.annualCTC) upd("ctc", emp.annualCTC);
                        }}>
                          <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select employee" /></SelectTrigger>
                          <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Month *</Label><Input type="month" className="mt-1 h-9" value={form.month} onChange={(e) => upd("month", e.target.value)} /></div>
                    </div>
                    <div>
                      <Label>Salary Structure</Label>
                      <div className="flex gap-2 mt-1">
                        <Select value={form.structureId} onValueChange={(v) => upd("structureId", v)}>
                          <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Select structure" /></SelectTrigger>
                          <SelectContent>{salaryStructures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        {form.structureId && (
                          <>
                            <Input type="number" className="w-36 h-9" placeholder="Annual CTC (₹)" value={form.ctc || ""} onChange={(e) => upd("ctc", parseFloat(e.target.value) || 0)} />
                            <Button type="button" variant="outline" size="sm" className="h-9 gap-1" onClick={applyStructure}>
                              <Calculator className="h-3.5 w-3.5" />Fill
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Basic Salary (₹) *</Label>
                      <Input type="number" className="mt-1 h-9" value={form.basicSalary || ""} onChange={(e) => upd("basicSalary", parseFloat(e.target.value) || 0)} />
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Components with toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Salary Components</CardTitle>
                    <CardDescription className="text-xs">Toggle each component on/off to include or exclude from the calculation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {COMP_LABELS.map(({ key, label, isDeduction }) => (
                      <div key={key} className="flex items-center gap-3">
                        <Checkbox
                          id={`chk-${key}`}
                          checked={enabled[key]}
                          onCheckedChange={() => toggleComp(key)}
                        />
                        <Label htmlFor={`chk-${key}`} className={`w-40 text-sm cursor-pointer ${!enabled[key] ? "line-through text-muted-foreground" : ""}`}>
                          {label}
                          {isDeduction && <span className="text-xs text-red-500 ml-1">(-)</span>}
                        </Label>
                        <Input
                          type="number"
                          className="h-8 flex-1 text-sm"
                          disabled={!enabled[key]}
                          value={(form as Record<string, number>)[key] || 0}
                          onChange={(e) => upd(key, parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {enabled[key] ? (isDeduction ? "-" : "+") + "₹" + ((form as Record<string, number>)[key] || 0).toLocaleString("en-IN") : "Excluded"}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate("/payroll")}>Cancel</Button>
                  <Button type="submit">Process Payroll</Button>
                </div>
              </div>

              {/* Salary Breakdown */}
              <Card className="h-fit">
                <CardHeader><CardTitle className="text-sm">Salary Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Basic</span>
                    <span>₹{form.basicSalary.toLocaleString("en-IN")}</span>
                  </div>
                  {COMP_LABELS.filter(({ key, isDeduction }) => !isDeduction && enabled[key]).map(({ key, label }) => (
                    <div key={key} className="flex justify-between text-green-600">
                      <span className="text-muted-foreground">{label}</span>
                      <span>+₹{((form as Record<string, number>)[key] || 0).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t pt-1.5">
                    <span>Gross</span>
                    <span>₹{grossSalary.toLocaleString("en-IN")}</span>
                  </div>
                  <Separator />
                  {COMP_LABELS.filter(({ key, isDeduction }) => isDeduction && enabled[key]).map(({ key, label }) => (
                    <div key={key} className="flex justify-between text-red-600">
                      <span className="text-muted-foreground">{label}</span>
                      <span>-₹{((form as Record<string, number>)[key] || 0).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-xl border-t pt-2 text-primary">
                    <span>Net</span>
                    <span>₹{netSalary.toLocaleString("en-IN")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>

        {/* ── BULK ── */}
        <TabsContent value="bulk" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Bulk Payroll Processing</CardTitle><CardDescription>Process payroll for all employees using one salary structure</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label>Month *</Label><Input type="month" className="mt-1 h-9" value={bulkMonth} onChange={(e) => setBulkMonth(e.target.value)} /></div>
                <div>
                  <Label>Salary Structure *</Label>
                  <Select value={bulkStructureId} onValueChange={setBulkStructureId}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{salaryStructures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Annual CTC (₹) *</Label><Input type="number" className="mt-1 h-9" placeholder="e.g. 600000" value={bulkCTC || ""} onChange={(e) => setBulkCTC(parseFloat(e.target.value) || 0)} /></div>
              </div>
              <Button type="button" variant="outline" onClick={generateBulkPreview} className="gap-1.5">
                <Calculator className="h-4 w-4" />Generate Preview
              </Button>
              {bulkPreview.length > 0 && (
                <>
                  <div className="max-h-52 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Gross (₹)</TableHead>
                          <TableHead>Net (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkPreview.map((p) => (
                          <TableRow key={p.employeeId}>
                            <TableCell className="font-medium text-sm">{p.name}</TableCell>
                            <TableCell className="text-sm">₹{p.gross.toLocaleString("en-IN")}</TableCell>
                            <TableCell className="text-sm font-semibold text-primary">₹{p.net.toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button onClick={processBulk} className="gap-1.5">
                    <Calculator className="h-4 w-4" />Process Bulk Payroll ({bulkPreview.length} employees)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STRUCTURES ── */}
        <TabsContent value="structures" className="mt-4 space-y-4">
          {/* Add new structure */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" />Add Salary Structure</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Structure Name *</Label><Input className="mt-1 h-9" placeholder="e.g. Standard, Senior" value={newStruct.name} onChange={(e) => setNewStruct((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Basic % of Gross</Label><Input type="number" className="mt-1 h-9" value={newStruct.basicPercent} onChange={(e) => setNewStruct((p) => ({ ...p, basicPercent: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>HRA %</Label><Input type="number" className="mt-1 h-9" value={newStruct.hraPercent} onChange={(e) => setNewStruct((p) => ({ ...p, hraPercent: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>DA %</Label><Input type="number" className="mt-1 h-9" value={newStruct.daPercent} onChange={(e) => setNewStruct((p) => ({ ...p, daPercent: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Special Allowance %</Label><Input type="number" className="mt-1 h-9" value={newStruct.specialAllowancePercent} onChange={(e) => setNewStruct((p) => ({ ...p, specialAllowancePercent: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>PF %</Label><Input type="number" className="mt-1 h-9" value={newStruct.pfPercent} onChange={(e) => setNewStruct((p) => ({ ...p, pfPercent: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Professional Tax (₹/month)</Label><Input type="number" className="mt-1 h-9" value={newStruct.professionalTax} onChange={(e) => setNewStruct((p) => ({ ...p, professionalTax: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              <Button type="button" onClick={addStructure} className="gap-1.5"><Plus className="h-4 w-4" />Add Structure</Button>
            </CardContent>
          </Card>

          {/* Existing structures */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Existing Structures</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Basic%</TableHead>
                    <TableHead>HRA%</TableHead>
                    <TableHead>DA%</TableHead>
                    <TableHead>Special%</TableHead>
                    <TableHead>PF%</TableHead>
                    <TableHead>Prof. Tax</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryStructures.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.basicPercent}%</TableCell>
                      <TableCell>{s.hraPercent}%</TableCell>
                      <TableCell>{s.daPercent}%</TableCell>
                      <TableCell>{s.specialAllowancePercent}%</TableCell>
                      <TableCell>{s.pfPercent}%</TableCell>
                      <TableCell>₹{s.professionalTax}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteStructure(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {salaryStructures.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No salary structures added yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
