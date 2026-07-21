import { api } from "./client";
import type { ApiEnvelope, ImportSummary } from "@/types";

export const importApi = {
  students: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiEnvelope<ImportSummary>>("/auth/import/students", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  supervisors: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiEnvelope<ImportSummary>>("/auth/import/supervisors", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
