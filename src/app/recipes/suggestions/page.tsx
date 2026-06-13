import { RecipeBrowser } from "@/components/recipes/RecipeBrowser";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function RecipeSuggestionsPage() {
  return (
    <PageScaffold title="Suggestions" description="Suggestions calculees depuis votre inventaire.">
      <RecipeBrowser />
    </PageScaffold>
  );
}
