import { HapticsIcon, Menu, MoreIcon, SoundIcon } from "@plop-ui/react";
import type { MenuItem } from "@plop-ui/react";
import { MaximizeIcon, MinimizeIcon } from "lucide-react";

import {
  toggleFullscreen,
  useFullscreen,
} from "@/components/fullscreen-toggle";
import { THEME_ICONS, NEXT_THEME } from "@/components/mode-toggle";
import { useTheme } from "@/components/theme-provider";
import {
  setFeedbackSetting,
  useFeedbackSettings,
} from "@/lib/feedback-settings";

/**
 * Sound, Vibration, Fullscreen and Theme folded into one corner button, so
 * they take no room from the play screen. Each item names its current state.
 */
export const SettingsMenu = () => {
  const { sound, haptics } = useFeedbackSettings();
  const { theme, setTheme } = useTheme();
  const fullscreen = useFullscreen();

  const items: MenuItem[] = [
    {
      label: sound ? "Sound: on" : "Sound: off",
      icon: <SoundIcon off={!sound} />,
      onSelect: () => {
        setFeedbackSetting("sound", !sound);
      },
    },
    {
      label: haptics ? "Vibration: on" : "Vibration: off",
      icon: <HapticsIcon off={!haptics} />,
      onSelect: () => {
        setFeedbackSetting("haptics", !haptics);
      },
    },
    ...(fullscreen.supported
      ? [
          {
            label: fullscreen.active ? "Exit fullscreen" : "Fullscreen",
            icon: fullscreen.active ? <MinimizeIcon /> : <MaximizeIcon />,
            onSelect: () => {
              void toggleFullscreen();
            },
          },
        ]
      : []),
    {
      label: `Theme: ${theme}`,
      icon: THEME_ICONS[theme],
      onSelect: () => {
        setTheme(NEXT_THEME[theme]);
      },
    },
  ];

  return (
    <Menu label="Settings" icon={<MoreIcon />} align="end" items={items} />
  );
};
