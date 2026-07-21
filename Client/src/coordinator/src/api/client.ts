import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // sends the httpOnly refreshToken cookie
});

api.interceptors.request.use((config) => {
  // Activation and password-reset requests supply their own short-lived
  // verification token. Never replace that token with a cached login token.
  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axios.post(
      "/api/auth/refresh-token",
      {},
      { withCredentials: true }
    );
    const newToken = res.data?.data?.accessToken as string | undefined;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
};

// On a 401 (expired access token), silently refresh once and retry the
// original request - avoids bouncing the user to login on every 15-min expiry.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      window.dispatchEvent(new CustomEvent("spms:session-expired"));
    }

    return Promise.reject(error);
  }
);

// Every error response follows { success: false, message } - this pulls
// that message out consistently so callers/UI never have to guess the shape.
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
};

export { refreshAccessToken };
