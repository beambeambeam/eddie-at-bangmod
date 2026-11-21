import { createTestDb } from "@eddie-at-bangmod/db/testing";
import { maxScore } from "@eddie-at-bangmod/game";
import { createRouterClient } from "@orpc/server";
import { beforeEach, describe, expect, test } from "vite-plus/test";

import { appRouter } from "./index";
import type { AppRouterClient } from "./index";

const RUN_MS = 90_000;

let time: number;
let api: AppRouterClient;

beforeEach(async () => {
  time = Date.UTC(2026, 10, 19, 12);
  const db = await createTestDb();
  api = createRouterClient(appRouter, {
    context: { db, now: () => new Date(time) },
  });
});

const wait = (ms: number) => {
  time += ms;
};

const newDevice = () => crypto.randomUUID();

/** Plays one full Run on `deviceId` and posts `score`. */
const postRun = async (deviceId: string, nickname: string, score: number) => {
  const ticket = await api.run.start({ deviceId });
  wait(RUN_MS);

  return await api.run.submit({
    ticketId: ticket.ticketId,
    deviceId,
    nickname,
    score,
  });
};

describe("posting a Score", () => {
  test("a full Run puts the Device on the Leaderboard", async () => {
    const device = newDevice();

    const result = await postRun(device, "Eddie", 1200);

    expect(result).toEqual({
      runRank: 1,
      bestScore: 1200,
      bestRank: 1,
      newBest: false,
    });
    expect(await api.leaderboard.top()).toEqual([
      { rank: 1, nickname: "Eddie", score: 1200, at: new Date(time) },
    ]);
  });
});

describe("Run Ticket checks", () => {
  test("a Score posted before 90 s have passed is rejected", async () => {
    const device = newDevice();
    const { ticketId } = await api.run.start({ deviceId: device });
    wait(RUN_MS - 1);

    await expect(
      api.run.submit({
        ticketId,
        deviceId: device,
        nickname: "Eddie",
        score: 100,
      })
    ).rejects.toMatchObject({ code: "RUN_TOO_SHORT" });
    expect(await api.leaderboard.top()).toEqual([]);
  });

  test("a Run Ticket accepts only one Score", async () => {
    const device = newDevice();
    const { ticketId } = await api.run.start({ deviceId: device });
    wait(RUN_MS);
    await api.run.submit({
      ticketId,
      deviceId: device,
      nickname: "Eddie",
      score: 100,
    });

    await expect(
      api.run.submit({
        ticketId,
        deviceId: device,
        nickname: "Eddie",
        score: 900,
      })
    ).rejects.toMatchObject({ code: "TICKET_USED" });
    await expect(
      api.leaderboard.me({ deviceId: device })
    ).resolves.toMatchObject({ score: 100 });
  });

  test("a Run Ticket from another Device is rejected", async () => {
    const { ticketId } = await api.run.start({ deviceId: newDevice() });
    wait(RUN_MS);
    const thief = newDevice();

    await expect(
      api.run.submit({
        ticketId,
        deviceId: thief,
        nickname: "Eddie",
        score: 100,
      })
    ).rejects.toMatchObject({ code: "TICKET_NOT_FOUND" });
    expect(await api.leaderboard.me({ deviceId: thief })).toBeNull();
  });

  test("an unknown Run Ticket is rejected", async () => {
    await expect(
      api.run.submit({
        ticketId: crypto.randomUUID(),
        deviceId: newDevice(),
        nickname: "Eddie",
        score: 100,
      })
    ).rejects.toMatchObject({ code: "TICKET_NOT_FOUND" });
  });
});

describe("Score cap", () => {
  test("a Score above the cap from the game rules is rejected", async () => {
    await expect(
      postRun(newDevice(), "Eddie", maxScore() + 1)
    ).rejects.toMatchObject({ code: "SCORE_OVER_CAP" });
    expect(await api.leaderboard.top()).toEqual([]);
  });

  test("a Score exactly at the cap is accepted", async () => {
    const result = await postRun(newDevice(), "Eddie", maxScore());

    expect(result.bestScore).toBe(maxScore());
  });
});

describe("the Device's entry", () => {
  test("a better Score replaces the entry", async () => {
    const device = newDevice();
    await postRun(device, "Eddie", 500);

    const result = await postRun(device, "Eddie", 800);

    expect(result.bestScore).toBe(800);
    expect(await api.leaderboard.me({ deviceId: device })).toEqual({
      rank: 1,
      nickname: "Eddie",
      score: 800,
      at: new Date(time),
    });
  });

  test("a worse Score keeps the entry while the Nickname updates", async () => {
    const device = newDevice();
    await postRun(device, "Eddie", 800);
    const bestAt = new Date(time);

    const result = await postRun(device, "Fast Eddie", 300);

    expect(result.bestScore).toBe(800);
    expect(await api.leaderboard.me({ deviceId: device })).toEqual({
      rank: 1,
      nickname: "Fast Eddie",
      score: 800,
      at: bestAt,
    });
  });
});

