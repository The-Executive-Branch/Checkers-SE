import styles from "../styles/Checker.module.css";

export type CheckerColor = "red" | "black";

type CheckerProps = {
  color: CheckerColor;
  isKing?: boolean;
  isSelected?: boolean;
  isJumped?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onRemoved?: () => void;
};

const Checker = ({
  color,
  isKing = false,
  isSelected = false,
  isJumped = false,
  disabled = false,
  onSelect,
  onRemoved,
}: CheckerProps) => {
  const className = [
    styles.checker,
    styles[color],
    isSelected && styles.selected,
    isJumped && styles.jumped,
  ]
    .filter(Boolean)
    .join(" ");

  const handleAnimationEnd = () => {
    if (isJumped) onRemoved?.();
  };

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || isJumped}
      aria-pressed={isSelected}
      aria-label={`${color}${isKing ? " king" : ""} checker`}
      onClick={onSelect}
      onAnimationEnd={handleAnimationEnd}
    >
      {isKing && (
        <span className={styles.crown} aria-hidden="true">
          ♛
        </span>
      )}
    </button>
  );
};

export default Checker;
