import { IconButton } from "@plop-ui/react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/lib/localization/language-provider";
import type { Theme } from "@/lib/theme";

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const THEME_ICONS = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <MonitorIcon />,
} satisfies Record<Theme, React.ReactNode>;

/** Cycles light → dark → system. */
const ModeToggle = () => {
  const {
    text: { settings },
  } = useLanguage();

  const { theme, setTheme } = useTheme();

  return (
    <IconButton
      size="sm"
      icon={THEME_ICONS[theme]}
      label={settings.changeTheme(
        settings.themes[theme],
        settings.themes[NEXT_THEME[theme]]
      )}
      onClick={() => {
        setTheme(NEXT_THEME[theme]);
      }}
    />
  );
};

export { ModeToggle, NEXT_THEME, THEME_ICONS };
