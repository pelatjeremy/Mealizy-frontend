import { ShoppingListManager } from "@/components/shopping/ShoppingListManager";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function ShoppingListPage() {
  return (
    <PageScaffold
      title="Liste de courses"
      description="Generez la liste depuis le planning et ajoutez les achats coches a l’inventaire."
    >
      <ShoppingListManager />
    </PageScaffold>
  );
}
