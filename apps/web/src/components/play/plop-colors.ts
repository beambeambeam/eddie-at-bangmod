export interface PlopPalette {
  ink: string;
  "ink-soft": string;
  paper: string;
  sheet: string;
  track: string;
  tomato: string;
  mustard: string;
  mint: string;
  periwinkle: string;
  bubblegum: string;
}

/**
 * Reads the Plop color tokens the Market is painted with. The canvas cannot
 * read CSS variables, so the scene asks once when it mounts. These tokens stay
 * the same in light and dark Plop themes, so the card reads the same in both.
 */
export const readPlopPalette = (): PlopPalette => {
  const style = getComputedStyle(document.documentElement);

  const read = (token: string) =>
    style.getPropertyValue(`--plop-${token}`).trim();

  return {
    ink: read("ink"),
    "ink-soft": read("ink-soft"),
    paper: read("paper"),
    sheet: read("sheet"),
    track: read("track"),
    tomato: read("tomato"),
    mustard: read("mustard"),
    mint: read("mint"),
    periwinkle: read("periwinkle"),
    bubblegum: read("bubblegum"),
  };
};
