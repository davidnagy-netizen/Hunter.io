import { httpClient } from "@/api/httpClient";
import type {
  CompanyProfile,
  GetProfileResponse,
  ProfileHistoryResponse,
  RestoreProfileResponse,
  SaveProfileResponse,
} from "../types/profile.types";

export const profileApi = {
  get: () => httpClient.get<GetProfileResponse>("/profile").then((res) => res.data),

  save: (profile: CompanyProfile) =>
    httpClient.post<SaveProfileResponse>("/profile", { profile }).then((res) => res.data),

  /** Adds another company profile to the account and makes it the active one. */
  create: (profile: CompanyProfile) =>
    httpClient.post<SaveProfileResponse>("/profile/new", { profile }).then((res) => res.data),

  /** Works on another of the account's company profiles. */
  switchTo: (id: string) => httpClient.post<{ success: true }>("/profile/switch", { id }).then((res) => res.data),

  loadDemo: () => httpClient.post<SaveProfileResponse>("/profile/load-demo").then((res) => res.data),

  history: () => httpClient.get<ProfileHistoryResponse>("/profile/history").then((res) => res.data),

  restore: (version: number) =>
    httpClient.post<RestoreProfileResponse>("/profile/restore", { version }).then((res) => res.data),
};
