import { useState, useMemo, useCallback } from "react";
import { Download, RefreshCw, CheckSquare, Square, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getEmployees, getBranches, getIndianPayroll, setIndianPayroll, getPayrollMasters, type IndianPayrollEntry } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";
import { fmtINR } from "@/lib/utils";
import { toast } from "sonner";

function calcPT(m: number) { const a = m*12; if(a<=21000)return 0; if(a<=30000)return 135; if(a<=75000)return 174; if(a<=100000)return 195; return 200; }
function calcESIC(g: number) { return g<=21000 ? Math.round(g*0.0075) : 0; }
function calcPF(b: number) { return Math.min(Math.round(b*0.12), 1800); }
function calcTDS(t: number) { if(t<=300000)return 0; if(t<=600000)return Math.round((t-300000)*0.05/12); if(t<=900000)return Math.round(((t-600000)*0.10+15000)/12); if(t<=1200000)return Math.round(((t-900000)*0.15+45000)/12); if(t<=1500000)return Math.round(((t-1200000)*0.20+90000)/12); return Math.round(((t-1500000)*0.30+150000)/12); }

function calcEntry(entry: IndianPayrollEntry, masters: ReturnType<typeof getPayrollMasters>): IndianPayrollEntry {
  const { salary, td, p, l, a, alt, idle, idleRate, overTime, bonusDed, loan, adv } = entry;
  const ded = Math.max(0, a - Math.max(0, l - alt));
  const pd = Math.max(0, p + l - ded);
  const ratio = pd / Math.max(td, 1);
  const basic = Math.round(salary * (masters.basicPercent / 100) * ratio);
  const ti1 = Math.round(salary * (masters.ti1Percent / 100) * ratio);
  const ma = Math.round(masters.maFixed * ratio);
  const hra = Math.round(salary * (masters.hraPercent / 100) * ratio);
  const idleAmount = Math.round(idle * idleRate);
  const totalAdd = basic + ti1 + ma + hra + Math.round(overTime) + idleAmount;
  const esic075 = calcESIC(totalAdd);
  const pf12 = calcPF(basic);
  const pt200 = calcPT(salary);
  const tds = calcTDS((totalAdd - esic075 - pf12 - pt200) * 12);
  const totalDed = esic075 + pf12 + pt200 + tds + bonusDed + loan + adv;
  return { ...entry, ded, pd, na: Math.max(0, td - p - l - a - entry.off), idleAmount, basic, ti1, ma, hra, totalAdd, esic: esic075, pf: pf12, pt: pt200, tds, pf12, pt200, esic075, rOff: 0, totalDed, netSalary: Math.round(totalAdd - totalDed), status: "Processed" };
}

