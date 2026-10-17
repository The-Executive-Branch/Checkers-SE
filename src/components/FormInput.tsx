// REACT
import type { ComponentProps } from "react";
// STYLES
import styles from "../styles/FormInput.module.css";

interface FormInputProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  errorMessage?: string;
}

const FormInput = ({
  id,
  value,
  label,
  required,
  errorMessage,
  ...otherProps
}: FormInputProps) => {
  const errorId = `${id}-error`;
  const shrinkLabel = String(value ?? "").length > 0;

  return (
    <div className={styles.container}>
      <input
        id={id}
        value={value}
        required={required}
        {...otherProps}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
      />
      <label htmlFor={id} className={shrinkLabel ? styles.shrink : undefined}>
        {label}
        {required && <span className={styles["required-indicator"]}>*</span>}
      </label>
      <p
        id={errorId}
        className={`${styles["error-message"]} ${
          errorMessage ? styles.active : ""
        }`}
        role="alert"
      >
        {errorMessage}
      </p>
    </div>
  );
};

export default FormInput;
