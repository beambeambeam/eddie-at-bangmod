import { HapticsIcon, IconButton, SoundIcon } from "@plop-ui/react";

import {
  setFeedbackSetting,
  useFeedbackSettings,
} from "@/lib/feedback-settings";

/** Turns every sound of the site and the game on or off. */
const SoundToggle = () => {
  const { sound } = useFeedbackSettings();

  return (
    <IconButton
      size="sm"
      icon={<SoundIcon off={!sound} />}
      label={sound ? "Sound: on. Turn sound off" : "Sound: off. Turn sound on"}
      onClick={() => {
        setFeedbackSetting("sound", !sound);
      }}
    />
  );
};

/** Turns phone vibration on or off. */
const HapticsToggle = () => {
  const { haptics } = useFeedbackSettings();

  return (
    <IconButton
      size="sm"
      icon={<HapticsIcon off={!haptics} />}
      label={
        haptics
          ? "Vibration: on. Turn vibration off"
          : "Vibration: off. Turn vibration on"
      }
      onClick={() => {
        setFeedbackSetting("haptics", !haptics);
      }}
    />
  );
};

export { HapticsToggle, SoundToggle };
