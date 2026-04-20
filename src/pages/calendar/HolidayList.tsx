import { useState, useMemo, useCallback } from "react";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHolidays, setHolidays, getBranches } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const EMPTY_FORM = { name: "", date: "", type: "Public" as "Public" | "Optional" | "Restricted", description: "", applicableBranches: [] as string[] };

export default function HolidayList() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });

  const holidays = getHolidays();
  const branches = getBranches();

  const closeDialog = useCallback(() => { setOpen(false); setEditingId(null); setForm(EMPTY_FORM); }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setHolidays(holidays.map((h) => h.id === editingId ? { ...h, ...form } : h));
      toast.success("Holiday updated");
    } else {
      setHolidays([...holidays, { id: String(Date.now()), ...form }]);
      toast.success("Holiday added");
    }
    closeDialog();
  }, [editingId, form, holidays, closeDialog]);

  const handleEdit = useCallback((h: typeof holidays[0]) => {
    setForm({ name: h.name, date: h.date, type: h.type, description: h.description, applicableBranches: h.applicableBranches });
    setEditingId(h.id);
    setOpen(true);
  }, []);

  const toggleBranch = useCallback((id: string) => {
    setForm((p) => ({
      ...p,
      applicableBranches: p.applicableBranches.includes(id) ? p.applicableBranches.filter((b) => b !== id) : [...p.applicableBranches, id],
    }));
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [calMonth]);

  const getHolidayForDay = useCallback((day: number | null) => {
    if (!day) return null;
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.find((h) => h.date === dateStr) || null;
  }, [holidays, calMonth]);

  const sortedHolidays = useMemo(() => [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [holidays]);

  return (
    <div className="space-y-4">
      <PageHeader title="Holiday Calendar" description="Manage public, optional, and restricted holidays">
        <Button variant="outline" className="gap-2" onClick={() => exportCsv([["Name","Date","Type","Description"], ...holidays.map((h) => [h.name, h.date, h.type, h.description])], "holidays")}><Download className="h-4 w-4" />Export</Button>
        <Button className="gap-2" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); }}><Plus className="h-4 w-4" />Add Holiday</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        {(["Public","Optional","Restricted"] as const).map((type) => (
          <StatCard key={type} title={type} value={holidays.filter((h) => h.type === type).length} />
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList><TabsTrigger value="list">List View</TabsTrigger><TabsTrigger value="calendar">Calendar View</TabsTrigger></TabsList>

        <TabsContent value="list" className="mt-3">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Holiday Name</TableHead><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Type</TableHead><TableHead>Branches</TableHead><TableHead className="w-20" /></TableRow></TableHeader>
              <TableBody>
                {sortedHolidays.map((h) => {
                  const d = new Date(h.date);
                  const isUpcoming = d >= new Date();
                  return (
                    <TableRow key={h.id} className={!isUpcoming ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>{d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.toLocaleDateString("en-US", { weekday: "long" })}</TableCell>
                      <TableCell><StatusBadge status={h.type} /></TableCell>
                      <TableCell className="text-sm">{h.applicableBranches.length === 0 || h.applicableBranches.length === branches.length ? "All Branches" : `${h.applicableBranches.length} branch(es)`}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(h)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setHolidays(holidays.filter((x) => x.id !== h.id)); toast.success("Holiday deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {holidays.length === 0 && <EmptyState colSpan={6} message="No holidays configured yet" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="icon" onClick={() => setCalMonth((p) => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}><ChevronLeft className="h-4 w-4" /></Button>
                <h3 className="font-semibold">{MONTH_NAMES[calMonth.month]} {calMonth.year}</h3>
                <Button variant="outline" size="icon" onClick={() => setCalMonth((p) => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const holiday = getHolidayForDay(day);
                  const isToday = day === new Date().getDate() && calMonth.month === new Date().getMonth() && calMonth.year === new Date().getFullYear();
                  const isWeekend = day ? [0, 6].includes(new Date(calMonth.year, calMonth.month, day).getDay()) : false;
                  return (
                    <div key={idx} className={`min-h-[60px] rounded border text-xs p-1 ${holiday ? "bg-orange-50 border-orange-200" : isWeekend ? "bg-gray-50" : "border-transparent"} ${isToday ? "ring-2 ring-primary" : ""}`}>
                      {day && (
                        <>
                          <span className={`font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                          {holiday && <p className="text-[10px] text-orange-700 truncate mt-0.5">{holiday.name}</p>}
                          {isWeekend && !holiday && <p className="text-[10px] text-muted-foreground">Weekend</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Holiday" : "Add Holiday"}</DialogTitle><DialogDescription>Configure holiday details and branch applicability</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Holiday Name *</Label><Input className="mt-1" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" className="mt-1" required value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div>
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof form.type }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Public">Public</SelectItem><SelectItem value="Optional">Optional</SelectItem><SelectItem value="Restricted">Restricted</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Applicable Branches</Label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.applicableBranches.includes(b.id)} onCheckedChange={() => toggleBranch(b.id)} />
                    <span>{b.name} ({b.city})</span>
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-1 text-xs h-6" onClick={() => setForm((p) => ({ ...p, applicableBranches: p.applicableBranches.length === branches.length ? [] : branches.map((b) => b.id) }))}>
                {form.applicableBranches.length === branches.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">{editingId ? "Update" : "Add"} Holiday</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
