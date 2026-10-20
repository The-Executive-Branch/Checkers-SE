import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Checker from "@/components/Checker";

describe("Checker", () => {
  it("shows the piece's color in its label", () => {
    render(<Checker color="red" />);
    expect(screen.getByRole("button", { name: "red checker" })).toBeInTheDocument();
  });

  it("shows a crown for a king", () => {
    render(<Checker color="black" isKing />);
    const checker = screen.getByRole("button", { name: "black king checker" });
    expect(checker).toHaveTextContent("♛");
  });

  it("calls onSelect when clicked", async () => {
    const onSelect = vi.fn();
    render(<Checker color="red" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not call onSelect when disabled", async () => {
    const onSelect = vi.fn();
    render(<Checker color="red" disabled onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("marks a selected piece as pressed", () => {
    render(<Checker color="red" isSelected />);
    const checker = screen.getByRole("button");
    expect(checker).toHaveAttribute("aria-pressed", "true");
    expect(checker).toHaveClass("selected");
  });

  it("plays the capture animation and calls onRemoved when it finishes", () => {
    const onRemoved = vi.fn();
    render(<Checker color="black" isJumped onRemoved={onRemoved} />);
    const checker = screen.getByRole("button");

    expect(checker).toHaveClass("jumped");
    expect(checker).toBeDisabled();

    fireEvent.animationEnd(checker);
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it("does not call onRemoved when an animation ends on a piece that wasn't jumped", () => {
    const onRemoved = vi.fn();
    render(<Checker color="black" onRemoved={onRemoved} />);

    fireEvent.animationEnd(screen.getByRole("button"));

    expect(onRemoved).not.toHaveBeenCalled();
  });
});
