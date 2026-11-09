import { useEffect, useState } from "react";
import type { CheckerColor } from "checkers-shared-types";
import CheckerBoard from "./components/CheckerBoard";
import { useGame } from "./hooks/useGame";
import { createFakeConnection } from "./game/fakeConnection";
import UserAccessModal from "./components/UserAccessModal";
import { loadSession } from "./sessions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import default styles


const App = () => {
  const [session, setSession] = useState(loadSession);

  // Created once. Passing the function (not calling it) means React
  // only runs it on the first render.
  const [connection] = useState(createFakeConnection);
  const game = useGame(connection);

  const [isFlipped, setIsFlipped] = useState(false);
  const opposite: CheckerColor =
    game.controlledColor === "red" ? "black" : "red";
  const perspective = isFlipped ? opposite : game.controlledColor;

  useEffect(() => {
    toast("Welcome to Checkers - Presented by The Executive Branch", {
      position: "bottom-center",
      closeButton: false
    });
  }, [])

  return (
    <main
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1rem",
        justifyItems: "center",
      }}
    >

      {/*       <UserAccessModal
        isOpen={!session}
        onSuccess={() => setSession(loadSession())}
      /> */}

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
      <ToastContainer />
    </main>
  );
};

export default App;
