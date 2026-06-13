"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiRequest, getToken } from "@/lib/client-api";
import { shoppingList as demoShoppingList } from "@/lib/demo-data";
import { ShoppingItem } from "@/types/domain";

type ApiShoppingList = {
  _id: string;
  items: Array<ShoppingItem & { _id: string }>;
};

const weekStartDate = "2024-05-26";

export function ShoppingListManager() {
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>(demoShoppingList);
  const [message, setMessage] = useState("Données de démonstration tant que vous n’êtes pas connecté.");

  function applyList(list?: ApiShoppingList) {
    if (!list) return;
    setListId(list._id);
    setItems(list.items.map((item) => ({ ...item, id: item._id })));
  }

  async function load() {
    if (!getToken()) return;
    const lists = await apiRequest<ApiShoppingList[]>(`/shopping-list?weekStartDate=${weekStartDate}`);
    applyList(lists[0]);
    setMessage("Liste synchronisée avec le backend.");
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  async function generate() {
    if (!getToken()) {
      setMessage("Connectez-vous pour générer une liste depuis le planning.");
      return;
    }
    const list = await apiRequest<ApiShoppingList>("/shopping-list/generate", {
      method: "POST",
      body: JSON.stringify({ weekStartDate })
    });
    applyList(list);
    setMessage("Liste générée depuis le planning.");
  }

  async function toggle(item: ShoppingItem) {
    const checked = !item.checked;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, checked } : entry));
    if (getToken()) {
      const list = await apiRequest<ApiShoppingList>(`/shopping-list/items/${item.id}/check`, {
        method: "PUT",
        body: JSON.stringify({ checked, addToInventory: checked })
      });
      applyList(list);
    }
  }

  return (
    <section className="panel shopping-preview">
      <div className="panel-header compact">
        <h2>Produits à acheter</h2>
        <button className="primary-action" type="button" onClick={generate}><RefreshCw size={17} /> Générer</button>
      </div>
      <p className="status-note">{message}{listId ? ` Liste ${listId.slice(-6)}.` : ""}</p>
      <ul className="shopping-list interactive">
        {items.map((item) => (
          <li key={item.id}>
            <button className={item.checked ? "checkbox checked" : "checkbox"} aria-label="Cocher" type="button" onClick={() => toggle(item)} />
            <strong>{item.ingredientName}</strong>
            <small>{item.quantity} {item.unit}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
