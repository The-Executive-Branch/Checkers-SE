import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameId, GameRecord } from "checkers-shared-types";
import GameRecordsListItem from "@/components/GameRecordsListItem";

const RECORD: GameRecord = {
    gameId: "game-1" as GameId,
    players: {
        red: { kind: "user", username: "player_one" },
        black: { kind: "user", username: "player_two" },
    },
    winner: "red",
    moves: [],
    endedAt: "2026-10-20T12:00:00.000Z",
};

// A table row must live inside a table body to be valid markup.
const renderItem = (
    record: GameRecord = RECORD,
    username = "player_one",
    onRewatch?: (record: GameRecord) => void,
) =>
    render(
        <table>
            <tbody>
                <GameRecordsListItem
                    record={record}
                    username={username}
                    onRewatch={onRewatch}
                />
            </tbody>
        </table>,
    );

beforeEach(() => {
    vi.stubGlobal("localStorage", { clear: () => { } });
});

describe("GameRecordsListItem", () => {
    it("renders as a table row", () => {
        renderItem();
        expect(screen.getByRole("row")).toBeInTheDocument();
    });

    it("shows the signed-in player and their opponent", () => {
        renderItem();
        expect(
            screen.getByRole("rowheader", { name: "player_one" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "player_two" })).toBeInTheDocument();
    });

    it("shows a win when the signed-in player's side won", () => {
        renderItem({ ...RECORD, winner: "red" });
        expect(screen.getByText("W")).toBeInTheDocument();
        // The full word is available to screen readers, not just the color.
        expect(screen.getByText("Win").parentElement).toHaveClass("win");
    });

    it("shows a loss when the other side won", () => {
        renderItem({ ...RECORD, winner: "black" });
        expect(screen.getByText("L")).toBeInTheDocument();
        expect(screen.getByText("Loss").parentElement).toHaveClass("loss");
    });

    it("works out the result from the black side too", () => {
        renderItem({ ...RECORD, winner: "black" }, "player_two");
        expect(
            screen.getByRole("rowheader", { name: "player_two" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "player_one" })).toBeInTheDocument();
        expect(screen.getByText("Win")).toBeInTheDocument();
    });

    it("shows a guest by name", () => {
        renderItem({
            ...RECORD,
            players: {
                red: { kind: "user", username: "player_one" },
                black: { kind: "guest", name: "Guest Gary" },
            },
        });
        expect(screen.getByRole("cell", { name: "Guest Gary" })).toBeInTheDocument();
    });

    it("treats the red player as you when no username matches", () => {
        renderItem(RECORD, "someone_else");
        expect(
            screen.getByRole("rowheader", { name: "player_one" }),
        ).toBeInTheDocument();
    });

    it("names the rewatch button after the opponent", () => {
        renderItem(RECORD, "player_one", vi.fn());
        expect(
            screen.getByRole("button", { name: "Rewatch game against player_two" }),
        ).toBeEnabled();
    });

    it("calls onRewatch with the full record when rewatch is clicked", async () => {
        const onRewatch = vi.fn();
        renderItem(RECORD, "player_one", onRewatch);

        await userEvent.click(screen.getByRole("button"));

        expect(onRewatch).toHaveBeenCalledTimes(1);
        expect(onRewatch).toHaveBeenCalledWith(RECORD);
    });

    it("disables the rewatch button when there is no handler", () => {
        renderItem();
        expect(screen.getByRole("button")).toBeDisabled();
    });
});