import { IconButton } from "@plop-ui/react";
import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);

  return () => {
    document.removeEventListener("fullscreenchange", onChange);
  };
};

const getIsFullscreen = () => document.fullscreenElement !== null;
const getIsSupported = () => document.fullscreenEnabled;
const getServerSnapshot = () => false;

const toggleFullscreen = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();

    return;
  }

  await document.documentElement.requestFullscreen();
};

/** Enters or leaves fullscreen. Hidden where the browser lacks the API (e.g. iPhone Safari). */
const FullscreenToggle = () => {
  const isFullscreen = useSyncExternalStore(
    subscribe,
    getIsFullscreen,
    getServerSnapshot
  );

  const isSupported = useSyncExternalStore(
    subscribe,
    getIsSupported,
    getServerSnapshot
  );

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

export { FullscreenToggle };
