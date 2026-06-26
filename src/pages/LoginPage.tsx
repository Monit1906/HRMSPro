import { useState } from "react";
import { Eye, EyeOff, LogIn, Building2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useRole();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Please enter your username"); return; }
    if (!password)        { setError("Please enter your password"); return; }
    setBusy(true);
    const result = login(username.trim(), password);
    setBusy(false);
    if (result.success) {
      toast.success("Welcome back!");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto shadow-md select-none">
            HR
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HRMSPro</h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />Human Resource Management System
          </p>
        </div>

        {/* Login card */}
        <Card className="shadow-lg border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />Sign In
            </CardTitle>
            <CardDescription>Enter the username and password assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
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

              {/* Password */}
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

              {/* Error */}
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

        {/* Default credentials hint */}
        <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Default Credentials</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Admin username</span>
                <button
                  className="font-mono bg-background border px-2 py-0.5 rounded text-xs hover:bg-muted transition-colors"
                  onClick={() => { setUsername("admin"); setPassword("admin@123"); }}
                  title="Click to auto-fill"
                >admin / admin@123</button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">HR Manager</span>
                <button
                  className="font-mono bg-background border px-2 py-0.5 rounded text-xs hover:bg-muted transition-colors"
                  onClick={() => { setUsername("hrmanager"); setPassword("hr@123"); }}
                  title="Click to auto-fill"
                >hrmanager / hr@123</button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2">HR/Admin can create Employee accounts in User Management.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
