import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GameId, GameRecord, UserAccessResponse } from "checkers-shared-types";
import { loadGameRecords } from "@/gameRecords";

const RECORD: GameRecord = {
  gameId: "g1" as GameId,
  players: { red: { kind: "user", username: "ravae" }, black: { kind: "guest", name: "Gary" } },
  winner: "red",
  moves: [{ from: { row: 5, col: 0 }, to: { row: 4, col: 1 }, nextPlayerTurn: "black" }],
  endedAt: "2026-11-10T12:00:00.000Z",
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const signIn = () => {
  const session: UserAccessResponse = {
    userId: "user-1",
    username: "ravae",
    sessionId: "session-abc",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  localStorage.setItem("session", JSON.stringify(session));
};

beforeEach(() => {
  localStorage.clear();
  signIn();
});

describe("loadGameRecords", () => {
  it("asks for the list with a GET and the player's session", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    // Act
    await loadGameRecords();
    // Assert
    const [url, init] = fetchMock.mock.lastCall!;
    expect(String(url)).toMatch(/\/games\/list$/);
    expect(init?.method).toBe("GET");
    expect(init?.body).toBeUndefined();
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer session-abc");
  });

  it("returns the records from the server", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { data: [RECORD] })));
    // Act
    const result = await loadGameRecords();
    // Assert
    expect(result).toEqual({ ok: true, records: [RECORD] });
  });

  it("wraps a single record in a list", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { data: RECORD })));
    // Act
    const result = await loadGameRecords();
    // Assert
    expect(result).toEqual({ ok: true, records: [RECORD] });
  });

  it("passes on the server's error message", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(500, { error: "Server error." })));
    // Act
    const result = await loadGameRecords();
    // Assert
    expect(result).toEqual({ ok: false, error: "Server error." });
  });

  it("explains when the server can't be reached", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")));
    // Act
    const result = await loadGameRecords();
    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Couldn't load your games. Check your connection and try again.",
    });
  });
});
