"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { getRecipeSuggestions } from "@/lib/client-api";
import type { Recipe, RecipeSuggestionGroups } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";

const emptyGroups: RecipeSuggestionGroups = {
  complete: [],
  missing1: [],
  missing2: [],
  missing3: [],
  missingMore: []
};

const categories = [
  { key: "complete", title: "Tous les ingredients disponibles", tone: "ready" },
  { key: "missing1", title: "Il manque 1 ingredient", tone: "warn" },
  { key: "missing2", title: "Il manque 2 ingredients", tone: "warn" },
  { key: "missing3", title: "Il manque 3 ingredients", tone: "danger" },
  { key: "missingMore", title: "Plus de 3 ingredients manquants", tone: "danger" }
] as const;

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const missingIngredients = recipe.missingIngredients || [];

  return (
    <article className="suggestion-card">
      <img src={recipe.image} alt="" />
      <div className="suggestion-card-body">
        <div>
          <strong>{recipe.title}</strong>
          <span>{recipe.nutrition.calories} kcal · {recipe.servings} portions</span>
        </div>
        <p>{recipe.missingCount || 0} ingredient{recipe.missingCount === 1 ? "" : "s"} manquant{recipe.missingCount === 1 ? "" : "s"}</p>
        {missingIngredients.length > 0 && (
          <ul>
            {missingIngredients.map((ingredient) => (
              <li key={`${recipe.externalId}-${ingredient.normalizedName}`}>
                {ingredient.ingredientName} · {ingredient.quantity} {ingredient.unit}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function RecipeSuggestionsPage() {
  const [groups, setGroups] = useState<RecipeSuggestionGroups>(emptyGroups);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getRecipeSuggestions()
      .then((results) => {
        setGroups(results);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <PageScaffold
      title="Suggestions"
      description="Recettes classees selon votre inventaire disponible."
    >
      {status === "loading" && (
        <div className="state-panel"><Loader2 size={22} /> Chargement des suggestions</div>
      )}

      {status === "error" && (
        <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour voir vos suggestions.</div>
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
                    {recipes.map((recipe) => <RecipeCard key={recipe.externalId || recipe.title} recipe={recipe} />)}
                  </div>
                ) : (
                  <p className="empty-category">Aucune recette dans cette categorie.</p>
                )}
              </section>
            );
          })}
        </section>
      )}
    </PageScaffold>
  );
}
