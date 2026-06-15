"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CircleAlert, Flame, Loader2, PackageOpen, ShoppingCart, Utensils } from "lucide-react";
import { MealPlanner } from "@/components/dashboard/MealPlanner";
import { NutritionPanel } from "@/components/dashboard/NutritionPanel";
import { RecipeSuggestions } from "@/components/dashboard/RecipeSuggestions";
import { ShoppingPreview } from "@/components/dashboard/ShoppingPreview";
import { StatCard } from "@/components/dashboard/StatCard";
import { InventoryPreview } from "@/components/dashboard/InventoryPreview";
import {
  getApiErrorMessage,
  getInventory,
  getMealPlans,
  getRecipeSuggestions,
  getShoppingList,
  readAuthToken
} from "@/lib/api";
import type { InventoryItem, MealPlan, Recipe, ShoppingItem } from "@/types/domain";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date = new Date()) {
  const monday = new Date(date);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function flattenSuggestions(groups: Awaited<ReturnType<typeof getRecipeSuggestions>>) {
  return [...groups.complete, ...groups.missing1, ...groups.missing2, ...groups.missing3];
}

export default function DashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-token" | "error">("loading");
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const token = readAuthToken();
    if (!token) {
      setStatus("missing-token");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const week = formatDateInput(getMonday());
      const [inventoryItems, weekPlans, shoppingList, suggestionGroups] = await Promise.all([
        getInventory(token),
        getMealPlans(token, week),
        getShoppingList(token, week),
        getRecipeSuggestions(token)
      ]);

      setInventory(inventoryItems);
      setMealPlans(weekPlans);
      setShoppingItems((shoppingList.items || []).filter((item) => !item.checked));
      setRecipes(flattenSuggestions(suggestionGroups));
      setStatus("ready");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de charger le tableau de bord."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const averageCalories = useMemo(() => {
    if (mealPlans.length === 0) return 0;
    const total = mealPlans.reduce((sum, plan) => sum + Number(plan.recipe?.calories || 0), 0);
    return Math.round(total / mealPlans.length);
  }, [mealPlans]);

  return (
    <div className="dashboard-layout">
      <main className="main-column">
        <header className="page-header">
          <div>
            <h1>Tableau de bord</h1>
            <p>Voici un aperçu de votre semaine et de votre inventaire.</p>
          </div>
          <button className="icon-button" aria-label="Notifications">
            <Bell size={21} />
            <span className="badge">2</span>
          </button>
        </header>

        {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement du tableau de bord...</div>}
        {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour voir votre tableau de bord.</div>}
        {status === "error" && <div className="state-panel"><CircleAlert size={22} /> {error}</div>}

        <section className="stats-grid" aria-label="Indicateurs">
          <StatCard icon={PackageOpen} tone="green" label="Inventaire" value={inventory.length.toString()} helper="produits disponibles" href="/inventory" cta="Voir l'inventaire" />
          <StatCard icon={Utensils} tone="orange" label="Repas planifiés" value={mealPlans.length.toString()} helper="repas cette semaine" href="/meal-plans" cta="Voir le planning" />
          <StatCard icon={ShoppingCart} tone="purple" label="Liste de courses" value={shoppingItems.length.toString()} helper="produits à acheter" href="/shopping-list" cta="Voir la liste" />
          <StatCard icon={Flame} tone="blue" label="Calories moyenne" value={averageCalories ? averageCalories.toString() : "-"} helper="kcal / repas planifié" href="/profile" cta="Voir le détail" />
        </section>

        <MealPlanner onChanged={loadDashboard} />

        <section className="split-grid">
          <InventoryPreview items={inventory} />
          <ShoppingPreview items={shoppingItems} />
        </section>
      </main>

      <aside className="right-rail">
        <RecipeSuggestions recipes={recipes} />
        <NutritionPanel />
      </aside>
    </div>
  );
}
