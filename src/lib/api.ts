import { inventory, recipes, shoppingList } from "./demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) throw new Error("API request failed");
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getDashboardData() {
  try {
    const [recipeResults] = await Promise.all([request<typeof recipes>("/recipes/search")]);
    return { inventory, shoppingList, recipes: recipeResults };
  } catch {
    return { inventory, shoppingList, recipes };
  }
}
