import { api } from "./client";
import type { ApiEnvelope, User } from "@/types";

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: (identifier: string, password: string) =>
    api.post<ApiEnvelope<LoginResponse>>("/auth/login", { identifier, password }),

  logout: () => api.post<ApiEnvelope<null>>("/auth/logout"),

  me: () => api.get<ApiEnvelope<User>>("/auth/me"),

  activate: (matric: string) => api.post<ApiEnvelope<null>>("/auth/activate", { matric }),

  verifyOtp: (matric: string, code: string) =>
    api.post<ApiEnvelope<{ activationToken: string }>>("/auth/verify-otp", { matric, code }),

  createPassword: (activationToken: string, password: string) =>
    api.post<ApiEnvelope<null>>(
      "/auth/create-password",
      { password },
      { headers: { Authorization: `Bearer ${activationToken}` } }
    ),

  forgotPassword: (identifier: string) => api.post<ApiEnvelope<null>>("/auth/forgot-password", { identifier }),

  verifyResetOtp: (identifier: string, code: string) =>
    api.post<ApiEnvelope<{ activationToken: string }>>("/auth/verify-reset-otp", { identifier, code }),

  resetPassword: (activationToken: string, password: string) =>
    api.post<ApiEnvelope<null>>(
      "/auth/reset-password",
      { password },
      { headers: { Authorization: `Bearer ${activationToken}` } }
    ),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.patch<ApiEnvelope<null>>("/auth/change-password", { oldPassword, newPassword }),
};
