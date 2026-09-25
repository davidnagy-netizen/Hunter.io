import { httpClient } from "@/shared/api/httpClient";
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

  loadDemo: () => httpClient.post<SaveProfileResponse>("/profile/load-demo").then((res) => res.data),

  history: () => httpClient.get<ProfileHistoryResponse>("/profile/history").then((res) => res.data),

  restore: (version: number) =>
    httpClient.post<RestoreProfileResponse>("/profile/restore", { version }).then((res) => res.data),
};
