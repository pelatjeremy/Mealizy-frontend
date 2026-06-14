import { MealPlanManager } from "@/components/meal-plans/MealPlanManager";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function MealPlansPage() {
  return (
    <PageScaffold title="Planning repas" description="Planifiez les repas de la semaine par jour et par type de repas.">
      <MealPlanManager />
    </PageScaffold>
  );
}
