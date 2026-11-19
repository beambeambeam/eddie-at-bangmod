import { MARKET } from "@eddie-at-bangmod/game";
import { Tag } from "@plop-ui/react";

import { toFramePercent } from "./market-view";
import { COUNTER_HEIGHT, STALL_LOOKS } from "./stall-looks";

/** World height of the label, over the counter's front face. */
const LABEL_HEIGHT = COUNTER_HEIGHT * 0.4;

/**
 * Stall labels as Plop Tags, pinned on each Stall's counter (ADR-0003). The
 * sprite sign carries the Item's picture; the Tag carries its name.
 */
export const StallSigns = () => (
  <ul className="pointer-events-none absolute inset-0 m-0 list-none p-0">
    {MARKET.stalls.map(({ item, area }) => {
      const { left, top } = toFramePercent(
        (area.minX + area.maxX) / 2,
        area.maxY,
        LABEL_HEIGHT
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
