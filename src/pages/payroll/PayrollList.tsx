import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPayroll, setPayroll, getEmployees } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const PIE_COLORS = ["#2dd4bf","#3b82f6","#ef4444","#f59e0b"];

export default function PayrollList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [slipId, setSlipId] = useState<string | null>(null);

  const payroll  = getPayroll();
  const employees = getEmployees();

  const uniqueMonths = useMemo(() => [...new Set(payroll.map((p) => p.month))].sort().reverse(), [payroll]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return payroll.filter((e) => {
      const matchSearch = e.employeeName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      const matchMonth  = monthFilter === "all" || e.month === monthFilter;
      return matchSearch && matchStatus && matchMonth;
    });
  }, [payroll, searchQuery, statusFilter, monthFilter]);

  const stats = useMemo(() => ({
    totalGross: payroll.reduce((s, p) => s + p.basicSalary + p.allowances, 0),
    totalNet:   payroll.reduce((s, p) => s + p.netSalary, 0),
    totalTax:   payroll.reduce((s, p) => s + p.tax, 0),
    paidCount:  payroll.filter((p) => p.status === "Paid").length,
  }), [payroll]);

  const chartData = useMemo(() => payroll.slice(0, 8).map((p) => ({
    name: p.employeeName.split(" ")[0], Basic: p.basicSalary, Allowances: p.allowances, Net: p.netSalary,
  })), [payroll]);

  const pieData = useMemo(() => [
    { name: "Basic",      value: payroll.reduce((s, p) => s + p.basicSalary, 0) },
    { name: "Allowances", value: payroll.reduce((s, p) => s + p.allowances, 0) },
    { name: "Tax",        value: payroll.reduce((s, p) => s + p.tax, 0) },
    { name: "Deductions", value: payroll.reduce((s, p) => s + p.deductions, 0) },
  ], [payroll]);

  const handleMarkPaid = useCallback((id: string) => {
    setPayroll(payroll.map((p) => p.id === id ? { ...p, status: "Paid" as const, paidOn: new Date().toISOString() } : p));
    toast.success("Payroll marked as paid");
  }, [payroll]);

  const handleExport = useCallback(() => {
    exportCsv(
      [["Employee","Month","Basic","Allowances","Deductions","Tax","Net","Status"],
       ...filtered.map((p) => [p.employeeName, p.month, p.basicSalary, p.allowances, p.deductions, p.tax, p.netSalary, p.status])],
      "payroll"
    );
  }, [filtered]);

  const slipEntry    = slipId ? payroll.find((p) => p.id === slipId) : null;
  const slipEmployee = slipEntry ? employees.find((e) => e.id === slipEntry.employeeId) : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Payroll Records" description="Manage salary processing and payslips">
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export</Button>
        <Button onClick={() => navigate("/payroll/process")}>Process Payroll</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Gross" value={`₹${stats.totalGross.toLocaleString("en-IN")}`} />
        <StatCard title="Net Disbursed" value={`₹${stats.totalNet.toLocaleString("en-IN")}`} />
        <StatCard title="Tax Deducted" value={`₹${stats.totalTax.toLocaleString("en-IN")}`} />
        <StatCard title="Paid Entries" value={stats.paidCount} />
      </div>

      <Tabs defaultValue="list">
        <TabsList><TabsTrigger value="list">Payroll List</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList>

        <TabsContent value="list" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonths.map((m) => <SelectItem key={m} value={m}>{new Date(m + "-01").toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["Draft","Processed","Paid"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">Month</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead className="hidden md:table-cell">Allowances</TableHead>
                  <TableHead className="hidden md:table-cell">Deductions</TableHead>
                  <TableHead className="hidden lg:table-cell">Tax</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.employeeName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{new Date(e.month + "-01").toLocaleDateString("en-IN", { year: "numeric", month: "short" })}</TableCell>
                    <TableCell>₹{e.basicSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden md:table-cell text-green-600">+₹{e.allowances.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden md:table-cell text-red-600">-₹{e.deductions.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden lg:table-cell text-red-600">-₹{e.tax.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-semibold">₹{e.netSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSlipId(e.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        {e.status === "Processed" && <Button size="sm" className="h-7 text-xs" onClick={() => handleMarkPaid(e.id)}>Mark Paid</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <EmptyState colSpan={9} message="No payroll records found" action={<Button size="sm" variant="outline" onClick={() => navigate("/payroll/process")}>Process First Payroll</Button>} />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Salary Comparison</CardTitle><CardDescription>Basic vs Allowances vs Net</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                  <Bar dataKey="Basic" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Allowances" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Net" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Salary Components</CardTitle><CardDescription>Distribution across all employees</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Salary Slip Dialog */}
      <Dialog open={!!slipId} onOpenChange={(v) => { if (!v) setSlipId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Salary Slip</DialogTitle>
            <DialogDescription>{slipEntry && new Date(slipEntry.month + "-01").toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</DialogDescription>
          </DialogHeader>
          {slipEntry && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-base">
                    {slipEmployee ? `${slipEmployee.firstName} ${slipEmployee.lastName}` : slipEntry.employeeName}
                  </p>
                  {slipEmployee && (
                    <>
                      <p className="text-muted-foreground">{slipEmployee.employeeId} · {slipEmployee.designation}</p>
                      <p className="text-muted-foreground">{slipEmployee.department} · {slipEmployee.branch}</p>
                    </>
                  )}
                </div>
                <StatusBadge status={slipEntry.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Earnings</p>
                  {[["Basic Salary", slipEntry.basicSalary], ["Allowances", slipEntry.allowances]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between">
                      <span className="text-muted-foreground">{l}</span>
                      <span>₹{(v as number).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Gross</span>
                    <span>₹{(slipEntry.basicSalary + slipEntry.allowances).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Deductions</p>
                  {[["Deductions", slipEntry.deductions], ["Tax", slipEntry.tax]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between">
                      <span className="text-muted-foreground">{l}</span>
                      <span className="text-red-600">-₹{(v as number).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium border-t pt-1 text-red-600">
                    <span>Total Ded.</span>
                    <span>-₹{(slipEntry.deductions + slipEntry.tax).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg bg-primary/5 rounded-lg px-3 py-2">
                <span>Net Salary</span>
                <span className="text-primary">₹{slipEntry.netSalary.toLocaleString("en-IN")}</span>
              </div>
              <Button variant="outline" className="w-full gap-2 no-print" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />Print Payslip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
