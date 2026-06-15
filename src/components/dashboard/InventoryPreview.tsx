import { Apple, Egg, Milk, Package2 } from "lucide-react";
import type { InventoryItem } from "@/types/domain";

const icons = [Apple, Egg, Package2, Package2, Milk];
const categoryLabels: Record<string, string> = {
  "fruits-legumes": "Fruits & Légumes",
  epicerie: "Épicerie",
  "produits-laitiers": "Produits laitiers",
  "viandes-poissons": "Viandes & Poissons",
  surgeles: "Surgelés",
  autres: "Autres"
};

function formatExpirationDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
}

export function InventoryPreview({ items }: { items: InventoryItem[] }) {
  const previewItems = items.slice(0, 5);

  return (
    <section className="panel">
      <div className="panel-header compact">
        <h2>Inventaire</h2>
        <a href="/inventory">Voir tout</a>
      </div>
      {previewItems.length === 0 ? (
        <div className="shopping-empty">Aucun produit dans l'inventaire.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Produit</th><th>Quantité</th><th>Catégorie</th><th>Date de péremption</th></tr>
          </thead>
          <tbody>
            {previewItems.map((item, index) => {
              const Icon = icons[index] || Package2;
              return (
                <tr key={item.id}>
                  <td><Icon size={20} /> {item.name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{categoryLabels[item.category] || item.category}</td>
                  <td>{formatExpirationDate(item.expirationDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
