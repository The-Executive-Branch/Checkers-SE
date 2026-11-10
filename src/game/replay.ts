import type { CheckerColor, CheckerPiece, Move, Position } from "checkers-shared-types";

const BOARD_SIZE = 8;
const ROWS_PER_SIDE = 3;

const isDark = ({ row, col }: Position) => (row + col) % 2 === 1;

// The opening board, with the same piece IDs the server gives out
// ("red-5-0" is the red piece that starts on row 5, column 0).
// Saved moves refer to pieces by these IDs, so they have to match.
export const startingPieces = (): CheckerPiece[] => {
  const pieces: CheckerPiece[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const isBlackRow = row < ROWS_PER_SIDE;
      const isRedRow = row >= BOARD_SIZE - ROWS_PER_SIDE;
      if (!isDark({ row, col }) || (!isBlackRow && !isRedRow)) continue;
      const color: CheckerColor = isBlackRow ? "black" : "red";
      pieces.push({ id: `${color}-${row}-${col}`, color, row, col, isKing: false });
    }
  }
  return pieces;
};

export class ReplayError extends Error {
  readonly moveNumber: number;

  constructor(moveNumber: number, message: string) {
    super(`Move ${moveNumber}: ${message}`);
    this.name = "ReplayError";
    this.moveNumber = moveNumber;
  }
}

const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

// Plays one saved move on a board. The move already says which pieces were
// captured and whether one was crowned, so no rules are needed here.
// Returns a new array; the board passed in is not changed.
export const applyMove = (
  pieces: CheckerPiece[],
  move: Move,
  moveNumber: number,
): CheckerPiece[] => {
  const moving = pieces.find((piece) => samePosition(piece, move.from));
  if (!moving) {
    throw new ReplayError(
      moveNumber,
      `there is no piece at row ${move.from.row + 1}, column ${move.from.col + 1}.`,
    );
  }

  const captured = new Set(move.capturedIds ?? []);
  return pieces
    .filter((piece) => !captured.has(piece.id))
    .map((piece) =>
      piece.id === moving.id
        ? { ...piece, ...move.to, isKing: piece.isKing || move.kingId === piece.id }
        : piece,
    );
};

// Every board in the game, in order: boards[0] is the opening position and
// boards[n] is the board after n moves. Built once, so stepping back and
// forth is just picking an index.
export const buildReplay = (moves: Move[]): CheckerPiece[][] => {
  const boards = [startingPieces()];
  moves.forEach((move, index) => {
    boards.push(applyMove(boards[index], move, index + 1));
  });
  return boards;
};

// Whose turn it is after a number of moves. Red always moves first.
export const turnAfter = (moves: Move[], count: number): CheckerColor =>
  count === 0 ? "red" : moves[count - 1].nextPlayerTurn;
