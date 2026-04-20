import { useState, useCallback } from "react";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getWeekOffConfigs, setWeekOffConfigs, getDepartments, getBranches } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const DAYS = [{ value: 0, label: "Sunday" },{ value: 1, label: "Monday" },{ value: 2, label: "Tuesday" },{ value: 3, label: "Wednesday" },{ value: 4, label: "Thursday" },{ value: 5, label: "Friday" },{ value: 6, label: "Saturday" }];

export default function WeekOffConfig() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ department: "", branch: "", weekOffDays: [] as number[], effectiveFrom: "" });
  const configs = getWeekOffConfigs();
  const departments = getDepartments();
  const branches = getBranches();

  const toggleDay = useCallback((day: number) => {
    setForm((p) => ({ ...p, weekOffDays: p.weekOffDays.includes(day) ? p.weekOffDays.filter((d) => d !== day) : [...p.weekOffDays, day] }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (form.weekOffDays.length === 0) { toast.error("Select at least one week-off day"); return; }
    setWeekOffConfigs([...configs, { id: String(Date.now()), department: form.department || undefined, branch: form.branch || undefined, weekOffDays: form.weekOffDays, effectiveFrom: form.effectiveFrom }]);
    toast.success("Week-off configuration added");
    setOpen(false);
    setForm({ department: "", branch: "", weekOffDays: [], effectiveFrom: "" });
  }, [form, configs]);

  const getDayNames = (days: number[]) => days.sort().map((d) => DAYS.find((x) => x.value === d)?.label).join(", ");

  return (
    <div className="space-y-4">
      <PageHeader title="Week-off Configuration" description="Configure weekly off days by department or branch">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Configuration</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Week-off Configuration</DialogTitle><DialogDescription>Set weekly off days for a department or branch</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Department (Optional)</Label>
                <Select value={form.department} onValueChange={(v) => setForm((p) => ({ ...p, department: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branch (Optional)</Label>
                <Select value={form.branch} onValueChange={(v) => setForm((p) => ({ ...p, branch: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="All Branches" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Branches</SelectItem>{branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Week-off Days *</Label>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {DAYS.map((day) => (
                    <div key={day.value} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.weekOffDays.includes(day.value)} onCheckedChange={() => toggleDay(day.value)} />
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div><Label>Effective From *</Label><Input type="date" className="mt-1" required value={form.effectiveFrom} onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Add Configuration</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Branch</TableHead><TableHead>Week-off Days</TableHead><TableHead>Effective From</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
          <TableBody>
            {configs.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.department || "All"}</TableCell>
                <TableCell>{c.branch || "All"}</TableCell>
                <TableCell>{getDayNames(c.weekOffDays)}</TableCell>
                <TableCell>{new Date(c.effectiveFrom).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => { setWeekOffConfigs(configs.filter((x) => x.id !== c.id)); toast.success("Deleted"); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {configs.length === 0 && <EmptyState colSpan={5} message="No week-off configurations yet" />}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
