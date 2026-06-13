import { InventoryManager } from "@/components/inventory/InventoryManager";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function InventoryPage() {
  return (
    <PageScaffold
      title="Inventaire"
      description="Ajoutez, modifiez et surveillez les dates de peremption de vos produits."
    >
      <InventoryManager />
    </PageScaffold>
  );
}
