"use client";

import { useEffect, useState } from "react";
import { apiRequest, getToken } from "@/lib/client-api";

export function LiveDashboardSummary() {
  const [summary, setSummary] = useState({
    inventoryCount: 0,
    mealPlanCount: 0,
    shoppingCount: 0,
    expiringCount: 0,
    status: "Connectez-vous pour afficher les donnees reelles du backend."
  });

  useEffect(() => {
    if (!getToken()) return;

    Promise.all([
      apiRequest<unknown[]>("/inventory"),
      apiRequest<unknown[]>("/meal-plans"),
      apiRequest<Array<{ items: unknown[] }>>("/shopping-list"),
      apiRequest<unknown[]>("/inventory/expiring-soon")
    ])
      .then(([inventory, mealPlans, shoppingLists, expiring]) => {
        setSummary({
          inventoryCount: inventory.length,
          mealPlanCount: mealPlans.length,
          shoppingCount: shoppingLists[0]?.items?.length || 0,
          expiringCount: expiring.length,
          status: "Donnees reelles synchronisees avec le backend."
        });
      })
      .catch((error) => setSummary((current) => ({ ...current, status: error.message })));
  }, []);

  return (
    <section className="live-summary" aria-label="Donnees backend">
      <span>{summary.status}</span>
      <strong>{summary.inventoryCount} produits</strong>
      <strong>{summary.mealPlanCount} repas</strong>
      <strong>{summary.shoppingCount} courses</strong>
      <strong>{summary.expiringCount} bientot perimes</strong>
    </section>
  );
}
