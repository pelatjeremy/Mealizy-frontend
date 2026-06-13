import { RecipeBrowser } from "@/components/recipes/RecipeBrowser";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function RecipesPage() {
  return (
    <PageScaffold title="Recettes" description="Explorez les recettes compatibles avec votre inventaire et vos equipements.">
      <RecipeBrowser />
    </PageScaffold>
  );
}
