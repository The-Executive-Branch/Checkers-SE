import { useState } from "react";
// Changed to add both GameId and GameRecord from the shared types
import type { CheckerColor, GameId, GameRecord } from "checkers-shared-types";
import CheckerBoard from "./components/CheckerBoard";
import { useGame } from "./hooks/useGame";
import { createFakeConnection } from "./game/fakeConnection";
import UserAccessModal from "./components/UserAccessModal";
import { loadSession } from "./sessions";
// Importing both custom button and the game records page itself
import CustomButton from "./components/CustomButton";
import GameRecordsPage from "./components/GameRecordsPage";

// TODO: replace with the player's real games once the backend route exists.
const SAMPLE_RECORDS: GameRecord[] = [
  { gameId: "g1" as GameId, players: { red: { kind: "user", username: "you" }, black: { kind: "guest", name: "Gary" } }, winner: "red", moves: [], endedAt: "2026-10-20T12:00:00Z" },
  { gameId: "g2" as GameId, players: { red: { kind: "user", username: "you" }, black: { kind: "user", username: "a_very_long_opponent_username_to_test_truncation" } }, winner: "black", moves: [], endedAt: "2026-10-18T15:30:00Z" },
];

const App = () => {
  const [session, setSession] = useState(loadSession);
  // Page State
  const [view, setView] = useState<"game" | "records">("game");

  // Created once. Passing the function (not calling it) means React
  // only runs it on the first render.
  const [connection] = useState(createFakeConnection);
  const game = useGame(connection);

  const [isFlipped, setIsFlipped] = useState(false);
  const opposite: CheckerColor =
    game.controlledColor === "red" ? "black" : "red";
  const perspective = isFlipped ? opposite : game.controlledColor;
  // Adds the records page itself
  if (view === "records") {
    return (
      <>
        <UserAccessModal
          isOpen={!session}
          onSuccess={() => setSession(loadSession())}
        />
        <GameRecordsPage
          records={SAMPLE_RECORDS}
          username={session?.username ?? ""}
          onBack={() => setView("game")}
        />
      </>
    );
  }

  return (
    <main
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1rem",
        justifyItems: "center",
      }}
    >
      <UserAccessModal
        isOpen={!session}
        onSuccess={() => setSession(loadSession())}
      />
      {/* Adds button to access GameRecords page */}
      <header>
        <CustomButton handleClick={() => setView("records")}>
          Game Records
        </CustomButton>
      </header>
      <section style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={() => connection.setNextMove({ capture: true })}>
          Next move captures
        </button>
        <button onClick={() => connection.setNextMove({ crown: true })}>
          Next move crowns
        </button>
        <button onClick={() => connection.setNextMove({ mustJump: true })}>
          Next move must keep jumping
        </button>
        <button onClick={() => connection.setNextMove({ reject: true })}>
          Next move is rejected
        </button>
        <button onClick={() => setIsFlipped((prev) => !prev)}>
          Flip board
        </button>
      </section>

      <p>
        Status: {game.status.state} · Turn: {game.turn} · You:{" "}
        {game.playerColor}
        {game.isPlayerTurn ? " · Your move" : " · Waiting"}
      </p>

      {game.mustJumpFrom && (
        <p>
          Must keep jumping from row {game.mustJumpFrom.row + 1}, column{" "}
          {game.mustJumpFrom.col + 1}
        </p>
      )}

      {game.lastRejection && (
        <p role="alert">Rejected: {game.lastRejection.reason}</p>
      )}

      <CheckerBoard
        pieces={game.pieces}
        perspective={perspective}
        playerColor={game.controlledColor}
        isPlayerTurn={game.isPlayerTurn}
        onMove={game.makeMove}
        onPieceRemoved={game.removePiece}
      />
    </main>
  );
};

export default App;
