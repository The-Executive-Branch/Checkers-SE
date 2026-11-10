import { it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ClientMessage, GameId, ServerMessage } from "checkers-shared-types";
import type { GameMessageHandler } from "@/game/connection";
import GameScreen from "@/components/GameScreen";
import { createSocketConnection } from "@/game/socketConnection";

// Replace the real socket with a connection the test controls.
vi.mock("@/game/socketConnection", () => ({
  GAME_SERVER_URL: "ws://test/game",
  createSocketConnection: vi.fn(),
}));

let sent: ClientMessage[];
let handlers: Set<GameMessageHandler>;
let closeSpy: ReturnType<typeof vi.fn<() => void>>;

const receive = (message: ServerMessage) =>
  act(() => handlers.forEach((handler) => handler(message)));

beforeEach(() => {
  vi.mocked(createSocketConnection).mockClear();
  sent = [];
  handlers = new Set();
  closeSpy = vi.fn<() => void>();
  vi.mocked(createSocketConnection).mockImplementation(() => ({
    send: (message) => sent.push(message),
    onMessage: (handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close: closeSpy,
  }));
});

const GAME_ID = "game-1" as GameId;

it("connects with the player's session", () => {
  // Act
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Assert
  expect(createSocketConnection).toHaveBeenCalledWith(
    "ws://test/game",
    "session-abc",
    expect.anything(),
  );
});

it("starts a local game and shows the board when the snapshot arrives", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Act
  await user.click(screen.getByRole("button", { name: "Play on this computer" }));
  await receive({
    type: "gameState",
    gameId: GAME_ID,
    pieces: [{ id: "red-5-0", color: "red", row: 5, col: 0, isKing: false }],
    playerTurn: "red",
    playerColor: "both",
    status: { state: "inProgress" },
    mode: "local",
    players: { red: { kind: "user", username: "ravae" }, black: { kind: "guest", name: "Guest" } },
  });
  // Assert
  expect(sent).toEqual([{ type: "createGame", mode: { type: "local", guestName: "Guest" } }]);
  expect(screen.getByLabelText("Checkers board")).toBeInTheDocument();
  expect(screen.getByText(/Your move/)).toBeInTheDocument();
});

it("shows an invite and joins the game when accepted", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Act
  await receive({ type: "gameInvite", gameId: GAME_ID, fromUsername: "blake" });
  await user.click(screen.getByRole("button", { name: "Accept" }));
  // Assert
  expect(sent).toEqual([{ type: "join", gameId: GAME_ID }]);
});

it("lists open games and joins one", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Act
  await user.click(screen.getByRole("button", { name: "Find open games" }));
  await receive({
    type: "openGames",
    games: [{ gameId: GAME_ID, hostUsername: "blake", createdAt: "2026-11-09T00:00:00Z" }],
  });
  await user.click(screen.getByRole("button", { name: "Join" }));
  // Assert
  expect(sent).toEqual([{ type: "listOpenGames" }, { type: "join", gameId: GAME_ID }]);
});

it("shows server errors", async () => {
  // Arrange
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Act
  await receive({ type: "error", requestType: "createGame", reason: "blake isn't online." });
  // Assert
  expect(screen.getByRole("alert")).toHaveTextContent("blake isn't online.");
});

it("tells the app when the server rejects the session", () => {
  // Arrange
  const onSessionRejected = vi.fn();
  render(<GameScreen sessionId="bad" onSessionRejected={onSessionRejected} onShowRecords={vi.fn()} />);
  const { onClose } = vi.mocked(createSocketConnection).mock.lastCall![2]!;
  // Act
  act(() => onClose?.(4401));
  // Assert
  expect(onSessionRejected).toHaveBeenCalled();
});

it("closes the connection when the screen goes away", () => {
  // Arrange
  const { unmount } = render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Act
  unmount();
  // Assert
  expect(closeSpy).toHaveBeenCalled();
});

it("opens game records from the lobby", async () => {
  // Arrange
  const user = userEvent.setup();
  const onShowRecords = vi.fn();
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={onShowRecords} />);
  // Act
  await user.click(screen.getByRole("button", { name: "Game records" }));
  // Assert
  expect(onShowRecords).toHaveBeenCalledOnce();
});

it("goes back to the lobby after the game ends", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  await receive({
    type: "gameState",
    gameId: GAME_ID,
    pieces: [{ id: "red-5-0", color: "red", row: 5, col: 0, isKing: false }],
    playerTurn: "black",
    playerColor: "red",
    status: { state: "finished", winner: "red" },
    mode: "online",
    players: { red: { kind: "user", username: "ravae" }, black: { kind: "user", username: "blake" } },
  });
  // Act
  await user.click(screen.getByRole("button", { name: "Back to lobby" }));
  // Assert
  expect(screen.queryByLabelText("Checkers board")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Play on this computer" })).toBeInTheDocument();
});

it("doesn't offer to leave while the game is still going", async () => {
  // Arrange
  render(<GameScreen sessionId="session-abc" onSessionRejected={vi.fn()} onShowRecords={vi.fn()} />);
  // Act
  await receive({
    type: "gameState",
    gameId: GAME_ID,
    pieces: [{ id: "red-5-0", color: "red", row: 5, col: 0, isKing: false }],
    playerTurn: "red",
    playerColor: "red",
    status: { state: "inProgress" },
    mode: "online",
    players: { red: { kind: "user", username: "ravae" }, black: { kind: "user", username: "blake" } },
  });
  // Assert
  expect(screen.queryByRole("button", { name: "Back to lobby" })).not.toBeInTheDocument();
});
