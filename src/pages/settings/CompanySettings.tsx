import { useState, useCallback } from "react";
import { Building2, Globe, Clock, DollarSign, Bell, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompanySettings, setCompanySettings } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";

const CURRENCIES = ["USD","EUR","GBP","INR","AED","SGD","CAD","AUD"];
const TIMEZONES = ["America/Los_Angeles","America/New_York","Europe/London","Europe/Paris","Asia/Kolkata","Asia/Dubai","Asia/Singapore","Australia/Sydney"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CompanySettings() {
  const [settings, setSettings] = useState(getCompanySettings());
  const upd = useCallback((field: string, value: string | number | boolean) => setSettings((p) => ({ ...p, [field]: value })), []);

  const handleSave = useCallback(() => { setCompanySettings(settings); toast.success("Settings saved successfully"); }, [settings]);

  return (
    <div className="space-y-4">
      <PageHeader title="Company Settings" description="Organisation profile and HR configuration">
        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
      </PageHeader>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Building2 className="h-3.5 w-3.5 mr-1.5" />General</TabsTrigger>
          <TabsTrigger value="localization"><Globe className="h-3.5 w-3.5 mr-1.5" />Localization</TabsTrigger>
          <TabsTrigger value="policy"><Clock className="h-3.5 w-3.5 mr-1.5" />HR Policy</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1.5" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Organisation Profile</CardTitle><CardDescription>Basic company information</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Company Name *</Label><Input className="mt-1" value={settings.name} onChange={(e) => upd("name", e.target.value)} /></div>
              <div><Label>Legal Name</Label><Input className="mt-1" value={settings.legalName} onChange={(e) => upd("legalName", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>HR Email</Label><Input type="email" className="mt-1" value={settings.email} onChange={(e) => upd("email", e.target.value)} /></div>
                <div><Label>Phone</Label><Input className="mt-1" value={settings.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
              </div>
              <div><Label>Website</Label><Input className="mt-1" value={settings.website} onChange={(e) => upd("website", e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Address</CardTitle><CardDescription>Primary office location</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Street Address</Label><Input className="mt-1" value={settings.address} onChange={(e) => upd("address", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input className="mt-1" value={settings.city} onChange={(e) => upd("city", e.target.value)} /></div>
                <div><Label>State</Label><Input className="mt-1" value={settings.state} onChange={(e) => upd("state", e.target.value)} /></div>
              </div>
              <div><Label>Country</Label><Input className="mt-1" value={settings.country} onChange={(e) => upd("country", e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Localization Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={(v) => upd("currency", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => upd("timezone", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fiscal Year Start</Label>
                <Select value={settings.fiscalYearStart} onValueChange={(v) => upd("fiscalYearStart", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Currency", value: settings.currency },
                { label: "Local Time", value: new Date().toLocaleTimeString("en-US", { timeZone: settings.timezone, hour: "2-digit", minute: "2-digit" }) },
                { label: "Fiscal Year", value: `${settings.fiscalYearStart} → ${MONTHS[(MONTHS.indexOf(settings.fiscalYearStart) + 11) % 12]}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Work Policy</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Working Hours / Day</Label><Input type="number" className="w-24" value={settings.workingHours} onChange={(e) => upd("workingHours", parseInt(e.target.value) || 8)} /></div>
              <div className="flex items-center justify-between"><Label>Salary Pay Day (of month)</Label><Input type="number" className="w-24" value={settings.payDay} onChange={(e) => upd("payDay", parseInt(e.target.value) || 1)} /></div>
              <div className="flex items-center justify-between"><Label>Probation Period (days)</Label><Input type="number" className="w-24" value={settings.probationPeriod} onChange={(e) => upd("probationPeriod", parseInt(e.target.value) || 90)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Policy Preview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Clock, label: "Working Hours", value: `${settings.workingHours}h/day`, sub: `${settings.workingHours * 5}h/week` },
                { icon: DollarSign, label: "Pay Day", value: `${settings.payDay}${["st","nd","rd"][settings.payDay - 1] || "th"} of month`, sub: settings.currency },
                { icon: User, label: "Probation", value: `${settings.probationPeriod} days`, sub: `≈ ${Math.round(settings.probationPeriod / 30)} months` },
                { icon: Globe, label: "Fiscal Year", value: `${settings.fiscalYearStart}`, sub: settings.timezone.split("/")[1]?.replace("_", " ") },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xs font-medium">{sub}</p></div>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Notification Preferences</CardTitle><CardDescription>Control which HR notifications are sent</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "noticeEmailLeave", title: "Leave Applications", desc: "Notify HR when a new leave application is submitted or status changes", icon: "🏖️" },
                { key: "noticeEmailAttendance", title: "Attendance Alerts", desc: "Notify HR when an employee is absent or has irregular attendance", icon: "📋" },
                { key: "noticeEmailPayroll", title: "Payroll Processed", desc: "Notify when payroll is processed or salary is marked as paid", icon: "💰" },
              ].map(({ key, title, desc, icon }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                  </div>
                  <Switch checked={(settings as Record<string, unknown>)[key] as boolean} onCheckedChange={(v) => upd(key, v)} />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Notifications sent to: {settings.email || "hr@company.com"}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
