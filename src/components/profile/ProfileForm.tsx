"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { apiRequest, getToken } from "@/lib/client-api";

const mealOptions = [
  ["breakfast", "Petit-déjeuner"],
  ["lunch", "Déjeuner"],
  ["dinner", "Dîner"],
  ["snack", "Collation"]
];
const equipmentOptions = ["four", "micro-ondes", "plaques", "robot", "air fryer", "blender"];

type Profile = {
  firstname: string;
  lastname: string;
  householdSize: number;
  enabledMealTypes: string[];
  availableEquipments: string[];
  dietaryPreferences: string[];
  allergies: string[];
};

const defaultProfile: Profile = {
  firstname: "Sophie",
  lastname: "Dupont",
  householdSize: 2,
  enabledMealTypes: ["breakfast", "lunch", "dinner", "snack"],
  availableEquipments: ["four", "plaques", "blender"],
  dietaryPreferences: [],
  allergies: []
};

export function ProfileForm() {
  const [profile, setProfile] = useState(defaultProfile);
  const [message, setMessage] = useState("Connectez-vous pour sauvegarder le profil.");

  useEffect(() => {
    if (!getToken()) return;
    apiRequest<Profile>("/users/profile")
      .then((payload) => {
        setProfile({ ...defaultProfile, ...payload });
        setMessage("Profil synchronisé avec le backend.");
      })
      .catch((error) => setMessage(error.message));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getToken()) {
      setMessage("Profil modifié localement. Connectez-vous pour le sauvegarder.");
      return;
    }
    const payload = await apiRequest<Profile>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profile)
    });
    setProfile({ ...defaultProfile, ...payload });
    setMessage("Profil sauvegardé.");
  }

  function toggle(field: "enabledMealTypes" | "availableEquipments", value: string) {
    const selected = new Set(profile[field]);
    selected.has(value) ? selected.delete(value) : selected.add(value);
    setProfile({ ...profile, [field]: [...selected] });
  }

  return (
    <form className="panel form-panel" onSubmit={submit}>
      <label>Nombre de personnes<input value={profile.householdSize} min="1" type="number" onChange={(event) => setProfile({ ...profile, householdSize: Number(event.target.value) })} /></label>
      <div>
        <h2>Repas pris en compte</h2>
        <div className="toggle-grid">
          {mealOptions.map(([value, label]) => (
            <label key={value}><input checked={profile.enabledMealTypes.includes(value)} type="checkbox" onChange={() => toggle("enabledMealTypes", value)} /> {label}</label>
          ))}
        </div>
      </div>
      <div>
        <h2>Équipements disponibles</h2>
        <div className="toggle-grid">
          {equipmentOptions.map((item) => (
            <label key={item}><input checked={profile.availableEquipments.includes(item)} type="checkbox" onChange={() => toggle("availableEquipments", item)} /> {item}</label>
          ))}
        </div>
      </div>
      <label>Préférences alimentaires<input value={profile.dietaryPreferences.join(", ")} onChange={(event) => setProfile({ ...profile, dietaryPreferences: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
      <label>Allergies<input value={profile.allergies.join(", ")} onChange={(event) => setProfile({ ...profile, allergies: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
      <p className="status-note">{message}</p>
      <button className="primary-action" type="submit"><Save size={18} /> Sauvegarder le profil</button>
    </form>
  );
}
