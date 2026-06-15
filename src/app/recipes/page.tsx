"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CircleAlert, Loader2, Search } from "lucide-react";
import { getApiErrorMessage, getProfile, readAuthToken, searchRecipes } from "@/lib/api";
import type { Recipe, UserProfile } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";
import { recipeId, RecipePlanningModal } from "@/components/recipes/RecipePlanningModal";

function recipeKey(recipe: Recipe) {
  return recipe.externalId || recipe._id || recipe.id || recipe.title;
}

function RecipeImage({ recipe }: { recipe: Recipe }) {
  if (!recipe.image) return <div className="recipe-image-placeholder">Mealizy</div>;
  return <img src={recipe.image} alt="" />;
}

function RecipeMeta({ recipe }: { recipe: Recipe }) {
  const calories = recipe.nutrition?.calories || 0;
  return (
    <span>
      {recipe.preparationTime || 0} min - {calories} kcal - {recipe.servings || 1} portions
    </span>
  );
}

function IngredientSummary({ recipe }: { recipe: Recipe }) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return <small>Ingrédients non renseignés.</small>;
  return <small>{ingredients.slice(0, 4).map((ingredient) => ingredient.ingredientName).join(", ")}{ingredients.length > 4 ? "..." : ""}</small>;
}

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const loadRecipes = useCallback(async (nextQuery: string, authToken: string) => {
    setStatus("loading");
    setError("");
    try {
      const results = await searchRecipes(nextQuery, authToken);
      setRecipes(results);
      setStatus("ready");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de récupérer les recettes."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const authToken = readAuthToken();
    setToken(authToken);
    loadRecipes("", authToken);
    if (authToken) getProfile(authToken).then(setProfile).catch(() => setProfile(null));
  }, [loadRecipes]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadRecipes(query, token), 250);
    return () => window.clearTimeout(timeout);
  }, [loadRecipes, query, token]);

  return (
    <PageScaffold title="Recettes" description="Explorez les recettes disponibles et ajoutez-les au planning.">
      <div className="search-bar"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une recette ou un ingrédient" /></div>
      {!token && <div className="state-panel">Connectez-vous pour ajouter une recette au planning.</div>}
      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement des recettes</div>}
      {status === "error" && <div className="state-panel"><CircleAlert size={22} /> {error}</div>}

      {status === "ready" && recipes.length === 0 && <div className="state-panel">Aucune recette trouvée.</div>}

      {status === "ready" && recipes.length > 0 && (
        <section className="recipe-catalog">
          {recipes.map((recipe) => {
            const canPlan = Boolean(token && recipeId(recipe));
            return (
              <article className="recipe-card" key={recipeKey(recipe)}>
                <RecipeImage recipe={recipe} />
                <div>
                  <strong>{recipe.title}</strong>
                  <RecipeMeta recipe={recipe} />
                  <IngredientSummary recipe={recipe} />
                  <button className="outline-action" type="button" disabled={!canPlan} onClick={() => setSelectedRecipe(recipe)}>
                    <CalendarPlus size={17} /> Ajouter au planning
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedRecipe && token && (
        <RecipePlanningModal recipe={selectedRecipe} profile={profile} token={token} onClose={() => setSelectedRecipe(null)} />
      )}
    </PageScaffold>
  );
}
