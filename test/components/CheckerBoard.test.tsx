import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckerBoard, { type CheckerPiece } from "@/components/CheckerBoard";
import type { CheckerColor } from "@/components/Checker";

const piece = (
  id: string,
  row: number,
  col: number,
  color: CheckerColor,
): CheckerPiece => ({ id, row, col, color, isKing: false, isJumped: false });

const RED_A = piece("red-5-0", 5, 0, "red");
const RED_B = piece("red-5-2", 5, 2, "red");
const BLACK_A = piece("black-2-1", 2, 1, "black");

type BoardOptions = {
  pieces?: CheckerPiece[];
  perspective?: CheckerColor;
  playerColor?: CheckerColor;
  isPlayerTurn?: boolean;
};

const renderBoard = ({
  pieces = [RED_A, RED_B, BLACK_A],
  perspective = "red",
  playerColor = "red",
  isPlayerTurn = true,
}: BoardOptions = {}) => {
  const onMove = vi.fn();
  const onPieceRemoved = vi.fn();
  const utils = render(
    <CheckerBoard
      pieces={pieces}
      perspective={perspective}
      playerColor={playerColor}
      isPlayerTurn={isPlayerTurn}
      onMove={onMove}
      onPieceRemoved={onPieceRemoved}
    />,
  );
  const board = screen.getByLabelText("Checkers board");
  return { ...utils, board, onMove, onPieceRemoved };
};

// Squares are placed by screen position with CSS grid (1-based).
const squareAt = (board: HTMLElement, screenRow: number, screenCol: number) => {
  const square = Array.from(board.querySelectorAll<HTMLElement>(".square")).find(
    (el) =>
      el.style.gridRow === String(screenRow + 1) &&
      el.style.gridColumn === String(screenCol + 1),
  );
  if (!square) throw new Error(`No square at ${screenRow}, ${screenCol}`);
  return square;
};

const checkers = () => screen.queryAllByRole("button", { name: /checker$/ });

describe("CheckerBoard: board visualization", () => {
  it("draws 64 squares that alternate light and dark, with the bottom-left square dark", () => {
    const { board } = renderBoard({ pieces: [] });

    expect(board.querySelectorAll(".square")).toHaveLength(64);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const expected = (row + col) % 2 === 1 ? "dark" : "light";
        expect(squareAt(board, row, col)).toHaveClass(expected);
      }
    }
    expect(squareAt(board, 7, 0)).toHaveClass("dark");
  });

  it("keeps the bottom-left square dark when the board is flipped", () => {
    const { board } = renderBoard({ pieces: [], perspective: "black" });
    expect(squareAt(board, 7, 0)).toHaveClass("dark");
  });
});

describe("CheckerBoard: piece placement", () => {
  it("shows each piece once, on the square matching its row and column", () => {
    renderBoard();

    expect(checkers()).toHaveLength(3);
    for (const { row, col, color } of [RED_A, RED_B, BLACK_A]) {
      const cell = Array.from(document.querySelectorAll<HTMLElement>(".cell")).find(
        (el) =>
          el.style.gridRow === String(row + 1) &&
          el.style.gridColumn === String(col + 1),
      );
      expect(cell).toBeDefined();
      expect(within(cell!).getByRole("button")).toHaveAccessibleName(`${color} checker`);
    }
  });

  it("shows no pieces for an empty list", () => {
    renderBoard({ pieces: [] });
    expect(checkers()).toHaveLength(0);
  });

  it("places pieces on the opposite side when the board is flipped", () => {
    renderBoard({ pieces: [BLACK_A], perspective: "black", playerColor: "black" });
    const cell = document.querySelector<HTMLElement>(".cell")!;
    // Board row 2, column 1 is drawn at screen row 5, column 6.
    expect(cell.style.gridRow).toBe("6");
    expect(cell.style.gridColumn).toBe("7");
  });

  it("removes a piece when it is no longer in the list", () => {
    const { rerender, onMove, onPieceRemoved } = renderBoard();

    rerender(
      <CheckerBoard
        pieces={[RED_A, BLACK_A]}
        perspective="red"
        playerColor="red"
        isPlayerTurn
        onMove={onMove}
        onPieceRemoved={onPieceRemoved}
      />,
    );

    expect(checkers()).toHaveLength(2);
  });

  it("only makes empty dark squares clickable", () => {
    const { board } = renderBoard({ pieces: [] });
    const squareButtons = board.querySelectorAll("button.square");
    expect(squareButtons).toHaveLength(32);
    squareButtons.forEach((square) => expect(square).toHaveClass("dark"));
  });
});

