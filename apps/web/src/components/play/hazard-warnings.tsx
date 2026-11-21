import { MARKET, TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import type { Hazard } from "@eddie-at-bangmod/game";
import { ArrowRightIcon, Tag, WarnIcon } from "@plop-ui/react";
import { useLayoutEffect, useRef } from "react";

import type { RunLoop, RunView } from "@/lib/run-loop";
import { useRunSelect } from "@/lib/use-run-select";

import { toFramePercent } from "./market-view";

const MotorbikeWarning = ({
  loop,
  lane,
}: {
  loop: RunLoop;
  lane: (typeof MARKET.motorbikeLanes)[number];
}) => {
  const incoming = useRunSelect(
    loop,
    ({ stage, run }) =>
      stage === "running" && run.motorbikeWarnings.includes(lane)
  );

  const fromLeft = lane.heading === 1;
  const entryX = fromLeft ? MARKET.bounds.minX : MARKET.bounds.maxX;
  const { left, top } = toFramePercent(entryX, lane.y, 0.5);

  return (
    <output
      className={`absolute -translate-y-1/2 ${fromLeft ? "" : "-translate-x-full"}`}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {incoming && (
        <Tag tone="mustard" tilt={fromLeft ? -3 : 3}>
          <span aria-hidden="true" className="flex items-center gap-0.5">
            <WarnIcon className="size-[1em]" />
            <ArrowRightIcon
              className={`size-[1em] ${fromLeft ? "" : "rotate-180"}`}
            />
          </span>
          <span className="sr-only">
            {`Motorbike approaching from the ${fromLeft ? "left" : "right"}`}
          </span>
        </Tag>
      )}
    </output>
  );
};

const soiDog = ({ run }: RunView) =>
  run.hazards.find(
    (hazard): hazard is Extract<Hazard, { kind: "soi-dog" }> =>
      hazard.kind === "soi-dog"
  );

const SoiDogTimer = ({ loop }: { loop: RunLoop }) => {
  const anchor = useRef<HTMLOutputElement>(null);

  const seconds = useRunSelect(loop, (view) => {
    const ticks = soiDog(view)?.chaseInTicks ?? 0;

    return view.stage === "running" && ticks > 0
      ? Math.ceil(ticks / TICKS_PER_SECOND)
      : null;
  });

  // Follow the dog every frame without re-rendering the label as it moves.
  useLayoutEffect(() => {
    const followDog = () => {
      const label = anchor.current;
      const dog = soiDog(loop.getSnapshot());

      if (label && dog && dog.chaseInTicks !== null) {
        const { x, y } = dog.position;
        const { left, top } = toFramePercent(x, y, 0.9);
        label.style.left = `${left}%`;
        label.style.top = `${top}%`;
      }
    };

    followDog();

    return loop.subscribe(followDog);
  }, [loop]);

  return (
    <output
      aria-live="off"
      ref={anchor}
      className="absolute -translate-x-1/2 -translate-y-full"
    >
      {seconds !== null && (
        <>
          <span className="sr-only">Soi Dog chases in </span>
          <Tag tone="tomato" tilt={0}>
            {`${seconds}s`}
          </Tag>
        </>
      )}
    </output>
  );
};

export const HazardWarnings = ({ loop }: { loop: RunLoop }) => (
  <div className="pointer-events-none absolute inset-0">
    {MARKET.motorbikeLanes.map((lane) => (
      <MotorbikeWarning key={lane.y} loop={loop} lane={lane} />
    ))}
    <SoiDogTimer loop={loop} />
  </div>
);
