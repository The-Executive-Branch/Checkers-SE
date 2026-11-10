import { describe, it, expect } from "vitest";
import type { Move } from "checkers-shared-types";
import { applyMove, buildReplay, ReplayError, startingPieces, turnAfter } from "@/game/replay";
import { SAMPLE_RECORDS } from "@/game/sampleRecords";

const at = (row: number, col: number) => ({ row, col });

describe("startingPieces", () => {
  it("sets up 12 pieces per side on dark squares", () => {
    // Act
    const pieces = startingPieces();
    // Assert
    expect(pieces.filter((p) => p.color === "red")).toHaveLength(12);
    expect(pieces.filter((p) => p.color === "black")).toHaveLength(12);
    expect(pieces.every((p) => (p.row + p.col) % 2 === 1)).toBe(true);
  });

  it("uses the same IDs as the server", () => {
    // Act
    const ids = startingPieces().map((p) => p.id);
    // Assert
    expect(ids).toContain("red-5-0");
    expect(ids).toContain("black-0-1");
  });
});

describe("applyMove", () => {
  it("moves the piece on the from square", () => {
    // Arrange
    const move: Move = { from: at(5, 0), to: at(4, 1), nextPlayerTurn: "black" };
    // Act
    const pieces = applyMove(startingPieces(), move, 1);
    // Assert
    expect(pieces.find((p) => p.id === "red-5-0")).toMatchObject(at(4, 1));
  });

  it("removes captured pieces", () => {
    // Arrange
    const move: Move = { from: at(5, 0), to: at(3, 2), capturedIds: ["black-2-1"], nextPlayerTurn: "black" };
    // Act
    const pieces = applyMove(startingPieces(), move, 1);
    // Assert
    expect(pieces.some((p) => p.id === "black-2-1")).toBe(false);
    expect(pieces).toHaveLength(23);
  });

  it("crowns the moving piece when the move says so", () => {
    // Arrange
    const move: Move = { from: at(5, 0), to: at(4, 1), kingId: "red-5-0", nextPlayerTurn: "black" };
    // Act
    const pieces = applyMove(startingPieces(), move, 1);
    // Assert
    expect(pieces.find((p) => p.id === "red-5-0")?.isKing).toBe(true);
  });

  it("does not change the board it was given", () => {
    // Arrange
    const before = startingPieces();
    const move: Move = { from: at(5, 0), to: at(4, 1), nextPlayerTurn: "black" };
    // Act
    applyMove(before, move, 1);
    // Assert
    expect(before.find((p) => p.id === "red-5-0")).toMatchObject(at(5, 0));
  });

  it("throws a ReplayError naming the move when no piece is there", () => {
    // Arrange
    const move: Move = { from: at(4, 1), to: at(3, 2), nextPlayerTurn: "black" };
    // Act
    const act = () => applyMove(startingPieces(), move, 7);
    // Assert
    expect(act).toThrow(ReplayError);
    expect(act).toThrow("Move 7");
  });
});

describe("buildReplay", () => {
  it("returns the opening board plus one board per move", () => {
    // Arrange
    const { moves } = SAMPLE_RECORDS[0];
    // Act
    const boards = buildReplay(moves);
    // Assert
    expect(boards).toHaveLength(moves.length + 1);
    expect(boards[0]).toEqual(startingPieces());
  });

  it("replays the whole sample game, removing every captured piece", () => {
    // Arrange
    const { moves } = SAMPLE_RECORDS[0];
    const capturedCount = moves.reduce((sum, m) => sum + (m.capturedIds?.length ?? 0), 0);
    // Act
    const finalBoard = buildReplay(moves).at(-1)!;
    // Assert
    expect(finalBoard).toHaveLength(24 - capturedCount);
  });
});

describe("turnAfter", () => {
  it("is red before any moves, then follows each move's nextPlayerTurn", () => {
    // Arrange
    const moves: Move[] = [{ from: at(5, 0), to: at(4, 1), nextPlayerTurn: "black" }];
    // Assert
    expect(turnAfter(moves, 0)).toBe("red");
    expect(turnAfter(moves, 1)).toBe("black");
  });
});
