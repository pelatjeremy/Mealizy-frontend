import type { InventoryItem, MealPlan, MealPlanDay, MealType, Recipe, RecipeIngredient, RecipeSuggestionGroups, ShoppingList, UserProfile } from "@/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      signal: controller.signal,
      cache: "no-store"
    });
    if (response.status === 204) return undefined as T;

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      const backendMessage = typeof payload?.message === "string" ? payload.message : "";
      const message = response.status === 401 ? "Session expirée. Merci de vous reconnecter." : backendMessage || `Erreur API (${response.status})`;

      if (response.status === 401 && typeof window !== "undefined") {
        clearAuthToken();
      }

      throw new ApiError(message, response.status, payload?.details);
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getRecipeSuggestions(token: string) {
  return request<RecipeSuggestionGroups>("/recipes/suggestions", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function searchRecipes(query: string, token?: string) {
  return request<Recipe[]>(`/recipes/search?q=${encodeURIComponent(query)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
}

export async function getMyRecipes(token: string) {
  return request<Recipe[]>("/recipes/mine", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export type RecipePayload = {
  title: string;
  image?: string;
  preparationTime: number;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: RecipeIngredient[];
  instructions?: string[];
  requiredEquipments?: string[];
};

export async function createCustomRecipe(token: string, payload: RecipePayload) {
  return request<Recipe>("/recipes", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function readAuthToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("mealizy_token") || "";
}

export function storeAuthToken(token: string) {
  localStorage.setItem("mealizy_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("mealizy_token");
}

export async function login(payload: { email: string; password: string }) {
  return request<{ token: string; user: UserProfile }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function register(payload: { firstname: string; lastname: string; email: string; password: string }) {
  return request<{ token: string; user: UserProfile }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getProfile(token: string) {
  return request<UserProfile>("/users/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export type ProfilePayload = {
  firstname: string;
  lastname: string;
  householdSize: number;
  enabledMealTypes: MealType[];
  availableEquipments: string[];
  dietaryPreferences: string[];
  allergies: string[];
};

export async function updateProfile(token: string, payload: ProfilePayload) {
  return request<UserProfile>("/users/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

type InventoryApiItem = {
  _id?: string;
  id?: string;
  name?: string;
  quantity: number;
  unit: string;
  category?: string;
  expirationDate?: string;
  ingredientId?: {
    name?: string;
    category?: string;
  };
};

export type InventoryPayload = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate?: string;
};

function normalizeInventoryItem(item: InventoryApiItem): InventoryItem {
  return {
    id: item.id || item._id || "",
    name: item.name || item.ingredientId?.name || "Produit",
    quantity: item.quantity,
    unit: item.unit,
    category: item.category || item.ingredientId?.category || "autres",
    expirationDate: item.expirationDate
  };
}

function normalizeInventory(items: InventoryApiItem[]): InventoryItem[] {
  return items.map(normalizeInventoryItem);
}

export async function getInventory(token: string) {
  const items = await request<InventoryApiItem[]>("/inventory", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return normalizeInventory(items);
}

export async function createInventoryItem(token: string, payload: InventoryPayload) {
  const item = await request<InventoryApiItem>("/inventory", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return normalizeInventoryItem(item);
}

export async function updateInventoryItem(token: string, id: string, payload: InventoryPayload) {
  const item = await request<InventoryApiItem>(`/inventory/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return normalizeInventoryItem(item);
}

export async function deleteInventoryItem(token: string, id: string) {
  await request<void>(`/inventory/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getMealPlans(token: string, week: string) {
  return request<MealPlan[]>(`/meal-plans?week=${encodeURIComponent(week)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function createMealPlan(
  token: string,
  payload: {
    weekStartDate: string;
    day: MealPlanDay;
    mealType: MealType;
    recipeId: string;
    recipeSource: "api" | "user" | "demo";
    servings?: number;
  }
) {
  return request<MealPlan>("/meal-plans", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export async function updateMealPlan(token: string, id: string, payload: { servings?: number; recipeId?: string; recipeSource?: "api" | "user" | "demo" }) {
  return request<MealPlan>(`/meal-plans/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export async function deleteMealPlan(token: string, id: string) {
  await request<void>(`/meal-plans/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
}

function normalizeShoppingList(list: ShoppingList): ShoppingList {
  return {
    ...list,
    items: (list.items || []).map((item) => ({
      ...item,
      id: item.id || item._id || ""
    }))
  };
}

export async function getShoppingList(token: string, week: string) {
  const list = await request<ShoppingList>(`/shopping-list?week=${encodeURIComponent(week)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return normalizeShoppingList(list);
}

export async function generateShoppingList(token: string, week: string) {
  const list = await request<ShoppingList>("/shopping-list/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ week })
  });
  return normalizeShoppingList(list);
}

export async function updateShoppingListItemChecked(token: string, id: string, checked: boolean) {
  const list = await request<ShoppingList>(`/shopping-list/items/${id}/check`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ checked })
  });
  return normalizeShoppingList(list);
}

export async function addShoppingListItemToInventory(token: string, id: string) {
  const list = await request<ShoppingList>(`/shopping-list/items/${id}/add-to-inventory`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return normalizeShoppingList(list);
}
