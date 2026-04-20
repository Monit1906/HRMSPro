import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLeaveApplications, setLeaveApplications, getLeaveTypes, getEmployees } from "@/lib/mockData";
import { toast } from "sonner";

export default function LeaveApplicationAdd() {
  const navigate = useNavigate();
  const leaveTypes = getLeaveTypes();
  const employees = getEmployees();
  const applications = getLeaveApplications();

  const [form, setForm] = useState({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "" });
  const upd = useCallback((k: string, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  const totalDays = form.startDate && form.endDate
    ? Math.ceil(Math.abs(new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find((emp) => emp.id === form.employeeId);
    if (!employee) return;
    setLeaveApplications([...applications, {
      id: String(Date.now()),
      employeeId: form.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      days: totalDays,
      reason: form.reason,
      status: "Pending" as const,
      appliedOn: new Date().toISOString(),
    }]);
    toast.success("Leave application submitted successfully");
    navigate("/leave/applications");
  }, [form, employees, applications, totalDays, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leave/applications")}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-2xl font-bold">Apply for Leave</h1><p className="text-sm text-muted-foreground">Submit a new leave request</p></div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-base">Leave Application Form</CardTitle><CardDescription>Fill in the details for your leave request</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employeeId} onValueChange={(v) => upd("employeeId", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type *</Label>
              <Select value={form.leaveType} onValueChange={(v) => upd("leaveType", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>{leaveTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name} ({t.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" className="mt-1" required value={form.startDate} onChange={(e) => upd("startDate", e.target.value)} /></div>
              <div><Label>End Date *</Label><Input type="date" className="mt-1" required value={form.endDate} onChange={(e) => upd("endDate", e.target.value)} /></div>
            </div>
            {totalDays > 0 && (
              <p className="text-sm text-primary font-medium bg-primary/5 rounded px-3 py-2">Total Days: {totalDays}</p>
            )}
            <div><Label>Reason *</Label><Textarea className="mt-1" rows={4} required value={form.reason} onChange={(e) => upd("reason", e.target.value)} /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/leave/applications")}>Cancel</Button>
              <Button type="submit">Submit Application</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
