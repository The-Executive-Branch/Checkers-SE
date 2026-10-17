import type { AuthRoute } from "checkers-shared-types";

export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REGISTER: "/auth/register",
  USERNAME_AVAILABILITY: "/auth/username-available",
} as const satisfies Record<string, AuthRoute>;
