import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginUserForm from "@/components/LoginUserForm";
import { logIn } from "@/sessions";

// Replace the real network calls with test doubles.
vi.mock("@/sessions", () => ({ logIn: vi.fn() }));
const mockedLogIn = vi.mocked(logIn);

const SIGNED_IN = {
  ok: true as const,
  status: 200,
  data: {
    userId: "user-1",
    username: "player_one",
    sessionId: "session-abc",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  },
};

const usernameField = () => screen.getByLabelText(/^Username/);
const passwordField = () => screen.getByLabelText(/^Password/);
const submitButton = () => screen.getByRole("button", { name: "Login" });

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(usernameField(), "player_one");
  await user.type(passwordField(), "Passw0rd!");
  await user.click(submitButton());
};

describe("LoginUserForm", () => {
  beforeEach(() => {
    mockedLogIn.mockReset();
  });

  it("has labeled username and password fields", () => {
    render(<LoginUserForm onSuccess={vi.fn()} />);
    expect(usernameField()).toBeInTheDocument();
    expect(passwordField()).toHaveAttribute("type", "password");
  });

  it("sends sign in once with what the player entered", async () => {
    const user = userEvent.setup();
    mockedLogIn.mockResolvedValue(SIGNED_IN);
    render(<LoginUserForm onSuccess={vi.fn()} />);

    await fillAndSubmit(user);

    expect(mockedLogIn).toHaveBeenCalledTimes(1);
    expect(mockedLogIn).toHaveBeenCalledWith({
      username: "player_one",
      password: "Passw0rd!",
    });
  });

  it("sends nothing when a field is empty, shows a message, and moves focus to it", async () => {
    const user = userEvent.setup();
    render(<LoginUserForm onSuccess={vi.fn()} />);

    await user.type(usernameField(), "player_one");
    await user.click(submitButton());

    expect(mockedLogIn).not.toHaveBeenCalled();
    expect(screen.getByText("Enter your username and password.")).toBeInTheDocument();
    expect(passwordField()).toHaveFocus();
  });

  it("shows the server's message and clears the password after wrong details", async () => {
    const user = userEvent.setup();
    mockedLogIn.mockResolvedValue({
      ok: false,
      status: 401,
      data: { error: "Incorrect username or password." },
    });
    render(<LoginUserForm onSuccess={vi.fn()} />);

    await fillAndSubmit(user);

    expect(await screen.findByText("Incorrect username or password.")).toBeInTheDocument();
    expect(passwordField()).toHaveValue("");
    expect(usernameField()).toHaveValue("player_one");
  });

  it("tells the app when sign in succeeds", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockedLogIn.mockResolvedValue(SIGNED_IN);
    render(<LoginUserForm onSuccess={onSuccess} />);

    await fillAndSubmit(user);

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("locks the fields and button while the request is running", async () => {
    const user = userEvent.setup();
    let finish: (value: typeof SIGNED_IN) => void = () => {};
    mockedLogIn.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<LoginUserForm onSuccess={vi.fn()} />);

    await fillAndSubmit(user);

    expect(usernameField()).toBeDisabled();
    expect(passwordField()).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();

    finish(SIGNED_IN);
  });

  it("shows a connection message when the server can't be reached", async () => {
    const user = userEvent.setup();
    mockedLogIn.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<LoginUserForm onSuccess={vi.fn()} />);

    await fillAndSubmit(user);

    expect(await screen.findByText(/Couldn't reach the server/)).toBeInTheDocument();
  });
});
