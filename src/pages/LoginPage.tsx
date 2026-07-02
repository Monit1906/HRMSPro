import { useState } from "react";
import { Eye, EyeOff, LogIn, Building2, KeyRound, Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole, SYSTEM_USERS, getEmployeeUsers, getAllUsers } from "@/contexts/RoleContext";
import { toast } from "sonner";

// ─── Coder Panel ─────────────────────────────────────────────────────────────
const CODER_ID       = "Trion";
const CODER_PASSWORD = "HZM1234";
const TEMP_OTP_KEY   = "hrms_temp_otp";
const TEMP_ACCESS_KEY = "hrms_temp_access";

function CoderPanel({ onClose }: { onClose: () => void }) {
  const { createEmployeeUser, setUserPassword, getAllUsers: getUsers } = useRole();
  const [cpStep, setCpStep] = useState<"auth" | "menu" | "assign" | "otp">("auth");
  const [cpUser, setCpUser]     = useState("");
  const [cpPass, setCpPass]     = useState("");
  const [cpError, setCpError]   = useState("");
  const [assignType, setAssignType] = useState<"admin" | "hr">("hr");
  const [targetUsername, setTargetUsername] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetPass, setTargetPass] = useState("");
  const [otpTarget, setOtpTarget] = useState("");
  const [otpCode, setOtpCode]   = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpDuration, setOtpDuration] = useState(60); // minutes
  const [showCpPass, setShowCpPass] = useState(false);

  const handleCoderAuth = () => {
    if (cpUser !== CODER_ID || cpPass !== CODER_PASSWORD) {
      setCpError("Invalid coder credentials"); return;
    }
    setCpError("");
    setCpStep("menu");
  };

  const handleAssignUser = () => {
    if (!targetUsername.trim() || !targetName.trim() || !targetPass.trim()) {
      setCpError("All fields required"); return;
    }
    const all = getUsers();
    if (all.some((u) => u.username.toLowerCase() === targetUsername.toLowerCase())) {
      setCpError("Username already exists"); return;
    }
    const role = assignType === "admin" ? "Admin" as const : "HR Manager" as const;
    const result = createEmployeeUser({
      username: targetUsername.trim(),
      name: targetName.trim(),
      role,
      email: "",
      password: targetPass.trim(),
      locationPermission: true,
      dailyHoursTarget: 8,
    });
    if (result.success) {
      toast.success(`${role} account "${targetUsername}" created`);
      setTargetUsername(""); setTargetName(""); setTargetPass(""); setCpError("");
      setCpStep("menu");
    } else {
      setCpError(result.error || "Failed");
    }
  };

  const handleGenerateOtp = () => {
    const all = getAllUsers();
    const found = all.find((u) => u.username.toLowerCase() === otpTarget.toLowerCase());
    if (!found || (found.role !== "Admin" && found.role !== "HR Manager")) {
      setCpError("Admin/HR user not found"); return;
    }
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const expiry = Date.now() + otpDuration * 60_000;
    localStorage.setItem(TEMP_OTP_KEY, JSON.stringify({ userId: found.id, otp, expiry }));
    setGeneratedOtp(otp);
    setCpError("");
    toast.success(`OTP ${otp} generated for ${found.name} — valid ${otpDuration} min`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Coder Panel</CardTitle>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />Back
            </button>
          </div>
          <CardDescription className="text-xs">System administration access — restricted area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cpStep === "auth" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Coder User ID</Label>
                <Input value={cpUser} onChange={(e) => { setCpUser(e.target.value); setCpError(""); }} placeholder="Coder ID" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Coder Password</Label>
                <div className="relative">
                  <Input type={showCpPass ? "text" : "password"} value={cpPass} onChange={(e) => { setCpPass(e.target.value); setCpError(""); }} placeholder="Password" className="h-9 pr-9" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCpPass(!showCpPass)}>
                    {showCpPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {cpError && <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{cpError}</p>}
              <Button className="w-full h-9" onClick={handleCoderAuth}>Access Coder Panel</Button>
            </div>
          )}

          {cpStep === "menu" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="h-12 flex-col gap-0.5 text-left items-start px-4" onClick={() => { setCpStep("assign"); setCpError(""); }}>
                  <span className="font-semibold text-sm">Assign Admin / HR</span>
                  <span className="text-xs text-muted-foreground font-normal">Create Admin or HR Manager account</span>
                </Button>
                <Button variant="outline" className="h-12 flex-col gap-0.5 text-left items-start px-4" onClick={() => { setCpStep("otp"); setCpError(""); }}>
                  <span className="font-semibold text-sm">Grant Timed Admin Access</span>
                  <span className="text-xs text-muted-foreground font-normal">Generate OTP for temporary elevated access</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setCpStep("auth")}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back to Auth
              </Button>
            </div>
          )}

          {cpStep === "assign" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["hr", "admin"] as const).map((t) => (
                  <button key={t} onClick={() => setAssignType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${assignType === t ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"}`}>
                    {t === "admin" ? "Admin" : "HR Manager"}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <Input value={targetUsername} onChange={(e) => { setTargetUsername(e.target.value); setCpError(""); }} placeholder="e.g. john.admin" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="John Smith" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <Input type="password" value={targetPass} onChange={(e) => setTargetPass(e.target.value)} placeholder="Set password" className="h-9" />
              </div>
              {cpError && <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{cpError}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setCpStep("menu"); setCpError(""); }}>Back</Button>
                <Button className="flex-1" onClick={handleAssignUser}>Create Account</Button>
              </div>
            </div>
          )}

          {cpStep === "otp" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter the Admin/HR username. They will receive a 4-digit OTP to enter on the login screen for timed access.</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Target Admin/HR Username</Label>
                <Input value={otpTarget} onChange={(e) => { setOtpTarget(e.target.value); setCpError(""); }} placeholder="admin username" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Access Duration (minutes)</Label>
                <Input type="number" value={otpDuration} onChange={(e) => setOtpDuration(parseInt(e.target.value) || 60)} className="h-9" min={5} max={480} />
              </div>
              {cpError && <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{cpError}</p>}
              {generatedOtp && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Generated OTP (share with user)</p>
                  <p className="text-3xl font-bold font-mono tracking-widest text-primary">{generatedOtp}</p>
                  <p className="text-xs text-muted-foreground mt-1">Valid for {otpDuration} minutes</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setCpStep("menu"); setGeneratedOtp(""); setCpError(""); }}>Back</Button>
                <Button className="flex-1 gap-1.5" onClick={handleGenerateOtp}><RefreshCw className="h-3.5 w-3.5" />{generatedOtp ? "Regenerate" : "Generate OTP"}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── OTP Login Step ───────────────────────────────────────────────────────────
function OtpStep({ username, onSuccess, onBack }: { username: string; onSuccess: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    try {
      const raw = localStorage.getItem(TEMP_OTP_KEY);
      if (!raw) { setError("No OTP pending"); return; }
      const { userId, otp: stored, expiry } = JSON.parse(raw);
      if (Date.now() > expiry) { setError("OTP expired — request a new one from Coder Panel"); localStorage.removeItem(TEMP_OTP_KEY); return; }
      const all = getAllUsers();
      const user = all.find((u) => u.id === userId && u.username.toLowerCase() === username.toLowerCase());
      if (!user) { setError("Username does not match OTP target"); return; }
      if (otp.trim() !== stored) { setError("Incorrect OTP"); return; }
      localStorage.removeItem(TEMP_OTP_KEY);
      localStorage.setItem(TEMP_ACCESS_KEY, JSON.stringify({ userId, expiry }));
      toast.success("OTP verified — access granted");
      onSuccess();
    } catch { setError("Invalid OTP data"); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Enter the 4-digit OTP provided by Coder Panel for <span className="font-semibold text-foreground">{username}</span></p>
      <Input
        type="text"
        maxLength={4}
        value={otp}
        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
        placeholder="• • • •"
        className="h-14 text-center text-3xl font-bold tracking-widest"
      />
      {error && <p className="text-xs text-destructive bg-destructive/10 rounded p-2 text-center">{error}</p>}
      <Button className="w-full h-10" onClick={handleVerify} disabled={otp.length !== 4}>Verify OTP</Button>
      <Button variant="ghost" size="sm" className="w-full" onClick={onBack}><ArrowLeft className="h-3.5 w-3.5 mr-1" />Back</Button>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useRole();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [coderOpen, setCoderOpen] = useState(false);
  const [otpStep, setOtpStep]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Please enter your username"); return; }
    if (!password)        { setError("Please enter your password"); return; }
    setBusy(true);

    // Check if there is a pending OTP access for this user
    const tempRaw = localStorage.getItem(TEMP_ACCESS_KEY);
    if (tempRaw) {
      const { userId, expiry } = JSON.parse(tempRaw);
      if (Date.now() < expiry) {
        const all = getAllUsers();
        const found = all.find((u) => u.id === userId && u.username.toLowerCase() === username.toLowerCase());
        if (found) {
          // Verify password still
          const result = login(username.trim(), password);
          setBusy(false);
          if (result.success) { localStorage.removeItem(TEMP_ACCESS_KEY); toast.success("Welcome back!"); return; }
          setError(result.error || "Login failed");
          return;
        }
      } else {
        localStorage.removeItem(TEMP_ACCESS_KEY);
      }
    }

    const result = login(username.trim(), password);
    setBusy(false);
    if (result.success) {
      toast.success("Welcome back!");
    } else {
      setError(result.error || "Login failed");
    }
  };

  if (otpStep) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-md select-none overflow-hidden">
              <span className="text-xl font-bold">D</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Daftar</h1>
          </div>
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />OTP Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <OtpStep username={username} onSuccess={() => { setOtpStep(false); login(username, password); }} onBack={() => setOtpStep(false)} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {coderOpen && <CoderPanel onClose={() => setCoderOpen(false)} />}

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5">
          {/* Brand */}
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-md select-none overflow-hidden">
              <span className="text-2xl font-bold">D</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Daftar</h1>
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />HR Management System
            </p>
          </div>

          {/* Login card */}
          <Card className="shadow-lg border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />Sign In
              </CardTitle>
              <CardDescription>Enter your username and password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="Enter your username"
                    className="h-10"
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pwd">Password</Label>
                  <div className="relative">
                    <Input
                      id="pwd"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Enter your password"
                      className="pr-10 h-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShow(!show)}
                      tabIndex={-1}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
                )}

                <Button type="submit" className="w-full h-10 gap-2" disabled={busy}>
                  <LogIn className="h-4 w-4" />
                  {busy ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Coder panel link */}
          <div className="text-center">
            <button
              onClick={() => setCoderOpen(true)}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              System Administration
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
