import { useEffect, useMemo, useState } from "react";
import type { CheckerColor, GameRecord } from "checkers-shared-types";
import CheckerBoard from "./CheckerBoard";
import PlayerSeat from "./PlayerSeat";
import { buildReplay, ReplayError, turnAfter } from "../game/replay";
import { nameOf, sideOf } from "../game/records";
import gameStyles from "../styles/GameScreen.module.css";
import styles from "../styles/ReplayScreen.module.css";

const STEP_DELAY_MS = 900;

type ReplayScreenProps = {
  record: GameRecord;
  // The signed-in player's username, used to seat "you" below the board.
  username: string;
  onBack: () => void;
};

const opposite = (color: CheckerColor): CheckerColor =>
  color === "red" ? "black" : "red";

// Builds every board once. A broken record shows a message instead of
// crashing the whole screen.
const useReplay = (record: GameRecord) =>
  useMemo(() => {
    try {
      return { boards: buildReplay(record.moves), error: null };
    } catch (error) {
      if (error instanceof ReplayError) return { boards: null, error: error.message };
      throw error;
    }
  }, [record]);

const ReplayScreen = ({ record, username, onBack }: ReplayScreenProps) => {
  const { boards, error } = useReplay(record);

  return (
    <div className={gameStyles.page}>
      <div className={`${gameStyles.table} ${styles.table}`}>
        <div className={styles.topRow}>
          <button type="button" className={styles.back} onClick={onBack}>
            Back to records
          </button>
        </div>
        {boards ? (
          <ReplayPlayer record={record} username={username} boards={boards} />
        ) : (
          <p className={styles.problem} role="alert">
            This game can't be replayed. {error}
          </p>
        )}
      </div>
    </div>
  );
};

type ReplayPlayerProps = {
  record: GameRecord;
  username: string;
  boards: ReturnType<typeof buildReplay>;
};

const ReplayPlayer = ({ record, username, boards }: ReplayPlayerProps) => {
  const lastStep = record.moves.length;
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const isAtEnd = step === lastStep;
  const yourColor = sideOf(record, username);
  const turn = turnAfter(record.moves, step);

  // While playing, move forward one step at a time and stop at the end.
  useEffect(() => {
    if (!isPlaying) return;
    if (isAtEnd) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStep((current) => current + 1), STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, isAtEnd, step]);

  const goTo = (next: number) => {
    setIsPlaying(false);
    setStep(Math.min(Math.max(next, 0), lastStep));
  };

  const togglePlay = () => {
    // Pressing play at the end starts the game over.
    if (isAtEnd) setStep(0);
    setIsPlaying((current) => !current);
  };

  // Pieces taken by the move just shown fade out instead of vanishing.
  const lastMove = step > 0 ? record.moves[step - 1] : null;
  const fading = new Set(lastMove?.capturedIds ?? []);
  const pieces = [
    ...boards[step].map((piece) => ({ ...piece, isJumped: false })),
    ...(step > 0 ? boards[step - 1] : [])
      .filter((piece) => fading.has(piece.id))
      .map((piece) => ({ ...piece, isJumped: true })),
  ];

  const status = isAtEnd
    ? `${nameOf(record.players[record.winner])} wins!`
    : step === 0
      ? "Starting position"
      : `Move ${step} of ${lastStep}`;

  return (
    <>
      <p className={`${gameStyles.status} ${isAtEnd ? gameStyles.won : ""}`} role="status">
        {status}
      </p>

      <PlayerSeat
        color={opposite(yourColor)}
        name={nameOf(record.players[opposite(yourColor)])}
        isActive={!isAtEnd && turn === opposite(yourColor)}
      />
      <CheckerBoard
        pieces={pieces}
        perspective={yourColor}
        playerColor={yourColor}
        isPlayerTurn={false}
        onMove={() => {}}
        onPieceRemoved={() => {}}
      />
      <PlayerSeat
        color={yourColor}
        name={nameOf(record.players[yourColor])}
        isActive={!isAtEnd && turn === yourColor}
      />

      <div className={styles.controls}>
        <input
          type="range"
          className={styles.scrubber}
          min={0}
          max={lastStep}
          value={step}
          aria-label="Move"
          aria-valuetext={status}
          onChange={(event) => goTo(Number(event.target.value))}
        />
        <div className={styles.buttons}>
          <button type="button" className={styles.control} aria-label="Back to start" disabled={step === 0} onClick={() => goTo(0)}>
            <span aria-hidden="true">⏮</span>
          </button>
          <button type="button" className={styles.control} aria-label="Previous move" disabled={step === 0} onClick={() => goTo(step - 1)}>
            <span aria-hidden="true">◀</span>
          </button>
          <button type="button" className={`${styles.control} ${styles.play}`} onClick={togglePlay} disabled={lastStep === 0}>
            {isPlaying ? "Pause" : isAtEnd && lastStep > 0 ? "Replay" : "Play"}
          </button>
          <button type="button" className={styles.control} aria-label="Next move" disabled={isAtEnd} onClick={() => goTo(step + 1)}>
            <span aria-hidden="true">▶</span>
          </button>
          <button type="button" className={styles.control} aria-label="Jump to end" disabled={isAtEnd} onClick={() => goTo(lastStep)}>
            <span aria-hidden="true">⏭</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ReplayScreen;
