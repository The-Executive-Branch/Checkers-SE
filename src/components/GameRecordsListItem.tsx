import type { CheckerColor, GameRecord, Player } from "checkers-shared-types";
import styles from "../styles/GameRecordsListItem.module.css";

type GameRecordsListItemProps = {
    record: GameRecord;
    // The signed-in player's username, used to work out which side is "you".
    username: string;
    onRewatch?: (record: GameRecord) => void;
};

const RESULTS = {
    win: { letter: "W", label: "Win" },
    loss: { letter: "L", label: "Loss" },
} as const;

const nameOf = (player: Player) =>
    player.kind === "user" ? player.username : player.name;

// Guest games have no username to match, so "you" falls back to red.
const sideOf = (record: GameRecord, username: string): CheckerColor => {
    const { black } = record.players;
    return black.kind === "user" && black.username === username
        ? "black"
        : "red";
};

// Renders one table row. It must be placed inside a <tbody>.
const GameRecordsListItem = ({
    record,
    username,
    onRewatch,
}: GameRecordsListItemProps) => {
    const you = sideOf(record, username);
    const opponent: CheckerColor = you === "red" ? "black" : "red";
    const result = record.winner === you ? "win" : "loss";
    const { letter, label } = RESULTS[result];
    const opponentName = nameOf(record.players[opponent]);

    return (
        <tr className={styles.row}>
            <th scope="row" className={styles.name}>
                {nameOf(record.players[you])}
            </th>
            <td className={styles.resultCell}>
                <span className={`${styles.badge} ${styles[result]}`}>
                    <span aria-hidden="true">{letter}</span>
                    <span className={styles.srOnly}>{label}</span>
                </span>
            </td>
            <td className={styles.name}>{opponentName}</td>
            <td className={styles.actionCell}>
                <button
                    type="button"
                    className={styles.rewatch}
                    disabled={!onRewatch}
                    aria-label={`Rewatch game against ${opponentName}`}
                    onClick={() => onRewatch?.(record)}
                >
                    <span aria-hidden="true">▶</span>
                </button>
            </td>
        </tr>
    );
};

export default GameRecordsListItem;