import { useEffect, useState } from "react";
import type { GameId, ServerMessage } from "checkers-shared-types";
import type { GameConnection } from "../game/connection";

export type OpenGame = Extract<ServerMessage, { type: "openGames" }>["games"][number];
export type Invite = Extract<ServerMessage, { type: "gameInvite" }>;

// Lobby state and actions: open games, invites, and notices from the server.
// Game messages are handled separately by useGame.
export const useLobby = (connection: GameConnection) => {
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(
    () =>
      connection.onMessage((message) => {
        switch (message.type) {
          case "openGames":
            setOpenGames(message.games);
            setHasSearched(true);
            break;
          case "gameInvite":
            setInvite(message);
            break;
          case "inviteDeclined":
            setNotice(`${message.byUsername} declined your invite.`);
            break;
          case "error":
            setNotice(message.reason);
            break;
        }
      }),
    [connection],
  );

  const playLocally = (guestName: string) =>
    connection.send({
      type: "createGame",
      mode: { type: "local", guestName: guestName.trim() || "Guest" },
    });

  const invitePlayer = (opponentUsername: string) =>
    connection.send({
      type: "createGame",
      mode: { type: "online", isPrivate: true, opponentUsername: opponentUsername.trim() },
    });

  const createPublicGame = () =>
    connection.send({ type: "createGame", mode: { type: "online", isPrivate: false } });

  const findOpenGames = () => connection.send({ type: "listOpenGames" });

  const join = (gameId: GameId) => {
    setInvite(null);
    connection.send({ type: "join", gameId });
  };

  const decline = (gameId: GameId) => {
    setInvite(null);
    connection.send({ type: "declineInvite", gameId });
  };

  return {
    openGames,
    hasSearched,
    invite,
    notice,
    playLocally,
    invitePlayer,
    createPublicGame,
    findOpenGames,
    join,
    decline,
  };
};
