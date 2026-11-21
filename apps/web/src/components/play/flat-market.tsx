import { MARKET } from "@eddie-at-bangmod/game";
import type { Rect, Vec2 } from "@eddie-at-bangmod/game";
import { useLayoutEffect } from "react";

import type { RunLoop } from "@/lib/run-loop";
import { useRunSelect } from "@/lib/use-run-select";

import crowd from "./market-art/crowd.svg";
import eddieBack from "./market-art/eddie-back.svg";
import eddieFront from "./market-art/eddie-front.svg";
import eddieLeft from "./market-art/eddie-left.svg";
import eddieRight from "./market-art/eddie-right.svg";
import motorbike from "./market-art/motorbike.svg";
import soiDog from "./market-art/soi-dog.svg";
import { toFramePercent } from "./market-view";
import { STALL_LOOKS } from "./stall-looks";
import { StallSigns } from "./stall-signs";

const floorRect = ({ minX, minY, maxX, maxY }: Rect) => {
  const start = toFramePercent(minX, minY, 0);
  const end = toFramePercent(maxX, maxY, 0);

  return {
    left: `${start.left}%`,
    top: `${start.top}%`,
    width: `${end.left - start.left}%`,
    height: `${end.top - start.top}%`,
  };
};

const laneBounds = ({ y }: { y: number }): Rect => ({
  ...MARKET.bounds,
  minY: y - 0.42,
  maxY: y + 0.42,
});

const Floor = () => (
  <div aria-hidden className="absolute inset-0">
    <div
      className="absolute"
      style={{
        ...floorRect(MARKET.bounds),
        border: "var(--plop-stroke) solid var(--plop-ink)",
        borderRadius: "var(--plop-radius-sticker)",
      }}
    />
    {MARKET.motorbikeLanes.map((lane) => (
      <div
        key={lane.y}
        className="absolute opacity-30"
        style={{
          ...floorRect(laneBounds(lane)),
          borderBlock: "var(--plop-stroke) dashed var(--plop-ink)",
        }}
      />
    ))}
    {MARKET.stalls.map(({ area, front, item }) => {
      const fill = `var(--plop-${STALL_LOOKS[item].tone})`;

      return (
        <div key={item}>
          <div
            className="absolute"
            style={{
              ...floorRect(front),
              background: `color-mix(in srgb, ${fill} 25%, transparent)`,
            }}
          />
          <div
            className="absolute"
            style={{
              ...floorRect(area),
              background: fill,
              border: "var(--plop-stroke) solid var(--plop-ink)",
              borderRadius: "var(--plop-radius-sticker)",
            }}
          />
        </div>
      );
    })}
  </div>
);

const HAZARD_ART = {
  crowd: { src: crowd, alt: "Crowd", width: "8cqw" },
  motorbike: { src: motorbike, alt: "Motorbike", width: "8cqw" },
  "soi-dog": { src: soiDog, alt: "Soi Dog", width: "5cqw" },
};

const eddieArt = ({ x, y }: Vec2) => {
  if (Math.abs(x) >= Math.abs(y) - 1e-3) {
    return x < 0 ? eddieLeft : eddieRight;
  }

  return y < 0 ? eddieBack : eddieFront;
};

const actorPosition = ({ x, y }: Vec2) => {
  const { left, top } = toFramePercent(x, y, 0);

  return { left: `${left}%`, top: `${top}%` };
};

const Actors = ({ loop }: { loop: RunLoop }) => {
  const { eddie, hazards } = useRunSelect(loop, ({ run }) => run);

  return (
    <>
      {hazards.map(({ id, kind, position }) => {
        const { src, alt, width } = HAZARD_ART[kind];

        return (
          <img
            key={id}
            src={src}
            alt={alt}
            className="absolute -translate-1/2"
            style={{ ...actorPosition(position), width }}
          />
        );
      })}
      <img
        src={eddieArt(eddie.facing)}
        alt="Eddie"
        className="absolute -translate-1/2"
        style={{ ...actorPosition(eddie.position), width: "4.5cqw" }}
      />
    </>
  );
};

/** Draws the same Run as a paper map on browsers without WebGL 2. */
export const FlatMarket = ({
  loop,
  onReady,
}: {
  loop: RunLoop;
  onReady: () => void;
}) => {
  useLayoutEffect(onReady, [onReady]);

  return (
    <div className="absolute inset-0">
      <Floor />
      <StallSigns flat />
      <Actors loop={loop} />
    </div>
  );
};
