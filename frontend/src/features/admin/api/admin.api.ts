import { httpClient } from "@/shared/api/httpClient";
import type {
  AdminOverview,
  AdminUserHistory,
  AdminUsersResponse,
  GrantPayload,
  RefreshResponse,
  UserPatchPayload,
} from "@/shared/types/admin.types";
import type { AuthUser } from "@/shared/types/auth.types";

interface UserResponse {
  success: true;
  user: AuthUser;
}

export const adminApi = {
  overview: () => httpClient.get<AdminOverview>("/admin/overview").then((res) => res.data),

  users: () => httpClient.get<AdminUsersResponse>("/admin/users").then((res) => res.data),

  history: (userId: string) =>
    httpClient.get<AdminUserHistory>("/admin/history", { params: { userId } }).then((res) => res.data),

  grant: (payload: GrantPayload) => httpClient.post<UserResponse>("/admin/subscription", payload).then((res) => res.data),

  revoke: (userId: string) =>
    httpClient.post<UserResponse>("/admin/subscription", { userId, revoke: true }).then((res) => res.data),

  patchUser: (payload: UserPatchPayload) => httpClient.post<UserResponse>("/admin/user", payload).then((res) => res.data),

  refreshCatalog: () => httpClient.post<RefreshResponse>("/refresh").then((res) => res.data),
};
