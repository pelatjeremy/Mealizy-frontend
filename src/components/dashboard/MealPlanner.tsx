"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Apple, BookOpen, ChefHat, ChevronLeft, ChevronRight, CircleAlert, Coffee, Loader2, MoreHorizontal, Moon, Pencil, Sun, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMealPlan, getApiErrorMessage, getMealPlans, getProfile, readAuthToken, updateMealPlan } from "@/lib/api";
import type { MealPlan, MealPlanDay, MealPlanRecipe, MealType, UserProfile } from "@/types/domain";

const dayKeys: MealPlanDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dayLabels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const mealRows: { key: MealType; label: string; icon: typeof Coffee }[] = [
  { key: "breakfast", label: "Petit-déjeuner", icon: Coffee },
  { key: "lunch", label: "Déjeuner", icon: Sun },
  { key: "dinner", label: "Dîner", icon: Moon },
  { key: "snack", label: "Collation", icon: Apple }
];

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

function addWeeks(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount * 7);
  return next;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addWeeks(weekStart, 1);
  weekEnd.setDate(weekEnd.getDate() - 1);

  return `${weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })}`;
}

function planKey(day: MealPlanDay, mealType: MealType) {
  return `${day}:${mealType}`;
}

function NutritionLine({ recipe }: { recipe: MealPlanRecipe }) {
  const nutrition = recipe.nutrition;
  if (!nutrition) return null;

  return (
    <div className="cook-nutrition">
      <span>{nutrition.calories || recipe.calories || 0} kcal</span>
      <span>{nutrition.protein || 0} g protéines</span>
      <span>{nutrition.carbs || 0} g glucides</span>
      <span>{nutrition.fat || 0} g lipides</span>
    </div>
  );
}

