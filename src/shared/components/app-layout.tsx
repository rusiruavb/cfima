import { CalendarRange, Download, Landmark, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/shared/components/app-logo";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { downloadExport } from "@/shared/lib/api";
import { cn } from "@/shared/lib/utils";

const navItems = [
  {
    to: "/monthly",
    label: "Monthly",
    shortLabel: "Monthly",
    icon: CalendarRange,
  },
  { to: "/loans", label: "Loans", shortLabel: "Loans", icon: Landmark },
  { to: "/summary", label: "Summary", shortLabel: "Summary", icon: TrendingUp },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  compact = false,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center transition-colors",
          compact
            ? "flex-1 flex-col gap-1 rounded-lg px-2 py-2 text-[10px] font-medium sm:text-xs"
            : "gap-3 rounded-lg px-4 py-3 text-sm font-medium",
          isActive
            ? compact
              ? "text-primary"
              : "bg-primary text-secondary"
            : compact
              ? "text-primary/70"
              : "text-primary hover:bg-primary/10",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex items-center justify-center rounded-lg",
              compact && isActive && "bg-primary/10 p-1.5",
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className={cn(compact && "leading-tight")}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function AppLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background print:h-auto print:overflow-visible lg:flex-row">
      <aside className="no-print hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-primary/20 bg-sidebar lg:flex">
        <div className="flex items-center justify-between gap-2 border-b border-primary/20 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <AppLogo className="h-8" />
            <span className="text-lg font-semibold text-primary">Monthly</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} />
          ))}
        </nav>
        <div className="space-y-3 border-t border-primary/20 p-4">
          <ThemeToggle />
          <Button
            variant="outline"
            className="w-full gap-2 border-primary/30 text-primary"
            onClick={() => downloadExport()}
          >
            <Download className="h-4 w-4" />
            Download data
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-primary/20 bg-sidebar px-4 py-3 lg:hidden">
          <AppLogo className="h-8" />
          <span className="flex-1 text-lg font-semibold text-primary">
            Monthly
          </span>
          <ThemeToggle compact />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-primary"
            onClick={() => downloadExport()}
            aria-label="Download data"
          >
            <Download className="h-4 w-4" />
          </Button>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] print:overflow-visible sm:p-5 lg:p-6 lg:pb-8 xl:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-primary/20 bg-sidebar px-2 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden"
        aria-label="Main navigation"
      >
        {navItems.map(({ to, shortLabel, icon }) => (
          <NavItem key={to} to={to} label={shortLabel} icon={icon} compact />
        ))}
      </nav>
    </div>
  );
}
