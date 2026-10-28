import type {
  CheckerColor,
  CheckerPiece,
  GameId,
  GameStatus,
  Position,
  ServerMessage,
} from "checkers-shared-types";

export type BoardPiece = CheckerPiece & { isJumped: boolean };

type MoveRejected = Extract<ServerMessage, { type: "moveRejected" }>;
type GameStateMessage = Extract<ServerMessage, { type: "gameState" }>;

export type GameState = {
  gameId: GameId | null;
  pieces: BoardPiece[];
  turn: CheckerColor;
  playerColor: CheckerColor | "both";
  status: GameStatus;
  mustJumpFrom: Position | null;
  lastRejection: MoveRejected | null;
  mode: GameStateMessage["mode"];
  players: GameStateMessage["players"] | null;
};

export type GameAction = ServerMessage | { type: "removePiece"; id: string };

export const INITIAL_GAME_STATE: GameState = {
  gameId: null,
  pieces: [],
  turn: "red",
  playerColor: "red",
  status: { state: "waiting" },
  mustJumpFrom: null,
  lastRejection: null,
  mode: "online",
  players: null,
};

export const samePosition = (a: Position, b: Position) =>
  a.row === b.row && a.col === b.col;

export const gameReducer = (
  state: GameState,
  action: GameAction,
): GameState => {
  if (action.type === "removePiece") {
    return {
      ...state,
      pieces: state.pieces.filter((piece) => piece.id !== action.id),
    };
  }

  if (!("gameId" in action)) return state;

  // Every server message has a gameId. Ignore ones for another game.
  if (state.gameId !== null && action.gameId !== state.gameId) {
    return state;
  }

  switch (action.type) {
    case "gameState":
      return {
        gameId: action.gameId,
        pieces: action.pieces.map((piece) => ({ ...piece, isJumped: false })),
        turn: action.playerTurn,
        playerColor: action.playerColor,
        status: action.status,
        mustJumpFrom: null,
        lastRejection: null,
        mode: action.mode,
        players: action.players,
      };

    case "moveResult": {
      const captured = new Set(action.capturedIds);
      const pieces = state.pieces.map((piece) => {
        let next = piece;
        if (samePosition(piece, action.from)) {
          next = { ...next, row: action.to.row, col: action.to.col };
        }
        if (piece.id === action.kingId) {
          next = { ...next, isKing: true };
        }
        if (captured.has(piece.id)) {
          next = { ...next, isJumped: true };
        }
        return next;
      });

      return {
        ...state,
        pieces,
        turn: action.nextPlayerTurn,
        status: action.status,
        mustJumpFrom: action.jumpFrom ?? null,
        lastRejection: null,
      };
    }

    case "moveRejected":
      return { ...state, lastRejection: action };

    default:
      return state;
  }
};
