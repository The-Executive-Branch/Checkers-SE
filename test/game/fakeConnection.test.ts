import { describe, expect, it, vi } from "vitest";
import type { ServerGameMessage } from "checkers-shared-types";
import { createFakeConnection } from "@/game/fakeConnection";

describe("createFakeConnection", () => {
  it("sends a starting position with 12 pieces per side on the dark squares of their first three rows", () => {
    vi.useFakeTimers();
    const connection = createFakeConnection();
    const handler = vi.fn<(message: ServerGameMessage) => void>();

    connection.onMessage(handler);
    vi.runOnlyPendingTimers();

    const message = handler.mock.calls[0][0];
    if (message.type !== "gameState") throw new Error("Expected gameState");

    const black = message.pieces.filter((p) => p.color === "black");
    const red = message.pieces.filter((p) => p.color === "red");

    expect(black).toHaveLength(12);
    expect(red).toHaveLength(12);
    expect(black.every((p) => p.row <= 2)).toBe(true);
    expect(red.every((p) => p.row >= 5)).toBe(true);
    expect(message.pieces.every((p) => (p.row + p.col) % 2 === 1)).toBe(true);
  });
});
