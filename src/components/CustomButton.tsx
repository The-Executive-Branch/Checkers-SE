import type { MouseEventHandler, ReactNode } from "react";
import styles from "../styles/CustomButton.module.css";

type CustomButtonProps = {
  className?: string;
  disabled?: boolean;
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  type?: "submit" | "button";
  variant?: "primary" | "secondary" | "danger";
  handleClick?: MouseEventHandler<HTMLButtonElement>;
};

const CustomButton = ({
  children,
  className = "",
  type = "button",
  variant = "primary",
  disabled = false,
  isLoading = false,
  loadingText = "In Progress…",
  handleClick,
}: CustomButtonProps) => {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      onClick={handleClick}
    >
      {isLoading ? loadingText : children}
    </button>
  );
};

export default CustomButton;
