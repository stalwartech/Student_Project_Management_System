import { api } from "./client";
import type { ApiEnvelope, AllocationResult } from "@/types";

export const allocationApi = {
  preview: () => api.post<ApiEnvelope<AllocationResult>>("/coordinator/projects/preview-allocation"),
  run: () => api.post<ApiEnvelope<AllocationResult>>("/coordinator/projects/auto-allocation"),
};