describe("CheckerBoard: selecting and moving", () => {
  it("selects one of the player's pieces when clicked", async () => {
    renderBoard();
    const [redA] = screen.getAllByRole("button", { name: "red checker" });

    await userEvent.click(redA);

    expect(redA).toHaveAttribute("aria-pressed", "true");
  });

  it("deselects a piece when it is clicked again", async () => {
    renderBoard();
    const [redA] = screen.getAllByRole("button", { name: "red checker" });

    await userEvent.click(redA);
    await userEvent.click(redA);

    expect(redA).toHaveAttribute("aria-pressed", "false");
  });

  it("moves the selection when another of the player's pieces is clicked, so only one looks selected", async () => {
    renderBoard();
    const [redA, redB] = screen.getAllByRole("button", { name: "red checker" });

    await userEvent.click(redA);
    await userEvent.click(redB);

    expect(redA).toHaveAttribute("aria-pressed", "false");
    expect(redB).toHaveAttribute("aria-pressed", "true");
  });

  it("clears the selection when Escape is pressed", async () => {
    renderBoard();
    const [redA] = screen.getAllByRole("button", { name: "red checker" });

    await userEvent.click(redA);
    await userEvent.keyboard("{Escape}");

    expect(redA).toHaveAttribute("aria-pressed", "false");
  });

  it("does not let the player select an opponent's piece", () => {
    renderBoard();
    expect(screen.getByRole("button", { name: "black checker" })).toBeDisabled();
  });

  it("does not let the player select anything when it isn't their turn", () => {
    renderBoard({ isPlayerTurn: false });
    checkers().forEach((checker) => expect(checker).toBeDisabled());
  });

  it("sends the move once, in board coordinates, when a piece and then an empty square are clicked", async () => {
    const { onMove } = renderBoard();
    const [redA] = screen.getAllByRole("button", { name: "red checker" });

    await userEvent.click(redA);
    await userEvent.click(screen.getByRole("button", { name: "Row 5, column 2" }));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ row: 5, col: 0 }, { row: 4, col: 1 });
    expect(redA).toHaveAttribute("aria-pressed", "false");
  });

  it("still sends board coordinates when the board is flipped", async () => {
    const { onMove, board } = renderBoard({
      pieces: [BLACK_A],
      perspective: "black",
      playerColor: "black",
    });

    await userEvent.click(screen.getByRole("button", { name: "black checker" }));
    // Board row 3, column 2 is drawn at screen row 4, column 5.
    await userEvent.click(squareAt(board, 4, 5));

    expect(onMove).toHaveBeenCalledWith({ row: 2, col: 1 }, { row: 3, col: 2 });
  });

  it("does not send a move when nothing is selected", async () => {
    const { onMove } = renderBoard();
    const square = screen.getByRole("button", { name: "Row 5, column 2" });

    expect(square).toBeDisabled();
    await userEvent.click(square);

    expect(onMove).not.toHaveBeenCalled();
  });

  it("does not send a move when a light square is clicked", async () => {
    const { onMove, board } = renderBoard();
    const [redA] = screen.getAllByRole("button", { name: "red checker" });

    await userEvent.click(redA);
    await userEvent.click(squareAt(board, 4, 0));

    expect(onMove).not.toHaveBeenCalled();
  });

  it("works with only a keyboard", async () => {
    const { onMove } = renderBoard();
    const [redA] = screen.getAllByRole("button", { name: "red checker" });

    redA.focus();
    await userEvent.keyboard("{Enter}");
    screen.getByRole("button", { name: "Row 5, column 2" }).focus();
    await userEvent.keyboard("{Enter}");

    expect(onMove).toHaveBeenCalledWith({ row: 5, col: 0 }, { row: 4, col: 1 });
  });

  it("tells the parent when a captured piece's animation finishes", () => {
    const jumped = { ...BLACK_A, isJumped: true };
    const { onPieceRemoved } = renderBoard({ pieces: [RED_A, jumped] });

    fireEvent.animationEnd(screen.getByRole("button", { name: "black checker" }));

    expect(onPieceRemoved).toHaveBeenCalledWith("black-2-1");
  });
});
