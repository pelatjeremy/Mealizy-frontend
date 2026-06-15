"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { MealPlan } from "@/types/domain";

type MacroKey = "protein" | "carbs" | "fat";

const macroLabels: Record<MacroKey, string> = {
  protein: "Protéines",
  carbs: "Glucides",
  fat: "Lipides"
};

const macroColors: Record<MacroKey, string> = {
  protein: "#3b82f6",
  carbs: "#39a96b",
  fat: "#f59e0b"
};

function numberValue(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function NutritionPanel({ mealPlans }: { mealPlans: MealPlan[] }) {
  const nutritionPlans = mealPlans.filter((plan) => {
    const nutrition = plan.recipe?.nutrition;
    return numberValue(nutrition?.calories || plan.recipe?.calories) > 0;
  });

  const averageCalories = nutritionPlans.length
    ? Math.round(
        nutritionPlans.reduce((sum, plan) => sum + numberValue(plan.recipe?.nutrition?.calories || plan.recipe?.calories), 0) /
          nutritionPlans.length
      )
    : 0;

  const macroTotals = nutritionPlans.reduce<Record<MacroKey, number>>(
    (totals, plan) => {
      totals.protein += numberValue(plan.recipe?.nutrition?.protein);
      totals.carbs += numberValue(plan.recipe?.nutrition?.carbs);
      totals.fat += numberValue(plan.recipe?.nutrition?.fat);
      return totals;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  const macroTotal = macroTotals.protein + macroTotals.carbs + macroTotals.fat;
  const data = (Object.keys(macroTotals) as MacroKey[]).map((key) => ({
    name: macroLabels[key],
    value: macroTotal ? Math.round((macroTotals[key] / macroTotal) * 100) : 0,
    color: macroColors[key]
  }));

  return (
    <section className="panel nutrition">
      <h2>Apports nutritionnels</h2>
      {nutritionPlans.length === 0 ? (
        <div className="shopping-empty">Aucune donnée nutritionnelle disponible pour les repas planifiés.</div>
      ) : (
        <div className="nutrition-body">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={36} outerRadius={54} paddingAngle={2}>
                  {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span><strong>{averageCalories}</strong> kcal</span>
          </div>
          <ul>
            {data.map((entry) => (
              <li key={entry.name}><i style={{ background: entry.color }} /> {entry.name} <strong>{entry.value}%</strong></li>
            ))}
          </ul>
        </div>
      )}
      <a className="outline-action" href="/profile">Voir le détail des nutriments</a>
    </section>
  );
}
