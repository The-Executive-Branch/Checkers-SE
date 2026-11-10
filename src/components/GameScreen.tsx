import { useEffect, useState } from "react";
import type { GameConnection } from "../game/connection";
import { createSocketConnection, GAME_SERVER_URL } from "../game/socketConnection";
import { useGame } from "../hooks/useGame";
import Lobby from "./Lobby";
import GameInProgress from "./GameInProgress";

const SESSION_REJECTED = 4401;

type GameScreenProps = {
  sessionId: string;
  onSessionRejected: () => void;
  onShowRecords: () => void;
};

// Owns the connection: opens it once per signed-in session and closes it
// on unmount. It's created in an effect, not during render, so React's
// development double-render can't leave a second connection open.
const GameScreen = ({ sessionId, onSessionRejected, onShowRecords }: GameScreenProps) => {
  const [connection, setConnection] = useState<GameConnection | null>(null);

  useEffect(() => {
    const created = createSocketConnection(GAME_SERVER_URL, sessionId, {
      onClose: (code) => {
        if (code === SESSION_REJECTED) onSessionRejected();
      },
    });
    setConnection(created);
    return () => created.close();
  }, [sessionId, onSessionRejected]);

  if (!connection) return <p>Connecting…</p>;
  return <GameView connection={connection} onShowRecords={onShowRecords} />;
};

type GameViewProps = {
  connection: GameConnection;
  onShowRecords: () => void;
};

// Shows the board once a game exists, and the lobby until then.
// useGame stays mounted the whole time, so it catches the first snapshot.
// The records button lives in the lobby only, so nobody can leave a live
// game by accident (leaving unmounts GameScreen, which closes the connection).
const GameView = ({ connection, onShowRecords }: GameViewProps) => {
  const game = useGame(connection);

  return game.gameId ? (
    <GameInProgress game={game} />
  ) : (
    <Lobby connection={connection} onShowRecords={onShowRecords} />
  );
};

export default GameScreen;