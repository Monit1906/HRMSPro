import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Calendar, DollarSign, ChevronRight, Plus, MapPin,
  CheckCircle, XCircle, Edit, Save, X, User, AlertCircle, Coffee,
  Play, Pause, StopCircle,
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
  getLeaveBalances, ensureLeaveBalances, deductLeaveBalance, type Attendance,
} from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useGeolocation, haversineMeters } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Live Timer Component ─────────────────────────────────────────────────────
function LiveTimer({ checkInTime, breaks, dailyTarget }: {
  checkInTime: string;
  breaks: { start: string; end?: string }[];
  dailyTarget: number;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = now.toISOString().split("T")[0];
  const checkIn = new Date(`${today}T${checkInTime}:00`);

  // Calculate total break duration so far
  const breakMs = breaks.reduce((sum, b) => {
    const start = new Date(`${today}T${b.start}:00`).getTime();
    const end = b.end ? new Date(`${today}T${b.end}:00`).getTime() : now.getTime();
    return sum + Math.max(0, end - start);
  }, 0);

  const onDutyMs = Math.max(0, now.getTime() - checkIn.getTime() - breakMs);
  const onDutyHours = onDutyMs / 3_600_000;
  const isOnBreak = breaks.some((b) => !b.end);

  const fmt = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const progress = Math.min(100, (onDutyHours / dailyTarget) * 100);
  const isRed = !isOnBreak && onDutyHours < dailyTarget * 0.5 && onDutyHours > 0.1;
  const isYellow = !isOnBreak && onDutyHours >= dailyTarget * 0.5 && onDutyHours < dailyTarget;
  const isGreen = onDutyHours >= dailyTarget;

  return (
    <div className="space-y-2">
      <div className={cn(
        "text-3xl font-bold tabular-nums text-center py-2 rounded-lg transition-colors",
        isGreen  ? "text-green-600 bg-green-50 dark:bg-green-900/20" :
        isYellow ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" :
        isRed    ? "text-red-600 bg-red-50 dark:bg-red-900/20 animate-pulse" :
                   "text-foreground bg-muted"
      )}>
        {fmt(onDutyMs)}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Work Time</span>
          <span>{onDutyHours.toFixed(1)}h / {dailyTarget}h</span>
        </div>
        <Progress
          value={progress}
          className={cn("h-2", isGreen ? "[&>div]:bg-green-500" : isYellow ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500")}
        />
      </div>

      {isOnBreak && (
        <div className="flex items-center gap-2 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded px-2 py-1.5">
          <Coffee className="h-3.5 w-3.5 shrink-0" />
          <span>On break — {fmt(breakMs)} total break time</span>
        </div>
      )}
      {isRed && !isOnBreak && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center">Below target — {(dailyTarget - onDutyHours).toFixed(1)}h remaining</p>
      )}
    </div>
  );
}

// ─── Leave Balance Card ───────────────────────────────────────────────────────
function LeaveBalanceCard({ employeeId }: { employeeId: string }) {
  const leaveTypes = getLeaveTypes();
  const year = new Date().getFullYear();
  ensureLeaveBalances(employeeId, year);
  const balances = getLeaveBalances().filter((b) => b.employeeId === employeeId && b.year === year);

  if (balances.length === 0 || leaveTypes.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">No leave types configured</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary" />Leave Balance {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {balances.map((b) => {
          const remaining = Math.max(0, b.allotted - b.taken);
          const pct = b.allotted > 0 ? Math.min(100, (b.taken / b.allotted) * 100) : 0;
          const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
          return (
            <div key={b.leaveTypeId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: lt?.color || "#6b7280" }} />
                  <span className="font-medium">{b.leaveTypeName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{b.taken} taken</span>
                  <span>·</span>
                  <span className={cn("font-semibold", remaining === 0 ? "text-red-600" : remaining <= 2 ? "text-yellow-600" : "text-green-600")}>
                    {remaining} left
                  </span>
                  <span className="text-muted-foreground/60">/ {b.allotted}</span>
                </div>
              </div>
              <Progress value={pct} className={cn("h-1.5", pct >= 100 ? "[&>div]:bg-red-500" : pct > 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function EmployeePortal() {
  const navigate = useNavigate();
  const { user } = useRole();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const { coords, loading: locLoading, detect } = useGeolocation();
  const didAutoDetect = useRef(false);
  const [tick, setTick] = useState(0); // force re-render for live timer

  // Auto-detect location on first load only if user has permission
  useEffect(() => {
    if (!didAutoDetect.current && user.locationPermission) {
      didAutoDetect.current = true;
      detect();
    }
  }, [detect, user.locationPermission]);

  const employees = getEmployees();
  const currentEmployee = employees.find((e) => e.id === user.employeeId || e.id === user.id);

  const [profileForm, setProfileForm] = useState({
    phone: currentEmployee?.phone ?? "",
    address: currentEmployee?.address ?? "",
    emergencyContact: currentEmployee?.emergencyContact ?? "",
  });

  const branches    = getBranches();
  const leaveTypes  = getLeaveTypes();
  const payroll     = getPayroll();
  const holidays    = getHolidays();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get today's attendance for this user
  const getMyAttendance = () => getAttendance().filter((a) => a.employeeId === (currentEmployee?.id || user.id));
  const getAllAttendance = () => getAttendance();

  const myAttendance  = useMemo(() => getMyAttendance().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30), [tick]);
  const todayRecord   = useMemo(() => getAllAttendance().find((a) => a.employeeId === (currentEmployee?.id || user.id) && a.date === today), [tick, today]);

  const leaveApps  = getLeaveApplications();
  const myLeaves   = useMemo(() => leaveApps.filter((a) => a.employeeId === (currentEmployee?.id || user.id)), [leaveApps, user.id, currentEmployee?.id]);
  const pendingLeaves = useMemo(() => myLeaves.filter((a) => a.status === "Pending"), [myLeaves]);
  const approvedDays  = useMemo(() => myLeaves.filter((a) => a.status === "Approved").reduce((s, a) => s + a.days, 0), [myLeaves]);
  const myPayroll     = useMemo(() => payroll.filter((p) => p.employeeId === (currentEmployee?.id || user.id)).sort((a, b) => b.month.localeCompare(a.month)), [payroll, user.id, currentEmployee?.id]);
  const latestSlip    = myPayroll[0];
  const upcomingHols  = useMemo(() => holidays.filter((h) => new Date(h.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4), [holidays]);
  const dailyTarget   = user.dailyHoursTarget ?? 8;

  // Location & nearest branch
  const nearestBranch = useMemo(() => {
    if (!coords || branches.length === 0) return null;
    return branches
      .map((b) => ({ ...b, distance: haversineMeters(coords, { lat: b.latitude, lng: b.longitude }) }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [coords, branches]);
  const inRange    = nearestBranch ? nearestBranch.distance <= nearestBranch.radius : false;
  const noBranches = branches.length === 0;

  // Can check in?
  // locationPermission: true = can check in from anywhere (no location needed)
  // locationPermission: false = must be in range of an assigned branch
  const locationPermission = user.locationPermission ?? false;
  const canDoAttendance = locationPermission || noBranches || inRange;

  const employeeId = currentEmployee?.id || user.id;

  // ── Check-in ─────────────────────────────────────────────────────────────
  const handleCheckIn = useCallback(() => {
    if (todayRecord) { toast.error("Already checked in today"); return; }
    if (!locationPermission && !noBranches && !inRange) {
      if (!coords) {
        toast.error("Location check required — please detect your location");
      } else {
        toast.error(`Not within ${nearestBranch?.name ?? "branch"} radius (${Math.round(nearestBranch?.distance ?? 0)}m away). Check-in not allowed.`);
      }
      return;
    }
    const rec: Attendance = {
      id: String(Date.now()), employeeId, employeeName: user.name, date: today,
      checkIn: currentTime.toTimeString().slice(0, 5),
      ...(coords && nearestBranch ? { checkInLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name } } : {}),
      status: "Present",
      branch: nearestBranch?.name || currentEmployee?.branch || "—",
      breaks: [],
      activeBreak: false,
    };
    setAttendance([...getAllAttendance(), rec]);
    toast.success("Checked in successfully!");
  }, [todayRecord, locationPermission, noBranches, inRange, coords, nearestBranch, user, today, currentTime, employeeId, currentEmployee]);

  // ── Break Start/End ───────────────────────────────────────────────────────
  const handleBreakStart = useCallback(() => {
    if (!todayRecord || todayRecord.checkOut) return;
    if (todayRecord.activeBreak) { toast.error("Already on break"); return; }
    const updated = {
      ...todayRecord,
      breaks: [...(todayRecord.breaks || []), { start: currentTime.toTimeString().slice(0, 5) }],
      activeBreak: true,
    };
    setAttendance(getAllAttendance().map((a) => a.id === todayRecord.id ? updated : a));
    toast.success("Break started — timer paused");
  }, [todayRecord, currentTime]);

  const handleBreakEnd = useCallback(() => {
    if (!todayRecord || !todayRecord.activeBreak) return;
    const breaks = (todayRecord.breaks || []).map((b, i) =>
      i === (todayRecord.breaks || []).length - 1 && !b.end
        ? { ...b, end: currentTime.toTimeString().slice(0, 5) }
        : b
    );
    const updated = { ...todayRecord, breaks, activeBreak: false };
    setAttendance(getAllAttendance().map((a) => a.id === todayRecord.id ? updated : a));
    toast.success("Break ended — timer resumed");
  }, [todayRecord, currentTime]);

  // ── Check-out ─────────────────────────────────────────────────────────────
  const handleCheckOut = useCallback(() => {
    if (!todayRecord) { toast.error("No check-in found for today"); return; }
    if (todayRecord.checkOut) { toast.error("Already checked out today"); return; }
    if (!locationPermission && !noBranches && !inRange) {
      toast.error(!coords ? "Please detect your location first" : "Not within branch radius — checkout blocked");
      return;
    }
    // End any active break first
    let breaksToSave = todayRecord.breaks || [];
    if (todayRecord.activeBreak) {
      breaksToSave = breaksToSave.map((b, i) =>
        i === breaksToSave.length - 1 && !b.end
          ? { ...b, end: currentTime.toTimeString().slice(0, 5) }
          : b
      );
    }
    const today2 = today;
    const checkInTime = new Date(`${today2}T${todayRecord.checkIn}:00`);
    const checkOutTime = currentTime;
    const totalMs = checkOutTime.getTime() - checkInTime.getTime();
    const breakMs = breaksToSave.reduce((sum, b) => {
      if (!b.end) return sum;
      return sum + (new Date(`${today2}T${b.end}:00`).getTime() - new Date(`${today2}T${b.start}:00`).getTime());
    }, 0);
    const workHours = Math.max(0, (totalMs - breakMs) / 3_600_000);
    setAttendance(getAllAttendance().map((a) =>
      a.id === todayRecord.id
        ? {
            ...a,
            checkOut: currentTime.toTimeString().slice(0, 5),
            ...(coords && nearestBranch ? { checkOutLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name } } : {}),
            workHours,
            breaks: breaksToSave,
            activeBreak: false,
          }
        : a
    ));
    toast.success(`Checked out — ${workHours.toFixed(1)}h on duty today`);
  }, [todayRecord, locationPermission, noBranches, inRange, coords, nearestBranch, today, currentTime]);

  const submitLeave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please fill all fields"); return;
    }
    const days = Math.max(1, Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / 86_400_000) + 1);
    const newApp = {
      id: String(Date.now()), employeeId, employeeName: user.name,
      leaveType: leaveForm.leaveType, startDate: leaveForm.startDate, endDate: leaveForm.endDate,
      days, reason: leaveForm.reason, status: "Pending" as const, appliedOn: new Date().toISOString(),
    };
    setLeaveApplications([...leaveApps, newApp]);
    toast.success("Leave application submitted!");
    setLeaveDialogOpen(false);
    setLeaveForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
  }, [leaveForm, leaveApps, user, employeeId]);

  const saveProfile = useCallback(() => {
    if (!currentEmployee) return;
    setEmployees(employees.map((e) =>
      e.id === currentEmployee.id ? { ...e, phone: profileForm.phone, address: profileForm.address, emergencyContact: profileForm.emergencyContact } : e
    ));
    setEditingProfile(false);
    toast.success("Profile updated");
  }, [employees, currentEmployee, profileForm]);

  const greeting = currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 17 ? "Afternoon" : "Evening";

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Good {greeting}, {currentEmployee?.firstName || user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm">{currentTime.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Button onClick={() => setLeaveDialogOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />Apply Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Leave Taken" value={approvedDays} sub="approved days" />
        <StatCard title="Pending" value={pendingLeaves.length} sub="leave requests" />
        <StatCard title="Days Present" value={myAttendance.filter((a) => a.status === "Present").length} sub="all time" />
        <StatCard title="Last Salary" value={latestSlip ? `₹${latestSlip.netSalary.toLocaleString("en-IN")}` : "N/A"} sub={latestSlip ? formatDate(latestSlip.month + "-01") : "No payslip yet"} />
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="w-full sm:w-auto flex">
          <TabsTrigger value="attendance" className="flex-1 sm:flex-none text-xs sm:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="leaves" className="flex-1 sm:flex-none text-xs sm:text-sm">Leaves</TabsTrigger>
          <TabsTrigger value="payslips" className="flex-1 sm:flex-none text-xs sm:text-sm">Payslips</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 sm:flex-none text-xs sm:text-sm">Profile</TabsTrigger>
        </TabsList>

        {/* ── ATTENDANCE ── */}
        <TabsContent value="attendance" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Check-in panel */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />Today — {currentTime.toTimeString().slice(0, 5)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Live timer */}
                {todayRecord?.checkIn && !todayRecord.checkOut && (
                  <LiveTimer
                    checkInTime={todayRecord.checkIn}
                    breaks={todayRecord.breaks || []}
                    dailyTarget={dailyTarget}
                  />
                )}

                {/* Completed day summary */}
                {todayRecord?.checkOut && (
                  <div className="grid grid-cols-2 gap-2 bg-muted rounded-lg p-2 text-xs">
                    <div><p className="text-muted-foreground">Check In</p><p className="font-semibold">{todayRecord.checkIn}</p></div>
                    <div><p className="text-muted-foreground">Check Out</p><p className="font-semibold">{todayRecord.checkOut}</p></div>
                    {todayRecord.workHours != null && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Work Hours</p>
                          <p className={cn("font-semibold", todayRecord.workHours >= dailyTarget ? "text-green-600" : "text-red-600")}>
                            {todayRecord.workHours.toFixed(1)}h / {dailyTarget}h
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Breaks</p>
                          <p className="font-semibold">{(todayRecord.breaks || []).length}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Location */}
                {!locationPermission && !noBranches && (
                  !coords ? (
                    <Button onClick={detect} disabled={locLoading} size="sm" variant="outline" className="w-full gap-2">
                      <MapPin className="h-3.5 w-3.5" />{locLoading ? "Detecting…" : "Detect My Location"}
                    </Button>
                  ) : (
                    <div className="text-xs space-y-1.5">
                      {nearestBranch && (
                        <div className="flex justify-between items-center bg-muted rounded p-2">
                          <div>
                            <p className="font-medium">{nearestBranch.name}</p>
                            <p className="text-muted-foreground">{Math.round(nearestBranch.distance)}m · radius {nearestBranch.radius}m</p>
                          </div>
                          {inRange ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        </div>
                      )}
                      {!inRange && <p className="text-red-600 dark:text-red-400 text-center">Must be within branch to check in/out</p>}
                      <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={detect}>{locLoading ? "Detecting…" : "Refresh Location"}</Button>
                    </div>
                  )
                )}

                {locationPermission && (
                  <div className="flex items-center gap-1.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded p-2">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />Location check not required for you
                  </div>
                )}

                {noBranches && (
                  <div className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded p-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />No branches configured — open check-in
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={handleCheckIn} disabled={!!todayRecord} className="gap-1 h-10">
                    <Play className="h-3.5 w-3.5" />Check In
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCheckOut}
                    disabled={!todayRecord || !!todayRecord?.checkOut || !canDoAttendance}
                    className="gap-1 h-10">
                    <StopCircle className="h-3.5 w-3.5" />Check Out
                  </Button>
                </div>

                {/* Break button */}
                {todayRecord?.checkIn && !todayRecord.checkOut && (
                  <div className="grid grid-cols-1 gap-2">
                    {!todayRecord.activeBreak ? (
                      <Button size="sm" variant="outline"
                        onClick={handleBreakStart}
                        className="gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20 h-9">
                        <Pause className="h-3.5 w-3.5" />Start Break
                      </Button>
                    ) : (
                      <Button size="sm"
                        onClick={handleBreakEnd}
                        className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white h-9">
                        <Coffee className="h-3.5 w-3.5" />End Break
                      </Button>
                    )}
                  </div>
                )}

                {/* Break history */}
                {todayRecord && (todayRecord.breaks || []).length > 0 && (
                  <div className="text-xs space-y-0.5">
                    <p className="text-muted-foreground font-medium">Breaks today:</p>
                    {(todayRecord.breaks || []).map((b, i) => (
                      <div key={i} className="flex gap-2 text-muted-foreground">
                        <span>#{i + 1}</span>
                        <span>{b.start} → {b.end || "ongoing"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance history */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">My Attendance</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => navigate("/attendance")}>
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {myAttendance.length > 0 ? (
                  <div className="space-y-1.5">
                    {myAttendance.slice(0, 8).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{new Date(rec.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
                          {rec.checkIn && <p className="text-xs text-muted-foreground">{rec.checkIn} → {rec.checkOut || "—"}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {rec.workHours != null && (
                            <span className={cn("text-xs", rec.workHours >= dailyTarget ? "text-green-600" : "text-orange-500")}>
                              {rec.workHours.toFixed(1)}h
                            </span>
                          )}
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
          {/* Leave balance */}
          <LeaveBalanceCard employeeId={employeeId} />

          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">{myLeaves.length} total application(s)</p>
            <Button size="sm" onClick={() => setLeaveDialogOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />Apply Leave
            </Button>
          </div>
          {myLeaves.length > 0 ? (
            <div className="space-y-2">
              {myLeaves.slice().reverse().map((leave) => (
                <Card key={leave.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{leave.leaveType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(leave.startDate)} → {formatDate(leave.endDate)} · {leave.days} day(s)</p>
                      {leave.reason && <p className="text-xs text-muted-foreground truncate mt-0.5">{leave.reason}</p>}
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
          {myPayroll.length > 0 ? myPayroll.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">{new Date(p.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
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
          )) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No payslips available yet</CardContent></Card>
          )}
        </TabsContent>

        {/* ── MY PROFILE ── */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">My Profile</p>
                  <p className="text-xs text-muted-foreground">Contact details are editable. HR/Admin fields are read-only.</p>
                </div>
              </div>
              {editingProfile ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingProfile(false); setProfileForm({ phone: currentEmployee?.phone ?? "", address: currentEmployee?.address ?? "", emergencyContact: currentEmployee?.emergencyContact ?? "" }); }} className="gap-1"><X className="h-3.5 w-3.5" />Cancel</Button>
                  <Button size="sm" onClick={saveProfile} className="gap-1"><Save className="h-3.5 w-3.5" />Save</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)} className="gap-1"><Edit className="h-3.5 w-3.5" />Edit</Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentEmployee ? (
                <div className="rounded-lg bg-muted/50 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">HR / Admin Managed</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                      ["Full Name", `${currentEmployee.firstName} ${currentEmployee.lastName}`],
                      ["Employee ID", currentEmployee.employeeId],
                      ["Department", currentEmployee.department || "—"],
                      ["Designation", currentEmployee.designation || "—"],
                      ["Branch", currentEmployee.branch || "—"],
                      ["Date of Joining", currentEmployee.dateOfJoining ? formatDate(currentEmployee.dateOfJoining) : "—"],
                      ["Email", currentEmployee.email],
                      ["Gender", currentEmployee.gender || "—"],
                    ].map(([label, value]) => (
                      <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-sm">{value}</p></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  Your employee profile has not been linked yet. Please contact HR.
                </div>
              )}

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

          {/* Upcoming holidays */}
          <Card>
            <CardHeader className="pb-2">
              <p className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Upcoming Holidays</p>
            </CardHeader>
            <CardContent>
              {upcomingHols.length > 0 ? (
                <div className="space-y-2">
                  {upcomingHols.map((h) => (
                    <div key={h.id} className="flex justify-between items-center text-sm">
                      <div><p className="font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{formatDate(h.date)}</p></div>
                      <Badge variant="outline" className="text-xs">{h.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No upcoming holidays</p>}
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
                <SelectContent>
                  {leaveTypes.length > 0 ? leaveTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>) : (
                    <SelectItem value="__none" disabled>No leave types configured</SelectItem>
                  )}
                </SelectContent>
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
              <p className="text-sm text-muted-foreground">Total: <span className="font-medium text-foreground">{Math.max(0, Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / 86_400_000) + 1)} day(s)</span></p>
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
