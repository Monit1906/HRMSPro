import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Calendar, DollarSign, User, ChevronRight, Plus, MapPin, CheckCircle, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAttendance, setAttendance, getBranches, getCurrentUser, getEmployees,
  getLeaveApplications, setLeaveApplications, getLeaveTypes, getPayroll, getHolidays,
} from "@/lib/mockData";
import { useGeolocation, haversineMeters } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function EmployeePortal() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });
  const { coords, loading, detect } = useGeolocation();

  const currentUser = getCurrentUser();
  const employees = getEmployees();
  const currentEmployee = employees.find((e) => e.id === currentUser?.id);
  const branches = getBranches();
  const attendance = getAttendance();
  const leaveApplications = getLeaveApplications();
  const leaveTypes = getLeaveTypes();
  const payroll = getPayroll();
  const holidays = getHolidays();

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => a.employeeId === currentUser?.id && a.date === today);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const myLeaves = useMemo(() => leaveApplications.filter((a) => a.employeeId === currentUser?.id), [leaveApplications, currentUser]);
  const pendingLeaves = useMemo(() => myLeaves.filter((a) => a.status === "Pending"), [myLeaves]);
  const approvedLeaves = useMemo(() => myLeaves.filter((a) => a.status === "Approved"), [myLeaves]);
  const totalLeaveDays = useMemo(() => approvedLeaves.reduce((s, a) => s + a.days, 0), [approvedLeaves]);
  const myPayroll = useMemo(() => payroll.filter((p) => p.employeeId === currentUser?.id).sort((a, b) => b.month.localeCompare(a.month)), [payroll, currentUser]);
  const latestSlip = myPayroll[0];
  const upcomingHolidays = useMemo(() =>
    holidays.filter((h) => new Date(h.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3),
    [holidays]);
  const myAttendance = useMemo(() =>
    attendance.filter((a) => a.employeeId === currentUser?.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7),
    [attendance, currentUser]);

  const nearestBranch = useMemo(() => {
    if (!coords) return null;
    return branches
      .map((b) => ({ ...b, distance: haversineMeters(coords, { lat: b.latitude, lng: b.longitude }) }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [coords, branches]);

  const inRange = nearestBranch ? nearestBranch.distance <= nearestBranch.radius : false;

  const handleCheckIn = useCallback(() => {
    if (!inRange || !coords || !nearestBranch) { toast.error("Not within branch radius"); return; }
    const rec = {
      id: String(Date.now()), employeeId: currentUser?.id || "3",
      employeeName: currentUser?.name || "Employee", date: today,
      checkIn: currentTime.toTimeString().slice(0, 5),
      checkInLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name },
      status: "Present" as const, branch: nearestBranch.name,
    };
    setAttendance([...attendance, rec]);
    toast.success("Checked in successfully!");
  }, [inRange, coords, nearestBranch, currentUser, today, currentTime, attendance]);

  const handleCheckOut = useCallback(() => {
    if (!inRange || !coords || !nearestBranch || !todayRecord) { toast.error("Cannot check out"); return; }
    const checkInTime = new Date(`${today}T${todayRecord.checkIn}:00`);
    const workHours = (currentTime.getTime() - checkInTime.getTime()) / 3_600_000;
    const updated = attendance.map((a) =>
      a.id === todayRecord.id
        ? { ...a, checkOut: currentTime.toTimeString().slice(0, 5), checkOutLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name }, workHours }
        : a
    );
    setAttendance(updated);
    toast.success(`Checked out — ${workHours.toFixed(1)}h worked`);
  }, [inRange, coords, nearestBranch, todayRecord, today, currentTime, attendance]);

  const submitLeave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please fill all fields"); return;
    }
    const days = Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / 86_400_000) + 1;
    setLeaveApplications([...leaveApplications, {
      id: String(Date.now()), employeeId: currentUser?.id || "3",
      employeeName: currentUser?.name || "Employee", leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate, endDate: leaveForm.endDate, days,
      reason: leaveForm.reason, status: "Pending", appliedOn: new Date().toISOString(),
    }]);
    toast.success("Leave application submitted!");
    setLeaveDialogOpen(false);
    setLeaveForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
  }, [leaveForm, leaveApplications, currentUser]);

  const greeting = currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 17 ? "Afternoon" : "Evening";

  const statusColor: Record<string, string> = {
    Present: "bg-green-100 text-green-700", Absent: "bg-red-100 text-red-700",
    "Half Day": "bg-yellow-100 text-yellow-700", "On Leave": "bg-blue-100 text-blue-700",
    Weekend: "bg-gray-100 text-gray-600", Holiday: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good {greeting}, {currentEmployee?.firstName || "Employee"} 👋</h1>
          <p className="text-muted-foreground text-sm">{currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Button onClick={() => setLeaveDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Apply Leave</Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Leave Taken" value={totalLeaveDays} sub="days this year" />
        <StatCard title="Pending Requests" value={pendingLeaves.length} sub="leave requests" />
        <StatCard title="Days Present" value={myAttendance.filter((a) => a.status === "Present").length} sub="last 7 days" />
        <StatCard title="Last Salary" value={latestSlip ? `₹${latestSlip.netSalary.toLocaleString("en-IN")}` : "N/A"} sub={latestSlip ? formatDate(latestSlip.month + "-01") : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Check In */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold tabular-nums text-center">{currentTime.toTimeString().slice(0, 5)}</p>
            {todayRecord && (
              <div className="text-xs grid grid-cols-2 gap-2 bg-muted rounded-lg p-2">
                <div><p className="text-muted-foreground">Check In</p><p className="font-medium">{todayRecord.checkIn}</p></div>
                {todayRecord.checkOut && <div><p className="text-muted-foreground">Check Out</p><p className="font-medium">{todayRecord.checkOut}</p></div>}
                {todayRecord.workHours && (
                  <div className="col-span-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Target: 8h</span>
                      <span>{Math.min(100, Math.round((todayRecord.workHours / 8) * 100))}%</span>
                    </div>
                    <Progress value={Math.min(100, (todayRecord.workHours / 8) * 100)} className="h-1.5" />
                  </div>
                )}
              </div>
            )}
            {/* Location */}
            {!coords ? (
              <Button onClick={detect} disabled={loading} size="sm" variant="outline" className="w-full gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{loading ? "Detecting…" : "Detect Location"}
              </Button>
            ) : (
              <div className="text-xs space-y-1">
                {nearestBranch && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{nearestBranch.name}</span>
                    <span className="flex items-center gap-0.5">
                      {Math.round(nearestBranch.distance)}m
                      {inRange ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    </span>
                  </div>
                )}
                <Button size="sm" variant="ghost" className="w-full text-xs h-6" onClick={detect}>Refresh</Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={handleCheckIn} disabled={!!todayRecord || !inRange}>Check In</Button>
              <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={!todayRecord || !!todayRecord?.checkOut || !inRange}>Check Out</Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent attendance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Attendance</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => navigate("/attendance")}>View All <ChevronRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            {myAttendance.length > 0 ? (
              <div className="space-y-2">
                {myAttendance.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                      {rec.checkIn && <p className="text-xs text-muted-foreground">{rec.checkIn} → {rec.checkOut || "—"}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.workHours && <span className="text-xs text-muted-foreground">{rec.workHours.toFixed(1)}h</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[rec.status] || "bg-gray-100"}`}>{rec.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-6">No attendance records yet</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leave requests */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">My Leave Requests</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => navigate("/leave/applications")}>View All <ChevronRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            {myLeaves.length > 0 ? (
              <div className="space-y-2">
                {myLeaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{leave.leaveType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(leave.startDate)} · {leave.days} day(s)</p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-6">No leave requests yet</p>}
          </CardContent>
        </Card>

        {/* Upcoming holidays */}
        <Card>
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
                    <StatusBadge status={h.type} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-6">No upcoming holidays</p>}
          </CardContent>
        </Card>
      </div>

      {/* Latest payslip */}
      {latestSlip && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Latest Payslip — {formatDate(latestSlip.month + "-01")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Basic</p><p className="font-medium">₹{latestSlip.basicSalary.toLocaleString("en-IN")}</p></div>
            <div><p className="text-muted-foreground text-xs">Allowances</p><p className="font-medium">+₹{latestSlip.allowances.toLocaleString("en-IN")}</p></div>
            <div><p className="text-muted-foreground text-xs">Deductions</p><p className="font-medium text-red-600">-₹{(latestSlip.deductions + latestSlip.tax).toLocaleString("en-IN")}</p></div>
            <div><p className="text-muted-foreground text-xs">Net Pay</p><p className="font-bold text-primary">₹{latestSlip.netSalary.toLocaleString("en-IN")}</p></div>
          </CardContent>
        </Card>
      )}

      {/* Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a new leave request</DialogDescription>
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
              <div><Label>Start Date *</Label><Input type="date" className="mt-1" value={leaveForm.startDate} onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
              <div><Label>End Date *</Label><Input type="date" className="mt-1" value={leaveForm.endDate} onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div><Label>Reason *</Label><Textarea className="mt-1" value={leaveForm.reason} onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))} rows={3} /></div>
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
