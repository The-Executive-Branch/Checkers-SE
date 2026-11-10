import { useCallback, useEffect, useState } from "react";
import type { GameRecord } from "checkers-shared-types";
import { loadGameRecords } from "../gameRecords";

// Loads the player's game records when the screen opens, and again on retry.
export const useGameRecords = () => {
    const [records, setRecords] = useState<GameRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        // Ignores a response that arrives after the screen has closed.
        let isCurrent = true;
        setIsLoading(true);
        setError(null);

        loadGameRecords().then((result) => {
            if (!isCurrent) return;
            if (result.ok) setRecords(result.records);
            else setError(result.error);
            setIsLoading(false);
        });

        return () => {
            isCurrent = false;
        };
    }, [attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return { records, isLoading, error, retry };
};