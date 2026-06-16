"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  createCustomRecipe,
  deleteCustomRecipe,
  getApiErrorMessage,
  getMyRecipes,
  readAuthToken,
  updateCustomRecipe,
  type RecipePayload
} from "@/lib/api";
import type { Recipe, RecipeIngredient } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";

type Status = "loading" | "ready" | "missing-token" | "error";
type RecipeFormState = {
  title: string;
  image: string;
  preparationTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string;
};

const emptyForm: RecipeFormState = {
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

function formatIngredients(ingredients: RecipeIngredient[] = []) {
  return ingredients
    .map((ingredient) => `${ingredient.ingredientName}, ${ingredient.quantity || 1}, ${ingredient.unit || "unit"}, ${ingredient.category || "autres"}`)
    .join("\n");
}

function recipeKey(recipe: Recipe) {
  return recipe._id || recipe.externalId || recipe.id || recipe.title;
}

function editableRecipeId(recipe: Recipe) {
  return recipe._id || recipe.id || "";
}

function recipeToForm(recipe: Recipe): RecipeFormState {
  return {
    title: recipe.title || "",
    image: recipe.image || "",
    preparationTime: Number(recipe.preparationTime || 20),
    servings: Number(recipe.servings || 2),
    calories: Number(recipe.nutrition?.calories || 0),
    protein: Number(recipe.nutrition?.protein || 0),
    carbs: Number(recipe.nutrition?.carbs || 0),
    fat: Number(recipe.nutrition?.fat || 0),
    ingredients: formatIngredients(recipe.ingredients || [])
  };
}

function buildPayload(form: RecipeFormState): RecipePayload {
  return {
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
    ingredients: parseIngredients(form.ingredients)
  };
}

function RecipeImage({ recipe }: { recipe: Recipe }) {
  if (!recipe.image) return <div className="recipe-image-placeholder">Mealizy</div>;
  return <img src={recipe.image} alt="" />;
}

function RecipeCard({
  recipe,
  isDeleting,
  onEdit,
  onDelete
}: {
  recipe: Recipe;
  isDeleting: boolean;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}) {
  const ingredients = recipe.ingredients || [];

  return (
    <article className="recipe-card">
      <RecipeImage recipe={recipe} />
      <div>
        <strong>{recipe.title}</strong>
        <span>{recipe.preparationTime || 0} min - {recipe.nutrition?.calories || 0} kcal - {recipe.servings || 1} portions</span>
        <small>{ingredients.length ? ingredients.map((ingredient) => ingredient.ingredientName).slice(0, 5).join(", ") : "Ingrédients non renseignés."}</small>
        <div className="recipe-card-actions">
          <button type="button" className="outline-action compact-action" onClick={() => onEdit(recipe)}>
            <Pencil size={15} />
            Modifier
          </button>
          <button type="button" className="outline-action compact-action danger-action" disabled={isDeleting} onClick={() => onDelete(recipe)}>
            {isDeleting ? <Loader2 size={15} /> : <Trash2 size={15} />}
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}

function RecipeFormModal({
  form,
  mode,
  isSaving,
  onChange,
  onClose,
  onSubmit
}: {
  form: RecipeFormState;
  mode: "create" | "edit";
  isSaving: boolean;
  onChange: (form: RecipeFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = mode === "edit" ? "Modifier la recette" : "Créer une recette";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <article className="planning-modal recipe-editor-modal">
        <header>
          <div>
            <h2>{title}</h2>
            <p>Une ligne par ingrédient : nom, quantité, unité, catégorie.</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form className="recipe-form" onSubmit={onSubmit}>
          <label>Titre<input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="Salade maison" /></label>
          <label>Image URL<input value={form.image} onChange={(event) => onChange({ ...form, image: event.target.value })} placeholder="https://..." /></label>
          <label>Temps<input min="1" type="number" value={form.preparationTime} onChange={(event) => onChange({ ...form, preparationTime: Number(event.target.value) })} /></label>
          <label>Portions<input min="1" type="number" value={form.servings} onChange={(event) => onChange({ ...form, servings: Number(event.target.value) })} /></label>
          <label>Calories<input min="0" type="number" value={form.calories} onChange={(event) => onChange({ ...form, calories: Number(event.target.value) })} /></label>
          <label>Protéines<input min="0" type="number" value={form.protein} onChange={(event) => onChange({ ...form, protein: Number(event.target.value) })} /></label>
          <label>Glucides<input min="0" type="number" value={form.carbs} onChange={(event) => onChange({ ...form, carbs: Number(event.target.value) })} /></label>
          <label>Lipides<input min="0" type="number" value={form.fat} onChange={(event) => onChange({ ...form, fat: Number(event.target.value) })} /></label>
          <label className="recipe-ingredients-field">
            Ingrédients
            <textarea value={form.ingredients} onChange={(event) => onChange({ ...form, ingredients: event.target.value })} />
            <small>Exemple : Tomates, 2, unit, fruits-legumes</small>
          </label>
          <div className="form-actions">
            <button type="button" className="outline-action" onClick={onClose} disabled={isSaving}>
              Annuler
            </button>
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 size={17} /> : <Save size={17} />}
              Enregistrer
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}

export default function MyRecipesPage() {
  const [token, setToken] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [form, setForm] = useState<RecipeFormState>(emptyForm);
  const [editingRecipeId, setEditingRecipeId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState("");

  const formMode = useMemo(() => (editingRecipeId ? "edit" : "create"), [editingRecipeId]);

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

  function openCreateForm() {
    setForm(emptyForm);
    setEditingRecipeId("");
    setError("");
    setNotice("");
    setIsFormOpen(true);
  }

  function openEditForm(recipe: Recipe) {
    const id = editableRecipeId(recipe);
    if (!id) {
      setError("Cette recette ne peut pas être modifiée.");
      return;
    }
    setForm(recipeToForm(recipe));
    setEditingRecipeId(id);
    setError("");
    setNotice("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingRecipeId("");
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const payload = buildPayload(form);

    if (!payload.title || payload.preparationTime < 1 || payload.servings < 1 || payload.ingredients.length === 0) {
      setError("Titre, temps, portions et au moins un ingrédient valides sont obligatoires.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingRecipeId) {
        const updatedRecipe = await updateCustomRecipe(token, editingRecipeId, payload);
        setRecipes((items) => items.map((recipe) => (recipeKey(recipe) === recipeKey(updatedRecipe) ? updatedRecipe : recipe)));
        setNotice("Recette modifiée.");
      } else {
        const createdRecipe = await createCustomRecipe(token, payload);
        setRecipes((items) => [createdRecipe, ...items]);
        setNotice("Recette créée.");
      }
      setIsFormOpen(false);
      setEditingRecipeId("");
      setForm(emptyForm);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, editingRecipeId ? "Impossible de modifier la recette." : "Impossible de créer la recette."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(recipe: Recipe) {
    if (!token) return;
    const id = editableRecipeId(recipe);
    if (!id) {
      setError("Cette recette ne peut pas être supprimée.");
      return;
    }
    if (!window.confirm(`Supprimer la recette "${recipe.title}" ?`)) return;

    setDeletingRecipeId(id);
    setError("");
    setNotice("");

    try {
      await deleteCustomRecipe(token, id);
      setRecipes((items) => items.filter((item) => editableRecipeId(item) !== id));
      setNotice("Recette supprimée.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de supprimer la recette."));
    } finally {
      setDeletingRecipeId("");
    }
  }

  return (
    <PageScaffold title="Mes recettes" description="Créez et retrouvez vos recettes personnalisées stockées en base.">
      {notice && <div className="state-panel success-state">{notice}</div>}
      {error && <div className="state-panel"><CircleAlert size={22} /> {error}</div>}
      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement des recettes</div>}
      {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour gérer vos recettes.</div>}

      {status === "ready" && (
        <section className="panel">
          <div className="panel-header compact">
            <div>
              <h2>Recettes sauvegardées</h2>
              <p>{recipes.length} recette{recipes.length > 1 ? "s" : ""} personnelle{recipes.length > 1 ? "s" : ""}</p>
            </div>
            <button type="button" className="primary-action compact-action" onClick={openCreateForm}>
              <Plus size={17} />
              Créer une recette
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="shopping-empty">Aucune recette personnalisée.</div>
          ) : (
            <div className="recipe-catalog">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipeKey(recipe)}
                  recipe={recipe}
                  isDeleting={deletingRecipeId === editableRecipeId(recipe)}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {isFormOpen && (
        <RecipeFormModal
          form={form}
          mode={formMode}
          isSaving={isSaving}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </PageScaffold>
  );
}
