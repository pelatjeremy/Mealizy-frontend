"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2, CircleAlert, Loader2, PackageOpen, X } from "lucide-react";
import { apiRequest, createMealPlan, getProfile, getRecipeSuggestions, getToken } from "@/lib/client-api";
import type { MealPlanDay, MealType, Recipe, RecipeIngredient, RecipeSuggestionGroups, UserProfile } from "@/types/domain";

type ApiInventoryItem = {
  _id: string;
};

const emptyGroups: RecipeSuggestionGroups = {
  complete: [],
  missing1: [],
  missing2: [],
  missing3: [],
  missingMore: []
};

const categories = [
  { key: "complete", title: "Tous les ingredients disponibles", tone: "ready", icon: CheckCircle2 },
  { key: "missing1", title: "Il manque 1 ingredient", tone: "warn", icon: CircleAlert },
  { key: "missing2", title: "Il manque 2 ingredients", tone: "warn", icon: CircleAlert },
  { key: "missing3", title: "Il manque 3 ingredients", tone: "danger", icon: CircleAlert },
  { key: "missingMore", title: "Il manque plus de 3 ingredients", tone: "danger", icon: CircleAlert }
] as const;

const days: { key: MealPlanDay; label: string }[] = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" }
];

const mealTypes: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Petit-dejeuner" },
  { key: "lunch", label: "Dejeuner" },
  { key: "dinner", label: "Diner" },
  { key: "snack", label: "Collation" }
];

function hasRecipes(groups: RecipeSuggestionGroups) {
  return categories.some((category) => groups[category.key].length > 0);
}

function hasOnlyMissingMore(groups: RecipeSuggestionGroups) {
  return groups.missingMore.length > 0
    && groups.complete.length === 0
    && groups.missing1.length === 0
    && groups.missing2.length === 0
    && groups.missing3.length === 0;
}

function MissingIngredientList({ ingredients }: { ingredients: RecipeIngredient[] }) {
  if (ingredients.length === 0) {
    return <p className="ready-note">Aucun ingredient manquant.</p>;
  }

  return (
    <ul>
      {ingredients.map((ingredient) => (
        <li key={`${ingredient.normalizedName}-${ingredient.unit}`}>
          {ingredient.ingredientName} - {ingredient.quantity} {ingredient.unit}
        </li>
      ))}
    </ul>
  );
}

function getMonday() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function recipeSource(recipe: Recipe): "api" | "user" | "demo" {
  return recipe.source || (recipe.externalId?.startsWith("demo-") ? "demo" : "user");
}

function recipeId(recipe: Recipe) {
  return recipe.externalId || recipe._id || recipe.id || "";
}

