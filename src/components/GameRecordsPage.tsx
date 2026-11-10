import type { GameRecord } from "checkers-shared-types";
import GameRecordsList from "./GameRecordsList";
import styles from "../styles/GameRecordsPage.module.css";

type GameRecordsPageProps = {
    records: GameRecord[];
    // The signed-in player's username, used to work out which side is "you".
    username: string;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onRewatch?: (record: GameRecord) => void;
    onBack: () => void;
};

const GameRecordsPage = ({ onBack, ...listProps }: GameRecordsPageProps) => {
    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <button type="button" className={styles.back} onClick={onBack}>
                    Back home
                </button>
                <h1 className={styles.title}>Game Records</h1>
            </header>
            <div className={styles.tray}>
                <GameRecordsList {...listProps} />
            </div>
        </main>
    );
};

export default GameRecordsPage;