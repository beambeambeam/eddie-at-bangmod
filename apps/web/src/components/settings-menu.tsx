import {
  CheckIcon,
  HapticsIcon,
  Menu,
  MoreIcon,
  SoundIcon,
} from "@plop-ui/react";
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
import { languageNames, languages } from "@/lib/localization/language";
import { useLanguage } from "@/lib/localization/language-provider";

/**
 * Sound, Vibration, Fullscreen and Theme folded into one corner button, so
 * they take no room from the play screen. Each item names its current state.
 */
export const SettingsMenu = () => {
  const {
    language,
    setLanguage,
    text: { settings },
  } = useLanguage();

  const { sound, haptics } = useFeedbackSettings();
  const { theme, setTheme } = useTheme();
  const fullscreen = useFullscreen();

  const items: MenuItem[] = [
    {
      label: sound ? settings.soundOn : settings.soundOff,
      icon: <SoundIcon off={!sound} />,
      onSelect: () => {
        setFeedbackSetting("sound", !sound);
      },
    },
    {
      label: haptics ? settings.vibrationOn : settings.vibrationOff,
      icon: <HapticsIcon off={!haptics} />,
      onSelect: () => {
        setFeedbackSetting("haptics", !haptics);
      },
    },
    ...(fullscreen.supported
      ? [
          {
            label: fullscreen.active
              ? settings.exitFullscreen
              : settings.fullscreen,
            icon: fullscreen.active ? <MinimizeIcon /> : <MaximizeIcon />,
            onSelect: () => {
              void toggleFullscreen();
            },
          },
        ]
      : []),
    {
      label: settings.theme(settings.themes[theme]),
      icon: THEME_ICONS[theme],
      onSelect: () => {
        setTheme(NEXT_THEME[theme]);
      },
    },
    "separator",
    ...languages.map((choice) => ({
      label:
        choice === language
          ? settings.selectedLanguage(languageNames[choice])
          : languageNames[choice],
      icon: choice === language ? <CheckIcon /> : undefined,
      onSelect: () => {
        setLanguage(choice);
      },
    })),
  ];

  return (
    <Menu
      label={settings.title}
      icon={<MoreIcon />}
      align="end"
      items={items}
    />
  );
};
