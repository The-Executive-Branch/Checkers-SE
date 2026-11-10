import { useCallback, useEffect, useState } from "react";
import type { GameRecord } from "checkers-shared-types";
import UserAccessModal from "./components/UserAccessModal";
import { loadSession, logOut } from "./sessions";
import GameRecordsPage from "./components/GameRecordsPage";
import GameScreen from "./components/GameScreen";
import ReplayScreen from "./components/ReplayScreen";
import { useGameRecords } from "./hooks/useGameRecords";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Which screen is showing. A replay carries the game being watched.
type View =
  | { name: "game" }
  | { name: "records" }
  | { name: "replay"; record: GameRecord };

const App = () => {
  const [session, setSession] = useState(loadSession);
  const [view, setView] = useState<View>({ name: "game" });

  const handleSessionRejected = useCallback(() => {
    logOut();
    setSession(null);
  }, []);

  useEffect(() => {
    toast("Welcome to American Checkers presented by The Executive Branch", {
      position: "bottom-center",
      closeButton: false
    });
  }, []);

  return (
    <main
      style={{
        gap: "1rem",
        justifyItems: "center",
      }}
    >
      {session && view.name === "records" && (
        <RecordsScreen
          username={session.username}
          onBack={() => setView({ name: "game" })}
          onRewatch={(record) => setView({ name: "replay", record })}
        />
      )}

      {session && view.name === "replay" && (
        <ReplayScreen
          record={view.record}
          username={session.username}
          onBack={() => setView({ name: "records" })}
        />
      )}

      {session && view.name === "game" && (
        <GameScreen
          sessionId={session.sessionId}
          onSessionRejected={handleSessionRejected}
          onShowRecords={() => setView({ name: "records" })}
        />
      )}

      <UserAccessModal
        isOpen={!session}
        onSuccess={() => setSession(loadSession())}
      />
      <ToastContainer />
    </main>
  );
};

type RecordsScreenProps = {
  username: string;
  onBack: () => void;
  onRewatch: (record: GameRecord) => void;
};

// Loads the records each time the page opens, so a game that just
// finished shows up without restarting the app.
const RecordsScreen = ({ username, onBack, onRewatch }: RecordsScreenProps) => {
  const { records, isLoading, error, retry } = useGameRecords();
  return (
    <GameRecordsPage
      records={records}
      username={username}
      isLoading={isLoading}
      error={error}
      onRetry={retry}
      onBack={onBack}
      onRewatch={onRewatch}
    />
  );
};

export default App;