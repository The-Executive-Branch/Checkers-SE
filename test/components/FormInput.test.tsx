import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FormInput from "@/components/FormInput";

describe("FormInput", () => {
  it("connects the label to the input", () => {
    render(<FormInput id="usernameInput" label="Username" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Username")).toHaveAttribute("id", "usernameInput");
  });

  it("shows a required marker", () => {
    render(<FormInput id="emailInput" label="Email" required value="" onChange={() => {}} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("marks the input invalid and links it to the error message, which is announced", () => {
    render(
      <FormInput
        id="emailInput"
        label="Email"
        value=""
        onChange={() => {}}
        errorMessage="Email is required."
      />,
    );
    const input = screen.getByLabelText("Email");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Email is required.");
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required.");
  });

  it("is not marked invalid when there is no error", () => {
    render(<FormInput id="emailInput" label="Email" value="" onChange={() => {}} />);
    const input = screen.getByLabelText("Email");

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });
});
