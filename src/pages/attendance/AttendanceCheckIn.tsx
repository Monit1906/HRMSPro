import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Coffee, Play, Pause, StopCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getAttendance, setAttendance, getBranches, type Attendance } from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useGeolocation, haversineMeters } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Live Timer ────────────────────────────────────────────────────────────────
function LiveTimer({ checkInTime, breaks, dailyTarget }: {
  checkInTime: string; breaks: { start: string; end?: string }[]; dailyTarget: number;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const today = now.toISOString().split("T")[0];
  const checkIn = new Date(`${today}T${checkInTime}:00`);

  const breakMs = breaks.reduce((sum, b) => {
    const s = new Date(`${today}T${b.start}:00`).getTime();
    const e = b.end ? new Date(`${today}T${b.end}:00`).getTime() : now.getTime();
    return sum + Math.max(0, e - s);
  }, 0);

  const onDutyMs = Math.max(0, now.getTime() - checkIn.getTime() - breakMs);
  const onDutyH = onDutyMs / 3_600_000;
  const isOnBreak = breaks.some((b) => !b.end);
  const pct = Math.min(100, (onDutyH / dailyTarget) * 100);
  const isGreen = onDutyH >= dailyTarget;
  const isYellow = !isOnBreak && onDutyH >= dailyTarget * 0.5 && onDutyH < dailyTarget;
  const isRed = !isOnBreak && onDutyH < dailyTarget * 0.5 && onDutyH > 0.05;

  const fmt = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className={cn(
        "text-4xl font-bold tabular-nums text-center py-3 rounded-xl transition-colors font-mono",
        isGreen  ? "text-green-600 bg-green-50 dark:bg-green-900/20" :
        isYellow ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" :
        isRed    ? "text-red-600 bg-red-50 dark:bg-red-900/20 animate-pulse" :
                   "text-foreground bg-muted"
      )}>
        {fmt(onDutyMs)}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Time on duty</span>
          <span>{onDutyH.toFixed(1)}h / {dailyTarget}h target</span>
        </div>
        <Progress value={pct} className={cn("h-2", isGreen ? "[&>div]:bg-green-500" : isYellow ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500")} />
      </div>
      {isOnBreak && (
        <div className="flex items-center gap-2 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg px-3 py-2">
          <Coffee className="h-3.5 w-3.5 shrink-0" />On break — timer paused · break: {fmt(breakMs)}
        </div>
      )}
      {isRed && !isOnBreak && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
          {(dailyTarget - onDutyH).toFixed(1)}h remaining to complete today's target
        </p>
      )}
    </div>
  );
}

// ── Confirmation Dialog ───────────────────────────────────────────────────────
function ConfirmDialog({ open, title, description, onConfirm, onCancel, confirmLabel = "Confirm", variant = "default" }: {
  open: boolean; title: string; description: string;
  onConfirm: () => void; onCancel: () => void; confirmLabel?: string; variant?: "default" | "destructive";
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <div className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant={variant === "destructive" ? "destructive" : "default"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AttendanceCheckIn() {
  const navigate = useNavigate();
  const { user } = useRole();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const { coords, loading, detect } = useGeolocation();
  const didAutoDetect = useRef(false);

  // Confirmation dialogs
  const [confirmCheckIn, setConfirmCheckIn]   = useState(false);
  const [confirmCheckOut, setConfirmCheckOut] = useState(false);
  const [confirmBreakIn, setConfirmBreakIn]   = useState(false);
  const [confirmBreakOut, setConfirmBreakOut] = useState(false);

  const branches   = getBranches();
  const today      = new Date().toISOString().split("T")[0];
  const dailyTarget = user.dailyHoursTarget ?? 8;

  const attendance  = getAttendance();
  const todayRecord = attendance.find((a) => a.employeeId === user.id && a.date === today);
  const noBranches  = branches.length === 0;
  const locationPermission = user.locationPermission ?? false;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!didAutoDetect.current && !noBranches && !locationPermission) {
      didAutoDetect.current = true;
      detect();
    }
  }, [detect, noBranches, locationPermission]);

  const nearestBranch = coords && branches.length > 0
    ? branches.map((b) => ({ ...b, distance: haversineMeters(coords, { lat: b.latitude, lng: b.longitude }) })).sort((a, b) => a.distance - b.distance)[0]
    : null;

  const inRange = nearestBranch ? nearestBranch.distance <= nearestBranch.radius : false;
  const canDoAttendance = locationPermission || noBranches || inRange;

  const doCheckIn = useCallback(() => {
    if (todayRecord) { toast.error("Already checked in today"); return; }
    if (!locationPermission && !noBranches && !inRange) {
      toast.error(!coords ? "Please detect location first" : `Outside branch radius — ${Math.round(nearestBranch?.distance ?? 0)}m from ${nearestBranch?.name ?? "branch"}`);
      return;
    }
    const rec: Attendance = {
      id: String(Date.now()), employeeId: user.id, employeeName: user.name, date: today,
      checkIn: currentTime.toTimeString().slice(0, 5),
      ...(coords && nearestBranch ? { checkInLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name } } : {}),
      status: "Present",
      branch: nearestBranch?.name || "—",
      breaks: [],
      activeBreak: false,
    };
    setAttendance([...getAttendance(), rec]);
    reload();
    toast.success("✅ Checked in successfully!");
  }, [todayRecord, locationPermission, noBranches, inRange, coords, nearestBranch, user, today, currentTime, reload]);

  const doCheckOut = useCallback(() => {
    if (!todayRecord) { toast.error("No check-in found"); return; }
    if (todayRecord.checkOut) { toast.error("Already checked out today"); return; }
    if (!locationPermission && !noBranches && !inRange) {
      toast.error(!coords ? "Please detect location first" : "Outside branch radius");
      return;
    }
    let breaksToSave = todayRecord.breaks || [];
    if (todayRecord.activeBreak) {
      breaksToSave = breaksToSave.map((b, i) =>
        i === breaksToSave.length - 1 && !b.end
          ? { ...b, end: currentTime.toTimeString().slice(0, 5) }
          : b
      );
    }
    const checkInMs = new Date(`${today}T${todayRecord.checkIn}:00`).getTime();
    const totalMs = currentTime.getTime() - checkInMs;
    const breakMs = breaksToSave.reduce((sum, b) => {
      if (!b.end) return sum;
      return sum + (new Date(`${today}T${b.end}:00`).getTime() - new Date(`${today}T${b.start}:00`).getTime());
    }, 0);
    const workHours = Math.max(0, (totalMs - breakMs) / 3_600_000);
    setAttendance(getAttendance().map((a) =>
      a.id === todayRecord.id
        ? { ...a, checkOut: currentTime.toTimeString().slice(0, 5), ...(coords && nearestBranch ? { checkOutLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name } } : {}), workHours, breaks: breaksToSave, activeBreak: false }
        : a
    ));
    reload();
    toast.success(`✅ Checked out — ${workHours.toFixed(1)}h on duty`);
  }, [todayRecord, locationPermission, noBranches, inRange, coords, nearestBranch, today, currentTime, reload]);

  const doBreakStart = useCallback(() => {
    if (!todayRecord || todayRecord.checkOut || todayRecord.activeBreak) return;
    const updated = {
      ...todayRecord,
      breaks: [...(todayRecord.breaks || []), { start: currentTime.toTimeString().slice(0, 5) }],
      activeBreak: true,
    };
    setAttendance(getAttendance().map((a) => a.id === todayRecord.id ? updated : a));
    reload();
    toast.success("☕ Break started — timer paused");
  }, [todayRecord, currentTime, reload]);

  const doBreakEnd = useCallback(() => {
    if (!todayRecord || !todayRecord.activeBreak) return;
    const breaks = (todayRecord.breaks || []).map((b, i) =>
      i === (todayRecord.breaks || []).length - 1 && !b.end
        ? { ...b, end: currentTime.toTimeString().slice(0, 5) }
        : b
    );
    setAttendance(getAttendance().map((a) => a.id === todayRecord.id ? { ...a, breaks, activeBreak: false } : a));
    reload();
    toast.success("▶ Break ended — timer resumed");
  }, [todayRecord, currentTime, reload]);

  const latestAttendance = getAttendance()
    .filter((a) => a.employeeId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 sm:p-6 gap-4">
      {/* Back / Header */}
      <div className="w-full max-w-md flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-none">Attendance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{currentTime.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums">{currentTime.toTimeString().slice(0, 5)}</p>
          <p className="text-xs text-muted-foreground">{currentTime.toTimeString().slice(6, 11)}</p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        {/* Live Timer */}
        {todayRecord?.checkIn && !todayRecord.checkOut && (
          <Card>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Time in Office</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <LiveTimer checkInTime={todayRecord.checkIn} breaks={todayRecord.breaks || []} dailyTarget={dailyTarget} />
            </CardContent>
          </Card>
        )}

        {/* Today's summary if checked out */}
        {todayRecord?.checkOut && (
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-semibold text-green-700 dark:text-green-400">Day Complete</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><p className="text-muted-foreground">Check In</p><p className="font-bold text-sm">{todayRecord.checkIn}</p></div>
                <div><p className="text-muted-foreground">Check Out</p><p className="font-bold text-sm">{todayRecord.checkOut}</p></div>
                <div>
                  <p className="text-muted-foreground">Work Hours</p>
                  <p className={cn("font-bold text-sm", todayRecord.workHours && todayRecord.workHours >= dailyTarget ? "text-green-600" : "text-orange-500")}>
                    {todayRecord.workHours?.toFixed(1)}h
                  </p>
                </div>
              </div>
              {(todayRecord.breaks || []).length > 0 && (
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                  {(todayRecord.breaks || []).length} break(s) taken
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status if not checked in */}
        {!todayRecord && (
          <Card className="border-dashed">
            <CardContent className="p-4 text-center text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-medium">Not checked in yet</p>
              <p className="text-xs mt-1">Tap Check In to start your timer</p>
            </CardContent>
          </Card>
        )}

        {/* Location card */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />Location Check
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            {locationPermission ? (
              <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg p-3 text-sm">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Open check-in enabled</p>
                  <p className="text-xs mt-0.5 opacity-80">HR has granted location-free access.</p>
                </div>
              </div>
            ) : noBranches ? (
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">No branches configured — open check-in</p>
              </div>
            ) : !coords ? (
              <Button onClick={detect} disabled={loading} className="w-full gap-2" size="sm">
                <MapPin className="h-4 w-4" />{loading ? "Detecting…" : "Detect My Location"}
              </Button>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                {nearestBranch && (
                  <div className="flex justify-between items-center bg-muted rounded-lg p-2 text-sm">
                    <div>
                      <p className="font-medium text-xs">{nearestBranch.name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(nearestBranch.distance)}m · allowed: {nearestBranch.radius}m</p>
                    </div>
                    {inRange ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                )}
                {!inRange && <p className="text-xs text-red-600 dark:text-red-400 text-center">Outside allowed radius — check-in blocked</p>}
                <Button variant="outline" size="sm" onClick={detect} className="w-full text-xs h-8">{loading ? "Detecting…" : "Refresh Location"}</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setConfirmCheckIn(true)}
            disabled={!!todayRecord || (!canDoAttendance && !!coords && !noBranches && !locationPermission)}
            className="h-14 text-base gap-2 flex-col"
          >
            <Play className="h-5 w-5" />
            <span className="text-xs">Check In</span>
          </Button>
          <Button
            onClick={() => setConfirmCheckOut(true)}
            disabled={!todayRecord || !!todayRecord?.checkOut || (!canDoAttendance && !!coords && !noBranches && !locationPermission)}
            variant="outline"
            className="h-14 text-base gap-2 flex-col"
          >
            <StopCircle className="h-5 w-5" />
            <span className="text-xs">Check Out</span>
          </Button>
        </div>

        {/* Break buttons */}
        {todayRecord?.checkIn && !todayRecord.checkOut && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmBreakIn(true)}
              disabled={!!todayRecord.activeBreak}
              className="h-10 gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
            >
              <Pause className="h-4 w-4" />Start Break
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmBreakOut(true)}
              disabled={!todayRecord.activeBreak}
              className="h-10 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40"
            >
              <Coffee className="h-4 w-4" />End Break
            </Button>
          </div>
        )}

        {/* Break history */}
        {todayRecord && (todayRecord.breaks || []).length > 0 && (
          <Card>
            <CardContent className="p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-1">Breaks today</p>
              {(todayRecord.breaks || []).map((b, i) => (
                <div key={i} className="flex gap-2 text-muted-foreground">
                  <span className="font-mono">#{i + 1}</span>
                  <span>{b.start} → {b.end || <span className="text-orange-500">ongoing</span>}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent history */}
        {latestAttendance.length > 0 && (
          <Card>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Recent</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                {latestAttendance.map((rec) => (
                  <div key={rec.id} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                    <div>
                      <p className="font-medium text-xs">{new Date(rec.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
                      {rec.checkIn && <p className="text-xs text-muted-foreground">{rec.checkIn} → {rec.checkOut || "—"}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.workHours != null && (
                        <span className={cn("text-xs font-medium", rec.workHours >= dailyTarget ? "text-green-600" : "text-orange-500")}>{rec.workHours.toFixed(1)}h</span>
                      )}
                      <StatusBadge status={rec.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation dialogs */}
      <ConfirmDialog open={confirmCheckIn} title="Check In?" description={`Confirm check-in at ${currentTime.toTimeString().slice(0, 5)}? Your office timer will start now.`} onConfirm={() => { setConfirmCheckIn(false); doCheckIn(); }} onCancel={() => setConfirmCheckIn(false)} confirmLabel="Yes, Check In" />
      <ConfirmDialog open={confirmCheckOut} title="Check Out?" description={`Are you sure you want to check out at ${currentTime.toTimeString().slice(0, 5)}? Your timer will stop.`} onConfirm={() => { setConfirmCheckOut(false); doCheckOut(); }} onCancel={() => setConfirmCheckOut(false)} confirmLabel="Yes, Check Out" variant="destructive" />
      <ConfirmDialog open={confirmBreakIn} title="Start Break?" description="Your timer will be paused while on break. Click End Break when you return." onConfirm={() => { setConfirmBreakIn(false); doBreakStart(); }} onCancel={() => setConfirmBreakIn(false)} confirmLabel="Start Break" />
      <ConfirmDialog open={confirmBreakOut} title="End Break?" description="Your office timer will resume now." onConfirm={() => { setConfirmBreakOut(false); doBreakEnd(); }} onCancel={() => setConfirmBreakOut(false)} confirmLabel="End Break" />
    </div>
  );
}
