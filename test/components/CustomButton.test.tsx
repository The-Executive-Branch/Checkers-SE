import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomButton from "@/components/CustomButton";

describe("CustomButton", () => {
  it("renders a button showing its content", () => {
    render(<CustomButton>Login</CustomButton>);
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("calls handleClick once per click or keyboard press", async () => {
    const handleClick = vi.fn();
    render(<CustomButton handleClick={handleClick}>Login</CustomButton>);
    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);

    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("does not call handleClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <CustomButton disabled handleClick={handleClick}>
        Login
      </CustomButton>,
    );
    const button = screen.getByRole("button");

    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it("does not call handleClick while loading, and is marked busy", async () => {
    const handleClick = vi.fn();
    render(
      <CustomButton isLoading loadingText="Processing..." handleClick={handleClick}>
        Register
      </CustomButton>,
    );
    const button = screen.getByRole("button");

    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Processing...");
  });

  it('defaults to type "button" and accepts type "submit"', () => {
    const { rerender } = render(<CustomButton>Go</CustomButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");

    rerender(<CustomButton type="submit">Go</CustomButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it.each(["primary", "secondary", "danger"] as const)(
    'marks the "%s" variant with its own class',
    (variant) => {
      render(<CustomButton variant={variant}>Go</CustomButton>);
      expect(screen.getByRole("button")).toHaveClass(variant);
    },
  );
});
