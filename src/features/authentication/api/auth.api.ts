import { httpClient } from "@/shared/api/httpClient";
import type { AuthActionResponse, LoginPayload, MeResponse, RegisterPayload } from "../types/auth.types";

export const authApi = {
  me: () => httpClient.get<MeResponse>("/auth/me").then((res) => res.data),

  login: (payload: LoginPayload) =>
    httpClient.post<AuthActionResponse>("/auth/login", payload).then((res) => res.data),

  register: (payload: RegisterPayload) =>
    httpClient.post<AuthActionResponse>("/auth/register", payload).then((res) => res.data),

  logout: () => httpClient.post<{ success: true }>("/auth/logout").then((res) => res.data),
};
