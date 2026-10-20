import type {
  ClientGameMessage,
  ServerGameMessage,
} from "checkers-shared-types";

export type GameMessageHandler = (message: ServerGameMessage) => void;

export type GameConnection = {
  send: (message: ClientGameMessage) => void;
  onMessage: (handler: GameMessageHandler) => () => void;
  close: () => void;
};
