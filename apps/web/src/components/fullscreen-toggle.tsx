import { IconButton } from "@plop-ui/react";
import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { enterLandscape } from "@/lib/landscape";

const subscribe = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);

  return () => {
    document.removeEventListener("fullscreenchange", onChange);
  };
};

const getIsFullscreen = () => document.fullscreenElement !== null;
const getIsSupported = () => document.fullscreenEnabled;
const getServerSnapshot = () => false;

/** Leaves fullscreen, or enters it turned to landscape where the browser can. */
const toggleFullscreen = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();

    return;
  }

  await enterLandscape();
};

/** Whether the browser has the fullscreen API, and whether the page is fullscreen. */
const useFullscreen = () => ({
  active: useSyncExternalStore(subscribe, getIsFullscreen, getServerSnapshot),
  supported: useSyncExternalStore(subscribe, getIsSupported, getServerSnapshot),
});

/** Enters or leaves fullscreen. Hidden where the browser lacks the API (e.g. iPhone Safari). */
const FullscreenToggle = () => {
  const { active: isFullscreen, supported: isSupported } = useFullscreen();

  if (!isSupported) {
    return null;
  }

  return (
    <IconButton
      size="sm"
      icon={isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
      label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      onClick={() => {
        void toggleFullscreen();
      }}
    />
  );
};

export { FullscreenToggle, toggleFullscreen, useFullscreen };
