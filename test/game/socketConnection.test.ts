import { it, expect, vi, beforeEach } from "vitest";
import type { ServerMessage } from "checkers-shared-types";
import { createSocketConnection } from "@/game/socketConnection";

// A stand-in for the browser's WebSocket that the tests control.
class FakeWebSocket {
  static latest: FakeWebSocket;
  sent: unknown[] = [];
  closed = false;
  private listeners: Record<string, ((event: any) => void)[]> = {};

  constructor(readonly url: string) {
    FakeWebSocket.latest = this;
  }

  addEventListener(type: string, listener: (event: any) => void) {
    (this.listeners[type] ??= []).push(listener);
  }

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.closed = true;
  }

  // Test helpers: pretend the server did something.
  open() {
    this.listeners.open?.forEach((l) => l({}));
  }
  receive(message: ServerMessage) {
    this.listeners.message?.forEach((l) => l({ data: JSON.stringify(message) }));
  }
  serverClose(code: number) {
    this.listeners.close?.forEach((l) => l({ code }));
  }
}

const AUTHENTICATED: ServerMessage = { type: "authenticated", userId: "u1", username: "ravae" };

beforeEach(() => {
  vi.stubGlobal("WebSocket", FakeWebSocket);
});

it("connects to the given address and signs in first", () => {
  // Act
  createSocketConnection("ws://server/game", "session-abc");
  FakeWebSocket.latest.open();
  // Assert
  expect(FakeWebSocket.latest.url).toBe("ws://server/game");
  expect(FakeWebSocket.latest.sent).toEqual([{ type: "authenticate", sessionId: "session-abc" }]);
});

it("holds messages until the server confirms the sign-in", () => {
  // Arrange
  const connection = createSocketConnection("ws://server/game", "session-abc");
  const socket = FakeWebSocket.latest;
  socket.open();
  // Act
  connection.send({ type: "listOpenGames" });
  const beforeConfirm = [...socket.sent];
  socket.receive(AUTHENTICATED);
  // Assert
  expect(beforeConfirm).toEqual([{ type: "authenticate", sessionId: "session-abc" }]);
  expect(socket.sent).toEqual([
    { type: "authenticate", sessionId: "session-abc" },
    { type: "listOpenGames" },
  ]);
});

it("sends right away once signed in", () => {
  // Arrange
  const connection = createSocketConnection("ws://server/game", "session-abc");
  const socket = FakeWebSocket.latest;
  socket.open();
  socket.receive(AUTHENTICATED);
  // Act
  connection.send({ type: "listOpenGames" });
  // Assert
  expect(socket.sent.at(-1)).toEqual({ type: "listOpenGames" });
});

it("passes every server message to subscribers until they unsubscribe", () => {
  // Arrange
  const connection = createSocketConnection("ws://server/game", "session-abc");
  const socket = FakeWebSocket.latest;
  const handler = vi.fn();
  const unsubscribe = connection.onMessage(handler);
  // Act
  socket.receive(AUTHENTICATED);
  unsubscribe();
  socket.receive({ type: "openGames", games: [] });
  // Assert
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledWith(AUTHENTICATED);
});

it("reports the close code when the server closes the connection", () => {
  // Arrange
  const onClose = vi.fn();
  createSocketConnection("ws://server/game", "bad-session", { onClose });
  // Act
  FakeWebSocket.latest.serverClose(4401);
  // Assert
  expect(onClose).toHaveBeenCalledWith(4401);
});

it("closes the socket and stops delivering messages when closed", () => {
  // Arrange
  const connection = createSocketConnection("ws://server/game", "session-abc");
  const socket = FakeWebSocket.latest;
  const handler = vi.fn();
  connection.onMessage(handler);
  // Act
  connection.close();
  socket.receive(AUTHENTICATED);
  // Assert
  expect(socket.closed).toBe(true);
  expect(handler).not.toHaveBeenCalled();
});
