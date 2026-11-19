import { IconButton } from "@plop-ui/react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/lib/theme";

const NEXT: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const ICONS = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <MonitorIcon />,
} satisfies Record<Theme, React.ReactNode>;

/** Cycles light → dark → system. */
const ModeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <IconButton
      icon={ICONS[theme]}
      label={`Theme: ${theme}. Switch to ${NEXT[theme]}`}
      onClick={() => {
        setTheme(NEXT[theme]);
      }}
    />
  );
};

export { ModeToggle };
