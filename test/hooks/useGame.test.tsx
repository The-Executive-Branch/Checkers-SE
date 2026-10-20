import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { GameId, ServerGameMessage } from "checkers-shared-types";
import type { GameConnection, GameMessageHandler } from "@/game/connection";
import { useGame } from "@/hooks/useGame";

const GAME_ID = "game-1" as GameId;

// A stand-in connection the test controls directly.
const createTestConnection = () => {
  let handler: GameMessageHandler | null = null;
  const unsubscribe = vi.fn();
  const connection: GameConnection = {
    send: vi.fn(),
    onMessage: vi.fn((h: GameMessageHandler) => {
      handler = h;
      return unsubscribe;
    }),
    close: vi.fn(),
  };
  const receive = (message: ServerGameMessage) => act(() => handler?.(message));
  return { connection, receive, unsubscribe };
};

const startGame: ServerGameMessage = {
  type: "gameState",
  gameId: GAME_ID,
  pieces: [{ id: "red-5-0", color: "red", row: 5, col: 0, isKing: false }],
  playerTurn: "red",
  playerColor: "red",
  status: { state: "inProgress" },
};

describe("useGame", () => {
  it("shows the pieces and whose turn it is once the game state arrives", () => {
    const { connection, receive } = createTestConnection();
    const { result } = renderHook(() => useGame(connection));

    receive(startGame);

    expect(result.current.pieces).toHaveLength(1);
    expect(result.current.turn).toBe("red");
    expect(result.current.isPlayerTurn).toBe(true);
  });

  it("sends a move without changing the board until the server answers", () => {
    const { connection, receive } = createTestConnection();
    const { result } = renderHook(() => useGame(connection));
    receive(startGame);

    act(() => result.current.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 }));

    expect(connection.send).toHaveBeenCalledTimes(1);
    expect(connection.send).toHaveBeenCalledWith({
      type: "move",
      gameId: GAME_ID,
      from: { row: 5, col: 0 },
      to: { row: 4, col: 1 },
    });
    expect(result.current.pieces[0]).toMatchObject({ row: 5, col: 0 });

    receive({
      type: "moveResult",
      gameId: GAME_ID,
      from: { row: 5, col: 0 },
      to: { row: 4, col: 1 },
      capturedIds: [],
      nextPlayerTurn: "black",
      status: { state: "inProgress" },
    });

    expect(result.current.pieces[0]).toMatchObject({ row: 4, col: 1 });
    expect(result.current.isPlayerTurn).toBe(false);
  });

  it("does not send a move before a game has started", () => {
    const { connection } = createTestConnection();
    const { result } = renderHook(() => useGame(connection));

    act(() => result.current.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 }));

    expect(connection.send).not.toHaveBeenCalled();
  });

  it("removes a captured piece when removePiece is called", () => {
    const { connection, receive } = createTestConnection();
    const { result } = renderHook(() => useGame(connection));
    receive(startGame);

    act(() => result.current.removePiece("red-5-0"));

    expect(result.current.pieces).toHaveLength(0);
  });

  it("stops listening to the connection when unmounted", () => {
    const { connection, unsubscribe } = createTestConnection();
    const { unmount } = renderHook(() => useGame(connection));

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
