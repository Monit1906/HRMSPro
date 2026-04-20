import { useState, useMemo, useCallback } from "react";
import { Plus, Star, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getPerformanceReviews, setPerformanceReviews, getEmployees, type PerformanceReview, type PerformanceGoal } from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function StarRating({ value, max = 5, onChange }: { value: number; max?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 cursor-pointer ${i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} onClick={() => onChange?.(i + 1)} />
      ))}
    </div>
  );
}

export default function PerformancePage() {
  const [viewId, setViewId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [empFilter, setEmpFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const reviews = getPerformanceReviews();
  const employees = getEmployees();

  const [newReview, setNewReview] = useState({ employeeId: "", reviewPeriod: "", reviewType: "Quarterly" as PerformanceReview["reviewType"], goals: [] as PerformanceGoal[] });
  const [goalInput, setGoalInput] = useState({ title: "", description: "", targetDate: "", weight: 25 });

  const filtered = useMemo(() => reviews.filter((r) => (empFilter === "all" || r.employeeId === empFilter) && (statusFilter === "all" || r.status === statusFilter)), [reviews, empFilter, statusFilter]);
  const viewReview = reviews.find((r) => r.id === viewId);

  const stats = useMemo(() => {
    const completed = reviews.filter((r) => r.status === "Completed");
    const avgRating = completed.length ? completed.reduce((s, r) => s + r.overallRating, 0) / completed.length : 0;
    return { avgRating, total: reviews.length, completed: completed.length, pending: reviews.filter((r) => r.status === "Self Review" || r.status === "Manager Review").length };
  }, [reviews]);

  const addGoal = useCallback(() => {
    if (!goalInput.title) { toast.error("Goal title required"); return; }
    setNewReview((p) => ({ ...p, goals: [...p.goals, { id: String(Date.now()), ...goalInput, selfScore: 0, managerScore: 0, status: "Not Started" as const }] }));
    setGoalInput({ title: "", description: "", targetDate: "", weight: 25 });
  }, [goalInput]);

  const submitReview = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.employeeId || !newReview.reviewPeriod) { toast.error("Fill required fields"); return; }
    if (!newReview.goals.length) { toast.error("Add at least one goal"); return; }
    const emp = employees.find((e) => e.id === newReview.employeeId);
    setPerformanceReviews([...reviews, {
      id: String(Date.now()), employeeId: newReview.employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      reviewPeriod: newReview.reviewPeriod, reviewType: newReview.reviewType,
      goals: newReview.goals, selfRating: 0, managerRating: 0, overallRating: 0,
      status: "Self Review" as const, comments: "", managerComments: "",
      createdOn: new Date().toISOString().split("T")[0],
    }]);
    toast.success("Performance review created");
    setAddOpen(false);
    setNewReview({ employeeId: "", reviewPeriod: "", reviewType: "Quarterly", goals: [] });
  }, [newReview, reviews, employees]);

  const updateRating = useCallback((id: string, field: "selfRating" | "managerRating", value: number) => {
    setPerformanceReviews(reviews.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (updated.selfRating > 0 && updated.managerRating > 0) {
        updated.overallRating = (updated.selfRating + updated.managerRating) / 2;
        updated.status = "Completed";
      }
      return updated;
    }));
  }, [reviews]);

  return (
    <div className="space-y-4">
      <PageHeader title="Performance Management" description="Goals, reviews, and ratings for your team">
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" />New Review Cycle</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Avg Rating" value={stats.avgRating.toFixed(1)} sub="out of 5.0" />
        <StatCard title="Total Reviews" value={stats.total} />
        <StatCard title="Completed" value={stats.completed} />
        <StatCard title="Pending" value={stats.pending} />
      </div>

      <Tabs defaultValue="reviews">
        <TabsList><TabsTrigger value="reviews">Reviews</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Employees</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{["Draft","Self Review","Manager Review","Completed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead>Type</TableHead><TableHead>Goals</TableHead><TableHead>Self</TableHead><TableHead>Manager</TableHead><TableHead>Overall</TableHead><TableHead>Status</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employeeName}</TableCell>
                    <TableCell>{r.reviewPeriod}</TableCell>
                    <TableCell>{r.reviewType}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{r.goals.length}</span>
                        <Progress value={r.goals.filter((g) => g.status === "Completed").length / r.goals.length * 100} className="w-12 h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>{r.selfRating > 0 ? <span className="text-yellow-500">{r.selfRating.toFixed(1)} ⭐</span> : <span className="text-xs text-muted-foreground">Pending</span>}</TableCell>
                    <TableCell>{r.managerRating > 0 ? <span className="text-yellow-500">{r.managerRating.toFixed(1)} ⭐</span> : <span className="text-xs text-muted-foreground">Pending</span>}</TableCell>
                    <TableCell>{r.overallRating > 0 ? <span className={r.overallRating >= 4 ? "text-green-600 font-bold" : r.overallRating >= 3 ? "text-blue-600 font-bold" : "text-orange-600 font-bold"}>{r.overallRating.toFixed(2)}</span> : "—"}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewId(r.id)}><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <EmptyState colSpan={9} message="No reviews found" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Individual Ratings</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reviews.filter((r) => r.selfRating > 0).map((r) => ({ name: r.employeeName.split(" ")[0], Self: r.selfRating, Manager: r.managerRating, Overall: r.overallRating }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Self" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Manager" fill="#14b8a6" radius={[3,3,0,0]} />
                  <Bar dataKey="Overall" fill="#f59e0b" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewId} onOpenChange={(v) => { if (!v) setViewId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Performance Review — {viewReview?.employeeName}</DialogTitle><DialogDescription>{viewReview?.reviewPeriod} · {viewReview?.reviewType}</DialogDescription></DialogHeader>
          {viewReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-xs text-muted-foreground mb-1">Self Rating</p><StarRating value={viewReview.selfRating} onChange={(v) => updateRating(viewReview.id, "selfRating", v)} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">Manager Rating</p><StarRating value={viewReview.managerRating} onChange={(v) => updateRating(viewReview.id, "managerRating", v)} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">Overall</p><p className="text-2xl font-bold text-primary">{viewReview.overallRating > 0 ? viewReview.overallRating.toFixed(2) : "—"}</p></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Goals & Objectives</p>
                {viewReview.goals.map((g) => (
                  <div key={g.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium">{g.title}</p><p className="text-xs text-muted-foreground">{g.description}</p></div>
                      <div className="flex gap-2"><StatusBadge status={g.status} /><span className="text-xs text-muted-foreground">{g.weight}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Review Cycle</DialogTitle><DialogDescription>Set up goals and initiate the review</DialogDescription></DialogHeader>
          <form onSubmit={submitReview} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Employee *</Label>
                <Select value={newReview.employeeId} onValueChange={(v) => setNewReview((p) => ({ ...p, employeeId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Review Period *</Label><Input className="mt-1" placeholder="e.g. Q1 2026" value={newReview.reviewPeriod} onChange={(e) => setNewReview((p) => ({ ...p, reviewPeriod: e.target.value }))} /></div>
              <div>
                <Label>Type</Label>
                <Select value={newReview.reviewType} onValueChange={(v) => setNewReview((p) => ({ ...p, reviewType: v as PerformanceReview["reviewType"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Annual">Annual</SelectItem><SelectItem value="Probation">Probation</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Add Goals</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Title *</Label><Input className="mt-0.5 h-8" value={goalInput.title} onChange={(e) => setGoalInput((p) => ({ ...p, title: e.target.value }))} /></div>
                <div><Label className="text-xs">Target Date</Label><Input type="date" className="mt-0.5 h-8" value={goalInput.targetDate} onChange={(e) => setGoalInput((p) => ({ ...p, targetDate: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Description</Label><Input className="mt-0.5 h-8" value={goalInput.description} onChange={(e) => setGoalInput((p) => ({ ...p, description: e.target.value }))} /></div>
              <Button type="button" variant="outline" size="sm" onClick={addGoal}><Plus className="h-3.5 w-3.5 mr-1" />Add Goal</Button>
              {newReview.goals.map((g) => <div key={g.id} className="text-xs bg-muted rounded px-2 py-1">{g.title} ({g.weight}%)</div>)}
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit">Create Review</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
