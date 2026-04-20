import { memo, useState, useCallback } from "react";
import { Bell, User, LogOut, Sun, Moon, Monitor, CheckCheck, Calendar, DollarSign, Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useTheme } from "@/contexts/ThemeContext";
import { useRole, USERS } from "@/contexts/RoleContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { cn } from "@/lib/utils";

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };
const THEME_LABELS = { light: "Light", dark: "Dark", system: "Device" };

const NOTIF_ICON: Record<string, typeof Calendar> = {
  leave: Calendar,
  holiday: Calendar,
  payroll: DollarSign,
};

const NOTIF_COLOR: Record<string, string> = {
  leave: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  holiday: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  payroll: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, setUser, can } = useRole();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const ThemeIcon = THEME_ICONS[theme];

  const handleNotifClick = useCallback((id: string) => {
    markRead(id);
  }, [markRead]);

  const cycleTheme = useCallback(() => {
    const order: typeof theme[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % 3];
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <header className="h-14 shrink-0 border-b flex items-center justify-between px-3 sm:px-6 bg-background z-30">
      {/* Left: Hamburger + Brand */}
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

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={cycleTheme}
          title={`Theme: ${THEME_LABELS[theme]}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>

        {/* Notifications bell */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
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
                  <CheckCheck className="h-3 w-3" /> Mark all read
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
                    <button
                      key={n.id}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left border-b last:border-0",
                        !n.read && "bg-primary/5"
                      )}
                      onClick={() => handleNotifClick(n.id)}
                    >
                      <div className={cn("p-1.5 rounded-full shrink-0 mt-0.5", NOTIF_COLOR[n.type])}>
                        <Icon className="h-3 w-3" />
                      </div>
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
                <span className="text-xs font-semibold text-primary">{user.name[0]}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
            {USERS.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => setUser(u)}
                className={cn(user.id === u.id && "bg-primary/10 text-primary")}
              >
                <User className="mr-2 h-4 w-4" />
                <div>
                  <p className="text-xs font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.role}</p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* Theme options */}
            <DropdownMenuLabel className="flex items-center gap-1"><Settings className="h-3 w-3" />Theme</DropdownMenuLabel>
            {(["light","dark","system"] as const).map((t) => {
              const Icon = THEME_ICONS[t];
              return (
                <DropdownMenuItem key={t} onClick={() => setTheme(t)} className={cn(theme === t && "bg-primary/10 text-primary")}>
                  <Icon className="mr-2 h-4 w-4" />{THEME_LABELS[t]}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default memo(Header);
