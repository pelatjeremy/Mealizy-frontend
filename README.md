# Mealizy Frontend

Frontend Next.js de Mealizy, une application de gestion des repas, inventaire alimentaire, suggestions de recettes et liste de courses.

## Stack

- Next.js
- React
- TypeScript
- Recharts
- Lucide React
- Yarn

## Installation

```bash
yarn install
```

## Variables d'environnement

Creer un fichier `.env.local` local. Ne jamais committer ce fichier.

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Lancement

```bash
yarn dev
```

Frontend disponible sur http://localhost:3000.

## Build

```bash
yarn build
```

## Pages incluses

- Tableau de bord
- Inventaire avec formulaire d'ajout, modification, suppression et alerte anti-gaspillage
- Recettes avec recherche, filtres visuels et fallback demonstration
- Planning repas avec choix de semaine, jour, type de repas, recette et portions
- Liste de courses cochable avec generation backend si l'utilisateur est connecte
- Mes recettes
- Profil avec foyer, repas actives, equipements, preferences et allergies
- Parametres
- Connexion
- Inscription

## Connexion au backend

Les pages utilisent `NEXT_PUBLIC_API_URL` pour contacter l'API Express. Si aucun token JWT n'est present ou si l'API est indisponible, certaines pages conservent des donnees locales de demonstration pour rester utilisables.

Workflow conseille :

1. Demarrer le backend sur `http://localhost:4000`.
2. Creer un compte depuis `/register` ou se connecter depuis `/login`.
3. Utiliser inventaire, profil, planning et liste de courses avec synchronisation API.

## Securite

Les fichiers `.env`, `.env.local` et `.env.production` sont ignores par Git. Ne pas ecrire de cle API, mot de passe ou chaine de connexion dans le code, le README ou GitHub.