describe("Nickname", () => {
  test.each([
    ["too short", "E", "too-short"],
    ["too long", "EddieEddieEddie17", "too-long"],
    ["made of other characters", "Eddie!", "invalid-characters"],
    ["only spaces", "    ", "too-short"],
    ["on the blocklist", "Fuck Eddie", "blocked"],
  ])(
    "a Nickname %s is rejected with a stable reason",
    async (_, nickname, reason) => {
      const device = newDevice();

      await expect(postRun(device, nickname, 100)).rejects.toMatchObject({
        code: "INVALID_NICKNAME",
        data: { reason },
      });
      expect(await api.leaderboard.me({ deviceId: device })).toBeNull();
    }
  );

  test("Thai letters, digits and spaces are accepted, trimmed", async () => {
    const device = newDevice();

    await postRun(device, "  เอ็ดดี้ 99  ", 100);

    await expect(
      api.leaderboard.me({ deviceId: device })
    ).resolves.toMatchObject({ nickname: "เอ็ดดี้ 99" });
  });

  test("a rejected Nickname leaves the Run Ticket open for a retry", async () => {
    const device = newDevice();
    const { ticketId } = await api.run.start({ deviceId: device });
    wait(RUN_MS);
    await expect(
      api.run.submit({ ticketId, deviceId: device, nickname: "E", score: 100 })
    ).rejects.toThrow();

    const result = await api.run.submit({
      ticketId,
      deviceId: device,
      nickname: "Eddie",
      score: 100,
    });

    expect(result.bestScore).toBe(100);
  });
});

describe("Leaderboard order", () => {
  test("higher Scores rank first, and a tie goes to whoever reached it first", async () => {
    // The ids sort against the posting order, so only the time can settle the tie.
    const first = "ffffffff-ffff-4fff-bfff-ffffffffffff";
    const second = "00000000-0000-4000-8000-000000000000";
    await postRun(first, "First", 500);
    await postRun(second, "Second", 500);
    await postRun(newDevice(), "Top", 900);
    await postRun(newDevice(), "Low", 100);

    const top = await api.leaderboard.top();

    const names = top.map(({ rank, nickname }) => `${rank} ${nickname}`);

    expect(names).toEqual(["1 Top", "2 First", "3 Second", "4 Low"]);
    await expect(
      api.leaderboard.me({ deviceId: second })
    ).resolves.toMatchObject({ rank: 3 });
  });

  test("a tied Run ranks behind the Device that reached the Score first", async () => {
    await postRun(newDevice(), "First", 500);

    const result = await postRun(newDevice(), "Second", 500);

    expect(result).toEqual({
      runRank: 2,
      bestScore: 500,
      bestRank: 2,
      newBest: false,
    });
  });

  test("the top shows 50 entries and `me` still ranks a Device below them", async () => {
    // 50 Runs that end together, each with its own Score from 1000 down.
    const ahead = Array.from({ length: 50 }, (_, index) => ({
      deviceId: newDevice(),
      score: 1000 - index,
    }));

    const tickets = await Promise.all(
      ahead.map(async ({ deviceId }) => await api.run.start({ deviceId }))
    );

    wait(RUN_MS);
    await Promise.all(
      ahead.map(
        async ({ deviceId, score }, index) =>
          await api.run.submit({
            ticketId: tickets[index]?.ticketId ?? "",
            deviceId,
            nickname: "Ahead",
            score,
          })
      )
    );

    const device = newDevice();
    await postRun(device, "Behind", 10);

    const top = await api.leaderboard.top();

    expect(top).toHaveLength(50);
    expect(top.at(-1)?.score).toBe(951);
    expect(await api.leaderboard.me({ deviceId: device })).toMatchObject({
      rank: 51,
      nickname: "Behind",
      score: 10,
    });
  });

  test("`me` is empty for a Device that never posted", async () => {
    expect(await api.leaderboard.me({ deviceId: newDevice() })).toBeNull();
  });
});

describe("the Run's own rank", () => {
  test("a worse Run reports its own rank next to the best rank", async () => {
    const device = newDevice();
    await postRun(device, "Eddie", 800);
    await postRun(newDevice(), "Mid", 500);

    const result = await postRun(device, "Eddie", 300);

    expect(result).toEqual({
      runRank: 2,
      bestScore: 800,
      bestRank: 1,
      newBest: false,
    });
  });
});

describe("New best", () => {
  test("a Score above the Device's previous best is a new best", async () => {
    const device = newDevice();
    await postRun(device, "Eddie", 500);

    const result = await postRun(device, "Eddie", 800);

    expect(result.newBest).toBe(true);
  });

  test("a Score equal to the previous best is not a new best", async () => {
    const device = newDevice();
    await postRun(device, "Eddie", 500);

    const result = await postRun(device, "Eddie", 500);

    expect(result.newBest).toBe(false);
  });

  test("a Score below the previous best is not a new best", async () => {
    const device = newDevice();
    await postRun(device, "Eddie", 500);

    const result = await postRun(device, "Eddie", 300);

    expect(result.newBest).toBe(false);
  });

  test("the first Score a Device posts has no best to beat", async () => {
    const result = await postRun(newDevice(), "Eddie", 500);

    expect(result.newBest).toBe(false);
  });

  test("another Device's higher Score does not matter", async () => {
    await postRun(newDevice(), "Top", 900);
    const device = newDevice();
    await postRun(device, "Eddie", 100);

    const result = await postRun(device, "Eddie", 200);

    expect(result.newBest).toBe(true);
  });
});
