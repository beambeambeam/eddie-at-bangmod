import { HapticsIcon, IconButton, SoundIcon } from "@plop-ui/react";

import {
  setFeedbackSetting,
  useFeedbackSettings,
} from "@/lib/feedback-settings";
import { useLanguage } from "@/lib/localization/language-provider";

/** Turns every sound of the site and the game on or off. */
const SoundToggle = () => {
  const {
    text: { settings },
  } = useLanguage();

  const { sound } = useFeedbackSettings();

  return (
    <IconButton
      size="sm"
      icon={<SoundIcon off={!sound} />}
      label={sound ? settings.turnSoundOff : settings.turnSoundOn}
      onClick={() => {
        setFeedbackSetting("sound", !sound);
      }}
    />
  );
};

/** Turns phone vibration on or off. */
const HapticsToggle = () => {
  const {
    text: { settings },
  } = useLanguage();

  const { haptics } = useFeedbackSettings();

  return (
    <IconButton
      size="sm"
      icon={<HapticsIcon off={!haptics} />}
      label={haptics ? settings.turnVibrationOff : settings.turnVibrationOn}
      onClick={() => {
        setFeedbackSetting("haptics", !haptics);
      }}
    />
  );
};

export { HapticsToggle, SoundToggle };
