import { RecipeBrowser } from "@/components/recipes/RecipeBrowser";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function RecipesPage() {
  return (
    <PageScaffold title="Recettes" description="Suggestions calculees depuis votre inventaire.">
      <RecipeBrowser />
    </PageScaffold>
  );
}
