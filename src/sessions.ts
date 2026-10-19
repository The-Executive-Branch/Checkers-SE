import type {
  UserAccessResponse,
  LoginUserRequest,
  ErrorResponse,
  RegisterUserRequest,
} from "checkers-shared-types";

import { AUTH_ROUTES } from "./constants";

type Session = UserAccessResponse;

type RequestResult<T> =
  | {
      ok: true;
      status: number;
      data: T;
    }
  | {
      ok: false;
      status: number;
      data: ErrorResponse;
    };

const saveSession = (session: UserAccessResponse) => {
  localStorage.setItem("session", JSON.stringify(session));
};

export const loadSession = (): Session | null => {
  const session = localStorage.getItem("session");
  if (!session) return null;

  try {
    const parsedSession: Session = JSON.parse(session);
    const expiresAt = Date.parse(parsedSession.expiresAt);
    const isValid = expiresAt > Date.now();
    if (!isValid) {
      clearSession();
      return null;
    }
    return parsedSession;
  } catch {
    clearSession();
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem("session");
};

const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : "http://127.0.0.1:8000";

export const request = async <T>(
  url: string,
  body?: unknown,
): Promise<RequestResult<T>> => {
  // Load session
  const session: Session | null = loadSession();

  const headers = {
    "Content-Type": "application/json",
    ...(session && { Authorization: `Bearer ${session.sessionId}` }),
  };

  const response = await fetch(BASE_URL + url, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });

  if (session && response.status === 401) {
    clearSession();
    onAccessRevoked();
  }

  const data = response.status === 204 ? null : await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  } as RequestResult<T>;
};

export const registerUser = async (requestBody: RegisterUserRequest) => {
  const response = await request<UserAccessResponse>(
    AUTH_ROUTES.REGISTER,
    requestBody,
  );

  if (response.ok) {
    saveSession(response.data);
    onAccessGranted();
  }

  return response;
};

export const logIn = async (requestBody: LoginUserRequest) => {
  const response = await request<UserAccessResponse>(
    AUTH_ROUTES.LOGIN,
    requestBody,
  );

  if (response.ok) {
    saveSession(response.data);
    onAccessGranted();
  }

  return response;
};

export const logOut = async () => {
  try {
    await request(AUTH_ROUTES.LOGOUT);
  } finally {
    clearSession();
    onAccessRevoked();
  }
};

const onAccessGranted = () => {};
const onAccessRevoked = () => {};
