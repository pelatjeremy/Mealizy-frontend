"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, PackageOpen } from "lucide-react";
import { apiRequest, getRecipeSuggestions, getToken } from "@/lib/client-api";
import type { Recipe, RecipeIngredient, RecipeSuggestionGroups } from "@/types/domain";

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

function RecipeCard({ recipe }: { recipe: Recipe }) {
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
      </div>
    </article>
  );
}

export function RecipeBrowser() {
  const [groups, setGroups] = useState<RecipeSuggestionGroups>(emptyGroups);
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

      const suggestions = await getRecipeSuggestions();
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
                {recipes.map((recipe) => <RecipeCard key={recipe.externalId || recipe.title} recipe={recipe} />)}
              </div>
            ) : (
              <p className="empty-category">Aucune recette dans cette categorie.</p>
            )}
          </section>
        );
      })}
    </section>
  );
}
