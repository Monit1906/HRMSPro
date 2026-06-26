import { memo, useState, useCallback } from "react";
import {
  Bell, User, LogOut, Sun, Moon, Monitor, CheckCheck, Calendar, DollarSign,
  Menu, X, Settings, RotateCcw, KeyRound, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useRole } from "@/contexts/RoleContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { resetAllData } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const THEME_ICONS  = { light: Sun, dark: Moon, system: Monitor };
const THEME_LABELS = { light: "Light", dark: "Dark", system: "Device" };

const NOTIF_ICON: Record<string, typeof Calendar> = {
  leave: Calendar, holiday: Calendar, payroll: DollarSign,
};
const NOTIF_COLOR: Record<string, string> = {
  leave:   "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  holiday: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  payroll: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

interface HeaderProps { onMenuToggle: () => void; sidebarOpen: boolean; }

function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout, can, verifyPassword } = useRole();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  // Reset dialog
  const [resetOpen, setResetOpen]     = useState(false);
  const [resetPwd, setResetPwd]       = useState("");
  const [resetBusy, setResetBusy]     = useState(false);
  const [resetError, setResetError]   = useState("");

  const ThemeIcon = THEME_ICONS[theme];

  const cycleTheme = useCallback(() => {
    const order: typeof theme[] = ["light", "dark", "system"];
    setTheme(order[(order.indexOf(theme) + 1) % 3]);
  }, [theme, setTheme]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Logged out successfully");
  }, [logout]);

  const openReset = useCallback(() => {
    setResetPwd("");
    setResetError("");
    setResetOpen(true);
  }, []);

  const handleReset = useCallback(async () => {
    if (!resetPwd) { setResetError("Please enter your password"); return; }
    setResetBusy(true);
    const ok = verifyPassword(user.id, resetPwd);
    setResetBusy(false);
    if (!ok) { setResetError("Incorrect password"); return; }
    toast.success("Resetting all data…");
    setResetOpen(false);
    resetAllData();
    setTimeout(() => window.location.reload(), 600);
  }, [resetPwd, user.id, verifyPassword]);

  const userInitials = (user.name || user.username || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  return (
    <>
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-3 sm:px-6 bg-background z-30">
        {/* Left */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onMenuToggle}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold select-none shrink-0">
              HR
            </div>
            <span className="font-semibold text-sm hidden sm:block">HRMSPro</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={cycleTheme} title={`Theme: ${THEME_LABELS[theme]}`}>
            <ThemeIcon className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2.5 border-b">
                <p className="font-semibold text-sm">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" />Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[340px]">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">All caught up!</p>
                ) : (
                  notifications.map((n) => {
                    const Icon = NOTIF_ICON[n.type] ?? Bell;
                    return (
                      <button key={n.id}
                        className={cn("w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left border-b last:border-0", !n.read && "bg-primary/5")}
                        onClick={() => markRead(n.id)}
                      >
                        <div className={cn("p-1.5 rounded-full shrink-0 mt-0.5", NOTIF_COLOR[n.type])}><Icon className="h-3 w-3" /></div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs font-medium truncate", !n.read && "text-foreground")}>{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        </div>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </button>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2 pr-3 h-9">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">{userInitials}</span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="pb-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user.email || user.username}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Theme */}
              <DropdownMenuLabel className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Settings className="h-3 w-3" />Appearance
              </DropdownMenuLabel>
              {(["light", "dark", "system"] as const).map((t) => {
                const Icon = THEME_ICONS[t];
                return (
                  <DropdownMenuItem key={t} onClick={() => setTheme(t)} className={cn(theme === t && "bg-primary/10 text-primary")}>
                    <Icon className="mr-2 h-4 w-4" />{THEME_LABELS[t]}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />

              {/* Reset — Admin only */}
              {can("reset_data") && (
                <DropdownMenuItem onClick={openReset} className="text-destructive focus:text-destructive">
                  <RotateCcw className="mr-2 h-4 w-4" />Reset All Data
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Reset confirmation dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Reset All Data</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently delete all employees, payroll, attendance, and other records. This action cannot be undone. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" />Your Password</Label>
              <Input
                type="password"
                placeholder="Enter your current password"
                value={resetPwd}
                onChange={(e) => { setResetPwd(e.target.value); setResetError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className={resetError ? "border-destructive" : ""}
              />
              {resetError && <p className="text-xs text-destructive">{resetError}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReset} disabled={resetBusy}>
                {resetBusy ? "Resetting…" : "Reset All Data"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(Header);
