import { MARKET } from "@eddie-at-bangmod/game";
import { Tag } from "@plop-ui/react";

import { useLanguage } from "@/lib/localization/language-provider";
import { lettered } from "@/lib/localization/lettering";

import { toFramePercent } from "./market-view";
import { AWNING_HEIGHT, AWNING_OFFSET, STALL_TONES } from "./stall-looks";

/**
 * Stall signs as Plop Tags, pinned over each Stall's awning (ADR-0003). The
 * awning already hides what is behind it, so a sign never covers Eddie.
 */
export const StallSigns = () => {
  const { text } = useLanguage();

  return (
    <ul className="pointer-events-none absolute inset-0 m-0 list-none p-0">
      {MARKET.stalls.map(({ item, area }) => {
        const { left, top } = toFramePercent(
          (area.minX + area.maxX) / 2,
          (area.minY + area.maxY) / 2 + AWNING_OFFSET,
          AWNING_HEIGHT
        );

        return (
          <li
            key={item}
            className="absolute -translate-1/2 scale-90"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <Tag tone={STALL_TONES[item]} pattern="dots" seed={item}>
              {lettered(text.items[item])}
            </Tag>
          </li>
        );
      })}
    </ul>
  );
};
