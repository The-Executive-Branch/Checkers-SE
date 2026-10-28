import type { ClientMessage, ServerMessage } from "checkers-shared-types";

export type GameMessageHandler = (message: ServerMessage) => void;

export type GameConnection = {
  send: (message: ClientMessage) => void;
  onMessage: (handler: GameMessageHandler) => () => void;
  close: () => void;
};
