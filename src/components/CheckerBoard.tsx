import { useState, type KeyboardEvent, type ReactNode } from "react";
import Checker, { type CheckerColor } from "./Checker";
import styles from "../styles/CheckerBoard.module.css";

export type Position = { row: number; col: number };

export type CheckerPiece = Position & {
  id: string;
  color: CheckerColor;
  isKing: boolean;
  isJumped: boolean;
};

type CheckerBoardProps = {
  pieces: CheckerPiece[];
  perspective: CheckerColor;
  playerColor: CheckerColor;
  isPlayerTurn: boolean;
  onMove: (from: Position, to: Position) => void;
  onPieceRemoved: (id: string) => void;
};

const BOARD_SIZE = 8;
const positionKey = ({ row, col }: Position) => `${row},${col}`;

const CheckerBoard = ({
  pieces,
  perspective,
  playerColor,
  isPlayerTurn,
  onMove,
  onPieceRemoved,
}: CheckerBoardProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isFlipped = perspective === "black";
  const flip = (n: number) => (isFlipped ? BOARD_SIZE - 1 - n : n);

  const canSelect = (piece: CheckerPiece) =>
    isPlayerTurn && piece.color === playerColor && !piece.isJumped;

  // Derived, not stored: if the turn ends or the piece disappears,
  // the selection clears itself without an effect.
  const selectedPiece = pieces.find(
    (piece) => piece.id === selectedId && canSelect(piece),
  );

  const occupied = new Set(pieces.map(positionKey));

  const handlePieceSelect = (piece: CheckerPiece) => {
    setSelectedId((current) => (current === piece.id ? null : piece.id));
  };

  const handleSquareSelect = (to: Position) => {
    if (!selectedPiece) return;
    onMove({ row: selectedPiece.row, col: selectedPiece.col }, to);
    setSelectedId(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") setSelectedId(null);
  };

  const squares: ReactNode[] = [];
  for (let screenRow = 0; screenRow < BOARD_SIZE; screenRow++) {
    for (let screenCol = 0; screenCol < BOARD_SIZE; screenCol++) {
      const row = flip(screenRow);
      const col = flip(screenCol);
      const key = positionKey({ row, col });
      const isDark = (row + col) % 2 === 1;
      const gridPosition = {
        gridRow: screenRow + 1,
        gridColumn: screenCol + 1,
      };

      if (isDark && !occupied.has(key)) {
        squares.push(
          <button
            key={key}
            type="button"
            className={`${styles.square} ${styles.dark}`}
            style={gridPosition}
            disabled={!selectedPiece}
            aria-label={`Row ${row + 1}, column ${col + 1}`}
            onClick={() => handleSquareSelect({ row, col })}
          />,
        );
      } else {
        squares.push(
          <div
            key={key}
            className={`${styles.square} ${isDark ? styles.dark : styles.light}`}
            style={gridPosition}
          />,
        );
      }
    }
  }

  return (
    <div
      className={styles.board}
      aria-label="Checkers board"
      onKeyDown={handleKeyDown}
    >
      {squares}
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={styles.cell}
          style={{
            gridRow: flip(piece.row) + 1,
            gridColumn: flip(piece.col) + 1,
          }}
        >
          <Checker
            color={piece.color}
            isKing={piece.isKing}
            isJumped={piece.isJumped}
            isSelected={piece.id === selectedPiece?.id}
            disabled={!canSelect(piece)}
            onSelect={() => handlePieceSelect(piece)}
            onRemoved={() => onPieceRemoved(piece.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default CheckerBoard;
