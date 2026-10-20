import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserAccessModal from "@/components/UserAccessModal";
import { logIn, registerUser, request } from "@/sessions";

// Replace the real network calls with test doubles.
vi.mock("@/sessions", () => ({
  logIn: vi.fn(),
  registerUser: vi.fn(),
  request: vi.fn(),
}));

const SESSION = {
  ok: true as const,
  status: 200,
  data: {
    userId: "user-1",
    username: "player_one",
    sessionId: "session-abc",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  },
};

const dialog = (container: HTMLElement) => container.querySelector("dialog")!;

describe("UserAccessModal", () => {
  beforeEach(() => {
    vi.mocked(logIn).mockReset().mockResolvedValue(SESSION);
    vi.mocked(registerUser).mockReset().mockResolvedValue(SESSION);
    vi.mocked(request)
      .mockReset()
      .mockResolvedValue({ ok: true, status: 200, data: { available: true } });
  });

  it("stays closed when set to closed", () => {
    const { container } = render(<UserAccessModal isOpen={false} onSuccess={vi.fn()} />);
    expect(dialog(container)).not.toHaveAttribute("open");
  });

  it("opens on the registration form when set to open", () => {
    const { container } = render(<UserAccessModal isOpen onSuccess={vi.fn()} />);

    expect(dialog(container)).toHaveAttribute("open");
    expect(
      screen.getByRole("heading", { name: "We're happy you decided to join us!" }),
    ).toBeInTheDocument();
  });

  it("switches between the registration and sign in forms", async () => {
    const user = userEvent.setup();
    render(<UserAccessModal isOpen onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("heading", { name: "Welcome back!" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    expect(
      screen.getByRole("heading", { name: "We're happy you decided to join us!" }),
    ).toBeInTheDocument();
  });

  it("stays open when the player presses Escape", () => {
    const { container } = render(<UserAccessModal isOpen onSuccess={vi.fn()} />);
    // Pressing Escape on an open dialog fires a "cancel" event.
    const cancel = new Event("cancel", { cancelable: true });

    fireEvent(dialog(container), cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog(container)).toHaveAttribute("open");
  });

  it("closes when the app sets it to closed", () => {
    const { container, rerender } = render(<UserAccessModal isOpen onSuccess={vi.fn()} />);

    rerender(<UserAccessModal isOpen={false} onSuccess={vi.fn()} />);

    expect(dialog(container)).not.toHaveAttribute("open");
  });

  it("tells the app when the player signs in", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<UserAccessModal isOpen onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.type(screen.getByLabelText(/^Username/), "player_one");
    await user.type(screen.getByLabelText(/^Password/), "Passw0rd!");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("tells the app when the player registers", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<UserAccessModal isOpen onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/^Email/), "player@example.com");
    await user.type(screen.getByLabelText(/^Username/), "player_one");
    await user.type(screen.getByLabelText(/^Password/), "Passw0rd!");
    await user.type(screen.getByLabelText(/^Confirm Password/), "Passw0rd!");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
