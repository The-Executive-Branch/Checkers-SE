import type { GameRecord } from "checkers-shared-types";
import CustomButton from "./CustomButton";
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
                <CustomButton variant="secondary" handleClick={onBack}>
                    Back to game
                </CustomButton>
                <h1 className={styles.title}>Game Records</h1>
            </header>
            <GameRecordsList {...listProps} />
        </main>
    );
};

export default GameRecordsPage;