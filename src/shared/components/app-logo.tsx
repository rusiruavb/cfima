import logo from "@/assets/logo.png";
import { cn } from "@/shared/lib/utils";

type AppLogoProps = {
  className?: string;
};

/** App mark from src/assets/logo.png — inverted in dark mode for contrast on the sidebar. */
export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      src={logo}
      alt=""
      aria-hidden
      className={cn("h-7 w-auto shrink-0 object-contain dark:invert", className)}
    />
  );
}
