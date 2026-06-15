"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { getApiErrorMessage, getProfile, getRecipeSuggestions, readAuthToken } from "@/lib/api";
import type { Recipe, RecipeIngredient, RecipeSuggestionGroups, UserProfile } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";
import { recipeId, RecipePlanningModal } from "@/components/recipes/RecipePlanningModal";

const emptyGroups: RecipeSuggestionGroups = {
  complete: [],
  missing1: [],
  missing2: [],
  missing3: [],
  missingMore: []
};

const categories = [
  { key: "complete", title: "Tous les ingrédients disponibles", tone: "ready" },
  { key: "missing1", title: "Il manque 1 ingrédient", tone: "warn" },
  { key: "missing2", title: "Il manque 2 ingrédients", tone: "warn" },
  { key: "missing3", title: "Il manque 3 ingrédients", tone: "danger" },
  { key: "missingMore", title: "Plus de 3 ingrédients manquants", tone: "danger" }
] as const;

function RecipeImage({ recipe }: { recipe: Recipe }) {
  if (!recipe.image) return <div className="recipe-image-placeholder">Mealizy</div>;
  return <img src={recipe.image} alt="" />;
}

function IngredientList({ title, ingredients }: { title: string; ingredients: RecipeIngredient[] }) {
  if (!ingredients.length) return null;
  return (
    <div>
        <p>{title}</p>
      <ul>
        {ingredients.slice(0, 5).map((ingredient) => (
          <li key={`${ingredient.normalizedName}-${ingredient.unit}-${ingredient.quantity}`}>
            {ingredient.ingredientName} - {ingredient.quantity} {ingredient.unit}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecipeCard({
  recipe,
  token,
  onPlan
}: {
  recipe: Recipe;
  token: string;
  onPlan: (recipe: Recipe) => void;
}) {
  const missingIngredients = recipe.missingIngredients || [];
  const availableIngredients = recipe.availableIngredients || [];
  const canPlan = Boolean(token && recipeId(recipe));

  return (
    <article className="suggestion-card">
      <RecipeImage recipe={recipe} />
      <div className="suggestion-card-body">
        <div>
          <strong>{recipe.title}</strong>
        <span>{recipe.nutrition?.calories || 0} kcal - {recipe.servings || 1} portions</span>
        </div>
        <p>{recipe.missingCount || 0} ingrédient{recipe.missingCount === 1 ? "" : "s"} manquant{recipe.missingCount === 1 ? "" : "s"}</p>
        <IngredientList title="Disponibles" ingredients={availableIngredients} />
        <IngredientList title="Manquants" ingredients={missingIngredients} />
        <button className="outline-action" type="button" disabled={!canPlan} onClick={() => onPlan(recipe)}>
          <CalendarPlus size={17} /> Ajouter au planning
        </button>
      </div>
    </article>
  );
}

export default function RecipeSuggestionsPage() {
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [groups, setGroups] = useState<RecipeSuggestionGroups>(emptyGroups);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-token" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const authToken = readAuthToken();
    setToken(authToken);
    if (!authToken) {
      setStatus("missing-token");
      return;
    }

    Promise.all([getRecipeSuggestions(authToken), getProfile(authToken)])
      .then(([results, userProfile]) => {
        setGroups(results);
        setProfile(userProfile);
        setStatus("ready");
      })
      .catch((caughtError) => {
        setError(getApiErrorMessage(caughtError, "Impossible de récupérer les suggestions."));
        setStatus("error");
      });
  }, []);

  return (
    <PageScaffold
      title="Suggestions"
      description="Recettes classées selon votre inventaire disponible."
    >
      {status === "loading" && (
        <div className="state-panel"><Loader2 size={22} /> Chargement des suggestions</div>
      )}

      {status === "missing-token" && (
        <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour voir vos suggestions.</div>
      )}

      {status === "error" && (
        <div className="state-panel"><CircleAlert size={22} /> {error}</div>
      )}

      {status === "ready" && (
        <section className="suggestion-categories">
          {categories.map((category) => {
            const recipes = groups[category.key];
            const Icon = category.key === "complete" ? CheckCircle2 : CircleAlert;

            return (
              <section className="suggestion-category" key={category.key}>
                <header>
                  <h2><Icon className={category.tone} size={20} /> {category.title}</h2>
                  <span>{recipes.length}</span>
                </header>
                {recipes.length > 0 ? (
                  <div className="suggestion-grid">
                    {recipes.map((recipe) => (
                      <RecipeCard key={recipe.externalId || recipe._id || recipe.title} recipe={recipe} token={token} onPlan={setSelectedRecipe} />
                    ))}
                  </div>
                ) : (
                  <p className="empty-category">Aucune recette dans cette catégorie.</p>
                )}
              </section>
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
