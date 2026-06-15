"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CircleAlert, Loader2, Save } from "lucide-react";
import {
  createCustomRecipe,
  getApiErrorMessage,
  getMyRecipes,
  readAuthToken,
  type RecipePayload
} from "@/lib/api";
import type { Recipe, RecipeIngredient } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";

type Status = "loading" | "ready" | "missing-token" | "error";

const emptyForm = {
  title: "",
  image: "",
  preparationTime: 20,
  servings: 2,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  ingredients: "Tomates, 2, unit, fruits-legumes"
};

function parseIngredients(value: string): RecipeIngredient[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [ingredientName = "", quantity = "1", unit = "unit", category = "autres"] = line.split(",").map((part) => part.trim());
      return {
        ingredientName,
        normalizedName: ingredientName.toLowerCase(),
        quantity: Number(quantity || 1),
        unit: unit || "unit",
        category: category || "autres"
      };
    })
    .filter((ingredient) => ingredient.ingredientName && Number.isFinite(ingredient.quantity));
}

function recipeKey(recipe: Recipe) {
  return recipe._id || recipe.externalId || recipe.id || recipe.title;
}

function RecipeImage({ recipe }: { recipe: Recipe }) {
  if (!recipe.image) return <div className="recipe-image-placeholder">Mealizy</div>;
  return <img src={recipe.image} alt="" />;
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const ingredients = recipe.ingredients || [];
  return (
    <article className="recipe-card">
      <RecipeImage recipe={recipe} />
      <div>
        <strong>{recipe.title}</strong>
        <span>{recipe.preparationTime || 0} min - {recipe.nutrition?.calories || 0} kcal - {recipe.servings || 1} portions</span>
        <small>{ingredients.length ? ingredients.map((ingredient) => ingredient.ingredientName).slice(0, 5).join(", ") : "Ingrédients non renseignés."}</small>
      </div>
    </article>
  );
}

export default function MyRecipesPage() {
  const [token, setToken] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadRecipes = useCallback(async (authToken: string) => {
    setStatus("loading");
    setError("");
    try {
      const results = await getMyRecipes(authToken);
      setRecipes(results);
      setStatus("ready");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de récupérer vos recettes."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const authToken = readAuthToken();
    setToken(authToken);
    if (!authToken) {
      setStatus("missing-token");
      return;
    }
    loadRecipes(authToken);
  }, [loadRecipes]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const ingredients = parseIngredients(form.ingredients);
    const payload: RecipePayload = {
      title: form.title.trim(),
      image: form.image.trim() || undefined,
      preparationTime: Number(form.preparationTime),
      servings: Number(form.servings),
      nutrition: {
        calories: Number(form.calories || 0),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0)
      },
      ingredients
    };

    if (!payload.title || payload.preparationTime < 1 || payload.servings < 1 || ingredients.length === 0) {
      setError("Titre, temps, portions et au moins un ingrédient valides sont obligatoires.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await createCustomRecipe(token, payload);
      setNotice("Recette créée.");
      setForm(emptyForm);
      await loadRecipes(token);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de créer la recette."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageScaffold title="Mes recettes" description="Créez et retrouvez vos recettes personnalisées stockées en base.">
      {notice && <div className="state-panel success-state">{notice}</div>}
      {error && <div className="state-panel"><CircleAlert size={22} /> {error}</div>}
      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement des recettes</div>}
      {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour gérer vos recettes.</div>}

      {status === "ready" && (
        <>
          <section className="panel form-panel recipe-form-panel">
            <h2>Nouvelle recette</h2>
            <form className="recipe-form" onSubmit={handleSubmit}>
              <label>Titre<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Salade maison" /></label>
              <label>Image URL<input value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>
              <label>Temps<input min="1" type="number" value={form.preparationTime} onChange={(event) => setForm((current) => ({ ...current, preparationTime: Number(event.target.value) }))} /></label>
              <label>Portions<input min="1" type="number" value={form.servings} onChange={(event) => setForm((current) => ({ ...current, servings: Number(event.target.value) }))} /></label>
              <label>Calories<input min="0" type="number" value={form.calories} onChange={(event) => setForm((current) => ({ ...current, calories: Number(event.target.value) }))} /></label>
              <label>Protéines<input min="0" type="number" value={form.protein} onChange={(event) => setForm((current) => ({ ...current, protein: Number(event.target.value) }))} /></label>
              <label>Glucides<input min="0" type="number" value={form.carbs} onChange={(event) => setForm((current) => ({ ...current, carbs: Number(event.target.value) }))} /></label>
              <label>Lipides<input min="0" type="number" value={form.fat} onChange={(event) => setForm((current) => ({ ...current, fat: Number(event.target.value) }))} /></label>
              <label className="recipe-ingredients-field">
                Ingrédients
                <textarea value={form.ingredients} onChange={(event) => setForm((current) => ({ ...current, ingredients: event.target.value }))} />
                <small>Une ligne par ingrédient : nom, quantité, unité, catégorie.</small>
              </label>
              <button className="primary-action" type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 size={17} /> : <Save size={17} />}
                Enregistrer
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header compact">
              <h2>Recettes sauvegardées</h2>
              <span className="inventory-count">{recipes.length}</span>
            </div>
            {recipes.length === 0 ? (
              <div className="shopping-empty">Aucune recette personnalisée.</div>
            ) : (
              <div className="recipe-catalog">
                {recipes.map((recipe) => <RecipeCard key={recipeKey(recipe)} recipe={recipe} />)}
              </div>
            )}
          </section>
        </>
      )}
    </PageScaffold>
  );
}
