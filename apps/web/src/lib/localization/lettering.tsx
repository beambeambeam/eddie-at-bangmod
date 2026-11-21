// Plop letters strings one character at a time. Thai marks need to stay
// with their base characters so the browser can shape the whole word.
export const hasThai = (text: string) => /[\u0E00-\u0E7F]/u.test(text);

export const lettered = (text: string) =>
  hasThai(text) ? (
    <span lang="th" className="thai-lettering">
      {text}
    </span>
  ) : (
    text
  );
