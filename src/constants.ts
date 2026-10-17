import type { AuthRoute } from "checkers-shared-types";

export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REGISTER: "/auth/register",
} as const satisfies Record<string, AuthRoute>;
