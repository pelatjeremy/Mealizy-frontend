import { ChevronLeft, ChevronRight, Coffee, Moon, Sun, Apple } from "lucide-react";
import { Fragment } from "react";
import { weekMeals } from "@/lib/demo-data";
import { MealType } from "@/types/domain";

const days = ["Lun 26", "Mar 27", "Mer 28", "Jeu 29", "Ven 30", "Sam 31", "Dim 1"];
const meals: { key: MealType; label: string; icon: typeof Coffee }[] = [
  { key: "breakfast", label: "Petit-déjeuner", icon: Coffee },
  { key: "lunch", label: "Déjeuner", icon: Sun },
  { key: "dinner", label: "Dîner", icon: Moon },
  { key: "snack", label: "Collation", icon: Apple }
];

const mealImages = [
  "photo-1490645935967-10de6ba17061",
  "photo-1505253716362-afaea1d3d1af",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1525351484163-7529414344d8",
  "photo-1512058564366-18510be2db19",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1512621776951-a57141f2eefd"
];

export function MealPlanner() {
  return (
    <section className="panel meal-panel">
      <div className="panel-header">
        <h2>Planning des repas</h2>
        <div className="week-switcher">
          <button aria-label="Semaine précédente"><ChevronLeft size={17} /></button>
          <span>26 mai - 1 juin 2024</span>
          <button aria-label="Semaine suivante"><ChevronRight size={17} /></button>
        </div>
        <a href="/meal-plans">Voir le planning complet</a>
      </div>

      <div className="meal-grid">
        <div className="grid-spacer" />
        {days.map((day) => <strong className="day-label" key={day}>{day}</strong>)}
        {meals.map((meal) => (
          <Fragment key={meal.key}>
            <div className="meal-label" key={`${meal.key}-label`}>
              <meal.icon size={22} />
              <span>{meal.label}</span>
            </div>
            {weekMeals[meal.key].map((title, index) => (
              <article className="meal-slot" key={`${meal.key}-${title}`}>
                {meal.key !== "snack" && (
                  <img src={`https://images.unsplash.com/${mealImages[index]}?auto=format&fit=crop&w=240&q=80`} alt="" />
                )}
                <span>{title}</span>
              </article>
            ))}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
