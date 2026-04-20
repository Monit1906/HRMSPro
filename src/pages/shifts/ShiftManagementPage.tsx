import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getEmployees, getDepartments, getShifts, setShifts, getShiftAssignments, setShiftAssignments, type Shift, type ShiftAssignment } from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FULL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const EMPTY_SHIFT = { name: "", startTime: "09:00", endTime: "18:00", breakMinutes: 60, color: "#14b8a6", weekDays: [1,2,3,4,5] };
const EMPTY_ASSIGN = { employeeId: "", shiftId: "", startDate: new Date().toISOString().split("T")[0], endDate: "", type: "Permanent" as ShiftAssignment["type"] };

export default function ShiftManagementPage() {
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editShiftId, setEditShiftId] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState<Omit<Shift, "id">>(EMPTY_SHIFT);
  const [assignForm, setAssignForm] = useState<Omit<ShiftAssignment, "id">>(EMPTY_ASSIGN);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);

  const employees = getEmployees();
  const departments = getDepartments();
  const shifts = getShifts();
  const assignments = getShiftAssignments();

  const weekStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; }), [weekStart]);

  const filteredEmployees = useMemo(() => employees.filter((e) => {
    const matchSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    return matchSearch && matchDept;
  }), [employees, searchQuery, deptFilter]);

  const getEmpShift = useCallback((empId: string, date: Date): Shift | null => {
    const dateStr = date.toISOString().split("T")[0];
    const assign = assignments.find((a) => a.employeeId === empId && a.startDate <= dateStr && (!a.endDate || a.endDate >= dateStr));
    if (!assign) return null;
    return shifts.find((s) => s.id === assign.shiftId) || null;
  }, [assignments, shifts]);

  const submitShift = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name) { toast.error("Shift name required"); return; }
    if (editShiftId) {
      setShifts(shifts.map((s) => s.id === editShiftId ? { ...s, ...shiftForm } : s));
      toast.success("Shift updated");
    } else {
      setShifts([...shifts, { id: String(Date.now()), ...shiftForm }]);
      toast.success("Shift created");
    }
    setShiftDialogOpen(false);
  }, [shiftForm, editShiftId, shifts]);

  const submitAssign = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.employeeId || !assignForm.shiftId) { toast.error("Select employee and shift"); return; }
    const filtered = assignments.filter((a) => a.employeeId !== assignForm.employeeId);
    setShiftAssignments([...filtered, { id: String(Date.now()), ...assignForm }]);
    toast.success("Shift assigned");
    setAssignDialogOpen(false);
    setAssignForm(EMPTY_ASSIGN);
  }, [assignForm, assignments]);

  const toggleDay = useCallback((day: number) => {
    setShiftForm((p) => ({ ...p, weekDays: p.weekDays.includes(day) ? p.weekDays.filter((d) => d !== day) : [...p.weekDays, day] }));
  }, []);

  const getDuration = (s: string, e: string, b: number) => {
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm) - b;
    return `${Math.floor(total / 60)}h${total % 60 > 0 ? ` ${total % 60}m` : ""}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Shift Management" description="Define shifts, assign rosters, and track schedules">
        <Button variant="outline" onClick={() => { setAssignForm(EMPTY_ASSIGN); setAssignDialogOpen(true); }}>Assign Shift</Button>
        <Button onClick={() => { setShiftForm(EMPTY_SHIFT); setEditShiftId(null); setShiftDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />New Shift</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Defined Shifts" value={shifts.length} />
        <StatCard title="Assigned Employees" value={new Set(assignments.map((a) => a.employeeId)).size} />
        <StatCard title="Active Rosters" value={assignments.filter((a) => !a.endDate || a.endDate >= new Date().toISOString().split("T")[0]).length} />
        <StatCard title="Unassigned" value={employees.length - new Set(assignments.map((a) => a.employeeId)).size} />
      </div>

      <Tabs defaultValue="roster">
        <TabsList><TabsTrigger value="roster">Weekly Roster</TabsTrigger><TabsTrigger value="shifts">Shift Definitions</TabsTrigger><TabsTrigger value="assignments">Assignments</TabsTrigger></TabsList>

        <TabsContent value="roster" className="mt-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekOffset((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <p className="text-sm font-medium min-w-[200px] text-center">
                {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {weekOffset === 0 && <span className="ml-2 text-xs text-primary">Current Week</span>}
              </p>
              <Button variant="outline" size="icon" onClick={() => setWeekOffset((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              {weekOffset !== 0 && <Button variant="ghost" size="sm" className="text-xs" onClick={() => setWeekOffset(0)}>Today</Button>}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 w-44" />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All Depts" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Employee</TableHead>
                    {weekDates.map((d, i) => {
                      const isToday = d.toDateString() === new Date().toDateString();
                      return <TableHead key={i} className={`text-center min-w-[90px] ${isToday ? "bg-primary/5 text-primary" : ""}`}><p>{DAY_NAMES[d.getDay()]}</p><p className="text-xs font-normal">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></TableHead>;
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell><p className="font-medium text-sm">{emp.firstName} {emp.lastName}</p><p className="text-xs text-muted-foreground">{emp.department}</p></TableCell>
                      {weekDates.map((d, di) => {
                        const shift = getEmpShift(emp.id, d);
                        const isWeekend = [0, 6].includes(d.getDay());
                        return (
                          <TableCell key={di} className="text-center p-1">
                            {shift ? (
                              <div className="rounded text-xs px-1.5 py-1 bg-primary/10 text-primary">
                                <p className="font-medium">{shift.name}</p>
                                <p className="text-[10px] opacity-75">{shift.startTime}–{shift.endTime}</p>
                              </div>
                            ) : isWeekend ? <span className="text-xs text-muted-foreground">Off</span> : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {filteredEmployees.length === 0 && <EmptyState colSpan={8} message="No employees found" />}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: shift.color }} />
                      <p className="font-medium">{shift.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShiftForm({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime, breakMinutes: shift.breakMinutes, color: shift.color, weekDays: [...shift.weekDays] }); setEditShiftId(shift.id); setShiftDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setShifts(shifts.filter((s) => s.id !== shift.id)); setShiftAssignments(assignments.filter((a) => a.shiftId !== shift.id)); toast.success("Shift deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{shift.startTime} – {shift.endTime} ({getDuration(shift.startTime, shift.endTime, shift.breakMinutes)})</p>
                  <p className="text-xs text-muted-foreground mt-1">Break: {shift.breakMinutes}min</p>
                  <div className="flex gap-0.5 mt-2">
                    {[0,1,2,3,4,5,6].map((d) => (
                      <span key={d} className={`text-xs px-1 rounded ${shift.weekDays.includes(d) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{DAY_NAMES[d]}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{assignments.filter((a) => a.shiftId === shift.id).length} employees assigned</p>
                </CardContent>
              </Card>
            ))}
            {shifts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8 col-span-3">No shifts defined yet</p>}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Shift</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Type</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const emp = employees.find((e) => e.id === a.employeeId);
                  const shift = shifts.find((s) => s.id === a.shiftId);
                  if (!emp || !shift) return null;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: shift.color }} />
                          <span>{shift.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(a.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                      <TableCell>{a.endDate ? new Date(a.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Ongoing"}</TableCell>
                      <TableCell><StatusBadge status={a.type} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setShiftAssignments(assignments.filter((x) => x.id !== a.id)); toast.success("Assignment removed"); }}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  );
                }).filter(Boolean)}
                {assignments.length === 0 && <EmptyState colSpan={7} message="No shift assignments yet" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shift Dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editShiftId ? "Edit Shift" : "Create New Shift"}</DialogTitle></DialogHeader>
          <form onSubmit={submitShift} className="space-y-3">
            <div><Label>Shift Name *</Label><Input className="mt-1" required value={shiftForm.name} onChange={(e) => setShiftForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Start Time</Label><Input type="time" className="mt-1" value={shiftForm.startTime} onChange={(e) => setShiftForm((p) => ({ ...p, startTime: e.target.value }))} /></div>
              <div><Label>End Time</Label><Input type="time" className="mt-1" value={shiftForm.endTime} onChange={(e) => setShiftForm((p) => ({ ...p, endTime: e.target.value }))} /></div>
              <div><Label>Break (min)</Label><Input type="number" className="mt-1" value={shiftForm.breakMinutes} onChange={(e) => setShiftForm((p) => ({ ...p, breakMinutes: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>Color</Label><Input type="color" className="mt-1 h-10 cursor-pointer" value={shiftForm.color} onChange={(e) => setShiftForm((p) => ({ ...p, color: e.target.value }))} /></div>
            <div>
              <Label>Working Days</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {FULL_DAYS.map((day, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={shiftForm.weekDays.includes(i)} onCheckedChange={() => toggleDay(i)} />
                    <span>{day.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShiftDialogOpen(false)}>Cancel</Button><Button type="submit">{editShiftId ? "Update" : "Create"} Shift</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Shift</DialogTitle><DialogDescription>Assign a shift to an employee</DialogDescription></DialogHeader>
          <form onSubmit={submitAssign} className="space-y-3">
            <div><Label>Employee *</Label><Select value={assignForm.employeeId} onValueChange={(v) => setAssignForm((p) => ({ ...p, employeeId: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Shift *</Label><Select value={assignForm.shiftId} onValueChange={(v) => setAssignForm((p) => ({ ...p, shiftId: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select shift" /></SelectTrigger><SelectContent>{shifts.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" className="mt-1" required value={assignForm.startDate} onChange={(e) => setAssignForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" className="mt-1" value={assignForm.endDate} onChange={(e) => setAssignForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div><Label>Type</Label><Select value={assignForm.type} onValueChange={(v) => setAssignForm((p) => ({ ...p, type: v as ShiftAssignment["type"] }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Permanent">Permanent</SelectItem><SelectItem value="Temporary">Temporary</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button><Button type="submit">Assign Shift</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
