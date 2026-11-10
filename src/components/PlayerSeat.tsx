import type { CheckerColor } from "checkers-shared-types";
import styles from "../styles/GameScreen.module.css";

type PlayerSeatProps = {
  color: CheckerColor;
  // null while nobody has taken the seat yet.
  name: string | null;
  isActive: boolean;
};

// One player's place at the table: a piece in their color and their name.
// A gold ring marks the player whose turn it is.
const PlayerSeat = ({ color, name, isActive }: PlayerSeatProps) => (
  <div className={`${styles.seat} ${isActive ? styles.active : ""}`}>
    <span className={`${styles.chip} ${styles[color]}`} aria-hidden="true" />
    <span className={styles.seatName}>
      {name ?? <span className={styles.empty}>Open seat</span>}
    </span>
    <span className={styles.seatColor}>{color === "red" ? "Red" : "Black"}</span>
  </div>
);

export default PlayerSeat;
