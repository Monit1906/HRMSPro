import { useState } from "react";
import { Eye, EyeOff, LogIn, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRole, USERS, DEFAULT_PASSWORDS } from "@/contexts/RoleContext";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  Admin:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "HR Manager": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Employee:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function LoginPage() {
  const { login } = useRole();
  const [userId, setUserId]     = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);

  const selectedUser = USERS.find((u) => u.id === userId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId)   { toast.error("Please select an account"); return; }
    if (!password) { toast.error("Please enter your password"); return; }
    setBusy(true);
    const result = login(userId, password);
    setBusy(false);
    if (result.success) {
      toast.success("Login successful!");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto shadow-md">
            HR
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HRMSPro</h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />Human Resource Management System
          </p>
        </div>

        {/* Login card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>Select your account and enter your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account selector */}
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose your account…" />
                  </SelectTrigger>
                  <SelectContent>
                    {USERS.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2.5 py-0.5">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {u.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">{u.name}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{u.role}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUser && (
                  <Badge className={`text-xs ${ROLE_COLORS[selectedUser.role]}`}>{selectedUser.role}</Badge>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="pwd">Password</Label>
                <div className="relative">
                  <Input
                    id="pwd"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <Button type="submit" className="w-full h-10 gap-2" disabled={busy}>
                <LogIn className="h-4 w-4" />
                {busy ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Default credentials */}
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Default Credentials</p>
            <div className="space-y-1.5">
              {USERS.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {u.name} <span className="opacity-60">({u.role})</span>
                  </span>
                  <button
                    type="button"
                    className="font-mono bg-muted hover:bg-muted/80 px-2 py-0.5 rounded text-xs transition-colors"
                    onClick={() => { setUserId(u.id); setPassword(DEFAULT_PASSWORDS[u.id]); }}
                    title="Click to auto-fill"
                  >
                    {DEFAULT_PASSWORDS[u.id]}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2">Click a password to auto-fill</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
