
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendance, setAttendance, getBranches } from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useGeolocation, haversineMeters } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/ui/StatusBadge";
import { toast } from "sonner";

export default function AttendanceCheckIn() {
  const navigate = useNavigate();
  const { user } = useRole();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { coords, loading, detect } = useGeolocation();
  const didAutoDetect = useRef(false);

  const branches  = getBranches();
  const attendance = getAttendance();
  const today     = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => a.employeeId === user.id && a.date === today);
  const noBranches = branches.length === 0;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if (!didAutoDetect.current && !noBranches) {
      didAutoDetect.current = true;
      detect();
    }
  }, [detect, noBranches]); // Added detect and noBranches to dependencies

  const nearestBranch = coords && branches.length > 0
    ? branches.map((b) => ({ ...b, distance: haversineMeters(coords, { lat: b.latitude, lng: b.longitude }) })).sort((a, b) => a.distance - b.distance)[0]
    : null;

  const inRange = nearestBranch ? nearestBranch.distance <= nearestBranch.radius : false;

  const canCheckIn  = noBranches || inRange;
  const canCheckOut = noBranches || inRange;

  const handleCheckIn = useCallback(() => {
    if (todayRecord) { toast.error("Already checked in today"); return; }
    if (!noBranches && !inRange) {
      toast.error(!coords ? "Please detect location first" : `Not within branch radius — ${Math.round(nearestBranch?.distance ?? 0)}m from ${nearestBranch?.name ?? "branch"}`);
      return;
    }
    const rec = {
      id: String(Date.now()), employeeId: user.id, employeeName: user.name, date: today,
      checkIn: currentTime.toTimeString().slice(0, 5),
      ...(coords && nearestBranch ? { checkInLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name } } : {}),
      status: "Present" as const,
      branch: nearestBranch?.name || "—",
    };
    setAttendance([...attendance, rec]);
    toast.success("Checked in successfully!");
  }, [todayRecord, noBranches, inRange, coords, nearestBranch, user, today, currentTime, attendance]);

  const handleCheckOut = useCallback(() => {
    if (!todayRecord) { toast.error("No check-in record found"); return; }
    if (todayRecord.checkOut) { toast.error("Already checked out today"); return; }
    if (!noBranches && !inRange) {
      toast.error(!coords ? "Please detect location first" : "Not within branch radius");
      return;
    }
    const checkInTime = new Date(`${today}T${todayRecord.checkIn}:00`);
    const workHours = (currentTime.getTime() - checkInTime.getTime()) / 3_600_000;
    setAttendance(attendance.map((a) =>
      a.id === todayRecord.id
        ? { ...a, checkOut: currentTime.toTimeString().slice(0, 5), ...(coords && nearestBranch ? { checkOutLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name } } : {}), workHours }
        : a
    ));
    toast.success(`Checked out — ${workHours.toFixed(1)}h worked`);
  }, [todayRecord, noBranches, inRange, coords, nearestBranch, today, currentTime, attendance]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-full max-w-md space-y-4">
        {/* Clock */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2"><Clock className="h-6 w-6 text-primary" /></div>
            <p className="text-4xl font-bold tabular-nums">{currentTime.toTimeString().slice(0, 5)}</p>
            <CardDescription>{currentTime.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardDescription>
          </CardHeader>
        </Card>

        {/* Today status */}
        {todayRecord && (
          <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Check In</p><p className="font-semibold">{todayRecord.checkIn}</p></div>
              {todayRecord.checkOut && (
                <>
                  <div><p className="text-xs text-muted-foreground">Check Out</p><p className="font-semibold">{todayRecord.checkOut}</p></div>
                  <div><p className="text-xs text-muted-foreground">Work Hours</p><p className="font-semibold">{todayRecord.workHours?.toFixed(1)}h</p></div>
                </>
              )}
              <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={todayRecord.status} /></div>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Location Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {noBranches ? (
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">No branches configured</p>
                  <p className="text-xs mt-0.5 opacity-80">Location check is skipped. Admin can add branches in Setup → Branches.</p>
                </div>
              </div>
            ) : !coords ? (
              <Button onClick={detect} disabled={loading} className="w-full gap-2">
                <MapPin className="h-4 w-4" />{loading ? "Detecting…" : "Detect My Location"}
              </Button>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                {nearestBranch && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-muted rounded p-2 text-sm">
                      <div>
                        <p className="font-medium">{nearestBranch.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(nearestBranch.distance)}m away · allowed: {nearestBranch.radius}m</p>
                      </div>
                      {inRange ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    {!inRange && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        You are {Math.round(nearestBranch.distance - nearestBranch.radius)}m outside the allowed radius.
                      </p>
                    )}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={detect} className="w-full">{loading ? "Detecting…" : "Refresh Location"}</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Check In/Out buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCheckIn} disabled={!!todayRecord || (!noBranches && !!coords && !inRange)} className="h-12 text-base">
            Check In
          </Button>
          <Button onClick={handleCheckOut} disabled={!todayRecord || !!todayRecord?.checkOut || (!noBranches && !!coords && !inRange)} variant="outline" className="h-12 text-base">
            Check Out
          </Button>
        </div>

        <Button variant="ghost" className="w-full" onClick={() => navigate("/attendance")}>View Attendance History</Button>
      </div>
    </div>
  );
}
