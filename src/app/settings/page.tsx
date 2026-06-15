import { PageScaffold } from "@/components/ui/PageScaffold";

export default function SettingsPage() {
  return (
    <PageScaffold title="Paramètres" description="Configurez l'API recettes, la sécurité et les préférences d'affichage.">
      <section className="panel form-panel">
        <label>URL API backend<input defaultValue={process.env.NEXT_PUBLIC_API_URL || ""} readOnly /></label>
        <label>Fournisseur recettes<input defaultValue="Spoonacular ou données de démonstration" readOnly /></label>
      </section>
    </PageScaffold>
  );
}