function PlanningModal({
  recipe,
  profile,
  onClose
}: {
  recipe: Recipe;
  profile: UserProfile | null;
  onClose: () => void;
}) {
  const enabledMealTypes = profile?.enabledMealTypes?.length ? profile.enabledMealTypes : mealTypes.map((meal) => meal.key);
  const visibleMealTypes = mealTypes.filter((meal) => enabledMealTypes.includes(meal.key));
  const [weekStartDate, setWeekStartDate] = useState(getMonday());
  const [day, setDay] = useState<MealPlanDay>("monday");
  const [mealType, setMealType] = useState<MealType>(visibleMealTypes[0]?.key || "lunch");
  const [servings, setServings] = useState(profile?.householdSize || recipe.servings || 1);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    try {
      await createMealPlan({
        weekStartDate,
        day,
        mealType,
        recipeId: recipeId(recipe),
        recipeSource: recipeSource(recipe),
        servings
      });
      setStatus("saved");
      window.setTimeout(onClose, 650);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="planning-modal" onSubmit={submit}>
        <header>
          <div>
            <h2>Ajouter au planning</h2>
            <p>{recipe.title}</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        </header>
        <label>Semaine<input type="date" value={weekStartDate} onChange={(event) => setWeekStartDate(event.target.value)} /></label>
        <label>Jour
          <select value={day} onChange={(event) => setDay(event.target.value as MealPlanDay)}>
            {days.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label>Type de repas
          <select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
            {visibleMealTypes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label>Portions<input min="1" type="number" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label>
        <button className="primary-action" type="submit" disabled={status === "saving"}><CalendarPlus size={17} /> Enregistrer</button>
        {status === "saved" && <p className="form-note ready">Repas ajoute.</p>}
        {status === "error" && <p className="form-note danger">Impossible d'ajouter ce repas.</p>}
      </form>
    </div>
  );
}

function RecipeCard({ recipe, onPlan }: { recipe: Recipe; onPlan: (recipe: Recipe) => void }) {
  const missingIngredients = recipe.missingIngredients || [];

  return (
    <article className="suggestion-card">
      <img src={recipe.image} alt="" />
      <div className="suggestion-card-body">
        <div>
          <strong>{recipe.title}</strong>
          <span>{recipe.preparationTime} min - {recipe.nutrition.calories} kcal - {recipe.servings} portions</span>
        </div>
        <p>{recipe.missingCount || 0} ingredient{recipe.missingCount === 1 ? "" : "s"} manquant{recipe.missingCount === 1 ? "" : "s"}</p>
        <MissingIngredientList ingredients={missingIngredients} />
        <button className="outline-action" type="button" onClick={() => onPlan(recipe)}>
          <CalendarPlus size={17} /> Ajouter au planning
        </button>
      </div>
    </article>
  );
}

export function RecipeBrowser() {
  const [groups, setGroups] = useState<RecipeSuggestionGroups>(emptyGroups);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-token" | "empty-inventory" | "no-recipes" | "error">("loading");

  const recipeCount = useMemo(() => {
    return categories.reduce((count, category) => count + groups[category.key].length, 0);
  }, [groups]);

  useEffect(() => {
    async function loadSuggestions() {
      if (!getToken()) {
        setStatus("missing-token");
        return;
      }

      const inventory = await apiRequest<ApiInventoryItem[]>("/inventory");
      if (inventory.length === 0) {
        setGroups(emptyGroups);
        setStatus("empty-inventory");
        return;
      }

      const [suggestions, userProfile] = await Promise.all([getRecipeSuggestions(), getProfile()]);
      setProfile(userProfile);
      setGroups(suggestions);
      setStatus(hasRecipes(suggestions) ? "ready" : "no-recipes");
    }

    loadSuggestions().catch((error) => {
      setStatus(error instanceof Error && error.message === "Authentication required" ? "missing-token" : "error");
    });
  }, []);

  if (status === "loading") {
    return <div className="state-panel"><Loader2 size={22} /> Chargement des suggestions</div>;
  }

  if (status === "missing-token") {
    return <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour voir les recettes calculees depuis votre inventaire.</div>;
  }

  if (status === "empty-inventory") {
    return <div className="state-panel"><PackageOpen size={22} /> Ajoutez des ingredients dans votre inventaire pour obtenir des suggestions.</div>;
  }

  if (status === "error") {
    return <div className="state-panel"><CircleAlert size={22} /> Backend indisponible : impossible de calculer les suggestions.</div>;
  }

  if (status === "no-recipes") {
    return <div className="state-panel"><CircleAlert size={22} /> Aucune recette trouvee pour cet inventaire.</div>;
  }

  return (
    <section className="suggestion-categories" aria-label={`${recipeCount} recettes suggerees`}>
      {hasOnlyMissingMore(groups) && (
        <div className="state-panel">
          <CircleAlert size={22} />
          Votre inventaire est trop limite pour proposer des recettes proches. Ajoutez plus d'ingredients ou essayez une recherche plus large.
        </div>
      )}

      {categories.map((category) => {
        const recipes = category.key === "missingMore" ? groups[category.key].slice(0, 6) : groups[category.key];
        const Icon = category.icon;

        return (
          <section className="suggestion-category" key={category.key}>
            <header>
              <h2><Icon className={category.tone} size={20} /> {category.title}</h2>
              <span>{recipes.length}</span>
            </header>

            {recipes.length > 0 ? (
              <div className="suggestion-grid">
                {recipes.map((recipe) => <RecipeCard key={recipe.externalId || recipe.title} recipe={recipe} onPlan={setSelectedRecipe} />)}
              </div>
            ) : (
              <p className="empty-category">Aucune recette dans cette categorie.</p>
            )}
          </section>
        );
      })}
      {selectedRecipe && <PlanningModal recipe={selectedRecipe} profile={profile} onClose={() => setSelectedRecipe(null)} />}
    </section>
  );
}
