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
  return (
    <section className="panel">
      <div className="panel-header compact">
        <h2>Inventaire</h2>
        <a href="/inventory">Voir tout</a>
      </div>
      <div className="chips">
        {["Tout", "Fruits & Légumes", "Épicerie", "Produits laitiers", "Viandes & Poissons", "Autres"].map((chip, index) => (
          <span className={index === 0 ? "chip active" : "chip"} key={chip}>{chip}</span>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Produit</th><th>Quantité</th><th>Catégorie</th><th>Date de péremption</th></tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
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
    </section>
  );
}
