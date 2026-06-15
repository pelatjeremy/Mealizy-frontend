import type { ShoppingItem } from "@/types/domain";

export function ShoppingPreview({ items }: { items: ShoppingItem[] }) {
  const previewItems = items.slice(0, 6);

  return (
    <section className="panel shopping-preview">
      <div className="panel-header compact">
        <h2>Liste de courses</h2>
        <span>{items.length} produit{items.length > 1 ? "s" : ""}</span>
      </div>
      {previewItems.length === 0 ? (
        <div className="shopping-empty">Aucun article à acheter.</div>
      ) : (
        <ul className="shopping-list">
          {previewItems.map((item) => (
            <li key={item.id}>
              <span className="checkbox" />
              <strong>{item.ingredientName}</strong>
              <small>{item.quantity} {item.unit}</small>
            </li>
          ))}
        </ul>
      )}
      <a className="outline-action" href="/shopping-list">Voir la liste complète</a>
    </section>
  );
}
