import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Calendar, DollarSign, ChevronRight, Plus, MapPin,
  CheckCircle, XCircle, Edit, Save, X, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAttendance, setAttendance, getBranches, getEmployees, setEmployees,
  getLeaveApplications, setLeaveApplications, getLeaveTypes, getPayroll, getHolidays,
} from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useGeolocation, haversineMeters } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function EmployeePortal() {
  const navigate = useNavigate();
  const { user } = useRole();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const { coords, loading: locLoading, detect } = useGeolocation();

  // Derive the employee record for the logged-in user
  const employees = getEmployees();
  const currentEmployee = employees.find((e) => e.id === user.id);

  const [profileForm, setProfileForm] = useState({
    phone: currentEmployee?.phone ?? "",
    address: currentEmployee?.address ?? "",
    emergencyContact: currentEmployee?.emergencyContact ?? "",
  });

  const branches = getBranches();
  const attendance = getAttendance();
  const leaveApplications = getLeaveApplications();
  const leaveTypes = getLeaveTypes();
  const payroll = getPayroll();
  const holidays = getHolidays();

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => a.employeeId === user.id && a.date === today);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Employee-scoped data (only their own records)
  const myLeaves = useMemo(() => leaveApplications.filter((a) => a.employeeId === user.id), [leaveApplications, user.id]);
  const pendingLeaves = useMemo(() => myLeaves.filter((a) => a.status === "Pending"), [myLeaves]);
  const approvedLeaves = useMemo(() => myLeaves.filter((a) => a.status === "Approved"), [myLeaves]);
  const totalLeaveDays = useMemo(() => approvedLeaves.reduce((s, a) => s + a.days, 0), [approvedLeaves]);
  const myPayroll = useMemo(() =>
    payroll.filter((p) => p.employeeId === user.id).sort((a, b) => b.month.localeCompare(a.month)),
    [payroll, user.id]);
  const latestSlip = myPayroll[0];
  const upcomingHolidays = useMemo(() =>
    holidays.filter((h) => new Date(h.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4),
    [holidays]);
  const myAttendance = useMemo(() =>
    attendance.filter((a) => a.employeeId === user.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [attendance, user.id]);

  // Geolocation
  const nearestBranch = useMemo(() => {
    if (!coords) return null;
    return branches
      .map((b) => ({ ...b, distance: haversineMeters(coords, { lat: b.latitude, lng: b.longitude }) }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [coords, branches]);
  const inRange = nearestBranch ? nearestBranch.distance <= nearestBranch.radius : false;

  const handleCheckIn = useCallback(() => {
    if (!inRange || !coords || !nearestBranch) { toast.error("Not within branch radius"); return; }
    if (todayRecord) { toast.error("Already checked in today"); return; }
    const rec = {
      id: String(Date.now()), employeeId: user.id,
      employeeName: user.name, date: today,
      checkIn: currentTime.toTimeString().slice(0, 5),
      checkInLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name },
      status: "Present" as const, branch: nearestBranch.name,
    };
    setAttendance([...attendance, rec]);
    toast.success("Checked in successfully!");
  }, [inRange, coords, nearestBranch, user, today, currentTime, attendance, todayRecord]);

  const handleCheckOut = useCallback(() => {
    if (!inRange || !coords || !nearestBranch || !todayRecord) { toast.error("Cannot check out"); return; }
    if (todayRecord.checkOut) { toast.error("Already checked out today"); return; }
    const checkInTime = new Date(`${today}T${todayRecord.checkIn}:00`);
    const workHours = (currentTime.getTime() - checkInTime.getTime()) / 3_600_000;
    setAttendance(attendance.map((a) =>
      a.id === todayRecord.id
        ? { ...a, checkOut: currentTime.toTimeString().slice(0, 5), checkOutLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name }, workHours }
        : a
    ));
    toast.success(`Checked out — ${workHours.toFixed(1)}h worked`);
  }, [inRange, coords, nearestBranch, todayRecord, today, currentTime, attendance]);

  const submitLeave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please fill all fields"); return;
    }
    const days = Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / 86_400_000) + 1;
    setLeaveApplications([...leaveApplications, {
      id: String(Date.now()), employeeId: user.id, employeeName: user.name,
      leaveType: leaveForm.leaveType, startDate: leaveForm.startDate, endDate: leaveForm.endDate,
      days, reason: leaveForm.reason, status: "Pending", appliedOn: new Date().toISOString(),
    }]);
    toast.success("Leave application submitted!");
    setLeaveDialogOpen(false);
    setLeaveForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
  }, [leaveForm, leaveApplications, user]);

  const saveProfile = useCallback(() => {
    if (!currentEmployee) return;
    setEmployees(employees.map((e) =>
      e.id === user.id ? { ...e, phone: profileForm.phone, address: profileForm.address, emergencyContact: profileForm.emergencyContact } : e
    ));
    setEditingProfile(false);
    toast.success("Profile updated");
  }, [currentEmployee, employees, user.id, profileForm]);

  const greeting = currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 17 ? "Afternoon" : "Evening";

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Good {greeting}, {currentEmployee?.firstName || user.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm">{currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Button onClick={() => setLeaveDialogOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />Apply Leave
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Leave Taken" value={totalLeaveDays} sub="approved days" />
        <StatCard title="Pending" value={pendingLeaves.length} sub="leave requests" />
        <StatCard title="Days Present" value={myAttendance.filter((a) => a.status === "Present").length} sub="last 10 records" />
        <StatCard title="Last Salary" value={latestSlip ? `₹${latestSlip.netSalary.toLocaleString("en-IN")}` : "N/A"} sub={latestSlip ? formatDate(latestSlip.month + "-01") : ""} />
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="w-full sm:w-auto flex">
          <TabsTrigger value="attendance" className="flex-1 sm:flex-none">Attendance</TabsTrigger>
          <TabsTrigger value="leaves" className="flex-1 sm:flex-none">Leaves</TabsTrigger>
          <TabsTrigger value="payslips" className="flex-1 sm:flex-none">Payslips</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 sm:flex-none">My Profile</TabsTrigger>
        </TabsList>

        {/* ── ATTENDANCE ── */}
        <TabsContent value="attendance" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Check-in card */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-4xl font-bold tabular-nums text-center tracking-tight">
                  {currentTime.toTimeString().slice(0, 5)}
                </p>

                {todayRecord && (
                  <div className="grid grid-cols-2 gap-2 bg-muted rounded-lg p-2 text-xs">
                    <div><p className="text-muted-foreground">Check In</p><p className="font-semibold">{todayRecord.checkIn}</p></div>
                    {todayRecord.checkOut && <div><p className="text-muted-foreground">Check Out</p><p className="font-semibold">{todayRecord.checkOut}</p></div>}
                    {todayRecord.workHours && (
                      <div className="col-span-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Progress (8h target)</span>
                          <span className="font-medium">{todayRecord.workHours.toFixed(1)}h</span>
                        </div>
                        <Progress value={Math.min(100, (todayRecord.workHours / 8) * 100)} className="h-1.5" />
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {!coords ? (
                  <Button onClick={detect} disabled={locLoading} size="sm" variant="outline" className="w-full gap-2">
                    <MapPin className="h-3.5 w-3.5" />{locLoading ? "Detecting…" : "Detect My Location"}
                  </Button>
                ) : (
                  <div className="text-xs space-y-1.5">
                    {nearestBranch && (
                      <div className="flex justify-between items-center bg-muted rounded p-2">
                        <div>
                          <p className="font-medium">{nearestBranch.name}</p>
                          <p className="text-muted-foreground">{Math.round(nearestBranch.distance)}m away</p>
                        </div>
                        {inRange
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    )}
                    {!inRange && nearestBranch && (
                      <p className="text-red-600 dark:text-red-400 text-xs">Must be within {nearestBranch.radius}m to check in/out</p>
                    )}
                    <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={detect}>Refresh Location</Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={handleCheckIn} disabled={!!todayRecord || !inRange} className="gap-1">
                    Check In
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={!todayRecord || !!todayRecord?.checkOut || !inRange} className="gap-1">
                    Check Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attendance history */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">My Attendance</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => navigate("/attendance")}>View All <ChevronRight className="h-3 w-3" /></Button>
              </CardHeader>
              <CardContent>
                {myAttendance.length > 0 ? (
                  <div className="space-y-2">
                    {myAttendance.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div>
                          <p className="font-medium">{new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                          {rec.checkIn && <p className="text-xs text-muted-foreground">{rec.checkIn} → {rec.checkOut || "—"}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {rec.workHours && <span className="text-xs text-muted-foreground">{rec.workHours.toFixed(1)}h</span>}
                          <StatusBadge status={rec.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── LEAVES ── */}
        <TabsContent value="leaves" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">{myLeaves.length} total application(s)</p>
            <Button size="sm" onClick={() => setLeaveDialogOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />Apply Leave
            </Button>
          </div>

          {myLeaves.length > 0 ? (
            <div className="space-y-2">
              {myLeaves.map((leave) => (
                <Card key={leave.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{leave.leaveType}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · {leave.days} day(s)
                      </p>
                      {leave.reason && <p className="text-xs text-muted-foreground truncate mt-0.5">{leave.reason}</p>}
                      {leave.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Reason: {leave.rejectionReason}</p>
                      )}
                    </div>
                    <StatusBadge status={leave.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No leave applications yet</CardContent></Card>
          )}
        </TabsContent>

        {/* ── PAYSLIPS ── */}
        <TabsContent value="payslips" className="mt-4 space-y-3">
          {myPayroll.length > 0 ? (
            myPayroll.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{new Date(p.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                      <StatusBadge status={p.status} className="mt-0.5" />
                    </div>
                    <p className="text-xl font-bold text-primary">₹{p.netSalary.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div><p className="text-muted-foreground">Basic</p><p className="font-medium">₹{p.basicSalary.toLocaleString("en-IN")}</p></div>
                    <div><p className="text-muted-foreground">Allowances</p><p className="font-medium text-green-600">+₹{p.allowances.toLocaleString("en-IN")}</p></div>
                    <div><p className="text-muted-foreground">Deductions</p><p className="font-medium text-red-600">-₹{p.deductions.toLocaleString("en-IN")}</p></div>
                    <div><p className="text-muted-foreground">Tax</p><p className="font-medium text-red-600">-₹{p.tax.toLocaleString("en-IN")}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No payslips available yet</CardContent></Card>
          )}
        </TabsContent>

        {/* ── MY PROFILE ── */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-sm">My Profile</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">You can edit your contact details. HR/Admin fields are read-only.</p>
                </div>
              </div>
              {editingProfile ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingProfile(false); setProfileForm({ phone: currentEmployee?.phone ?? "", address: currentEmployee?.address ?? "", emergencyContact: currentEmployee?.emergencyContact ?? "" }); }} className="gap-1">
                    <X className="h-3.5 w-3.5" />Cancel
                  </Button>
                  <Button size="sm" onClick={saveProfile} className="gap-1">
                    <Save className="h-3.5 w-3.5" />Save
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)} className="gap-1">
                  <Edit className="h-3.5 w-3.5" />Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Read-only HR fields */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">HR / Admin Managed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Full Name", `${currentEmployee?.firstName ?? ""} ${currentEmployee?.lastName ?? ""}`],
                    ["Employee ID", currentEmployee?.employeeId ?? "—"],
                    ["Department", currentEmployee?.department ?? "—"],
                    ["Designation", currentEmployee?.designation ?? "—"],
                    ["Branch", currentEmployee?.branch ?? "—"],
                    ["Date of Joining", currentEmployee?.dateOfJoining ? formatDate(currentEmployee.dateOfJoining) : "—"],
                    ["Email", currentEmployee?.email ?? "—"],
                    ["Gender", currentEmployee?.gender ?? "—"],
                    ["Blood Group", currentEmployee?.bloodGroup ?? "—"],
                    ["Date of Birth", currentEmployee?.dateOfBirth ? formatDate(currentEmployee.dateOfBirth) : "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Self-Service Fields</p>

                <div>
                  <Label>Phone Number</Label>
                  {editingProfile ? (
                    <Input className="mt-1" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                  ) : (
                    <p className="text-sm mt-1">{currentEmployee?.phone || "—"}</p>
                  )}
                </div>

                <div>
                  <Label>Home Address</Label>
                  {editingProfile ? (
                    <Textarea className="mt-1 resize-none" rows={2} value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} />
                  ) : (
                    <p className="text-sm mt-1">{currentEmployee?.address || "—"}</p>
                  )}
                </div>

                <div>
                  <Label>Emergency Contact</Label>
                  {editingProfile ? (
                    <Input className="mt-1" value={profileForm.emergencyContact} onChange={(e) => setProfileForm((p) => ({ ...p, emergencyContact: e.target.value }))} />
                  ) : (
                    <p className="text-sm mt-1">{currentEmployee?.emergencyContact || "—"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming holidays panel */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingHolidays.length > 0 ? (
                <div className="space-y-2">
                  {upcomingHolidays.map((h) => (
                    <div key={h.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{h.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming holidays</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a new leave request for approval</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitLeave} className="space-y-4">
            <div>
              <Label>Leave Type *</Label>
              <Select value={leaveForm.leaveType} onValueChange={(v) => setLeaveForm((p) => ({ ...p, leaveType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>{leaveTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" className="mt-1" value={leaveForm.startDate} onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" className="mt-1" value={leaveForm.endDate} onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            {leaveForm.startDate && leaveForm.endDate && (
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">
                  {Math.max(0, Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / 86_400_000) + 1)} day(s)
                </span>
              </p>
            )}
            <div>
              <Label>Reason *</Label>
              <Textarea className="mt-1" value={leaveForm.reason} onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Application</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