export default function PayrollSheet() {
  const [branchFilter, setBranchFilter] = useState("all");
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const employees = getEmployees();
  const branches = getBranches();
  const masters = getPayrollMasters();
  const allPayroll = getIndianPayroll();

  const payroll = useMemo(() => allPayroll.filter((e) => e.month === month && (branchFilter === "all" || e.branch === branchFilter)), [allPayroll, month, branchFilter]);

  const stats = useMemo(() => ({
    totalAdd: payroll.reduce((s, e) => s + e.totalAdd, 0),
    totalDed: payroll.reduce((s, e) => s + e.totalDed, 0),
    netPayout: payroll.reduce((s, e) => s + e.netSalary, 0),
    count: payroll.length,
  }), [payroll]);

  const generateEntries = useCallback(() => {
    const existing = new Set(allPayroll.filter((e) => e.month === month).map((e) => e.employeeId));
    const emps = branchFilter === "all" ? employees : employees.filter((e) => e.branch === branchFilter);
    const toAdd = emps.filter((e) => !existing.has(e.id)).map((emp, i) => {
      const base: IndianPayrollEntry = {
        id: `${month}-${emp.id}`, sno: i + 1, employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`, fatherName: emp.fatherName || "—",
        designationName: emp.designation, branch: emp.branch, month,
        salary: emp.monthlySalary || 30000, mode: "Biometric" as const,
        alt: 1, td: 26, wd: 22, idle: 0, idleRate: 0, p: 22, l: 0, a: 0, off: 4,
        ded: 0, pd: 22, na: 0, idleAmount: 0, minusHrs: 0,
        basic: 0, ti1: 0, ma: 0, hra: 0, overTime: 0, totalAdd: 0,
        esic: 0, pf: 0, pt: 0, tds: 0, pf12: 0, pt200: 0, esic075: 0,
        bonusDed: 0, loan: 0, adv: 0, rOff: 0, totalDed: 0, netSalary: 0, status: "Draft" as const,
      };
      return calcEntry(base, masters);
    });
    if (toAdd.length > 0) { setIndianPayroll([...allPayroll, ...toAdd]); toast.success(`Generated ${toAdd.length} entries`); }
    else toast.info("Entries already exist for this month");
  }, [allPayroll, month, branchFilter, employees, masters]);

  const recalcAll = useCallback(() => {
    const updated = allPayroll.map((e) => e.month === month && (branchFilter === "all" || e.branch === branchFilter) ? calcEntry(e, masters) : e);
    setIndianPayroll(updated);
    toast.success("All entries recalculated");
  }, [allPayroll, month, branchFilter, masters]);

  const markPaid = useCallback(() => {
    setIndianPayroll(allPayroll.map((e) => selected.has(e.id) ? { ...e, status: "Paid" as const } : e));
    setSelected(new Set());
    toast.success(`${selected.size} entries marked as Paid`);
  }, [allPayroll, selected]);

  const toggleAll = useCallback(() => setSelected(selected.size === payroll.length ? new Set() : new Set(payroll.map((e) => e.id))), [selected, payroll]);
  const toggleOne = useCallback((id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); }, [selected]);

  const handleExport = useCallback(() => {
    exportCsv([
      ["S.No","Employee","Branch","Salary","Basic","HRA","TI1","MA","OT","Total Add","ESIC","PF","PT","TDS","Total Ded","Net"],
      ...payroll.map((e) => [e.sno, e.employeeName, e.branch, e.salary, e.basic, e.hra, e.ti1, e.ma, e.overTime, e.totalAdd, e.esic075, e.pf12, e.pt200, e.tds, e.totalDed, e.netSalary])
    ], `payroll-sheet-${month}`);
  }, [payroll, month]);

  return (
    <div className="space-y-4">
      <PageHeader title="Indian Payroll Sheet" description="Statutory-compliant payroll with ESIC, PF, PT, and TDS">
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export</Button>
        <Button variant="outline" onClick={recalcAll} className="gap-2"><RefreshCw className="h-4 w-4" />Recalculate</Button>
        <Button onClick={generateEntries}>Generate Entries</Button>
        {selected.size > 0 && <Button variant="secondary" onClick={markPaid}>Mark {selected.size} Paid</Button>}
      </PageHeader>

      <div className="flex flex-wrap gap-3 items-center">
        <Input type="month" className="w-40" value={month} onChange={(e) => setMonth(e.target.value)} />
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Branches" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Branches</SelectItem>{branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Employees" value={stats.count} />
        <StatCard title="Gross Earnings" value={fmtINR(stats.totalAdd)} />
        <StatCard title="Total Deductions" value={fmtINR(stats.totalDed)} />
        <StatCard title="Net Payout" value={fmtINR(stats.netPayout)} />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><button onClick={toggleAll}>{selected.size === payroll.length && payroll.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button></TableHead>
                <TableHead>Employee</TableHead><TableHead>Branch</TableHead><TableHead>P/L/A/Off</TableHead>
                <TableHead>Basic</TableHead><TableHead>HRA</TableHead><TableHead>TI1</TableHead><TableHead>MA</TableHead><TableHead>Total Add</TableHead>
                <TableHead>ESIC</TableHead><TableHead>PF</TableHead><TableHead>PT</TableHead><TableHead>TDS</TableHead><TableHead>Total Ded</TableHead>
                <TableHead>Net Salary</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.map((e) => (
                <TableRow key={e.id} className={selected.has(e.id) ? "bg-primary/5" : ""}>
                  <TableCell><button onClick={() => toggleOne(e.id)}>{selected.has(e.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}</button></TableCell>
                  <TableCell><p className="font-medium text-sm">{e.employeeName}</p><p className="text-xs text-muted-foreground">{e.designationName}</p></TableCell>
                  <TableCell className="text-sm">{e.branch}</TableCell>
                  <TableCell className="text-xs">{e.p}/{e.l}/{e.a}/{e.off}</TableCell>
                  <TableCell className="text-sm">{fmtINR(e.basic)}</TableCell>
                  <TableCell className="text-sm">{fmtINR(e.hra)}</TableCell>
                  <TableCell className="text-sm">{fmtINR(e.ti1)}</TableCell>
                  <TableCell className="text-sm">{fmtINR(e.ma)}</TableCell>
                  <TableCell className="text-sm font-medium">{fmtINR(e.totalAdd)}</TableCell>
                  <TableCell className="text-sm text-red-600">{fmtINR(e.esic075)}</TableCell>
                  <TableCell className="text-sm text-red-600">{fmtINR(e.pf12)}</TableCell>
                  <TableCell className="text-sm text-red-600">{fmtINR(e.pt200)}</TableCell>
                  <TableCell className="text-sm text-red-600">{fmtINR(e.tds)}</TableCell>
                  <TableCell className="text-sm text-red-600">{fmtINR(e.totalDed)}</TableCell>
                  <TableCell className="text-sm font-bold text-primary">{fmtINR(e.netSalary)}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                </TableRow>
              ))}
              {payroll.length === 0 && <EmptyState colSpan={16} message="No payroll entries found. Click Generate Entries to start." />}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
