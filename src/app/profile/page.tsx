"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CircleAlert, Loader2, Save } from "lucide-react";
import {
  getApiErrorMessage,
  getProfile,
  readAuthToken,
  updateProfile,
  type ProfilePayload
} from "@/lib/api";
import type { MealType, UserProfile } from "@/types/domain";
import { PageScaffold } from "@/components/ui/PageScaffold";

type Status = "loading" | "ready" | "missing-token" | "error";

const mealTypes: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "lunch", label: "Déjeuner" },
  { value: "dinner", label: "Dîner" },
  { value: "snack", label: "Collation" }
];

const equipments = [
  { value: "four", label: "Four" },
  { value: "micro-ondes", label: "Micro-ondes" },
  { value: "plaques", label: "Plaques" },
  { value: "robot", label: "Robot" },
  { value: "air-fryer", label: "Air fryer" },
  { value: "blender", label: "Blender" }
];

const emptyForm: ProfilePayload = {
  firstname: "",
  lastname: "",
  householdSize: 1,
  enabledMealTypes: [],
  availableEquipments: [],
  dietaryPreferences: [],
  allergies: []
};

function profileToForm(profile: UserProfile): ProfilePayload {
  return {
    firstname: profile.firstname || "",
    lastname: profile.lastname || "",
    householdSize: profile.householdSize || 1,
    enabledMealTypes: profile.enabledMealTypes?.length ? profile.enabledMealTypes : mealTypes.map((meal) => meal.value),
    availableEquipments: profile.availableEquipments || [],
    dietaryPreferences: profile.dietaryPreferences || [],
    allergies: profile.allergies || []
  };
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatList(items: string[]) {
  return items.join(", ");
}

function toggleValue<T extends string>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export default function ProfilePage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [form, setForm] = useState<ProfilePayload>(emptyForm);
  const [dietaryPreferencesInput, setDietaryPreferencesInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async (authToken: string) => {
    setStatus("loading");
    setError("");
    setNotice("");
    try {
      const profile = await getProfile(authToken);
      const nextForm = profileToForm(profile);
      setForm(nextForm);
      setDietaryPreferencesInput(formatList(nextForm.dietaryPreferences));
      setAllergiesInput(formatList(nextForm.allergies));
      setStatus("ready");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de récupérer le profil."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const authToken = readAuthToken();
    setToken(authToken);
    if (!authToken) {
      setStatus("missing-token");
      return;
    }
    loadProfile(authToken);
  }, [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const payload: ProfilePayload = {
      ...form,
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      householdSize: Number(form.householdSize),
      dietaryPreferences: parseList(dietaryPreferencesInput),
      allergies: parseList(allergiesInput)
    };

    if (!payload.firstname || !payload.lastname || !Number.isFinite(payload.householdSize) || payload.householdSize < 1) {
      setError("Prénom, nom et nombre de personnes valide obligatoires.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const updatedProfile = await updateProfile(token, payload);
      const nextForm = profileToForm(updatedProfile);
      setForm(nextForm);
      setDietaryPreferencesInput(formatList(nextForm.dietaryPreferences));
      setAllergiesInput(formatList(nextForm.allergies));
      setNotice("Profil sauvegardé.");
      setStatus("ready");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Impossible de sauvegarder le profil."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageScaffold title="Profil" description="Ajustez les préférences qui pilotent les suggestions et les quantités.">
      {notice && <div className="state-panel success-state">{notice}</div>}
      {error && <div className="state-panel"><CircleAlert size={22} /> {error}</div>}
      {status === "loading" && <div className="state-panel"><Loader2 size={22} /> Chargement du profil</div>}
      {status === "missing-token" && <div className="state-panel"><CircleAlert size={22} /> Connectez-vous pour gérer votre profil.</div>}

      {status === "ready" && (
        <form className="panel form-panel profile-form-panel" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <label>
              Prénom
              <input value={form.firstname} onChange={(event) => setForm((current) => ({ ...current, firstname: event.target.value }))} />
            </label>
            <label>
              Nom
              <input value={form.lastname} onChange={(event) => setForm((current) => ({ ...current, lastname: event.target.value }))} />
            </label>
            <label>
              Nombre de personnes
              <input
                min="1"
                type="number"
                value={form.householdSize}
                onChange={(event) => setForm((current) => ({ ...current, householdSize: Number(event.target.value) }))}
              />
            </label>
          </div>

          <div>
            <h2>Repas pris en compte</h2>
            <div className="toggle-grid">
              {mealTypes.map((meal) => (
                <label key={meal.value}>
                  <input
                    checked={form.enabledMealTypes.includes(meal.value)}
                    type="checkbox"
                    onChange={() => setForm((current) => ({ ...current, enabledMealTypes: toggleValue(current.enabledMealTypes, meal.value) }))}
                  />
                  {meal.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2>Équipements disponibles</h2>
            <div className="toggle-grid">
              {equipments.map((equipment) => (
                <label key={equipment.value}>
                  <input
                    checked={form.availableEquipments.includes(equipment.value)}
                    type="checkbox"
                    onChange={() => setForm((current) => ({ ...current, availableEquipments: toggleValue(current.availableEquipments, equipment.value) }))}
                  />
                  {equipment.label}
                </label>
              ))}
            </div>
          </div>

          <label>
            Préférences alimentaires
            <input
              value={dietaryPreferencesInput}
              onChange={(event) => setDietaryPreferencesInput(event.target.value)}
              placeholder="végétarien, sans lactose"
            />
          </label>

          <label>
            Allergies
            <input value={allergiesInput} onChange={(event) => setAllergiesInput(event.target.value)} placeholder="arachides, gluten" />
          </label>

          <button className="primary-action" type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 size={17} /> : <Save size={17} />}
            Enregistrer le profil
          </button>
        </form>
      )}
    </PageScaffold>
  );
}
