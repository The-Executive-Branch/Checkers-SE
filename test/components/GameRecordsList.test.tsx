import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameId, GameRecord } from "checkers-shared-types";
import GameRecordsList from "@/components/GameRecordsList";

const makeRecord = (overrides: Partial<GameRecord> = {}): GameRecord => ({
    gameId: "game-1" as GameId,
    players: {
        red: { kind: "user", username: "player_one" },
        black: { kind: "user", username: "player_two" },
    },
    winner: "red",
    moves: [],
    endedAt: "2026-10-20T12:00:00.000Z",
    ...overrides,
});

const against = (name: string): GameRecord["players"] => ({
    red: { kind: "user", username: "player_one" },
    black: { kind: "user", username: name },
});

const renderList = (records: GameRecord[], props = {}) =>
    render(<GameRecordsList records={records} username="player_one" {...props} />);

// Every row except the header row.
const bodyRows = () => screen.getAllByRole("row").slice(1);

beforeEach(() => {
    vi.stubGlobal("localStorage", { clear: () => { } });
});

describe("GameRecordsList", () => {
    it("shows a table with the four column headers", () => {
        renderList([makeRecord()]);

        const table = screen.getByRole("table", { name: "Game records" });
        const headers = within(table).getAllByRole("columnheader");
        expect(headers.map((header) => header.textContent)).toEqual([
            "You",
            "Result",
            "Opponent",
            "Rewatch",
        ]);
    });

    it("shows one row per record", () => {
        renderList([
            makeRecord({ gameId: "a" as GameId }),
            makeRecord({ gameId: "b" as GameId }),
            makeRecord({ gameId: "c" as GameId }),
        ]);
        expect(bodyRows()).toHaveLength(3);
    });

    it("lists the most recent game first", () => {
        renderList([
            makeRecord({
                gameId: "old" as GameId,
                players: against("oldest"),
                endedAt: "2026-10-01T12:00:00Z",
            }),
            makeRecord({
                gameId: "new" as GameId,
                players: against("newest"),
                endedAt: "2026-10-20T12:00:00Z",
            }),
            makeRecord({
                gameId: "mid" as GameId,
                players: against("middle"),
                endedAt: "2026-10-10T12:00:00Z",
            }),
        ]);

        const rows = bodyRows();
        expect(rows[0]).toHaveTextContent("newest");
        expect(rows[1]).toHaveTextContent("middle");
        expect(rows[2]).toHaveTextContent("oldest");
    });

    it("puts games without an end time last", () => {
        renderList([
            makeRecord({
                gameId: "none" as GameId,
                players: against("undated"),
                endedAt: undefined,
            }),
            makeRecord({
                gameId: "dated" as GameId,
                players: against("dated"),
                endedAt: "2026-10-20T12:00:00Z",
            }),
        ]);

        expect(bodyRows()[0]).toHaveTextContent("dated");
        expect(bodyRows()[1]).toHaveTextContent("undated");
    });

    it("does not mutate the records it was given", () => {
        const records = [
            makeRecord({ gameId: "old" as GameId, endedAt: "2026-10-01T12:00:00Z" }),
            makeRecord({ gameId: "new" as GameId, endedAt: "2026-10-20T12:00:00Z" }),
        ];
        renderList(records);
        expect(records.map((r) => r.gameId)).toEqual(["old", "new"]);
    });

    it("passes the clicked record to onRewatch", async () => {
        const onRewatch = vi.fn();
        const records = [
            makeRecord({
                gameId: "a" as GameId,
                players: against("first"),
                endedAt: "2026-10-01T12:00:00Z",
            }),
            makeRecord({
                gameId: "b" as GameId,
                players: against("second"),
                endedAt: "2026-10-20T12:00:00Z",
            }),
        ];
        renderList(records, { onRewatch });

        await userEvent.click(
            screen.getByRole("button", { name: "Rewatch game against first" }),
        );

        expect(onRewatch).toHaveBeenCalledWith(records[0]);
    });

    it("shows an empty state when there are no records", () => {
        renderList([]);
        expect(screen.getByText("No games yet")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("shows a loading message instead of the table while loading", () => {
        renderList([makeRecord()], { isLoading: true });
        expect(screen.getByRole("status")).toHaveTextContent("Loading your games…");
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("shows the error and calls onRetry when retry is clicked", async () => {
        const onRetry = vi.fn();
        renderList([], { error: "Could not load games.", onRetry });

        expect(screen.getByRole("alert")).toHaveTextContent("Could not load games.");
        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("omits the retry button when no handler is given", () => {
        renderList([], { error: "Could not load games." });
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("prefers the error over the empty state", () => {
        renderList([], { error: "Could not load games." });
        expect(screen.queryByText("No games yet")).not.toBeInTheDocument();
    });
});