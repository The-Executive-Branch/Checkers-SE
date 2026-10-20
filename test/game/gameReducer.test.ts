import { describe, expect, it } from "vitest";
import type { GameId, ServerGameMessage } from "checkers-shared-types";
import {
  gameReducer,
  INITIAL_GAME_STATE,
  type BoardPiece,
  type GameState,
} from "@/game/gameReducer";

const GAME_ID = "game-1" as GameId;
const OTHER_GAME_ID = "game-2" as GameId;

const piece = (
  id: string,
  row: number,
  col: number,
  overrides: Partial<BoardPiece> = {},
): BoardPiece => ({
  id,
  row,
  col,
  color: id.startsWith("red") ? "red" : "black",
  isKing: false,
  isJumped: false,
  ...overrides,
});

const startedState = (pieces: BoardPiece[]): GameState => ({
  ...INITIAL_GAME_STATE,
  gameId: GAME_ID,
  pieces,
  turn: "red",
  playerColor: "red",
  status: { state: "inProgress" },
});

const moveResult = (
  overrides: Partial<Extract<ServerGameMessage, { type: "moveResult" }>> = {},
): ServerGameMessage => ({
  type: "moveResult",
  gameId: GAME_ID,
  from: { row: 5, col: 0 },
  to: { row: 4, col: 1 },
  capturedIds: [],
  nextPlayerTurn: "black",
  status: { state: "inProgress" },
  ...overrides,
});

describe("gameReducer", () => {
  it("loads a full game snapshot", () => {
    const next = gameReducer(INITIAL_GAME_STATE, {
      type: "gameState",
      gameId: GAME_ID,
      pieces: [{ id: "red-5-0", color: "red", row: 5, col: 0, isKing: false }],
      playerTurn: "red",
      playerColor: "red",
      status: { state: "inProgress" },
    });

    expect(next.gameId).toBe(GAME_ID);
    expect(next.pieces).toEqual([piece("red-5-0", 5, 0)]);
    expect(next.turn).toBe("red");
    expect(next.playerColor).toBe("red");
    expect(next.status).toEqual({ state: "inProgress" });
  });

  it("moves the piece and passes the turn when a move result arrives", () => {
    const state = startedState([piece("red-5-0", 5, 0), piece("black-2-1", 2, 1)]);

    const next = gameReducer(state, moveResult());

    expect(next.pieces).toContainEqual(piece("red-5-0", 4, 1));
    expect(next.pieces).toContainEqual(piece("black-2-1", 2, 1));
    expect(next.turn).toBe("black");
  });

  it("marks captured pieces as jumped but keeps them until removePiece", () => {
    const state = startedState([piece("red-5-0", 5, 0), piece("black-4-1", 4, 1)]);

    const afterJump = gameReducer(
      state,
      moveResult({ to: { row: 3, col: 2 }, capturedIds: ["black-4-1"] }),
    );
    expect(afterJump.pieces).toContainEqual(
      piece("black-4-1", 4, 1, { isJumped: true }),
    );

    const afterRemoval = gameReducer(afterJump, {
      type: "removePiece",
      id: "black-4-1",
    });
    expect(afterRemoval.pieces.map((p) => p.id)).toEqual(["red-5-0"]);
  });

  it("crowns the piece named in kingId", () => {
    const state = startedState([piece("red-1-0", 1, 0)]);

    const next = gameReducer(
      state,
      moveResult({ from: { row: 1, col: 0 }, to: { row: 0, col: 1 }, kingId: "red-1-0" }),
    );

    expect(next.pieces).toEqual([piece("red-1-0", 0, 1, { isKing: true })]);
  });

  it("keeps the turn and reports where the piece must keep jumping", () => {
    const state = startedState([piece("red-5-0", 5, 0)]);

    const next = gameReducer(
      state,
      moveResult({ to: { row: 3, col: 2 }, nextPlayerTurn: "red", jumpFrom: { row: 3, col: 2 } }),
    );

    expect(next.turn).toBe("red");
    expect(next.mustJumpFrom).toEqual({ row: 3, col: 2 });
  });

  it("stores a rejection without changing the board or the turn", () => {
    const state = startedState([piece("red-5-0", 5, 0)]);
    const rejection: ServerGameMessage = {
      type: "moveRejected",
      gameId: GAME_ID,
      from: { row: 5, col: 0 },
      to: { row: 4, col: 1 },
      reason: "That move isn't allowed.",
    };

    const next = gameReducer(state, rejection);

    expect(next.pieces).toBe(state.pieces);
    expect(next.turn).toBe(state.turn);
    expect(next.lastRejection).toEqual(rejection);
  });

  it("ignores messages for a different game", () => {
    const state = startedState([piece("red-5-0", 5, 0)]);

    const next = gameReducer(state, moveResult({ gameId: OTHER_GAME_ID }));

    expect(next).toBe(state);
  });
});
