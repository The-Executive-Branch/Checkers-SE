import type {
  CheckerColor,
  CheckerPiece,
  GameId,
  GameStatus,
  Position,
  ServerGameMessage,
} from "checkers-shared-types";
import type { GameConnection, GameMessageHandler } from "./connection";
import { samePosition } from "./gameReducer";

const PLAYER_COLOR: CheckerColor = "red";
const IN_PROGRESS: GameStatus = { state: "inProgress" };
const DELAY_MS = 50;

type NextMoveOptions = {
  reject?: boolean;
  capture?: boolean;
  crown?: boolean;
  mustJump?: boolean;
};

const createStartingPieces = (): CheckerPiece[] => {
  const pieces: CheckerPiece[] = [];
  for (let row = 0; row < 8; row++) {
    if (row === 3 || row === 4) continue;
    const color: CheckerColor = row < 3 ? "black" : "red";
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `${color}-${row}-${col}`,
          color,
          row,
          col,
          isKing: false,
        });
      }
    }
  }
  return pieces;
};

export const createFakeConnection = () => {
  const gameId = crypto.randomUUID() as GameId;
  const handlers = new Set<GameMessageHandler>();
  let pieces = createStartingPieces();
  let turn: CheckerColor = "red";
  let nextMove: NextMoveOptions = {};

  const emit = (message: ServerGameMessage) => {
    setTimeout(() => handlers.forEach((handler) => handler(message)), DELAY_MS);
  };

  const isEmpty = (position: Position) =>
    !pieces.some((piece) => samePosition(piece, position));

  const applyMove = (
    mover: CheckerPiece,
    to: Position,
    options: NextMoveOptions,
  ) => {
    const from = { row: mover.row, col: mover.col };
    const captured = options.capture
      ? pieces.find((piece) => piece.color !== mover.color)
      : undefined;

    pieces = pieces
      .filter((piece) => piece !== captured)
      .map((piece) =>
        piece === mover
          ? { ...piece, ...to, isKing: piece.isKing || Boolean(options.crown) }
          : piece,
      );

    if (!options.mustJump) turn = turn === "red" ? "black" : "red";

    emit({
      type: "moveResult",
      gameId,
      from,
      to,
      capturedIds: captured ? [captured.id] : [],
      kingId: options.crown ? mover.id : undefined,
      nextPlayerTurn: turn,
      jumpFrom: options.mustJump ? to : undefined,
      status: IN_PROGRESS,
    });
  };

  // The opponent steps one black piece forward diagonally, if it can.
  const playOpponent = () => {
    for (const piece of pieces.filter((p) => p.color !== PLAYER_COLOR)) {
      for (const colStep of [-1, 1]) {
        const to = { row: piece.row + 1, col: piece.col + colStep };
        const onBoard = to.row < 8 && to.col >= 0 && to.col < 8;
        if (onBoard && isEmpty(to)) {
          applyMove(piece, to, {});
          return;
        }
      }
    }
  };

  const connection: GameConnection = {
    send({ from, to }) {
      const options = nextMove;
      nextMove = {};

      const mover = pieces.find((piece) => samePosition(piece, from));
      if (options.reject || !mover || !isEmpty(to)) {
        emit({
          type: "moveRejected",
          gameId,
          from,
          to,
          reason: "That move isn't allowed.",
        });
        return;
      }

      applyMove(mover, to, options);
      if (turn !== PLAYER_COLOR) setTimeout(playOpponent, 600);
    },

    onMessage(handler) {
      handlers.add(handler);
      emit({
        type: "gameState",
        gameId,
        pieces,
        playerTurn: PLAYER_COLOR,
        playerColor: PLAYER_COLOR,
        status: IN_PROGRESS,
      });
      return () => {
        handlers.delete(handler);
      };
    },

    close() {
      handlers.clear();
    },
  };

  // Testing controls: shape what happens on the player's next move.
  const setNextMove = (options: NextMoveOptions) => {
    nextMove = options;
  };

  return { ...connection, setNextMove };
};
