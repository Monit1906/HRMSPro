import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendance, setAttendance, getBranches, getCurrentUser } from "@/lib/mockData";
import { useGeolocation, haversineMeters } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/ui/StatusBadge";
import { toast } from "sonner";

export default function AttendanceCheckIn() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { coords, loading, detect } = useGeolocation();

  const currentUser = getCurrentUser();
  const branches = getBranches();
  const attendance = getAttendance();
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => a.employeeId === currentUser?.id && a.date === today);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nearestBranch = coords
    ? branches
        .map((b) => ({ ...b, distance: haversineMeters(coords, { lat: b.latitude, lng: b.longitude }) }))
        .sort((a, b) => a.distance - b.distance)[0]
    : null;

  const inRange = nearestBranch ? nearestBranch.distance <= nearestBranch.radius : false;

  const handleCheckIn = useCallback(() => {
    if (!inRange || !coords || !nearestBranch) { toast.error("Not within branch radius"); return; }
    const rec = {
      id: String(Date.now()),
      employeeId: currentUser?.id || "3",
      employeeName: currentUser?.name || "Employee",
      date: today,
      checkIn: currentTime.toTimeString().slice(0, 5),
      checkInLocation: { lat: coords.lat, lng: coords.lng, address: nearestBranch.name },
      status: "Present" as const,
      branch: nearestBranch.name,
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-full max-w-md space-y-4">
        {/* Clock */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2"><Clock className="h-6 w-6 text-primary" /></div>
            <p className="text-4xl font-bold tabular-nums">{currentTime.toTimeString().slice(0, 5)}</p>
            <CardDescription>
              {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </CardDescription>
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
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Your Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!coords ? (
              <Button onClick={detect} disabled={loading} className="w-full gap-2">
                <MapPin className="h-4 w-4" />
                {loading ? "Detecting…" : "Detect My Location"}
              </Button>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
                {nearestBranch && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nearest Branch</span>
                      <span className="font-medium">{nearestBranch.name}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Distance</span>
                      <div className="flex items-center gap-1">
                        <span>{Math.round(nearestBranch.distance)}m</span>
                        {inRange ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    {!inRange && <p className="text-xs text-red-500">Must be within {nearestBranch.radius}m of the branch</p>}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={detect} className="w-full">Refresh Location</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Check In/Out */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCheckIn} disabled={!!todayRecord || !inRange} className="h-12 text-base">Check In</Button>
          <Button onClick={handleCheckOut} disabled={!todayRecord || !!todayRecord?.checkOut || !inRange} variant="outline" className="h-12 text-base">Check Out</Button>
        </div>

        <Button variant="ghost" className="w-full" onClick={() => navigate("/attendance")}>View Attendance History</Button>
      </div>
    </div>
  );
}
