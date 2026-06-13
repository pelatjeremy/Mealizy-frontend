"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { apiRequest, getToken } from "@/lib/client-api";
import { recipes } from "@/lib/demo-data";

type Plan = {
  _id: string;
  weekStartDate: string;
  day: number;
  mealType: string;
  recipeId: string;
  servings: number;
};

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

export function MealPlanManager() {
  const [weekStartDate, setWeekStartDate] = useState("2024-05-26");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ day: "0", mealType: "lunch", recipeId: "demo-one-pot-pasta", servings: "2" });
  const [message, setMessage] = useState("Connectez-vous pour synchroniser le planning.");

  async function load() {
    if (!getToken()) return;
    const payload = await apiRequest<Plan[]>(`/meal-plans?weekStartDate=${weekStartDate}`);
    setPlans(payload);
    setMessage("Planning synchronise avec le backend.");
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [weekStartDate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const plan = { weekStartDate, day: Number(form.day), mealType: form.mealType, recipeId: form.recipeId, servings: Number(form.servings) };
    if (!getToken()) {
      setPlans((current) => [...current, { ...plan, _id: crypto.randomUUID() }]);
      setMessage("Repas ajoute localement. Connectez-vous pour le sauvegarder.");
      return;
    }
    await apiRequest("/meal-plans", { method: "POST", body: JSON.stringify(plan) });
    await load();
  }

  async function remove(id: string) {
    if (getToken()) await apiRequest(`/meal-plans/${id}`, { method: "DELETE" });
    setPlans((current) => current.filter((plan) => plan._id !== id));
  }

  return (
    <section className="panel form-panel wide">
      <form className="inline-form" onSubmit={submit}>
        <label>Semaine<input value={weekStartDate} type="date" onChange={(event) => setWeekStartDate(event.target.value)} /></label>
        <label>Jour<select value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>{days.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
        <label>Repas<select value={form.mealType} onChange={(event) => setForm({ ...form, mealType: event.target.value })}>{mealTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
        <label>Recette<select value={form.recipeId} onChange={(event) => setForm({ ...form, recipeId: event.target.value })}>{recipes.slice(0, 6).map((recipe) => <option value={recipe.externalId} key={recipe.externalId}>{recipe.title}</option>)}</select></label>
        <label>Portions<input value={form.servings} min="1" type="number" onChange={(event) => setForm({ ...form, servings: event.target.value })} /></label>
        <button className="primary-action" type="submit"><CalendarPlus size={18} /> Planifier</button>
      </form>
      <p className="status-note">{message}</p>
      <div className="editable-list">
        {plans.map((plan) => (
          <article key={plan._id}>
            <span><strong>{days[plan.day]} · {plan.mealType}</strong><small>{plan.recipeId} · {plan.servings} portions</small></span>
            <button className="icon-danger" type="button" onClick={() => remove(plan._id)}><Trash2 size={17} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}
