import { Search } from "lucide-react";
import { PageScaffold } from "@/components/ui/PageScaffold";
import { recipes } from "@/lib/demo-data";

export default function RecipesPage() {
  return (
    <PageScaffold title="Recettes" description="Explorez les recettes compatibles avec votre inventaire et vos équipements.">
      <div className="search-bar"><Search size={18} /><input placeholder="Rechercher une recette ou un ingrédient" /></div>
      <section className="recipe-catalog">
        {recipes.slice(0, 9).map((recipe) => (
          <article className="recipe-card" key={recipe.externalId}>
            <img src={recipe.image} alt="" />
            <div>
              <strong>{recipe.title}</strong>
              <span>{recipe.preparationTime} min · {recipe.nutrition.calories} kcal</span>
            </div>
          </article>
        ))}
      </section>
    </PageScaffold>
  );
}
