/** The page as `enterLandscape` needs it: fullscreen and screen orientation. */
interface LandscapePage {
  fullscreenElement: Element | null;
  fullscreenEnabled: boolean;
  documentElement: Pick<Element, "requestFullscreen">;
}

interface LandscapeScreen {
  orientation?: { lock?: (orientation: "landscape") => Promise<void> };
}

/**
 * Goes fullscreen and turns the screen to landscape, where the browser can.
 * Browsers only allow this from a tap, so call it from one. Android Chrome
 * does both; iPhone Safari has neither API, so the rotate notice asks there.
 * Never throws: a refusal leaves the page as it was.
 */
export const enterLandscape = async (
  page: LandscapePage = document,
  { orientation }: LandscapeScreen = screen
) => {
  try {
    if (page.fullscreenEnabled && page.fullscreenElement === null) {
      await page.documentElement.requestFullscreen({ navigationUI: "hide" });
    }

    // Chrome locks the orientation only in fullscreen.
    await orientation?.lock?.("landscape");
  } catch {
    // Refused or not supported: the rotate notice still covers this case.
  }
};
