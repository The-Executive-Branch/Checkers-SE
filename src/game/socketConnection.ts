import type { ClientMessage, ServerMessage } from "checkers-shared-types";
import type { GameConnection, GameMessageHandler } from "./connection";

export const GAME_SERVER_URL: string = import.meta.env.PROD
  ? import.meta.env.VITE_GAME_SERVER_URL
  : "ws://127.0.0.1:8000/game";

type SocketOptions = {
  // Called when the connection closes. Code 4401 means the server
  // rejected the session, so the player needs to sign in again.
  onClose?: (code: number) => void;
};

// The real connection to the game server. It follows the same
// GameConnection shape as the fake one, so useGame works with either.
export const createSocketConnection = (
  url: string,
  sessionId: string,
  { onClose }: SocketOptions = {},
): GameConnection => {
  const socket = new WebSocket(url);
  const handlers = new Set<GameMessageHandler>();
  const pending: ClientMessage[] = [];
  let isAuthenticated = false;

  const write = (message: ClientMessage) => socket.send(JSON.stringify(message));

  // Signing in is always the first message on the connection.
  socket.addEventListener("open", () => {
    write({ type: "authenticate", sessionId });
  });

  socket.addEventListener("message", (event) => {
    let message: ServerMessage;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      return;
    }

    // Anything sent before the server confirmed the sign-in waits until now.
    if (message.type === "authenticated") {
      isAuthenticated = true;
      pending.splice(0).forEach(write);
    }

    handlers.forEach((handler) => handler(message));
  });

  socket.addEventListener("close", (event) => onClose?.(event.code));

  return {
    send(message) {
      if (isAuthenticated) write(message);
      else pending.push(message);
    },
    onMessage(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    close() {
      handlers.clear();
      socket.close();
    },
  };
};
