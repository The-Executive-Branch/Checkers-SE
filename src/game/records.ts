import type { CheckerColor, GameRecord, Player } from "checkers-shared-types";

export const nameOf = (player: Player) =>
  player.kind === "user" ? player.username : player.name;

// Which side the signed-in player was on. Guest games have no username
// to match, so "you" falls back to red.
export const sideOf = (record: GameRecord, username: string): CheckerColor => {
  const { black } = record.players;
  return black.kind === "user" && black.username === username ? "black" : "red";
};
