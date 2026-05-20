import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/shared/lib/theme";
import { cn } from "@/shared/lib/utils";

const themeToggleId = "theme-toggle";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Dark mode" : "Light mode";

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Switch
          id={themeToggleId}
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
        <Label htmlFor={themeToggleId} className="sr-only">
          {label}
        </Label>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-card px-3 py-2.5",
        className,
      )}
    >
      <Label
        htmlFor={themeToggleId}
        className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
      >
        {isDark ? (
          <Moon className="h-4 w-4" aria-hidden />
        ) : (
          <Sun className="h-4 w-4" aria-hidden />
        )}
        {label}
      </Label>
      <Switch
        id={themeToggleId}
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
    </div>
  );
}
