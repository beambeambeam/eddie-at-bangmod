import { Button, Doodle, Tag, WordSticker } from "@plop-ui/react";
import type { DoodleKind, DoodleTone } from "@plop-ui/react";
import { createFileRoute } from "@tanstack/react-router";

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

const HomeComponent = () => (
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
        A mini game
      </Tag>

      <div className="flex flex-col items-center gap-2">
        <WordSticker tone="mustard" size={88} tilt={-4}>
          Eddie
        </WordSticker>
        <WordSticker tone="tomato" size={56} tilt={3}>
          @Bangmod
        </WordSticker>
      </div>

      <p className="max-w-sm text-lg">
        A mini game about Eddie in the Market@Bangmod
      </p>

      <div className="pt-12">
        <Button
          variant="periwinkle"
          size="lg"
          buddy
          buddyMood="congrats"
          burst="confetti"
        >
          Play
        </Button>
      </div>
    </div>
  </main>
);

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
