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

/**
 * The one Nickname rule, shared by the results Sheet and the server:
 * trimmed, 2–16 characters, Thai or Latin letters, digits and spaces, and
 * no blocked word. Each failure carries a message the player can act on.
 */
export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(16, "Use 16 characters or fewer.")
  .regex(ALLOWED, "Use only Thai or Latin letters, digits and spaces.")
  .refine((nickname) => !isBlocked(nickname), "Pick a different Nickname.");
