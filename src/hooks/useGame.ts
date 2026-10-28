import { useEffect, useReducer } from "react";
import type { Position } from "checkers-shared-types";
import type { GameConnection } from "../game/connection";
import { gameReducer, INITIAL_GAME_STATE } from "../game/gameReducer";

export const useGame = (connection: GameConnection) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);

  useEffect(() => {
    const unsubscribe = connection.onMessage(dispatch);
    return unsubscribe;
  }, [connection]);

  const controlledColor =
    state.playerColor === "both" ? state.turn : state.playerColor;

  const isPlayerTurn =
    state.status.state === "inProgress" && state.turn === controlledColor;

  const makeMove = (from: Position, to: Position) => {
    if (state.gameId === null) return;
    connection.send({ type: "move", gameId: state.gameId, from, to });
  };

  const removePiece = (id: string) => {
    dispatch({ type: "removePiece", id });
  };

  return { ...state, isPlayerTurn, controlledColor, makeMove, removePiece };
};
