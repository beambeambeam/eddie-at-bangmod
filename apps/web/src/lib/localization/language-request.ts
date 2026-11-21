import { createServerFn } from "@tanstack/react-start";
import {
  appendResponseHeader,
  getCookie,
  getRequestHeader,
} from "@tanstack/react-start/server";

import { LANGUAGE_COOKIE, isLanguage } from "./language";
import type { Language } from "./language";

const preferredLanguage = (header: string): Language => {
  let best: Language = "en";
  let bestQuality = 0;

  for (const entry of header.split(",")) {
    const [tag = "", weight] = entry.trim().toLowerCase().split(";");

    const language = /^(?<language>en|th)(?:-[a-z\d]{1,8})*$/u.exec(tag.trim())
      ?.groups?.language;

    const quality =
      weight === undefined
        ? 1
        : Number(
            /^q=(?<quality>0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/u.exec(
              weight.trim()
            )?.groups?.quality
          );

    if (isLanguage(language) && quality > bestQuality) {
      best = language;
      bestQuality = quality;
    }
  }

  return best;
};

export const getLanguage = createServerFn().handler((): Language => {
  appendResponseHeader("Vary", "Accept-Language, Cookie");

  const saved = getCookie(LANGUAGE_COOKIE);

  return isLanguage(saved)
    ? saved
    : preferredLanguage(getRequestHeader("Accept-Language") ?? "");
});
