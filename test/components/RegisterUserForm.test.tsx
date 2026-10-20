import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterUserForm from "@/components/RegisterUserForm";
import { registerUser, request } from "@/sessions";

// Replace the real network calls with test doubles.
vi.mock("@/sessions", () => ({ registerUser: vi.fn(), request: vi.fn() }));
const mockedRegisterUser = vi.mocked(registerUser);
const mockedRequest = vi.mocked(request);

const VALID = {
  email: "player@example.com",
  username: "player_one",
  password: "Passw0rd!",
};

const REGISTERED = {
  ok: true as const,
  status: 201,
  data: {
    userId: "user-1",
    username: VALID.username,
    sessionId: "session-abc",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  },
};

const availability = (available: boolean) => ({
  ok: true as const,
  status: 200,
  data: { available },
});

const field = {
  email: () => screen.getByLabelText(/^Email/),
  username: () => screen.getByLabelText(/^Username/),
  password: () => screen.getByLabelText(/^Password/),
  confirmPassword: () => screen.getByLabelText(/^Confirm Password/),
};
const submitButton = () => screen.getByRole("button", { name: "Register" });

type User = ReturnType<typeof userEvent.setup>;

const fillForm = async (user: User, confirmPassword = VALID.password) => {
  await user.type(field.email(), VALID.email);
  await user.type(field.username(), VALID.username);
  await user.type(field.password(), VALID.password);
  await user.type(field.confirmPassword(), confirmPassword);
};

describe("RegisterUserForm", () => {
  beforeEach(() => {
    mockedRegisterUser.mockReset();
    mockedRequest.mockReset();
    mockedRequest.mockResolvedValue(availability(true));
  });

  it("has labeled email, username, password, and confirm password fields", () => {
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    expect(field.email()).toHaveAttribute("type", "email");
    expect(field.username()).toBeInTheDocument();
    expect(field.password()).toHaveAttribute("type", "password");
    expect(field.confirmPassword()).toHaveAttribute("type", "password");
  });

  it("sends registration once with what the player entered", async () => {
    const user = userEvent.setup();
    mockedRegisterUser.mockResolvedValue(REGISTERED);
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await fillForm(user);
    await user.click(submitButton());

    expect(mockedRegisterUser).toHaveBeenCalledTimes(1);
    expect(mockedRegisterUser).toHaveBeenCalledWith(VALID);
  });

  it("sends nothing when a field is empty, shows a message beside it, and moves focus to it", async () => {
    const user = userEvent.setup();
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await user.click(submitButton());

    expect(mockedRegisterUser).not.toHaveBeenCalled();
    expect(field.email()).toHaveAccessibleDescription("Email is required.");
    expect(field.email()).toHaveFocus();
  });

  it("sends nothing when the confirmation doesn't match", async () => {
    const user = userEvent.setup();
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await fillForm(user, "Different1!");
    await user.click(submitButton());

    expect(mockedRegisterUser).not.toHaveBeenCalled();
    expect(field.confirmPassword()).toHaveAccessibleDescription("Passwords must match.");
  });

  it("says the username is taken when the player leaves the field", async () => {
    const user = userEvent.setup();
    mockedRequest.mockResolvedValue(availability(false));
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await user.type(field.username(), "taken_name");
    await user.tab();

    expect(await screen.findByText(/That username is taken/)).toBeInTheDocument();
  });

  it("shows nothing when the username is free", async () => {
    const user = userEvent.setup();
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await user.type(field.username(), "free_name");
    await user.tab();

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(field.username()).not.toHaveAttribute("aria-invalid");
  });

  it("shows the rule and doesn't ask the server when the username breaks the rules", async () => {
    const user = userEvent.setup();
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await user.type(field.username(), "ab");
    await user.tab();

    expect(field.username()).toHaveAccessibleDescription(
      "Use 3 to 20 letters, numbers, or underscores.",
    );
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("shows a server error beside the field it names", async () => {
    const user = userEvent.setup();
    mockedRegisterUser.mockResolvedValue({
      ok: false,
      status: 409,
      data: { error: "That email is already registered.", field: "email" },
    });
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await fillForm(user);
    await user.click(submitButton());

    expect(field.email()).toHaveAccessibleDescription("That email is already registered.");
  });

  it("shows a server error that names no field in the form's general message area", async () => {
    const user = userEvent.setup();
    mockedRegisterUser.mockResolvedValue({
      ok: false,
      status: 500,
      data: { error: "Something went wrong." },
    });
    render(<RegisterUserForm onSuccess={vi.fn()} />);

    await fillForm(user);
    await user.click(submitButton());

    expect(await screen.findByText("Something went wrong.")).toBeInTheDocument();
  });

  it("tells the app when registration succeeds", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockedRegisterUser.mockResolvedValue(REGISTERED);
    render(<RegisterUserForm onSuccess={onSuccess} />);

    await fillForm(user);
    await user.click(submitButton());

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
