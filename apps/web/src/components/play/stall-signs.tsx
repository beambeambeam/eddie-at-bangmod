import { MARKET } from "@eddie-at-bangmod/game";
import { Tag } from "@plop-ui/react";

import { toFramePercent } from "./market-view";
import { AWNING_HEIGHT, AWNING_OFFSET, STALL_LOOKS } from "./stall-looks";

/**
 * Stall signs as Plop Tags, pinned over each Stall's awning (ADR-0003). The
 * awning already hides what is behind it, so a sign never covers Eddie.
 */
export const StallSigns = () => (
  <ul className="pointer-events-none absolute inset-0 m-0 list-none p-0">
    {MARKET.stalls.map(({ item, area }) => {
      const { left, top } = toFramePercent(
        (area.minX + area.maxX) / 2,
        (area.minY + area.maxY) / 2 + AWNING_OFFSET,
        AWNING_HEIGHT
      );

      const { label, tone } = STALL_LOOKS[item];

      return (
        <li
          key={item}
          className="absolute -translate-1/2 scale-90"
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          <Tag tone={tone} pattern="dots" seed={item}>
            {label}
          </Tag>
        </li>
      );
    })}
  </ul>
);
