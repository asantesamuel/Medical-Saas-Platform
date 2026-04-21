import axios from "axios";
import { supabase } from "@/lib/supabase";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  timeout: 30_000,   // 30 s — well within the <10 s SLA + network overhead
});

// Inject the Supabase JWT on every request automatically
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise error shape
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message: string =
      err.response?.data?.detail ?? err.message ?? "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
