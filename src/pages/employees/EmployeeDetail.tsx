
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, Briefcase, Edit, Save, X, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployees, setEmployees, getDepartments, getDesignations, getBranches, getAttendance, getLeaveApplications, getPayroll } from "@/lib/mockData";
import { ClipboardCheck } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const employees = getEmployees();
  const departments = getDepartments();
  const designations = getDesignations();
  const branches = getBranches();

  const employee = employees.find((e) => e.id === id);
  const [editData, setEditData] = useState(employee);

  const attendance = getAttendance().filter((a) => a.employeeId === id);
  const leaves = getLeaveApplications().filter((l) => l.employeeId === id);
  const payrollData = getPayroll().filter((p) => p.employeeId === id);

  if (!employee || !editData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Employee not found</p>
        <Button onClick={() => navigate("/employees")}>Back to Employees</Button>
      </div>
    );
  }

  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter((a) => a.status === "Present").length / attendance.length) * 100)
    : 0;
  const totalLeaveDays = leaves.filter((l) => l.status === "Approved").reduce((s, l) => s + l.days, 0);
  const latestPayroll = [...payrollData].sort((a, b) => b.month.localeCompare(a.month))[0];

  const yearsAtCompany = () => {
    const joined = new Date(employee.dateOfJoining);
    const years = (new Date().getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years < 1) return `${Math.floor(years * 12)} months`;
    return `${years.toFixed(1)} years`;
  };

  const handleSave = useCallback(() => {
    setEmployees(employees.map((e) => (e.id === id ? { ...editData } : e)));
    setEditing(false);
    toast.success("Employee profile updated");
  }, [editData, employees, id]);

  const handleCancel = useCallback(() => { setEditData(employee); setEditing(false); }, [employee]);
  const changeStatus = useCallback((status: "Active" | "Inactive" | "On Leave") => {
    const updated = { ...editData, status };
    setEditData(updated as typeof employee);
    setEmployees(employees.map((e) => (e.id === id ? updated : e)));
    toast.success(`Status changed to ${status}`);
  }, [editData, employees, id]);
  const upd = useCallback((field: string, value: string) => setEditData((p) => p ? { ...p, [field]: value } : p), []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h1>
            <p className="text-sm text-muted-foreground">{employee.employeeId} · {employee.designation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={editData.status} onValueChange={(v) => changeStatus(v as "Active" | "Inactive" | "On Leave")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {editing ? (
            <>
              <Button onClick={handleSave} className="gap-1"><Save className="h-4 w-4" />Save</Button>
              <Button variant="outline" onClick={handleCancel} className="gap-1"><X className="h-4 w-4" />Cancel</Button>
            </>
          ) : (
            <> {/* Added a Fragment here to wrap multiple JSX elements */}
              <Button variant="outline" onClick={() => setEditing(true)} className="gap-1"><Edit className="h-4 w-4" />Edit Profile</Button>
              <Button variant="outline" onClick={() => navigate(`/employees/${id}/onboarding`)} className="gap-1"><ClipboardCheck className="h-4 w-4" />Onboarding</Button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Tenure" value={yearsAtCompany()} sub={`Since ${new Date(employee.dateOfJoining).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`} icon={<Award className="h-4 w-4" />} />
        <div>
          <StatCard title="Attendance Rate" value={`${attendanceRate}%`} sub={`${attendance.filter((a) => a.status === "Present").length} days present`} />
          <Progress value={attendanceRate} className="h-1 mt-1 rounded-none" />
        </div>
        <StatCard title="Leave Taken" value={`${totalLeaveDays} days`} sub={`${leaves.filter((l) => l.status === "Pending").length} pending`} />
        <StatCard title="Net Salary" value={latestPayroll ? `₹${latestPayroll.netSalary.toLocaleString("en-IN")}` : "—"} sub={latestPayroll ? `${latestPayroll.salaryStructure || "N/A"} structure` : "No payroll yet"} />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>First Name</Label><Input className="mt-1" value={editData.firstName} onChange={(e) => upd("firstName", e.target.value)} /></div>
                    <div><Label>Last Name</Label><Input className="mt-1" value={editData.lastName} onChange={(e) => upd("lastName", e.target.value)} /></div>
                  </div>
                  <div><Label>Email</Label><Input type="email" className="mt-1" value={editData.email} onChange={(e) => upd("email", e.target.value)} /></div>
                  <div><Label>Phone</Label><Input className="mt-1" value={editData.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
                  <div><Label>Address</Label><Textarea className="mt-1" rows={2} value={editData.address} onChange={(e) => upd("address", e.target.value)} /></div>
                  <div><Label>Emergency Contact</Label><Input className="mt-1" value={editData.emergencyContact} onChange={(e) => upd("emergencyContact", e.target.value)} /></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: "Email", value: employee.email },
                    { icon: Phone, label: "Phone", value: employee.phone },
                    { icon: Calendar, label: "Date of Birth", value: new Date(employee.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                    { icon: MapPin, label: "Address", value: employee.address },
                    { icon: Phone, label: "Emergency", value: employee.emergencyContact },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-xs text-muted-foreground">{label}</p><p>{value}</p></div>
                    </div>
                  ))}
                  <div className="flex gap-4 text-sm pt-1">
                    <div><p className="text-xs text-muted-foreground">Blood Group</p><p className="font-medium">{employee.bloodGroup || "N/A"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium">{employee.gender}</p></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Employment Details</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label>Department</Label>
                    <Select value={editData.department} onValueChange={(v) => upd("department", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <Select value={editData.designation} onValueChange={(v) => upd("designation", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{designations.map((d) => <SelectItem key={d.id} value={d.title}>{d.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Select value={editData.branch} onValueChange={(v) => upd("branch", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date of Joining</Label><Input type="date" className="mt-1" value={editData.dateOfJoining} onChange={(e) => upd("dateOfJoining", e.target.value)} /></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Department", value: employee.department },
                    { icon: Briefcase, label: "Designation", value: employee.designation },
                    { icon: MapPin, label: "Branch", value: employee.branch },
                    { icon: Calendar, label: "Date of Joining", value: new Date(employee.dateOfJoining).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-xs text-muted-foreground">{label}</p><p>{value}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Present", value: attendance.filter((a) => a.status === "Present").length, color: "text-green-600" },
              { label: "Absent", value: attendance.filter((a) => a.status === "Absent").length, color: "text-red-600" },
              { label: "On Leave", value: attendance.filter((a) => a.status === "On Leave").length, color: "text-blue-600" },
              { label: "Avg Hours", value: `${(attendance.filter((a) => a.workHours).reduce((s, a) => s + (a.workHours || 0), 0) / Math.max(attendance.filter((a) => a.workHours).length, 1)).toFixed(1)}h`, color: "text-primary" },
            ].map(({ label, value, color }) => (
              <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
            ))}
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {attendance.length > 0 ? attendance.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</TableCell>
                    <TableCell>{a.checkIn || "—"}</TableCell>
                    <TableCell>{a.checkOut || "—"}</TableCell>
                    <TableCell>{a.workHours ? `${a.workHours.toFixed(1)}h` : "—"}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                  </TableRow>
                )) : <EmptyState colSpan={5} message="No attendance records" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {leaves.length > 0 ? leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.leaveType}</TableCell>
                    <TableCell>{new Date(l.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                    <TableCell>{new Date(l.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{l.reason}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                  </TableRow>
                )) : <EmptyState colSpan={6} message="No leave records" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Basic</TableHead><TableHead>Allowances</TableHead><TableHead>Deductions</TableHead><TableHead>Tax</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {payrollData.length > 0 ? payrollData.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}</TableCell>
                    <TableCell>₹{p.basicSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-green-600">+₹{p.allowances.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-red-600">-₹{p.deductions.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-red-600">-₹{p.tax.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-semibold">₹{p.netSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                )) : <EmptyState colSpan={7} message="No payroll records" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
