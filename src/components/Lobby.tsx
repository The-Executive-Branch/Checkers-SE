import { useState, type SubmitEvent } from "react";
import type { GameId } from "checkers-shared-types";
import type { GameConnection } from "../game/connection";
import { useLobby, type Invite, type OpenGame } from "../hooks/useLobby";
import styles from "../styles/Lobby.module.css";

type LobbyProps = {
  connection: GameConnection;
  onShowRecords: () => void;
};

const Lobby = ({ connection, onShowRecords }: LobbyProps) => {
  const lobby = useLobby(connection);

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <button type="button" className={styles.records} onClick={onShowRecords}>
          Game records
        </button>
      </nav>
      <header className={styles.hero}>
        <PieceStack />
        <h1 className={styles.title}>Checkers</h1>
      </header>

      <main className={styles.tray}>
        {lobby.invite && (
          <InviteBanner invite={lobby.invite} onAccept={lobby.join} onDecline={lobby.decline} />
        )}
        {lobby.notice && (
          <p className={styles.notice} role="alert">
            {lobby.notice}
          </p>
        )}

        <LobbyRow
          heading="On this computer"
          description="Take turns with someone sitting next to you."
        >
          <LocalGameForm onPlay={lobby.playLocally} />
        </LobbyRow>

        <LobbyRow
          heading="Invite a player"
          description="Send a game to someone who's signed in right now."
        >
          <InvitePlayerForm onInvite={lobby.invitePlayer} />
        </LobbyRow>

        <LobbyRow
          heading="Open games"
          description="Start a public game, or join one someone else started."
        >
          <PublicGames
            openGames={lobby.openGames}
            hasSearched={lobby.hasSearched}
            onCreate={lobby.createPublicGame}
            onFind={lobby.findOpenGames}
            onJoin={lobby.join}
          />
        </LobbyRow>
      </main>
    </div>
  );
};

// ── Layout pieces ───────────────────────────────────────────

// Three checkers stacked like pieces waiting on the table edge.
const PieceStack = () => (
  <div className={styles.stack} aria-hidden="true">
    <span className={`${styles.piece} ${styles.black}`} />
    <span className={`${styles.piece} ${styles.red}`} />
    <span className={`${styles.piece} ${styles.red} ${styles.king}`}>♛</span>
  </div>
);

type LobbyRowProps = {
  heading: string;
  description: string;
  children: React.ReactNode;
};

const LobbyRow = ({ heading, description, children }: LobbyRowProps) => (
  <section className={styles.row}>
    <div className={styles.rowText}>
      <h2 className={styles.rowHeading}>{heading}</h2>
      <p className={styles.rowDescription}>{description}</p>
    </div>
    <div className={styles.rowControls}>{children}</div>
  </section>
);

// ── Lobby actions ───────────────────────────────────────────

type InviteBannerProps = {
  invite: Invite;
  onAccept: (gameId: GameId) => void;
  onDecline: (gameId: GameId) => void;
};

const InviteBanner = ({ invite, onAccept, onDecline }: InviteBannerProps) => (
  <div className={styles.invite}>
    <p>
      <strong>{invite.fromUsername}</strong> invited you to a game.
    </p>
    <div className={styles.buttons}>
      <button type="button" className={styles.primary} onClick={() => onAccept(invite.gameId)}>
        Accept
      </button>
      <button type="button" className={styles.quiet} onClick={() => onDecline(invite.gameId)}>
        Decline
      </button>
    </div>
  </div>
);

const LocalGameForm = ({ onPlay }: { onPlay: (guestName: string) => void }) => {
  const [guestName, setGuestName] = useState("Guest");

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPlay(guestName);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        Guest name
        <input
          className={styles.input}
          value={guestName}
          onChange={(e) => setGuestName(e.currentTarget.value)}
        />
      </label>
      <button type="submit" className={styles.primary}>
        Play on this computer
      </button>
    </form>
  );
};

const InvitePlayerForm = ({ onInvite }: { onInvite: (username: string) => void }) => {
  const [opponent, setOpponent] = useState("");

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (opponent.trim()) onInvite(opponent);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        Opponent's username
        <input
          className={styles.input}
          value={opponent}
          onChange={(e) => setOpponent(e.currentTarget.value)}
          autoComplete="off"
        />
      </label>
      <button type="submit" className={styles.secondary}>
        Invite
      </button>
    </form>
  );
};

type PublicGamesProps = {
  openGames: OpenGame[];
  hasSearched: boolean;
  onCreate: () => void;
  onFind: () => void;
  onJoin: (gameId: GameId) => void;
};

const PublicGames = ({ openGames, hasSearched, onCreate, onFind, onJoin }: PublicGamesProps) => (
  <div className={styles.publicGames}>
    <div className={styles.buttons}>
      <button type="button" className={styles.secondary} onClick={onCreate}>
        Create a public game
      </button>
      <button type="button" className={styles.quiet} onClick={onFind}>
        Find open games
      </button>
    </div>

    {openGames.length > 0 ? (
      <ul className={styles.openGames}>
        {openGames.map((open) => (
          <li key={open.gameId} className={styles.openGame}>
            <span>{open.hostUsername}'s game</span>
            <button type="button" className={styles.quiet} onClick={() => onJoin(open.gameId)}>
              Join
            </button>
          </li>
        ))}
      </ul>
    ) : (
      hasSearched && (
        <p className={styles.empty}>No open games right now. Create one and wait for a player.</p>
      )
    )}
  </div>
);

export default Lobby;
