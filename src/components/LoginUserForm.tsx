import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { logIn } from "@/sessions";
import FormInput from "./FormInput";
import CustomButton from "./CustomButton";
import styles from "../styles/UserAccessForm.module.css";

type FormInputs = {
  username: string;
  password: string;
};

const INITIAL_INPUTS = {
  username: "",
  password: "",
};

type LoginUserFormProps = {
  onSuccess: () => void;
};

const LoginUserForm = ({ onSuccess }: LoginUserFormProps) => {
  const [inputs, setInputs] = useState<FormInputs>(INITIAL_INPUTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    setInputs((prevState) => ({ ...prevState, [target.name]: target.value }));
  };
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    if (!inputs.username.trim() || !inputs.password.trim()) {
      setFormError("Enter your username and password.");
      const emptyField = inputs.username.trim() ? passwordRef : usernameRef;
      emptyField.current?.focus();
      return;
    }

    setIsLoading(true);
    setFormError("");

    try {
      const { username, password } = inputs;
      const response = await logIn({ username, password });
      if (response.ok) {
        onSuccess();
        return;
      }

      const { error } = response.data;
      setFormError(error);
      setInputs((prevState) => ({ ...prevState, password: "" }));
    } catch {
      setFormError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header>
        <h1>Welcome back!</h1>
      </header>
      <fieldset disabled={isLoading} className={styles.fields}>
        <FormInput
          ref={usernameRef}
          label="Username"
          id="usernameInput"
          name="username"
          value={inputs.username}
          onChange={handleInputChange}
          required
        />
        <FormInput
          label="Password"
          id="passwordInput"
          name="password"
          type="password"
          ref={passwordRef}
          value={inputs.password}
          onChange={handleInputChange}
          required
        />
      </fieldset>
      <footer>
        <p className={styles["form-error"]} role="alert">
          {formError}
        </p>
        <CustomButton
          className={styles["form-button"]}
          isLoading={isLoading}
          type="submit"
        >
          Login
        </CustomButton>
      </footer>
    </form>
  );
};

export default LoginUserForm;
