import { describe, expect, it, vi } from "vitest";
import type { UserAccessResponse } from "checkers-shared-types";
import { AUTH_ROUTES } from "@/constants";
import { loadSession, logIn, logOut, request } from "@/sessions";

const DAY_MS = 24 * 60 * 60 * 1000;

const session = (expiresInMs = 7 * DAY_MS): UserAccessResponse => ({
  userId: "user-1",
  username: "player_one",
  sessionId: "session-abc",
  expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
});

const saveSessionDirectly = (value: UserAccessResponse) =>
  localStorage.setItem("session", JSON.stringify(value));

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mockFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn<typeof fetch>();
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const sentHeaders = (fetchMock: ReturnType<typeof mockFetch>, call = 0) =>
  fetchMock.mock.calls[call][1]?.headers as Record<string, string>;

describe("client session module", () => {
  it("sends the saved session as a Bearer token after signing in", async () => {
    const signedIn = session();
    const fetchMock = mockFetch(
      jsonResponse(200, signedIn),
      jsonResponse(200, { available: true }),
    );

    await logIn({ username: "player_one", password: "Passw0rd!" });
    await request(AUTH_ROUTES.USERNAME_AVAILABILITY, { username: "someone" });

    expect(sentHeaders(fetchMock, 1).Authorization).toBe("Bearer session-abc");
  });

  it("sends no Authorization header when there is no saved session", async () => {
    const fetchMock = mockFetch(jsonResponse(200, { available: true }));

    await request(AUTH_ROUTES.USERNAME_AVAILABILITY, { username: "someone" });

    expect(sentHeaders(fetchMock)).not.toHaveProperty("Authorization");
  });

  it("erases an expired session when the app loads it", () => {
    saveSessionDirectly(session(-DAY_MS));

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem("session")).toBeNull();
  });

  it("erases the saved session when the server answers 401", async () => {
    saveSessionDirectly(session());
    mockFetch(jsonResponse(401, { error: "Unauthorized" }));

    const response = await request(AUTH_ROUTES.USERNAME_AVAILABILITY, {
      username: "someone",
    });

    expect(response.status).toBe(401);
    expect(localStorage.getItem("session")).toBeNull();
  });

  it("still signs out on this device when the server can't be reached", async () => {
    saveSessionDirectly(session());
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(logOut()).rejects.toThrow("Failed to fetch");

    expect(localStorage.getItem("session")).toBeNull();
  });

  it("keeps a valid session across app restarts", () => {
    const saved = session();
    saveSessionDirectly(saved);

    expect(loadSession()).toEqual(saved);
  });

  it("erases a saved session that can't be read", () => {
    localStorage.setItem("session", "not json");

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem("session")).toBeNull();
  });
});
