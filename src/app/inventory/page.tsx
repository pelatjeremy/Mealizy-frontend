"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, Loader2, PackagePlus, Pencil, Save, Trash2, X } from "lucide-react";
import {
  createInventoryItem,
  deleteInventoryItem,
  getApiErrorMessage,
  getInventory,
  readAuthToken,
  updateInventoryItem,
  type InventoryPayload
} from "@/lib/api";
import type { InventoryItem } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";

type Status = "loading" | "ready" | "missing-token" | "error";

const emptyForm: InventoryPayload = {
  name: "",
  quantity: 1,
  unit: "unit",
  category: "autres",
  expirationDate: ""
};

const units = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "unit", label: "unité" },
  { value: "slice", label: "tranche" },
  { value: "can", label: "boîte" },
  { value: "jar", label: "pot" },
  { value: "tbsp", label: "cuillère à soupe" },
  { value: "tsp", label: "cuillère à café" }
];

const categories = [
  { value: "fruits-legumes", label: "Fruits & Légumes" },
  { value: "epicerie", label: "Épicerie" },
  { value: "produits-laitiers", label: "Produits laitiers" },
  { value: "viandes-poissons", label: "Viandes & Poissons" },
  { value: "surgeles", label: "Surgelés" },
  { value: "autres", label: "Autres" }
];

function formatDateForInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function cleanPayload(payload: InventoryPayload): InventoryPayload {
  return {
    ...payload,
    name: payload.name.trim(),
    quantity: Number(payload.quantity),
    expirationDate: payload.expirationDate || undefined
  };
}

function categoryLabel(category: string) {
  return categories.find((item) => item.value === category)?.label || category;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
}

export default function InventoryPage() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [form, setForm] = useState<InventoryPayload>(emptyForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [items]);

  const loadInventory = useCallback(async (authToken: string) => {
    setStatus("loading");
    setError("");
    try {
      const results = await getInventory(authToken);
      setItems(results);
      setStatus("ready");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de récupérer l'inventaire."));
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
    loadInventory(authToken);
  }, [loadInventory]);

  function resetForm() {
    setForm(emptyForm);
    setEditingItemId(null);
    setError("");
  }

  function startEditing(item: InventoryItem) {
    setEditingItemId(item.id);
    setNotice("");
    setError("");
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expirationDate: formatDateForInput(item.expirationDate)
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const payload = cleanPayload(form);
    if (!payload.name || !Number.isFinite(payload.quantity) || payload.quantity < 0) {
      setError("Nom et quantité valide obligatoires.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingItemId) {
        await updateInventoryItem(token, editingItemId, payload);
        setNotice("Produit modifié.");
      } else {
        await createInventoryItem(token, payload);
        setNotice("Produit ajouté à l'inventaire.");
      }
      resetForm();
      await loadInventory(token);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible d'enregistrer le produit."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: InventoryItem) {
    if (!token) return;
    setBusyItemId(item.id);
    setError("");
    setNotice("");

    try {
      await deleteInventoryItem(token, item.id);
      setItems((currentItems) => currentItems.filter((entry) => entry.id !== item.id));
      if (editingItemId === item.id) resetForm();
      setNotice("Produit supprimé.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de supprimer le produit."));
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <PageScaffold
      title="Inventaire"
      description="Suivez les quantités disponibles, les catégories et les dates de péremption."
    >
      <section className="panel form-panel inventory-form-panel">
        <h2>{editingItemId ? "Modifier un produit" : "Ajouter un produit"}</h2>
        <form className="inventory-form" onSubmit={handleSubmit}>
          <label>
            Produit
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Tomates" />
          </label>
          <label>
            Quantité
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
            />
          </label>
          <label>
            Unité
            <select value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}>
              {units.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
            </select>
          </label>
          <label>
            Catégorie
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <label>
            Péremption
            <input type="date" value={form.expirationDate || ""} onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))} />
          </label>
          <div className="inventory-form-actions">
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 size={17} /> : <Save size={17} />}
              {editingItemId ? "Enregistrer" : "Ajouter"}
            </button>
            {editingItemId && (
              <button className="outline-action compact-action" type="button" onClick={resetForm}>
                <X size={17} />
                Annuler
              </button>
            )}
          </div>
        </form>
      </section>

      {notice && <div className="state-panel success-state">{notice}</div>}
      {error && <div className="state-panel"><CircleAlert size={22} /> {error}</div>}
      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement de l'inventaire</div>}
      {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour gérer votre inventaire.</div>}

      {status === "ready" && (
        <section className="panel">
          <div className="panel-header compact">
            <h2>Produits en stock</h2>
            <span className="inventory-count">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <div className="shopping-empty">Aucun produit dans l'inventaire.</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table inventory-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Catégorie</th>
                    <th>Péremption</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id}>
                      <td><PackagePlus size={20} /> {item.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{categoryLabel(item.category)}</td>
                      <td>{formatDate(item.expirationDate)}</td>
                      <td>
                        <div className="inventory-row-actions">
                          <button className="outline-action compact-action" type="button" onClick={() => startEditing(item)} disabled={busyItemId === item.id}>
                            <Pencil size={16} />
                            Modifier
                          </button>
                          <button className="outline-action compact-action danger-action" type="button" onClick={() => handleDelete(item)} disabled={busyItemId === item.id}>
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </PageScaffold>
  );
}
