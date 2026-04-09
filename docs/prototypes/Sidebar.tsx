import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Hexagon,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/sprint-setup", label: "Sprint Setup", icon: Settings },
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feedback", label: "Feedback Board", icon: MessageSquare },
    { href: "/actions", label: "Action Items", icon: CheckSquare },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col h-screen border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="p-6 flex items-center gap-3 font-semibold text-lg tracking-tight">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          <Hexagon className="w-5 h-5 fill-primary" />
        </div>
        RetroBoard
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-4 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Sprint 42
        </div>

        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group",
                  isActive
                    ? "bg-secondary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "w-4 h-4",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Jane Doe</p>
            <p className="text-xs text-muted-foreground">Pod 1</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
