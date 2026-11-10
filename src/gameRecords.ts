import type { GameRecord, GetGameRecordsResponse } from "checkers-shared-types";
import { GAME_ROUTES } from "./constants";
import { get } from "./sessions";

export type LoadRecordsResult =
    | { ok: true; records: GameRecord[] }
    | { ok: false; error: string };

const LOAD_FAILED = "Couldn't load your games. Check your connection and try again.";

// Loads every finished game the signed-in player played, newest first.
export const loadGameRecords = async (): Promise<LoadRecordsResult> => {
    try {
        const response = await get<GetGameRecordsResponse>(GAME_ROUTES.LIST);
        if (!response.ok) return { ok: false, error: response.data?.error ?? LOAD_FAILED };
        // The shared type allows one record or a list; the list route sends a list.
        const { data } = response.data;
        return { ok: true, records: Array.isArray(data) ? data : [data] };
    } catch {
        // fetch throws when the server can't be reached at all.
        return { ok: false, error: LOAD_FAILED };
    }
};