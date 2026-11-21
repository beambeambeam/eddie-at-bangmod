import { ButtonLink, Doodle, Tag, WordSticker } from "@plop-ui/react";
import type { DoodleKind, DoodleTone } from "@plop-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { loadMarketScene } from "@/components/play/load-market-scene";
import { RouterLink } from "@/components/router-link";
import { useLanguage } from "@/lib/localization/language-provider";
import { lettered } from "@/lib/localization/lettering";

interface Decoration {
  kind: DoodleKind;
  tone: DoodleTone;
  size: number;
  tilt: number;
  className: string;
}

const DECORATIONS: Decoration[] = [
  {
    kind: "star",
    tone: "mustard",
    size: 72,
    tilt: -12,
    className: "top-[12%] left-[8%]",
  },
  {
    kind: "sparkle",
    tone: "periwinkle",
    size: 48,
    tilt: 8,
    className: "top-[18%] right-[12%]",
  },
  {
    kind: "heart",
    tone: "bubblegum",
    size: 56,
    tilt: 14,
    className: "bottom-[16%] left-[14%]",
  },
  {
    kind: "burst",
    tone: "tomato",
    size: 64,
    tilt: -6,
    className: "right-[8%] bottom-[12%]",
  },
  {
    kind: "sparkle",
    tone: "mint",
    size: 36,
    tilt: 20,
    className: "top-[44%] left-[4%] hidden sm:block",
  },
  {
    kind: "star",
    tone: "periwinkle",
    size: 40,
    tilt: 18,
    className: "top-[52%] right-[5%] hidden sm:block",
  },
];

const preloadMarket = () => {
  void loadMarketScene();
};

/**
 * Fetches the Market scene once the home page is idle, so Play opens fast.
 * Browsers without idle callbacks wait a moment instead.
 */
const usePreloadMarket = () => {
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const idle = requestIdleCallback(preloadMarket, { timeout: 3000 });

      return () => {
        cancelIdleCallback(idle);
      };
    }

    const timer = setTimeout(preloadMarket, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);
};

const HomeComponent = () => {
  const { text } = useLanguage();
  usePreloadMarket();

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      {DECORATIONS.map(({ className, ...doodle }) => (
        <Doodle
          key={`${doodle.kind}-${className}`}
          {...doodle}
          className={`motion-safe:animate-float pointer-events-none absolute ${className}`}
          style={{ animationDuration: `${3 + doodle.size / 40}s` }}
        />
      ))}

      <div className="relative flex flex-col items-center gap-8 text-center">
        <Tag tone="mint" pattern="dots" tilt={-3}>
          {lettered(text.home.miniGame)}
        </Tag>

        <div className="flex flex-col items-center gap-2">
          <WordSticker tone="mustard" size={88} tilt={-4}>
            Eddie
          </WordSticker>
          <WordSticker tone="tomato" size={56} tilt={3}>
            @Bangmod
          </WordSticker>
        </div>

        <p className="max-w-sm text-lg">{text.home.description}</p>

        <div className="flex flex-col items-center gap-6 pt-12">
          <ButtonLink
            as={RouterLink}
            href="/play"
            variant="periwinkle"
            onPointerEnter={preloadMarket}
            onFocus={preloadMarket}
            size="lg"
            buddy
            buddyMood="congrats"
            burst="confetti"
          >
            {lettered(text.play)}
          </ButtonLink>
          <ButtonLink
            as={RouterLink}
            href="/leaderboard"
            variant="mint"
            size="sm"
          >
            {lettered(text.leaderboard)}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
