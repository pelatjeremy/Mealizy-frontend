"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { recipes as demoRecipes } from "@/lib/demo-data";
import { Recipe } from "@/types/domain";

export function RecipeBrowser() {
  const [recipes, setRecipes] = useState<Recipe[]>(demoRecipes);
  const [query, setQuery] = useState("");
  const [isDemo, setIsDemo] = useState(true);
  const [message, setMessage] = useState("Recettes de demonstration chargees.");

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const payload = await apiRequest<{ recipes: Recipe[]; isDemo: boolean }>(`/recipes/search${params}`);
    setRecipes(payload.recipes);
    setIsDemo(payload.isDemo);
    setMessage(payload.isDemo ? "Spoonacular absent : donnees de demonstration." : "Recettes chargees depuis l’API.");
  }

  useEffect(() => {
    search().catch(() => setMessage("Backend indisponible : donnees de demonstration locales."));
  }, []);

  const grouped = {
    complete: recipes.filter((recipe) => (recipe.missingCount || 0) === 0),
    missingOne: recipes.filter((recipe) => recipe.missingCount === 1),
    missingTwo: recipes.filter((recipe) => recipe.missingCount === 2),
    missingThree: recipes.filter((recipe) => recipe.missingCount === 3)
  };

  return (
    <>
      <form className="search-bar" onSubmit={search}>
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une recette ou un ingredient" />
      </form>
      <p className={isDemo ? "waste-alert" : "status-note"}>{message}</p>
      <section className="suggestion-columns">
        {Object.entries(grouped).map(([key, items]) => (
          <div className="panel" key={key}>
            <h2>{labels[key as keyof typeof labels]}</h2>
            <div className="recipe-catalog compact">
              {items.slice(0, 6).map((recipe) => (
                <article className="recipe-card" key={recipe.externalId}>
                  <img src={recipe.image} alt="" />
                  <div>
                    <strong>{recipe.title}</strong>
                    <span>{recipe.preparationTime} min · {recipe.nutrition.calories} kcal</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

const labels = {
  complete: "Tous les ingredients",
  missingOne: "Il manque 1 ingredient",
  missingTwo: "Il manque 2 ingredients",
  missingThree: "Il manque 3 ingredients"
};
