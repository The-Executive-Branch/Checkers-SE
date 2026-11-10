import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameId, GameRecord } from "checkers-shared-types";
import GameRecordsPage from "@/components/GameRecordsPage";

// Node 25+ has its own experimental localStorage, which hides jsdom's. The
// shared test setup calls localStorage.clear() after every test, so give these
// tests a working one. (These components don't use localStorage themselves.)
beforeEach(() => {
    vi.stubGlobal("localStorage", { clear: () => { } });
});

const RECORD: GameRecord = {
    gameId: "game-1" as GameId,
    players: {
        red: { kind: "user", username: "player_one" },
        black: { kind: "guest", name: "Gary" },
    },
    winner: "red",
    moves: [],
    endedAt: "2026-10-20T12:00:00.000Z",
};

const renderPage = (props = {}) =>
    render(
        <GameRecordsPage
            records={[RECORD]}
            username="player_one"
            onBack={vi.fn()}
            {...props}
        />,
    );

describe("GameRecordsPage", () => {
    it("shows the page heading", () => {
        renderPage();
        expect(
            screen.getByRole("heading", { level: 1, name: "Game Records" }),
        ).toBeInTheDocument();
    });

    it("shows the player's games", () => {
        renderPage();
        expect(screen.getByRole("table", { name: "Game records" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "Gary" })).toBeInTheDocument();
    });

    it("goes back when the back button is clicked", async () => {
        const onBack = vi.fn();
        renderPage({ onBack });

        await userEvent.click(screen.getByRole("button", { name: "Back home" }));

        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("shows the loading state instead of the table", () => {
        renderPage({ isLoading: true });
        expect(screen.getByRole("status")).toHaveTextContent("Loading your games…");
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("passes the retry handler to the list when loading fails", async () => {
        const onRetry = vi.fn();
        renderPage({ records: [], error: "Could not load games.", onRetry });

        await userEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("passes the rewatch handler to the list", async () => {
        const onRewatch = vi.fn();
        renderPage({ onRewatch });

        await userEvent.click(
            screen.getByRole("button", { name: "Rewatch game against Gary" }),
        );

        expect(onRewatch).toHaveBeenCalledWith(RECORD);
    });
});