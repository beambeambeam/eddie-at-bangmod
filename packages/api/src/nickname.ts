import { z } from "zod";

/** Thai letters and marks, Thai digits, Latin letters, digits and spaces. */
const ALLOWED = /^[ก-ฺเ-๎๐-๙A-Za-z0-9 ]+$/u;

/** Words a Nickname may not contain, matched without case or spaces. */
const BLOCKLIST = [
  "asshole",
  "bitch",
  "cunt",
  "fuck",
  "nigga",
  "nigger",
  "pussy",
  "shit",
  "slut",
  "whore",
  "ควย",
  "สัส",
  "เย็ด",
  "เหี้ย",
];

const isBlocked = (nickname: string) => {
  const folded = nickname.toLowerCase().replaceAll(" ", "");

  return BLOCKLIST.some((word) => folded.includes(word));
};

export const nicknameReasonSchema = z.enum([
  "too-short",
  "too-long",
  "invalid-characters",
  "blocked",
]);

export type NicknameReason = z.infer<typeof nicknameReasonSchema>;

type NicknameResult =
  | { success: true; nickname: string }
  | { success: false; reason: NicknameReason };

/** Both the results Sheet and the server validate the same trimmed Nickname. */
export const validateNickname = (value: string): NicknameResult => {
  const nickname = value.trim();

  if (nickname.length < 2) {
    return { success: false, reason: "too-short" };
  }

  if (nickname.length > 16) {
    return { success: false, reason: "too-long" };
  }

  if (!ALLOWED.test(nickname)) {
    return { success: false, reason: "invalid-characters" };
  }

  if (isBlocked(nickname)) {
    return { success: false, reason: "blocked" };
  }

  return { success: true, nickname };
};
