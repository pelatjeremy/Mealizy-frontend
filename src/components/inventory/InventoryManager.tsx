"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { apiRequest, getToken } from "@/lib/client-api";
import { inventory as demoInventory } from "@/lib/demo-data";
import { InventoryItem } from "@/types/domain";

type ApiInventoryItem = {
  _id: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  ingredientId?: {
    name: string;
    category: string;
  };
};

const emptyForm = {
  name: "",
  quantity: "1",
  unit: "unité",
  category: "autres",
  expirationDate: ""
};

function mapItem(item: ApiInventoryItem): InventoryItem {
  return {
    id: item._id,
    name: item.ingredientId?.name || "Produit",
    quantity: item.quantity,
    unit: item.unit,
    category: item.ingredientId?.category || "autres",
    expirationDate: item.expirationDate || ""
  };
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>(demoInventory);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("Données de démonstration tant que vous n’êtes pas connecté.");

  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const fiveDays = 5 * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
      if (!item.expirationDate) return false;
      const date = new Date(item.expirationDate).getTime();
      return date >= now && date - now <= fiveDays;
    });
  }, [items]);

  async function loadInventory() {
    if (!getToken()) return;
    const payload = await apiRequest<ApiInventoryItem[]>("/inventory");
    setItems(payload.map(mapItem));
    setMessage("Inventaire synchronisé avec le backend.");
  }

  useEffect(() => {
    loadInventory().catch((error) => setMessage(error.message));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = {
      ...form,
      quantity: Number(form.quantity),
      expirationDate: form.expirationDate || undefined
    };

    if (!getToken()) {
      setItems((current) => [
        ...current,
        { id: crypto.randomUUID(), ...body, quantity: Number(form.quantity), expirationDate: form.expirationDate }
      ]);
      setForm(emptyForm);
      setMessage("Produit ajouté en local. Connectez-vous pour le sauvegarder.");
      return;
    }

    if (editingId) {
      await apiRequest(`/inventory/${editingId}`, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await apiRequest("/inventory", { method: "POST", body: JSON.stringify(body) });
    }
    setEditingId(null);
    setForm(emptyForm);
    await loadInventory();
  }

  async function remove(id: string) {
    if (getToken()) await apiRequest(`/inventory/${id}`, { method: "DELETE" });
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function edit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
      expirationDate: item.expirationDate ? item.expirationDate.slice(0, 10) : ""
    });
  }

  return (
    <section className="panel form-panel wide">
      <form className="inline-form" onSubmit={submit}>
        <label>Produit<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Quantité<input value={form.quantity} min="0" step="0.1" type="number" onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></label>
        <label>Unité<input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} required /></label>
        <label>Catégorie<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
        <label>Péremption<input value={form.expirationDate} type="date" onChange={(event) => setForm({ ...form, expirationDate: event.target.value })} /></label>
        <button className="primary-action" type="submit">{editingId ? <Save size={18} /> : <Plus size={18} />} {editingId ? "Enregistrer" : "Ajouter"}</button>
      </form>

      <p className="status-note">{message}</p>
      {expiringSoon.length > 0 && <p className="waste-alert">Anti-gaspillage : {expiringSoon.map((item) => item.name).join(", ")} expire bientôt.</p>}

      <div className="editable-list">
        {items.map((item) => (
          <article key={item.id}>
            <span><strong>{item.name}</strong><small>{item.quantity} {item.unit} · {item.category}</small></span>
            <span>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString("fr-FR") : "Sans date"}</span>
            <button type="button" onClick={() => edit(item)}>Modifier</button>
            <button className="icon-danger" aria-label="Supprimer" type="button" onClick={() => remove(item.id)}><Trash2 size={17} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}
