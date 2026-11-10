import type { CheckerColor } from "checkers-shared-types";
import type { useGame } from "../hooks/useGame";
import CheckerBoard from "./CheckerBoard";
import PlayerSeat from "./PlayerSeat";
import styles from "../styles/GameScreen.module.css";

type Game = ReturnType<typeof useGame>;

const opposite = (color: CheckerColor): CheckerColor =>
  color === "red" ? "black" : "red";

// Laid out like sitting at a real table: your seat is below the board,
// your opponent's is across from you, above it.
const GameInProgress = ({ game }: { game: Game }) => {
  const yourColor = game.controlledColor;

  return (
    <div className={styles.page}>
      <div className={styles.table}>
        <GameStatusLine game={game} />
        <Seat game={game} color={opposite(yourColor)} />

        {/* The notice floats over the top of the board, so it never
            pushes the board down. */}
        <div className={styles.boardArea}>
          {game.lastRejection && (
            <p className={styles.notice} role="alert">
              {game.lastRejection.reason}
            </p>
          )}
          <CheckerBoard
            pieces={game.pieces}
            perspective={yourColor}
            playerColor={yourColor}
            isPlayerTurn={game.isPlayerTurn}
            onMove={game.makeMove}
            onPieceRemoved={game.removePiece}
          />
          {/* Once the game is over, the board dims and the way out sits on
              top of it. The server has already forgotten the game, so
              leaving only has to clear it here. */}
          {game.status.state === "finished" && (
            <div className={styles.gameOver}>
              <button type="button" className={styles.lobbyButton} onClick={game.leaveGame}>
                Back to lobby
              </button>
            </div>
          )}
        </div>
        <Seat game={game} color={yourColor} />
      </div>
    </div>
  );
};

const nameOf = (game: Game, color: CheckerColor) => {
  const player = game.players?.[color];
  if (!player) return null;
  return player.kind === "user" ? player.username : player.name;
};

const Seat = ({ game, color }: { game: Game; color: CheckerColor }) => (
  <PlayerSeat
    color={color}
    name={nameOf(game, color)}
    isActive={game.status.state === "inProgress" && game.turn === color}
  />
);

const GameStatusLine = ({ game }: { game: Game }) => {
  const text = (() => {
    switch (game.status.state) {
      case "waiting":
        return "Waiting for an opponent…";
      case "finished":
        return `${nameOf(game, game.status.winner) ?? "Nobody"} wins!`;
      case "inProgress":
        return game.isPlayerTurn
          ? "Your move"
          : `${nameOf(game, game.turn) ?? "Opponent"}'s move`;
    }
  })();

  return (
    <p
      className={`${styles.status} ${game.status.state === "finished" ? styles.won : ""}`}
      role="status"
    >
      {text}
    </p>
  );
};

export default GameInProgress;
