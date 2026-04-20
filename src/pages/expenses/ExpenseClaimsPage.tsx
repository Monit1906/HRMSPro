import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Eye, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getEmployees, getExpenseClaims, setExpenseClaims, type ExpenseClaim } from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const CATEGORIES = ["Travel","Accommodation","Meals & Entertainment","Office Supplies","Software & Tools","Training","Communication","Medical","Other"];
const COLORS = ["#14b8a6","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#10b981","#f97316","#06b6d4","#84cc16"];
const EMPTY = { employeeId: "", category: "", amount: 0, currency: "INR", date: new Date().toISOString().split("T")[0], description: "", receiptRef: "", projectCode: "" };

export default function ExpenseClaimsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form, setForm] = useState(EMPTY);

  const employees = getEmployees();
  const claims = getExpenseClaims();
  const viewClaim = claims.find((c) => c.id === viewId);

  const stats = useMemo(() => {
    const pending = claims.filter((c) => c.status === "Pending");
    return {
      pendingCount: pending.length,
      totalPending: pending.reduce((s, c) => s + c.amount, 0),
      totalApproved: claims.filter((c) => c.status === "Approved" || c.status === "Paid").reduce((s, c) => s + c.amount, 0),
      totalPaid: claims.filter((c) => c.status === "Paid").reduce((s, c) => s + c.amount, 0),
    };
  }, [claims]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    claims.filter((c) => c.status !== "Rejected").forEach((c) => { map[c.category] = (map[c.category] || 0) + c.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [claims]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return claims.filter((c) => {
      const matchSearch = c.employeeName.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchEmp = empFilter === "all" || c.employeeId === empFilter;
      return matchSearch && matchStatus && matchEmp;
    });
  }, [claims, searchQuery, statusFilter, empFilter]);

  const submitClaim = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === form.employeeId);
    if (!emp) { toast.error("Select an employee"); return; }
    setExpenseClaims([...claims, { id: String(Date.now()), employeeId: form.employeeId, employeeName: `${emp.firstName} ${emp.lastName}`, category: form.category, amount: form.amount, currency: form.currency, date: form.date, description: form.description, receiptRef: form.receiptRef, projectCode: form.projectCode, status: "Pending", submittedOn: new Date().toISOString().split("T")[0] }]);
    toast.success("Expense claim submitted");
    setAddOpen(false);
    setForm(EMPTY);
  }, [form, employees, claims]);

  const handleApprove = useCallback((id: string) => {
    setExpenseClaims(claims.map((c) => c.id === id ? { ...c, status: "Approved" as const, approvedOn: new Date().toISOString().split("T")[0], approvedBy: "Emily Rodriguez" } : c));
    toast.success("Claim approved");
    setViewId(null);
  }, [claims]);

  const handleReject = useCallback(() => {
    if (!rejectId) return;
    setExpenseClaims(claims.map((c) => c.id === rejectId ? { ...c, status: "Rejected" as const, rejectionReason: rejectReason } : c));
    toast.success("Claim rejected");
    setRejectId(null);
    setRejectReason("");
    setViewId(null);
  }, [rejectId, rejectReason, claims]);

  const handleMarkPaid = useCallback((id: string) => {
    setExpenseClaims(claims.map((c) => c.id === id ? { ...c, status: "Paid" as const, paidOn: new Date().toISOString().split("T")[0] } : c));
    toast.success("Marked as paid");
  }, [claims]);

  return (
    <div className="space-y-4">
      <PageHeader title="Expense Claims" description="Manage employee expense submissions and reimbursements">
        <Button variant="outline" onClick={() => exportCsv([["Employee","Category","Amount","Currency","Date","Status"], ...filtered.map((c) => [c.employeeName, c.category, c.amount, c.currency, c.date, c.status])], "expense-claims")} className="gap-2"><Download className="h-4 w-4" />Export</Button>
        <Button onClick={() => { setForm(EMPTY); setAddOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />New Claim</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Pending Claims" value={stats.pendingCount} sub={`₹${stats.totalPending.toLocaleString("en-IN")} pending`} />
        <StatCard title="Total Approved" value={`₹${stats.totalApproved.toLocaleString("en-IN")}`} />
        <StatCard title="Total Paid" value={`₹${stats.totalPaid.toLocaleString("en-IN")}`} />
        <StatCard title="Total Claims" value={claims.length} />
      </div>

      <Tabs defaultValue="claims">
        <TabsList><TabsTrigger value="claims">All Claims</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList>

        <TabsContent value="claims" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Employees</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{["Pending","Approved","Rejected","Paid"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employeeName}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{c.category}</span></TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{c.description}</TableCell>
                    <TableCell className="text-sm">{formatDate(c.date)}</TableCell>
                    <TableCell className="font-medium">{c.currency} {c.amount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewId(c.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        {c.status === "Pending" && (
                          <>
                            <Button size="sm" className="h-7 text-xs" onClick={() => handleApprove(c.id)}>Approve</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setRejectId(c.id); setViewId(null); }}>Reject</Button>
                          </>
                        )}
                        {c.status === "Approved" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkPaid(c.id)}>Mark Paid</Button>}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setExpenseClaims(claims.filter((x) => x.id !== c.id)); toast.success("Deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <EmptyState colSpan={7} message="No expense claims found" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Expenses by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Employee Expense Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Pending</TableHead><TableHead>Approved</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const ec = claims.filter((c) => c.employeeId === emp.id);
                    if (!ec.length) return null;
                    return (
                      <TableRow key={emp.id}>
                        <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                        <TableCell className="text-orange-600">₹{ec.filter((c) => c.status === "Pending").reduce((s, c) => s + c.amount, 0).toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₹{ec.filter((c) => c.status === "Approved" || c.status === "Paid").reduce((s, c) => s + c.amount, 0).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{ec.reduce((s, c) => s + c.amount, 0).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  }).filter(Boolean)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      {viewClaim && (
        <Dialog open={!!viewId} onOpenChange={(v) => { if (!v) setViewId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{viewClaim.category}</DialogTitle><DialogDescription>{viewClaim.employeeName} · {formatDate(viewClaim.date)}</DialogDescription></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Amount</span><span className="text-xl font-bold">{viewClaim.currency} {viewClaim.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span>{viewClaim.description}</span></div>
              {viewClaim.receiptRef && <div className="flex justify-between"><span className="text-muted-foreground">Receipt</span><span>{viewClaim.receiptRef}</span></div>}
              {viewClaim.projectCode && <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{viewClaim.projectCode}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={viewClaim.status} /></div>
              {viewClaim.status === "Pending" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => handleApprove(viewClaim.id)}>Approve</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { setRejectId(viewClaim.id); setViewId(null); }}>Reject</Button>
                </div>
              )}
              {viewClaim.status === "Approved" && <Button className="w-full" onClick={() => { handleMarkPaid(viewClaim.id); setViewId(null); }}>Mark as Paid</Button>}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(v) => { if (!v) { setRejectId(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Expense Claim</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Rejection Reason *</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject}>Confirm Rejection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Claim Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Expense Claim</DialogTitle></DialogHeader>
          <form onSubmit={submitClaim} className="space-y-3">
            <div><Label>Employee *</Label><Select value={form.employeeId} onValueChange={(v) => setForm((p) => ({ ...p, employeeId: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category *</Label><Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Date *</Label><Input type="date" className="mt-1" required value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount *</Label><Input type="number" className="mt-1" required value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Currency</Label><Select value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INR">INR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit">Submit Claim</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
