import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployees, getPayroll, setPayroll, getSalaryStructures, setSalaryStructures, type SalaryStructure } from "@/lib/mockData";
import { toast } from "sonner";

function calcFromStructure(ctc: number, s: SalaryStructure) {
  const basic = (ctc * s.basicPercent) / 100;
  const hra = (ctc * s.hraPercent) / 100;
  const da = (ctc * s.daPercent) / 100;
  const special = (ctc * s.specialAllowancePercent) / 100;
  const pf = (basic * s.pfPercent) / 100;
  const pt = s.professionalTax;
  const taxable = basic + hra + da + special - pf - pt;
  const tax = taxable > 10000 ? taxable * 0.1 : taxable > 5000 ? taxable * 0.05 : 0;
  const net = basic + hra + da + special - pf - pt - tax;
  return { basic, hra, da, special, pf, pt, tax, net, gross: basic + hra + da + special };
}

export default function PayrollProcess() {
  const navigate = useNavigate();
  const employees = getEmployees();
  const payrollRecords = getPayroll();
  const salaryStructures = getSalaryStructures();

  const [form, setForm] = useState({ employeeId: "", month: "", structureId: "", ctc: 0, basicSalary: 0, hra: 0, da: 0, specialAllowance: 0, allowances: 0, deductions: 0, providentFund: 0, professionalTax: 200, tax: 0 });
  const [bulkMonth, setBulkMonth] = useState("");
  const [bulkStructureId, setBulkStructureId] = useState("");
  const [bulkCTC, setBulkCTC] = useState(0);
  const [bulkPreview, setBulkPreview] = useState<{ employeeId: string; name: string; net: number }[]>([]);

  const upd = useCallback((k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v })), []);

  const selectedStructure = salaryStructures.find((s) => s.id === form.structureId);
  const autoCalc = selectedStructure && form.ctc > 0 ? calcFromStructure(form.ctc, selectedStructure) : null;
  const netSalary = autoCalc ? autoCalc.net : form.basicSalary + form.hra + form.da + form.specialAllowance + form.allowances - form.deductions - form.providentFund - form.professionalTax - form.tax;

  const applyStructure = useCallback(() => {
    if (!autoCalc) return;
    setForm((p) => ({ ...p, basicSalary: autoCalc.basic, hra: autoCalc.hra, da: autoCalc.da, specialAllowance: autoCalc.special, allowances: autoCalc.hra + autoCalc.da + autoCalc.special, deductions: 0, providentFund: autoCalc.pf, professionalTax: autoCalc.pt, tax: autoCalc.tax }));
    toast.success("Structure applied");
  }, [autoCalc]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === form.employeeId);
    if (!emp) return;
    const struct = salaryStructures.find((s) => s.id === form.structureId);
    setPayroll([...payrollRecords, {
      id: String(Date.now()), employeeId: form.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`, month: form.month,
      basicSalary: form.basicSalary, hra: form.hra, da: form.da, specialAllowance: form.specialAllowance,
      allowances: form.hra + form.da + form.specialAllowance + form.allowances,
      deductions: form.deductions, providentFund: form.providentFund, professionalTax: form.professionalTax,
      tax: form.tax, netSalary, status: "Processed" as const,
      processedOn: new Date().toISOString(), salaryStructure: struct?.name,
    }]);
    toast.success("Payroll processed successfully");
    navigate("/payroll");
  }, [form, employees, payrollRecords, salaryStructures, netSalary, navigate]);

  const generateBulkPreview = useCallback(() => {
    if (!bulkMonth || !bulkStructureId || !bulkCTC) { toast.error("Fill month, structure, and CTC"); return; }
    const struct = salaryStructures.find((s) => s.id === bulkStructureId);
    if (!struct) return;
    setBulkPreview(employees.map((emp) => ({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, net: calcFromStructure(bulkCTC, struct).net })));
  }, [bulkMonth, bulkStructureId, bulkCTC, salaryStructures, employees]);

  const processBulk = useCallback(() => {
    if (!bulkPreview.length) return;
    const struct = salaryStructures.find((s) => s.id === bulkStructureId)!;
    const newEntries = bulkPreview.map((p) => {
      const c = calcFromStructure(bulkCTC, struct);
      return { id: String(Date.now() + Math.random()), employeeId: p.employeeId, employeeName: p.name, month: bulkMonth, basicSalary: c.basic, hra: c.hra, da: c.da, specialAllowance: c.special, allowances: c.hra + c.da + c.special, deductions: 0, providentFund: c.pf, professionalTax: c.pt, tax: c.tax, netSalary: c.net, status: "Processed" as const, processedOn: new Date().toISOString(), salaryStructure: struct.name };
    });
    setPayroll([...payrollRecords, ...newEntries]);
    toast.success(`Bulk payroll processed for ${newEntries.length} employees`);
    navigate("/payroll");
  }, [bulkPreview, bulkCTC, bulkMonth, bulkStructureId, salaryStructures, payrollRecords, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/payroll")}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-2xl font-bold">Process Payroll</h1><p className="text-sm text-muted-foreground">Single or bulk salary processing</p></div>
      </div>

      <Tabs defaultValue="single">
        <TabsList><TabsTrigger value="single">Single Employee</TabsTrigger><TabsTrigger value="bulk">Bulk Processing</TabsTrigger><TabsTrigger value="structures">Salary Structures</TabsTrigger></TabsList>

        <TabsContent value="single" className="mt-4">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Salary Details</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Employee *</Label>
                        <Select value={form.employeeId} onValueChange={(v) => upd("employeeId", v)}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                          <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Month *</Label><Input type="month" className="mt-1" required value={form.month} onChange={(e) => upd("month", e.target.value)} /></div>
                    </div>
                    <div>
                      <Label>Salary Structure</Label>
                      <div className="flex gap-2 mt-1">
                        <Select value={form.structureId} onValueChange={(v) => upd("structureId", v)}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Select structure" /></SelectTrigger>
                          <SelectContent>{salaryStructures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        {form.structureId && (
                          <>
                            <Input type="number" className="w-36" placeholder="Annual CTC" value={form.ctc || ""} onChange={(e) => upd("ctc", parseFloat(e.target.value) || 0)} />
                            <Button type="button" variant="outline" size="sm" onClick={applyStructure}><Calculator className="h-4 w-4 mr-1" />Auto-Fill</Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[["basicSalary","Basic Salary"],["hra","HRA"],["da","DA"],["specialAllowance","Special Allowance"],["allowances","Other Allowances"],["deductions","Deductions"],["providentFund","Provident Fund"],["professionalTax","Professional Tax"],["tax","Income Tax"]].map(([k, l]) => (
                        <div key={k}><Label>{l}</Label><Input type="number" className="mt-1" value={(form as Record<string, number>)[k] || 0} onChange={(e) => upd(k, parseFloat(e.target.value) || 0)} /></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate("/payroll")}>Cancel</Button>
                  <Button type="submit">Process Payroll</Button>
                </div>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Salary Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[["Basic", form.basicSalary],["HRA", form.hra],["DA", form.da],["Special Allow.", form.specialAllowance],["Other Allow.", form.allowances]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>${(v as number).toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-medium border-t pt-1"><span>Gross</span><span>${(form.basicSalary+form.hra+form.da+form.specialAllowance+form.allowances).toLocaleString()}</span></div>
                  {[["Deductions",-form.deductions],["PF",-form.providentFund],["Prof. Tax",-form.professionalTax],["Tax",-form.tax]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between text-red-600"><span className="text-muted-foreground">{l}</span><span>-${Math.abs(v as number).toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 text-primary"><span>Net</span><span>${netSalary.toLocaleString()}</span></div>
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="bulk" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Bulk Payroll Processing</CardTitle><CardDescription>Process payroll for all employees at once</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Month *</Label><Input type="month" className="mt-1" value={bulkMonth} onChange={(e) => setBulkMonth(e.target.value)} /></div>
                <div>
                  <Label>Salary Structure *</Label>
                  <Select value={bulkStructureId} onValueChange={setBulkStructureId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{salaryStructures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Annual CTC *</Label><Input type="number" className="mt-1" value={bulkCTC || ""} onChange={(e) => setBulkCTC(parseFloat(e.target.value) || 0)} /></div>
              </div>
              <Button type="button" variant="outline" onClick={generateBulkPreview}>Generate Preview</Button>
              {bulkPreview.length > 0 && (
                <>
                  <div className="max-h-48 overflow-y-auto border rounded">
                    <Table>
                      <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Net Salary</TableHead></TableRow></TableHeader>
                      <TableBody>{bulkPreview.map((p) => (<TableRow key={p.employeeId}><TableCell>{p.name}</TableCell><TableCell>${p.net.toLocaleString()}</TableCell></TableRow>))}</TableBody>
                    </Table>
                  </div>
                  <Button onClick={processBulk}>Process Bulk Payroll ({bulkPreview.length} employees)</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div><CardTitle className="text-sm">Salary Structures</CardTitle><CardDescription>Define percentage-based salary templates</CardDescription></div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Basic%</TableHead><TableHead>HRA%</TableHead><TableHead>DA%</TableHead><TableHead>Special%</TableHead><TableHead>PF%</TableHead><TableHead>Prof.Tax</TableHead></TableRow></TableHeader>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
