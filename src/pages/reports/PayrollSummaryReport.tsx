import { useState, useMemo, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getIndianPayroll, getBranches } from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";
import { fmtINR } from "@/lib/utils";

const COLORS = ["#14b8a6","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#10b981"];

export default function PayrollSummaryReport() {
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const branches = getBranches();
  const allPayroll = getIndianPayroll();

  const monthPayroll = useMemo(() => allPayroll.filter((e) => e.month === month), [allPayroll, month]);

  const branchSummary = useMemo(() => {
    const branchNames = [...new Set([...branches.map((b) => b.name), ...monthPayroll.map((e) => e.branch)])];
    return branchNames.map((name) => {
      const entries = monthPayroll.filter((e) => e.branch === name);
      if (!entries.length) return null;
      return {
        branch: name,
        headcount: new Set(entries.map((e) => e.employeeId)).size,
        totalSalary: entries.reduce((s, e) => s + e.salary, 0),
        totalAdd: entries.reduce((s, e) => s + e.totalAdd, 0),
        totalDed: entries.reduce((s, e) => s + e.totalDed, 0),
        totalESIC: entries.reduce((s, e) => s + e.esic075, 0),
        totalPF: entries.reduce((s, e) => s + e.pf12, 0),
        totalPT: entries.reduce((s, e) => s + e.pt200, 0),
        totalTDS: entries.reduce((s, e) => s + e.tds, 0),
        totalLoan: entries.reduce((s, e) => s + e.loan, 0),
        totalAdv: entries.reduce((s, e) => s + e.adv, 0),
        netPayout: entries.reduce((s, e) => s + e.netSalary, 0),
        esicEligible: entries.filter((e) => e.totalAdd <= 21000).length,
      };
    }).filter(Boolean) as NonNullable<ReturnType<typeof branchSummary>[number]>[];
  }, [monthPayroll, branches]);

  const grand = useMemo(() => ({
    headcount: branchSummary.reduce((s, b) => s + b.headcount, 0),
    totalAdd: branchSummary.reduce((s, b) => s + b.totalAdd, 0),
    totalDed: branchSummary.reduce((s, b) => s + b.totalDed, 0),
    totalESIC: branchSummary.reduce((s, b) => s + b.totalESIC, 0),
    totalPF: branchSummary.reduce((s, b) => s + b.totalPF, 0),
    totalPT: branchSummary.reduce((s, b) => s + b.totalPT, 0),
    totalTDS: branchSummary.reduce((s, b) => s + b.totalTDS, 0),
    netPayout: branchSummary.reduce((s, b) => s + b.netPayout, 0),
  }), [branchSummary]);

  const handleExport = useCallback(() => {
    exportCsv([
      ["Branch","Headcount","Total CTC","Gross","ESIC","PF","PT","TDS","Net Payout"],
      ...branchSummary.map((b) => [b.branch, b.headcount, b.totalSalary, b.totalAdd, b.totalESIC, b.totalPF, b.totalPT, b.totalTDS, b.netPayout]),
      ["GRAND TOTAL", grand.headcount, "", grand.totalAdd, grand.totalESIC, grand.totalPF, grand.totalPT, grand.totalTDS, grand.netPayout],
    ], `branch-payroll-${month}`);
  }, [branchSummary, grand, month]);

  const periodLabel = new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <PageHeader title="Branch-wise Payroll Summary" description={`Statutory deductions and net payout — ${periodLabel}`}>
        <Input type="month" className="w-40" value={month} onChange={(e) => setMonth(e.target.value)} />
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Headcount" value={grand.headcount} sub={`${branchSummary.length} branches`} />
        <StatCard title="Gross Earnings" value={fmtINR(grand.totalAdd)} sub="Before deductions" />
        <StatCard title="Total Deductions" value={fmtINR(grand.totalDed)} sub="ESIC+PF+PT+TDS" />
        <StatCard title="Net Payout" value={fmtINR(grand.netPayout)} sub="Total disbursement" />
      </div>

      {branchSummary.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Earnings vs Deductions vs Net</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={branchSummary.map((b) => ({ branch: b.branch.split(" ")[0], Gross: b.totalAdd, Deductions: b.totalDed, Net: b.netPayout }))}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmtINR(v)} />
                    <Bar dataKey="Gross" fill="#3b82f6" radius={[3,3,0,0]} />
                    <Bar dataKey="Deductions" fill="#ef4444" radius={[3,3,0,0]} />
                    <Bar dataKey="Net" fill="#10b981" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Net Payout Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={branchSummary.map((b) => ({ name: b.branch.split(" ")[0], value: b.netPayout }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {branchSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Branch-wise Payroll Register — {periodLabel}</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead><TableHead>HC</TableHead><TableHead>Gross</TableHead>
                    <TableHead>ESIC 0.75%</TableHead><TableHead>PF 12%</TableHead><TableHead>PT</TableHead><TableHead>TDS</TableHead>
                    <TableHead>Total Ded.</TableHead><TableHead>Net Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchSummary.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{b.branch}</TableCell>
                      <TableCell>{b.headcount}</TableCell>
                      <TableCell>{fmtINR(b.totalAdd)}</TableCell>
                      <TableCell className="text-red-600">{fmtINR(b.totalESIC)}</TableCell>
                      <TableCell className="text-red-600">{fmtINR(b.totalPF)}</TableCell>
                      <TableCell className="text-red-600">{fmtINR(b.totalPT)}</TableCell>
                      <TableCell className="text-red-600">{fmtINR(b.totalTDS)}</TableCell>
                      <TableCell className="text-red-600 font-medium">{fmtINR(b.totalDed)}</TableCell>
                      <TableCell className="text-primary font-bold">{fmtINR(b.netPayout)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell>GRAND TOTAL</TableCell>
                    <TableCell>{grand.headcount}</TableCell>
                    <TableCell>{fmtINR(grand.totalAdd)}</TableCell>
                    <TableCell>{fmtINR(grand.totalESIC)}</TableCell>
                    <TableCell>{fmtINR(grand.totalPF)}</TableCell>
                    <TableCell>{fmtINR(grand.totalPT)}</TableCell>
                    <TableCell>{fmtINR(grand.totalTDS)}</TableCell>
                    <TableCell>{fmtINR(grand.totalDed)}</TableCell>
                    <TableCell className="text-primary">{fmtINR(grand.netPayout)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No payroll entries found for {periodLabel}. Go to Payroll → Indian Payroll Sheet and generate entries first.</CardContent></Card>
      )}
    </div>
  );
}
