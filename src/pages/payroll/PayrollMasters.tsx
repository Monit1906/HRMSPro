import { useState, useCallback } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPayrollMasters, setPayrollMasters, getEmployees, setIndianPayroll, getIndianPayroll } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import { fmtINR } from "@/lib/utils";
import { toast } from "sonner";

const PT_SLABS = [
  { income: "Up to ₹21,000", monthly: "₹0", annual: "₹0" },
  { income: "₹21,001 – ₹30,000", monthly: "₹135", annual: "₹1,620" },
  { income: "₹30,001 – ₹75,000", monthly: "₹174", annual: "₹2,088" },
  { income: "₹75,001 – ₹1,00,000", monthly: "₹195", annual: "₹2,340" },
  { income: "Above ₹1,00,000", monthly: "₹200", annual: "₹2,400" },
];
const TDS_SLABS = [
  { range: "Up to ₹3,00,000", rate: "0%", tax: "Nil" },
  { range: "₹3,00,001 – ₹6,00,000", rate: "5%", tax: "₹0 – ₹15,000" },
  { range: "₹6,00,001 – ₹9,00,000", rate: "10%", tax: "₹15,000 – ₹45,000" },
  { range: "₹9,00,001 – ₹12,00,000", rate: "15%", tax: "₹45,000 – ₹90,000" },
  { range: "₹12,00,001 – ₹15,00,000", rate: "20%", tax: "₹90,000 – ₹1,50,000" },
  { range: "Above ₹15,00,000", rate: "30%", tax: "Above ₹1,50,000" },
];

export default function PayrollMasters() {
  const masters = getPayrollMasters();
  const [form, setForm] = useState({ ...masters });
  const employees = getEmployees();
  const allPayroll = getIndianPayroll();

  const upd = useCallback((k: string, v: number | string) => setForm((p) => ({ ...p, [k]: v })), []);

  const save = useCallback(() => { setPayrollMasters(form); toast.success("Payroll masters saved"); }, [form]);

  const updateSalary = useCallback((empId: string, salary: number) => {
    const updated = allPayroll.map((e) => e.employeeId === empId ? { ...e, salary } : e);
    setIndianPayroll(updated);
    toast.success("Salary updated");
  }, [allPayroll]);

  return (
    <div className="space-y-4">
      <PageHeader title="Payroll Masters" description="Configure salary components, statutory rates, and allowance masters">
        <Button onClick={save} className="gap-2"><Save className="h-4 w-4" />Save Masters</Button>
      </PageHeader>

      <Tabs defaultValue="structure">
        <TabsList>
          <TabsTrigger value="structure">Salary Structure</TabsTrigger>
          <TabsTrigger value="pt">PT Slabs</TabsTrigger>
          <TabsTrigger value="tds">TDS / Income Tax</TabsTrigger>
          <TabsTrigger value="esicpf">ESIC & PF</TabsTrigger>
          <TabsTrigger value="salary-master">Employee Salary Master</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Component Percentages</CardTitle><CardDescription>Derived from monthly salary</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "basicPercent", label: "Basic Salary (%)" },
                { key: "hraPercent", label: "HRA (%)" },
                { key: "ti1Percent", label: "Allowance 1 (TI1) (%)" },
                { key: "maFixed", label: "Medical Allowance (₹/month fixed)" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label className="flex-1">{label}</Label>
                  <Input type="number" className="w-24" value={(form as Record<string, number>)[key] || 0} onChange={(e) => upd(key, +e.target.value)} />
                </div>
              ))}
              <div>
                <Label>TI1 Column Label</Label>
                <Input className="mt-1" value={form.ti1Label} onChange={(e) => upd("ti1Label", e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Preview (₹30,000 salary, 22/26 days)</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {(() => {
                const salary = 30000; const ratio = 22/26;
                const basic = Math.round(salary * (form.basicPercent/100) * ratio);
                const hra = Math.round(salary * (form.hraPercent/100) * ratio);
                const ti1 = Math.round(salary * (form.ti1Percent/100) * ratio);
                const ma = Math.round(form.maFixed * ratio);
                const totalAdd = basic + hra + ti1 + ma;
                const pf = Math.min(Math.round(basic*0.12), 1800);
                const esic = totalAdd <= 21000 ? Math.round(totalAdd*0.0075) : 0;
                const pt = totalAdd > 100000/12 ? 200 : 0;
                return (
                  <>
                    {[["Basic", basic],["HRA", hra],[form.ti1Label || "TI1", ti1],["Medical", ma],["Total Earnings", totalAdd]].map(([l, v]) => (
                      <div key={l as string} className={`flex justify-between ${l === "Total Earnings" ? "font-medium border-t pt-1" : ""}`}><span className="text-muted-foreground">{l}</span><span>{fmtINR(v as number)}</span></div>
                    ))}
                    {[["PF 12%", pf],["ESIC 0.75%", esic],["PT", pt]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between text-red-600"><span className="text-muted-foreground">{l}</span><span>-{fmtINR(v as number)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1 text-primary"><span>Net</span><span>{fmtINR(totalAdd - pf - esic - pt)}</span></div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pt" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Professional Tax Slabs</CardTitle><CardDescription>Maharashtra slabs — auto-applied in payroll</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Annual Taxable Income</TableHead><TableHead>Monthly PT</TableHead><TableHead>Annual PT</TableHead></TableRow></TableHeader>
                <TableBody>{PT_SLABS.map((s, i) => <TableRow key={i}><TableCell>{s.income}</TableCell><TableCell>{s.monthly}</TableCell><TableCell>{s.annual}</TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tds" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">TDS / Income Tax — New Tax Regime FY 2024-25</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Annual Income Range</TableHead><TableHead>Rate</TableHead><TableHead>Tax Amount</TableHead></TableRow></TableHeader>
                <TableBody>{TDS_SLABS.map((s, i) => <TableRow key={i}><TableCell>{s.range}</TableCell><TableCell className="font-medium">{s.rate}</TableCell><TableCell>{s.tax}</TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esicpf" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">ESIC</CardTitle><CardDescription>Applicable if gross ≤ ₹21,000/month</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee contribution</span><span className="font-medium">0.75% of Gross</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Employer contribution</span><span className="font-medium">3.25% of Gross</span></div>
              <p className="text-xs text-muted-foreground pt-1">Auto-applied when gross ≤ ₹21,000.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">PF (EPF)</CardTitle><CardDescription>12% of Basic, capped at ₹1,800/month</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee (EPF)</span><span className="font-medium">12% of Basic</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Employer (EPF+EPS)</span><span className="font-medium">12% (EPS 8.33% + EPF 3.67%)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cap</span><span className="font-medium">₹1,800/month</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary-master" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Employee Salary Master</CardTitle><CardDescription>Monthly CTC in ₹ per employee</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Emp ID</TableHead><TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Branch</TableHead><TableHead>Monthly CTC (₹)</TableHead><TableHead>Annual CTC</TableHead></TableRow></TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const ctc = emp.monthlySalary || 25000;
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                        <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                        <TableCell>{emp.designation}</TableCell>
                        <TableCell>{emp.branch}</TableCell>
                        <TableCell>
                          <Input type="number" className="w-28 h-7 text-sm" defaultValue={ctc} onBlur={(e) => updateSalary(emp.id, +e.target.value)} />
                        </TableCell>
                        <TableCell>{fmtINR(ctc * 12)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
