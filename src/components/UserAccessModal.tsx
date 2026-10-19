import { useEffect, useRef, useState } from "react";
import LoginUserForm from "./LoginUserForm";
import RegisterUserForm from "./RegisterUserForm";
import styles from "../styles/UserAccessModal.module.css";

type Mode = "login" | "register";

type UserAccessModalProps = {
  isOpen: boolean;
  onSuccess: () => void;
};

const UserAccessModal = ({ isOpen, onSuccess }: UserAccessModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("register");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const isLogin = mode === "login";

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      onCancel={(event) => event.preventDefault()}
    >
      {isLogin ? (
        <LoginUserForm onSuccess={onSuccess} />
      ) : (
        <RegisterUserForm onSuccess={onSuccess} />
      )}
      <p className={styles.switch}>
        {isLogin ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          className={styles["switch-button"]}
          onClick={() => setMode(isLogin ? "register" : "login")}
        >
          {isLogin ? "Create an account" : "Sign in"}
        </button>
      </p>
    </dialog>
  );
};

export default UserAccessModal;
