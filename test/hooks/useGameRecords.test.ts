import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { GameId, GameRecord } from "checkers-shared-types";
import { useGameRecords } from "@/hooks/useGameRecords";
import { loadGameRecords } from "@/gameRecords";

vi.mock("@/gameRecords", () => ({ loadGameRecords: vi.fn() }));

const RECORD = { gameId: "g1" as GameId } as GameRecord;

beforeEach(() => {
  vi.mocked(loadGameRecords).mockReset();
});

describe("useGameRecords", () => {
  it("is loading until the records arrive", async () => {
    // Arrange
    vi.mocked(loadGameRecords).mockResolvedValue({ ok: true, records: [RECORD] });
    // Act
    const { result } = renderHook(() => useGameRecords());
    // Assert
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.records).toEqual([RECORD]);
    expect(result.current.error).toBeNull();
  });

  it("shows the error, then loads again on retry", async () => {
    // Arrange
    vi.mocked(loadGameRecords)
      .mockResolvedValueOnce({ ok: false, error: "Server error." })
      .mockResolvedValueOnce({ ok: true, records: [RECORD] });
    const { result } = renderHook(() => useGameRecords());
    await waitFor(() => expect(result.current.error).toBe("Server error."));
    // Act
    act(() => result.current.retry());
    // Assert
    await waitFor(() => expect(result.current.records).toEqual([RECORD]));
    expect(result.current.error).toBeNull();
    expect(loadGameRecords).toHaveBeenCalledTimes(2);
  });
});
