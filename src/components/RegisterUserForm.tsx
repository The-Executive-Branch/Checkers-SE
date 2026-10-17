import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type SubmitEvent,
} from "react";
import type { UsernameAvailabilityResponse } from "checkers-shared-types";
import CustomButton from "./CustomButton";
import { AUTH_ROUTES } from "@/constants";
import { registerUser, request } from "@/sessions";
import FormInput from "./FormInput";
import styles from "../styles/UserAccessForm.module.css";

interface RegistrationInputs {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_INPUTS: RegistrationInputs = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

type RegisterUserFormProps = {
  onSuccess: () => void;
};

const RegisterUserForm = ({ onSuccess }: RegisterUserFormProps) => {
  // Input Control
  const [inputs, setInputs] = useState<RegistrationInputs>(INITIAL_INPUTS);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;

    setValidationMessage((prevState) => ({
      ...prevState,
      [target.name]: "",
    }));

    if (target.name === "username") {
      lastCheckedUsername.current = "";
    }

    setInputs((prevState) => ({ ...prevState, [target.name]: target.value }));
  };

  // Focus Control
  const emailRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    emailRef?.current?.focus();
  }, []);

  // Input Validation
  const isPasswordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/.test(
      inputs.password,
    );

  const [validationMessage, setValidationMessage] = useState<{
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }>({ email: "", username: "", password: "", confirmPassword: "" });

  const checkEmailValidation = (event: FocusEvent<HTMLInputElement>) => {
    const { validity } = event.currentTarget;
    const message = validity.valueMissing
      ? "Email is required."
      : validity.typeMismatch
        ? "Enter a valid email address, like name@example.com."
        : "";
    setValidationMessage((prev) => ({ ...prev, email: message }));
  };

  const checkPasswordValidation = () => {
    inputs.password.length && isPasswordValid
      ? setValidationMessage((prevState) => ({ ...prevState, password: "" }))
      : setValidationMessage((prevState) => ({
          ...prevState,
          password:
            "Password must include uppercase and lowercase letters, a number, and a special character.",
        }));
  };

  const doPasswordsMatch = inputs.password === inputs.confirmPassword;

  const comparePasswords = () => {
    if (!inputs.confirmPassword.length) return;

    if (inputs.password !== inputs.confirmPassword)
      setValidationMessage((prevState) => ({
        ...prevState,
        confirmPassword: "Passwords must match.",
      }));
    else
      setValidationMessage((prevState) => ({
        ...prevState,
        confirmPassword: "",
      }));
  };

  // Username Availability
  const isUsernameAvailable = async (username: string) => {
    const response = await request<UsernameAvailabilityResponse>(
      AUTH_ROUTES.USERNAME_AVAILABILITY,
      { username },
    );

    if (response.ok) {
      return response.data.available;
    }
  };

  const lastCheckedUsername = useRef("");
  const latestUsername = useRef("");
  latestUsername.current = inputs.username;

  const checkUsernameAvailability = async () => {
    const username = inputs.username;

    if (!/^\w{3,20}$/.test(username)) {
      setValidationMessage((prevState) => ({
        ...prevState,
        username: "Use 3 to 20 letters, numbers, or underscores.",
      }));
      return;
    }

    if (username === lastCheckedUsername.current) return;
    lastCheckedUsername.current = username;

    const isAvailable = await isUsernameAvailable(username);

    if (username !== latestUsername.current) return;

    setValidationMessage((prevState) => ({
      ...prevState,
      username:
        isAvailable === false
          ? "That username is taken. Try adding numbers or an underscore."
          : "",
    }));
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  const runAllChecks = () => {
    const messages = {
      email: emailRef.current?.validity.valueMissing
        ? "Email is required."
        : !emailRef.current?.validity.valid
          ? "Enter a valid email address, like name@example.com."
          : "",
      username: /^\w{3,30}$/.test(inputs.username)
        ? ""
        : "Use 3 to 30 letters, numbers, or underscores.",
      password: isPasswordValid
        ? ""
        : "Password must include uppercase and lowercase letters, a number, and a special character.",
      confirmPassword: doPasswordsMatch ? "" : "Passwords must match.",
    };
    setValidationMessage(messages);

    const firstProblem = Object.entries(messages).find(
      ([, message]) => message,
    );
    if (firstProblem) {
      document.getElementById(`${firstProblem[0]}Input`)?.focus();
      return false;
    }
    return true;
  };

  const submitForm = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    if (!runAllChecks()) return;

    setIsLoading(true);
    setFormError("");
    try {
      const response = await registerUser({
        email: inputs.email,
        username: inputs.username,
        password: inputs.password,
      });

      if (response.ok) {
        onSuccess();
        return;
      }

      const { field, error } = response.data;
      if (field) {
        setValidationMessage((prevState) => ({ ...prevState, [field]: error }));
      } else {
        setFormError(error);
      }
    } catch {
      setFormError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submitForm} noValidate>
      <header>
        <h1>We're happy you decided to join us!</h1>
      </header>
      <fieldset disabled={isLoading} className={styles.fields}>
        <FormInput
          label="Email"
          id="emailInput"
          name="email"
          type="email"
          ref={emailRef}
          value={inputs.email}
          errorMessage={validationMessage.email}
          onBlur={checkEmailValidation}
          onChange={handleInputChange}
          required
        />
        <FormInput
          label="Username"
          id="usernameInput"
          name="username"
          value={inputs.username}
          errorMessage={validationMessage.username}
          onBlur={checkUsernameAvailability}
          onChange={handleInputChange}
          required
        />
        <FormInput
          label="Password"
          id="passwordInput"
          name="password"
          type="password"
          value={inputs.password}
          onBlur={checkPasswordValidation}
          errorMessage={validationMessage.password}
          onChange={handleInputChange}
          required
        />
        <FormInput
          label="Confirm Password"
          type="password"
          id="confirmPasswordInput"
          name="confirmPassword"
          value={inputs.confirmPassword}
          errorMessage={validationMessage.confirmPassword}
          onBlur={comparePasswords}
          onChange={handleInputChange}
          required
        />
      </fieldset>
      <footer>
        <p className={styles["form-error"]} role="alert">
          {formError}
        </p>
        <CustomButton
          type="submit"
          isLoading={isLoading}
          loadingText="Processing..."
          className={styles["form-button"]}
        >
          Register
        </CustomButton>
      </footer>
    </form>
  );
};

export default RegisterUserForm;