function CookingModeModal({ plan, onClose }: { plan: MealPlan; onClose: () => void }) {
  const recipe = plan.recipe;
  if (!recipe) return null;

  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <article className="cooking-modal">
        <header>
          <div>
            <h2>{recipe.title}</h2>
            <p>{plan.servings} portions · {recipe.preparationTime || 0} min</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        </header>

        {recipe.image && <img className="cook-image" src={recipe.image} alt="" />}

        <NutritionLine recipe={recipe} />

        <section>
          <h3>Ingrédients</h3>
          {ingredients.length === 0 ? (
            <p className="form-note">Ingrédients non disponibles pour cette recette.</p>
          ) : (
            <ul className="cook-list">
              {ingredients.map((ingredient, index) => (
                <li key={`${ingredient.ingredientName}-${index}`}>
                  <strong>{ingredient.ingredientName}</strong>
                  <span>{ingredient.quantity} {ingredient.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Préparation</h3>
          {instructions.length === 0 ? (
            <p className="form-note">Étapes de préparation non disponibles pour cette recette.</p>
          ) : (
            <ol className="cook-steps">
              {instructions.map((instruction, index) => <li key={`${instruction}-${index}`}>{instruction}</li>)}
            </ol>
          )}
        </section>
      </article>
    </div>
  );
}

function MealSlot({
  plan,
  openMenuId,
  onToggleMenu,
  onCook,
  onViewRecipe,
  onDelete,
  onUpdateServings
}: {
  plan?: MealPlan;
  openMenuId: string | null;
  onToggleMenu: (plan: MealPlan) => void;
  onCook: (plan: MealPlan) => void;
  onViewRecipe: (plan: MealPlan) => void;
  onDelete: (plan: MealPlan) => void;
  onUpdateServings: (plan: MealPlan) => void;
}) {
  if (!plan) return <article className="meal-slot meal-slot-empty">Disponible</article>;

  const isMenuOpen = openMenuId === plan._id;

  return (
    <article className="meal-slot planned-slot">
      {plan.recipe?.image && <img src={plan.recipe.image} alt="" />}
      <strong>{plan.recipe?.title || "Recette"}</strong>
      <span>{plan.recipe?.preparationTime || 0} min</span>
      <span>{plan.recipe?.calories || 0} kcal</span>
      <span>{plan.servings} portions</span>
      <div className="meal-actions">
        <button type="button" aria-label="Actions du repas" aria-expanded={isMenuOpen} onClick={() => onToggleMenu(plan)}>
          <MoreHorizontal size={16} />
        </button>
        {isMenuOpen && (
          <div className="meal-actions-menu">
            <button type="button" onClick={() => onCook(plan)}><ChefHat size={15} /> Cuisiner</button>
            <button type="button" onClick={() => onViewRecipe(plan)}><BookOpen size={15} /> Voir la recette</button>
            <button type="button" onClick={() => onUpdateServings(plan)}><Pencil size={15} /> Modifier les portions</button>
            <button type="button" onClick={() => onDelete(plan)}><Trash2 size={15} /> Supprimer du planning</button>
          </div>
        )}
      </div>
    </article>
  );
}

type MealPlannerProps = {
  onChanged?: () => void;
  weekStart?: Date;
  onWeekStartChange?: (weekStart: Date) => void;
};

export function MealPlanner({ onChanged, weekStart: controlledWeekStart, onWeekStartChange }: MealPlannerProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [servingsPlan, setServingsPlan] = useState<MealPlan | null>(null);
  const [servingsValue, setServingsValue] = useState("");
  const [servingsError, setServingsError] = useState("");
  const [isSavingServings, setIsSavingServings] = useState(false);
  const [internalWeekStart, setInternalWeekStart] = useState(() => getMonday());
  const [status, setStatus] = useState<"loading" | "ready" | "missing-token" | "error">("loading");
  const [error, setError] = useState("");
  const weekStart = controlledWeekStart ?? internalWeekStart;
  const week = formatDateInput(weekStart);

  const setDisplayedWeekStart = useCallback(
    (nextWeekStart: Date | ((current: Date) => Date)) => {
      const next = typeof nextWeekStart === "function" ? nextWeekStart(weekStart) : nextWeekStart;
      if (controlledWeekStart === undefined) {
        setInternalWeekStart(next);
      }
      onWeekStartChange?.(next);
    },
    [controlledWeekStart, onWeekStartChange, weekStart]
  );

  const visibleMeals = useMemo(() => {
    const enabled = profile?.enabledMealTypes?.length ? profile.enabledMealTypes : mealRows.map((meal) => meal.key);
    return mealRows.filter((meal) => enabled.includes(meal.key));
  }, [profile]);

  const planMap = useMemo(() => {
    return plans.reduce<Record<string, MealPlan>>((map, plan) => {
      map[planKey(plan.day, plan.mealType)] = plan;
      return map;
    }, {});
  }, [plans]);

  const loadWeek = useCallback(
    async (authToken: string) => {
      setStatus("loading");
      setError("");
      try {
        const [userProfile, weekPlans] = await Promise.all([getProfile(authToken), getMealPlans(authToken, week)]);
        setProfile(userProfile);
        setPlans(weekPlans);
        setStatus("ready");
      } catch (caughtError) {
        setError(getApiErrorMessage(caughtError, "Impossible de récupérer le planning."));
        setStatus("error");
      }
    },
    [week]
  );

  useEffect(() => {
    const authToken = readAuthToken();
    setToken(authToken);
    if (!authToken) {
      setStatus("missing-token");
      return;
    }
    loadWeek(authToken);
  }, [loadWeek]);

  const closeServingsModal = useCallback(() => {
    if (isSavingServings) return;
    setServingsPlan(null);
    setServingsValue("");
    setServingsError("");
  }, [isSavingServings]);

  useEffect(() => {
    if (!servingsPlan) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeServingsModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeServingsModal, servingsPlan]);

  function openServingsModal(plan: MealPlan) {
    setOpenMenuId(null);
    setServingsPlan(plan);
    setServingsValue(String(plan.servings));
    setServingsError("");
  }

  async function handleDelete(plan: MealPlan) {
    if (!token) return;
    try {
      await deleteMealPlan(token, plan._id);
      setPlans((items) => items.filter((item) => item._id !== plan._id));
      setOpenMenuId(null);
      onChanged?.();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de supprimer ce repas."));
      setStatus("error");
    }
  }

  async function handleSaveServings() {
    if (!token || !servingsPlan) return;

    const parsedValue = Number(servingsValue);
    if (!servingsValue.trim() || !Number.isFinite(parsedValue) || parsedValue <= 0) {
      setServingsError("Saisissez un nombre de portions supérieur à 0.");
      return;
    }

    setIsSavingServings(true);
    setServingsError("");
    try {
      const updated = await updateMealPlan(token, servingsPlan._id, { servings: parsedValue });
      setPlans((items) => items.map((item) => (item._id === updated._id ? updated : item)));
      setOpenMenuId(null);
      setServingsPlan(null);
      setServingsValue("");
      onChanged?.();
    } catch (caughtError) {
      setServingsError(getApiErrorMessage(caughtError, "Impossible d'enregistrer les portions. Réessayez dans un instant."));
    } finally {
      setIsSavingServings(false);
    }
  }

  function handleToggleMenu(plan: MealPlan) {
    setOpenMenuId((current) => (current === plan._id ? null : plan._id));
  }

  function handleCook(plan: MealPlan) {
    setOpenMenuId(null);
    setSelectedPlan(plan);
  }

  function handleViewRecipe(plan: MealPlan) {
    const recipeId = plan.recipe?.id || plan.recipeId;
    if (!recipeId) return;
    setOpenMenuId(null);
    router.push(`/recipes/${encodeURIComponent(recipeId)}?source=${encodeURIComponent(plan.recipeSource)}`);
  }

  return (
    <section className="panel meal-panel">
      <div className="panel-header">
        <h2>Planning des repas</h2>
        <div className="week-switcher">
          <button type="button" aria-label="Semaine précédente" onClick={() => setDisplayedWeekStart((date) => addWeeks(date, -1))}>
            <ChevronLeft size={17} />
          </button>
          <span>{formatWeekRange(weekStart)}</span>
          <button type="button" aria-label="Semaine suivante" onClick={() => setDisplayedWeekStart((date) => addWeeks(date, 1))}>
            <ChevronRight size={17} />
          </button>
        </div>
        <button type="button" className="outline-action compact-action" onClick={() => setDisplayedWeekStart(getMonday())}>
          Semaine actuelle
        </button>
      </div>

      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement du planning</div>}
      {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour voir votre planning.</div>}
      {status === "error" && <div className="state-panel"><CircleAlert size={22} /> {error || "Impossible de récupérer le planning."}</div>}

      {status === "ready" && (
        <>
          {plans.length === 0 && <div className="state-panel">Aucun repas planifié pour cette semaine.</div>}
          <div className="scroll-hint">Faites défiler le planning horizontalement.</div>
          <div className="meal-grid-scroll">
            <div className="meal-grid full-meal-grid">
              <div className="grid-spacer" />
              {dayLabels.map((day) => <strong className="day-label" key={day}>{day}</strong>)}
              {visibleMeals.map((meal) => (
                <Fragment key={meal.key}>
                  <div className="meal-label">
                    <meal.icon size={22} />
                    <span>{meal.label}</span>
                  </div>
                  {dayKeys.map((day) => (
                    <MealSlot
                      key={planKey(day, meal.key)}
                      plan={planMap[planKey(day, meal.key)]}
                      openMenuId={openMenuId}
                      onToggleMenu={handleToggleMenu}
                      onCook={handleCook}
                      onViewRecipe={handleViewRecipe}
                      onDelete={handleDelete}
                      onUpdateServings={openServingsModal}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
          {selectedPlan && <CookingModeModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
        </>
      )}

      {servingsPlan && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeServingsModal();
        }}>
          <div className="planning-modal" role="dialog" aria-modal="true" aria-labelledby="servings-modal-title">
            <header>
              <div>
                <h2 id="servings-modal-title">Modifier les portions</h2>
                <p>{servingsPlan.recipe?.title || "Recette"}</p>
              </div>
              <button type="button" aria-label="Fermer" onClick={closeServingsModal} disabled={isSavingServings}>
                <X size={17} />
              </button>
            </header>
            <form className="servings-form" noValidate onSubmit={(event) => {
              event.preventDefault();
              void handleSaveServings();
            }}>
              <p className="form-note">Portions actuelles : {servingsPlan.servings}</p>
              <label>
                Nouvelles portions
                <input
                  autoFocus
                  min="1"
                  step="1"
                  inputMode="numeric"
                  type="number"
                  value={servingsValue}
                  onChange={(event) => {
                    setServingsValue(event.target.value);
                    setServingsError("");
                  }}
                  aria-invalid={Boolean(servingsError)}
                  aria-describedby={servingsError ? "servings-error" : undefined}
                />
              </label>
              {servingsError && <p className="form-error" id="servings-error">{servingsError}</p>}
              <div className="modal-actions">
                <button type="button" className="outline-action" onClick={closeServingsModal} disabled={isSavingServings}>
                  Annuler
                </button>
                <button type="submit" className="primary-action" disabled={isSavingServings}>
                  {isSavingServings ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
