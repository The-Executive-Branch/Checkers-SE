import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameId, GameRecord } from "checkers-shared-types";
import ReplayScreen from "@/components/ReplayScreen";

const RECORD: GameRecord = {
  gameId: "g1" as GameId,
  players: { red: { kind: "user", username: "ravae" }, black: { kind: "guest", name: "Gary" } },
  winner: "red",
  moves: [
    { from: { row: 5, col: 0 }, to: { row: 4, col: 1 }, nextPlayerTurn: "black" },
    { from: { row: 2, col: 3 }, to: { row: 3, col: 2 }, nextPlayerTurn: "red" },
    { from: { row: 4, col: 1 }, to: { row: 2, col: 3 }, capturedIds: ["black-2-3"], nextPlayerTurn: "black" },
  ],
};

const renderReplay = (record = RECORD, onBack = vi.fn()) =>
  render(<ReplayScreen record={record} username="ravae" onBack={onBack} />);

const status = () => screen.getByRole("status");

afterEach(() => {
  vi.useRealTimers();
});

describe("ReplayScreen", () => {
  it("starts at the opening position", () => {
    // Act
    renderReplay();
    // Assert
    expect(status()).toHaveTextContent("Starting position");
    expect(screen.getAllByRole("button", { name: /red checker/ })).toHaveLength(12);
  });

  it("steps forward and back one move at a time", async () => {
    // Arrange
    const user = userEvent.setup();
    renderReplay();
    // Act
    await user.click(screen.getByRole("button", { name: "Next move" }));
    await user.click(screen.getByRole("button", { name: "Next move" }));
    await user.click(screen.getByRole("button", { name: "Previous move" }));
    // Assert
    expect(status()).toHaveTextContent("Move 1 of 3");
  });

  it("shows the winner at the end", async () => {
    // Arrange
    const user = userEvent.setup();
    renderReplay();
    // Act
    await user.click(screen.getByRole("button", { name: "Jump to end" }));
    // Assert
    expect(status()).toHaveTextContent("ravae wins!");
    expect(screen.getByRole("button", { name: "Next move" })).toBeDisabled();
  });

  it("jumps to a move with the slider", () => {
    // Arrange
    renderReplay();
    // Act
    fireEvent.change(screen.getByRole("slider", { name: "Move" }), { target: { value: "2" } });
    // Assert
    expect(status()).toHaveTextContent("Move 2 of 3");
  });

  it("plays through the game on its own", () => {
    // Arrange
    vi.useFakeTimers();
    renderReplay();
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(900));
    // Assert
    expect(status()).toHaveTextContent("Move 1 of 3");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("stops playing at the end", () => {
    // Arrange
    vi.useFakeTimers();
    renderReplay();
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(900));
    // Assert
    expect(status()).toHaveTextContent("ravae wins!");
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
  });

  it("goes back to the records page", async () => {
    // Arrange
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderReplay(RECORD, onBack);
    // Act
    await user.click(screen.getByRole("button", { name: "Back to records" }));
    // Assert
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("explains when a record can't be replayed", () => {
    // Arrange
    const broken: GameRecord = {
      ...RECORD,
      moves: [{ from: { row: 4, col: 1 }, to: { row: 3, col: 2 }, nextPlayerTurn: "black" }],
    };
    // Act
    renderReplay(broken);
    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent("This game can't be replayed. Move 1");
  });
});
