export const languageNames = { en: "English", th: "ไทย" };

export type Language = keyof typeof languageNames;

export const languages = ["en", "th"] as const;

export const LANGUAGE_COOKIE = "language";

export const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "th";

export const saveLanguage = (language: Language) => {
  // Save before re-rendering so an immediate reload sees the same choice.
  const maxAge = 60 * 60 * 24 * 365;
  // oxlint-disable-next-line unicorn/no-document-cookie -- Write synchronously before an immediate reload in browsers without Cookie Store.
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};
