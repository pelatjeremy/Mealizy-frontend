"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, Loader2, RefreshCw } from "lucide-react";
import {
  addShoppingListItemToInventory,
  generateShoppingList,
  getApiErrorMessage,
  getShoppingList,
  readAuthToken,
  updateShoppingListItemChecked
} from "@/lib/api";
import type { ShoppingItem, ShoppingList } from "@/types/domain";
import { formatWeekParam, getWeekStart, WeekSelector } from "./WeekSelector";
import { ShoppingListItem } from "./ShoppingListItem";

type Status = "loading" | "ready" | "missing-token" | "error";

function splitItems(items: ShoppingItem[]) {
  return {
    toBuy: items.filter((item) => !item.checked),
    bought: items.filter((item) => item.checked)
  };
}

export function ShoppingListManager() {
  const [token, setToken] = useState("");
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const week = formatWeekParam(weekStart);
  const items = shoppingList?.items || [];
  const { toBuy, bought } = useMemo(() => splitItems(items), [items]);

  const loadList = useCallback(
    async (authToken: string) => {
      setStatus("loading");
      setNotice("");
      setError("");
      try {
        const list = await getShoppingList(authToken, week);
        setShoppingList(list);
        setStatus("ready");
      } catch (caughtError) {
        setError(getApiErrorMessage(caughtError, "Impossible de récupérer la liste de courses."));
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
    loadList(authToken);
  }, [loadList]);

  async function handleGenerate() {
    if (!token) return;
    setIsGenerating(true);
    setNotice("");
    setError("");
    try {
      await generateShoppingList(token, week);
      await loadList(token);
      setNotice("Liste de courses générée avec succès.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de générer la liste de courses."));
      setStatus("error");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggle(item: ShoppingItem, checked: boolean) {
    if (!token || !item.id) return;

    setBusyItemId(item.id);
    setNotice("");
    setError("");
    setShoppingList((current) =>
      current
        ? {
            ...current,
            items: current.items.map((entry) => (entry.id === item.id ? { ...entry, checked } : entry))
          }
        : current
    );

    try {
      const list = await updateShoppingListItemChecked(token, item.id, checked);
      setShoppingList(list);
      setNotice(checked ? "Article ajouté à l'inventaire." : "Article remis dans la liste à acheter.");
    } catch (caughtError) {
      setShoppingList((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) => (entry.id === item.id ? { ...entry, checked: item.checked } : entry))
            }
          : current
      );
      setError(getApiErrorMessage(caughtError, "Impossible d'ajouter cet article à l'inventaire."));
      setStatus("error");
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleAddToInventory(item: ShoppingItem) {
    if (!token || !item.id || item.checked) return;
    setBusyItemId(item.id);
    setNotice("");
    setError("");
    try {
      const list = await addShoppingListItemToInventory(token, item.id);
      setShoppingList(list);
      setNotice("Article ajouté à l'inventaire.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible d'ajouter cet article à l'inventaire."));
      setStatus("error");
    } finally {
      setBusyItemId(null);
    }
  }

  function renderItems(sectionItems: ShoppingItem[], emptyText: string, showAddToInventory: boolean) {
    if (sectionItems.length === 0) return <div className="shopping-empty">{emptyText}</div>;

    return (
      <ul className="shopping-list detailed">
        {sectionItems.map((item) => (
          <ShoppingListItem
            key={item.id}
            item={item}
            disabled={busyItemId === item.id}
            showAddToInventory={showAddToInventory}
            onToggle={handleToggle}
            onAddToInventory={handleAddToInventory}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="shopping-manager">
      <div className="panel shopping-toolbar">
        <div>
          <h2>Semaine de courses</h2>
          <p>{shoppingList?._id ? `${items.length} article${items.length > 1 ? "s" : ""} dans la liste.` : "Aucune liste générée pour cette semaine."}</p>
        </div>
        <WeekSelector weekStart={weekStart} onChange={setWeekStart} />
        <button type="button" className="primary-action" disabled={isGenerating || status === "missing-token"} onClick={handleGenerate}>
          {isGenerating ? <Loader2 size={17} /> : <RefreshCw size={17} />}
          Générer la liste
        </button>
      </div>

      {notice && <div className="state-panel success-state">{notice}</div>}
      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement de la liste...</div>}
      {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour gérer votre liste de courses.</div>}
      {status === "error" && <div className="state-panel"><CircleAlert size={22} /> {error || "Impossible de récupérer la liste de courses."}</div>}

      {status === "ready" && (
        <div className="shopping-sections">
          {!shoppingList?._id && (
            <div className="state-panel shopping-callout">
              Aucune liste générée pour cette semaine.
              <button type="button" className="primary-action" disabled={isGenerating} onClick={handleGenerate}>
                Générer ma liste de courses
              </button>
            </div>
          )}

          {shoppingList?._id && items.length === 0 && <div className="state-panel">Aucun article à acheter.</div>}

          {shoppingList?._id && items.length > 0 && (
            <>
              <section className="panel shopping-section">
                <div className="panel-header compact">
                  <h2>À acheter</h2>
                  <span>{toBuy.length}</span>
                </div>
                {renderItems(toBuy, "Aucun article à acheter.", true)}
              </section>

              <section className="panel shopping-section">
                <div className="panel-header compact">
                  <h2>Déjà achetés</h2>
                  <span>{bought.length}</span>
                </div>
                {renderItems(bought, "Aucun article déjà acheté.", false)}
              </section>
            </>
          )}
        </div>
      )}
    </section>
  );
}
