import { httpClient } from "@/api/httpClient";
import type { AuthActionResponse, LoginPayload, MeResponse, RegisterPayload, ResetPasswordPayload } from "../types/auth.types";

export const authApi = {
  me: () => httpClient.get<MeResponse>("/auth/me").then((res) => res.data),

  login: (payload: LoginPayload) =>
    httpClient.post<AuthActionResponse>("/auth/login", payload).then((res) => res.data),

  /** `lang` is the site language, which the verification e-mail is written in. */
  register: (payload: RegisterPayload, lang: string) =>
    httpClient.post<AuthActionResponse>("/auth/register", payload, { params: { lang } }).then((res) => res.data),

  logout: () => httpClient.post<{ success: true }>("/auth/logout").then((res) => res.data),

  verifyEmail: (code: string) => httpClient.post<{ success: true }>("/auth/verification/verify", { code }).then((res) => res.data),

  forgotPassword: (email: string, lang: string) =>
    httpClient.post<{ success: true }>("/auth/password/forgot", { email }, { params: { lang } }).then((res) => res.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    httpClient.post<{ success: true }>("/auth/password/reset", payload).then((res) => res.data),
};
