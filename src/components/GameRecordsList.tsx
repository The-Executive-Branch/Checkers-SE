import type { GameRecord } from "checkers-shared-types";
import CustomButton from "./CustomButton";
import GameRecordsListItem from "./GameRecordsListItem";
import styles from "../styles/GameRecordsList.module.css";

type GameRecordsListProps = {
    records: GameRecord[];
    // The signed-in player's username, used to work out which side is "you".
    username: string;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onRewatch?: (record: GameRecord) => void;
};

// endedAt is optional in the shared type, so records without it sort last.
const endedTime = (record: GameRecord) => Date.parse(record.endedAt ?? "") || 0;

const byNewest = (a: GameRecord, b: GameRecord) => endedTime(b) - endedTime(a);

const GameRecordsList = ({
    records,
    username,
    isLoading = false,
    error = null,
    onRetry,
    onRewatch,
}: GameRecordsListProps) => {
    if (isLoading) {
        return (
            <p role="status" className={styles.message}>
                Loading your games…
            </p>
        );
    }

    if (error) {
        return (
            <div role="alert" className={styles.message}>
                <p>{error}</p>
                {onRetry && (
                    <CustomButton variant="secondary" handleClick={onRetry}>
                        Try again
                    </CustomButton>
                )}
            </div>
        );
    }

    if (records.length === 0) {
        return <p className={styles.message}>No games yet</p>;
    }

    // Copy before sorting so the caller's array isn't mutated.
    const sorted = [...records].sort(byNewest);

    return (
        <div className={styles.frame}>
            <table className={styles.table} aria-label="Game records">
                <thead>
                    <tr>
                        <th scope="col" className={styles.left}>
                            You
                        </th>
                        <th scope="col">Result</th>
                        <th scope="col" className={styles.left}>
                            Opponent
                        </th>
                        <th scope="col">Rewatch</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((record) => (
                        <GameRecordsListItem
                            key={record.gameId}
                            record={record}
                            username={username}
                            onRewatch={onRewatch}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GameRecordsList;