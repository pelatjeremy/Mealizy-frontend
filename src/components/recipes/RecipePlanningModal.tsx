"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { createMealPlan, getApiErrorMessage } from "@/lib/api";
import type { MealPlanDay, MealType, Recipe, UserProfile } from "@/types/domain";

const dayKeys: MealPlanDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const mealTypes: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Petit-déjeuner" },
  { key: "lunch", label: "Déjeuner" },
  { key: "dinner", label: "Dîner" },
  { key: "snack", label: "Collation" }
];

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return formatDateInput(date);
}

function dateParts(value: string): { weekStartDate: string; day: MealPlanDay } {
  const date = new Date(`${value}T00:00:00.000`);
  const dayIndex = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayIndex + 1);
  monday.setHours(0, 0, 0, 0);

  return {
    weekStartDate: formatDateInput(monday),
    day: dayKeys[dayIndex - 1]
  };
}

function recipeSource(recipe: Recipe): "api" | "user" | "demo" {
  return recipe.source || (recipe.externalId?.startsWith("demo-") ? "demo" : "user");
}

export function recipeId(recipe: Recipe) {
  return recipe.externalId || recipe._id || recipe.id || "";
}

export function RecipePlanningModal({
  recipe,
  profile,
  token,
  onClose
}: {
  recipe: Recipe;
  profile: UserProfile | null;
  token: string;
  onClose: () => void;
}) {
  const enabledMealTypes = profile?.enabledMealTypes?.length ? profile.enabledMealTypes : mealTypes.map((meal) => meal.key);
  const visibleMealTypes = useMemo(() => mealTypes.filter((meal) => enabledMealTypes.includes(meal.key)), [enabledMealTypes]);
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [mealType, setMealType] = useState<MealType>(visibleMealTypes[0]?.key || "lunch");
  const [servings, setServings] = useState(profile?.householdSize || recipe.servings || 1);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const { weekStartDate, day } = dateParts(selectedDate);
      await createMealPlan(token, {
        weekStartDate,
        day,
        mealType,
        recipeId: recipeId(recipe),
        recipeSource: recipeSource(recipe),
        servings: Number(servings)
      });
      setStatus("saved");
      window.setTimeout(onClose, 650);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible d'ajouter ce repas."));
      setStatus("error");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="planning-modal" onSubmit={handleSubmit}>
        <header>
          <div>
            <h2>Ajouter au planning</h2>
            <p>{recipe.title}</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        </header>
        <label>Date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        <label>Type de repas
          <select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
            {visibleMealTypes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label>Portions<input min="1" type="number" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label>
        <button className="primary-action" type="submit" disabled={status === "saving"}><CalendarPlus size={17} /> Enregistrer</button>
        {status === "saved" && <p className="form-note ready">Repas ajouté.</p>}
        {status === "error" && <p className="form-note danger">{error}</p>}
      </form>
    </div>
  );
}
