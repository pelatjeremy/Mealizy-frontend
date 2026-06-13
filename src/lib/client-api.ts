const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "mealizy_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Requête API impossible");
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export async function login(email: string, password: string) {
  const payload = await apiRequest<{ token: string; user: unknown }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setToken(payload.token);
  return payload;
}

export async function register(data: Record<string, unknown>) {
  const payload = await apiRequest<{ token: string; user: unknown }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
  setToken(payload.token);
  return payload;
}
