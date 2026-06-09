# 1. Vue d'Ensemble du Système

Ce projet est une application de calcul de dimensionnement de machine synchrone exploitable en tant qu'application desktop via Electron. L'architecture est essentiellement un monolithe applicatif frontend, avec une séparation fonctionnelle entre :

- une couche de présentation React/Router (`src/App.tsx`, `src/pages`, `src/components`, `src/components/ui`),
- une couche d'état global (`src/store/machineStore.ts`),
- une couche de logique métier et calculs physiques (`src/engine/CalculationEngine.ts`, `src/constants/magnetic_curves.ts`),
- une couche de définition de domaine (`src/types/machine.ts`),
- un wrapper Electron de packaging (`electron/main.cjs`, `main.cjs`).

L'application est livrée comme une SPA React embarquée dans un shell Electron. Le système n'est pas distribué : il s'agit d'un monolithe UI + business logic, avec un point d'entrée React unique.

# 2. Diagramme d'Architecture

Le diagramme textuel ci-dessous décrit les principales couches et leurs dépendances :

- Electron shell
  - `electron/main.cjs` / `main.cjs`
    - charge l'interface via `http://localhost:5173` en développement
    - charge `dist/index.html` en production
- Frontend React
  - `src/main.tsx` → `src/App.tsx`
  - `src/App.tsx`
    - configure `HashRouter`
    - expose `QueryClientProvider` et `TooltipProvider`
    - route `/` vers `LandingPage`
    - route `/step/:n` vers `AppLayout` et 14 étapes
- UI Shell
  - `src/components/AppLayout.tsx`
    - `AppSidebar`
    - `Outlet`
  - `src/components/AppSidebar.tsx`
    - navigation des étapes
    - verrouillage d'accès fondé sur `isCalculated`
- Pages d'étapes
  - `src/pages/steps/Step1.tsx` à `Step14.tsx`
    - consomment `useMachineStore`
    - déclenchent `setCurrentStep()` et `recalculate()`
- État central
  - `src/store/machineStore.ts`
    - état global `MachineState`
    - méthode `recalculate()` orchestration de la chaîne de calcul
    - expose setters et indicateurs (`currentStep`, `isCalculated`)
- Calculs métiers
  - `src/engine/CalculationEngine.ts`
    - static class regroupant toutes les étapes de calcul
    - utilise `src/constants/magnetic_curves.ts`
- Données métier
  - `src/types/machine.ts`
    - type definitions de `InputParams`, `NominalValues`, `MainDimensions`, etc.

# 3. Analyse Détaillée des Modules

## 3.1 `src/App.tsx`

Responsabilité : routeur principal et provision des providers.

- Sert de point d'entrée organisationnel pour l'application React.
- Ordonne la navigation entre la page d'accueil (`LandingPage`) et les 14 étapes.
- Aucune logique métier significative, mais la configuration du routeur est centralisée ici.

## 3.2 `src/main.tsx`

Responsabilité : bootstrap React dans le DOM.

- Appelle `createRoot(...).render(<App />)`.
- État minimal, pure initialisation.

## 3.3 `src/store/machineStore.ts`

Responsabilité : état applicatif et orchestration des calculs.

- Contient l'état de toutes les étapes de calcul et des données utilisateur.
- Incarne le principal orchestrateur de la chaîne de calcul via `recalculate()`.
- Définit des valeurs par défaut massives pour chaque objet métier (`defaultInputs`, `defaultNominal`, `defaultMainDimensions`, `defaultStator`, etc.).
- Expose des setters directs pour chaque table métier.

## 3.4 `src/engine/CalculationEngine.ts`

Responsabilité : moteur de calcul physique.

- Classe statique unique regroupant toute la logique de calcul.
- `validateInputs`, `calcNominal`, `calcMainDimensions`, `calcStator`, `calcAirGap`, `calcRotor`, `calcLeakageReactance`, `calcLoadExcitation`, `calcExcitationSystem`, `calcLossesAndEfficiency`, etc.
- Dépend directement du module constant `magnetic_curves.ts`.
- Contient des formules, des interpolations, des tableaux matériels et des règles physiques.

## 3.5 `src/constants/magnetic_curves.ts`

Responsabilité : données physiques et fonctions d'interpolation.

- Fournit les données B-H, tables de coefficients et utilitaires mathématiques.
- Contient des constantes de matériaux, des tables de pertes, des fonctions d'interpolation 1D/2D, et des coefficients thermiques.
- Sert essentiellement de bibliothèque de référence pour `CalculationEngine`.

## 3.6 `src/types/machine.ts`

Responsabilité : schéma de données métier.

- Définit les interfaces utilisées par le store et le moteur de calcul.
- Couvre toutes les étapes de calcul, y compris des objets complexes comme `LeakageReactance`, `LoadExcitation`, `ExcitationSystem`, `LossesAndEfficiency`.
- Documente explicitement la correspondance entre chaque méthode de `CalculationEngine` et le type attendu.

## 3.7 `src/components/AppLayout.tsx` et `src/components/AppSidebar.tsx`

Responsabilité : structure de l'interface de navigation.

- `AppLayout` encapsule le shell principal.
- `AppSidebar` présente la navigation par étapes et verrouille l'accès aux étapes suivantes si `isCalculated` est faux.
- La sidebar est fortement couplée à l'état global et aux routes.

## 3.8 `src/pages/steps/*`

Responsabilité : écrans de chaque étape métier.

- `Step1.tsx` à `Step14.tsx` forment l'interface métier du calcul.
- `Step1.tsx` déclenche la validation et l'appel à `recalculate()`.
- `Step14.tsx` est un composant volumineux contenant beaucoup de présentation spécifique (formules, KPI, canvas, etc.).

## 3.9 `electron/main.cjs` et `main.cjs`

Responsabilité : wrapper Electron.

- Deux fichiers identiques qui ouvrent une fenêtre Electron et chargent l'app.
- L'un est dans `electron/`, l'autre à la racine : duplication inutile.

# 4. Flux d'Interaction et Dépendances

## 4.1 Flux principal

1. `src/main.tsx` initialise React.
2. `src/App.tsx` configure le routeur et les providers.
3. L'utilisateur navigue vers `/step/1` à `/step/14` ou `/`.
4. Sur une étape, le composant appelle `useMachineStore()`.
5. `Step1.tsx` validera les entrées avec `CalculationEngine.validateInputs()` puis lancera `recalculate()`.
6. `machineStore.recalculate()` exécute séquentiellement les méthodes de `CalculationEngine` pour produire :
   - `nominal`
   - `mainDimensions`
   - `stator`
   - `airGap`
   - `rotor`
   - `reactances`
   - `loadExcitation`
   - `excitation`
   - `losses`
7. L'état calculé est stocké dans Zustand et rendu par les étapes suivantes.

## 4.2 Flux secondaire

- Les étapes consultent `currentStep` et `isCalculated` depuis le store.
- `AppSidebar` gère l'aide à la navigation et les états `active/complete/pending`.
- `CalculationEngine` utilise `magnetic_curves.ts` pour toutes les courbes et coefficients.

## 4.3 Diagramme des dépendances

- `src/pages/steps/*` → `src/store/machineStore.ts`
- `src/pages/steps/*` → `src/engine/CalculationEngine.ts` (directement pour validation dans `Step1.tsx` et potentiellement dans d'autres étapes)
- `src/store/machineStore.ts` → `src/engine/CalculationEngine.ts`
- `src/engine/CalculationEngine.ts` → `src/constants/magnetic_curves.ts`
- `src/store/machineStore.ts` → `src/types/machine.ts`
- `src/engine/CalculationEngine.ts` → `src/types/machine.ts`
- `src/components/AppLayout.tsx` → `src/components/AppSidebar.tsx`
- `src/components/AppSidebar.tsx` → `src/store/machineStore.ts`

# 5. Analyse de la Couche d'Orchestration

## 5.1 Point d'entrée d'orchestration

- Le principal orchestrateur est `src/store/machineStore.ts`, plus précisément la méthode `recalculate()`.
- `App.tsx` orchestre seulement la navigation et les providers, mais ne joue pas de rôle métier.

## 5.2 Nature de l'orchestration

- Centralisée : l'ensemble de la chaîne de calcul est déclenché à partir d'un unique `recalculate()`.
- Cette méthode exécute un pipeline séquentiel d'étapes métier.
- Les étapes ne sont pas orchestrées en parallèle, ni via un bus d'événements.

## 5.3 Limites identifiées

- L'orchestration est incluse dans le store Zustand plutôt que dans un service métier dédié.
- La responsabilité d'`AppStore` est double : à la fois stockage d'état et coordination de calcul. C'est une violation claire du principe de séparation des responsabilités.
- Il n'existe pas de service de workflow distinct pour gérer la progression des étapes, les transitions, et les effets secondaires.

## 5.4 Coordination de workflow

- `Step1.tsx` initialise `currentStep`.
- `AppSidebar` vérifie `isCalculated` pour autoriser ou bloquer la navigation.
- La coordination est donc partagée entre le store et l'UI, ce qui amoindrit la robustesse.

# 6. Problèmes, Risques et Dette Technique

## 6.1 Couplages et god objects

- `CalculationEngine.ts` est un god object : toute la logique physique est regroupée dans une seule classe statique.
- `machineStore.ts` contient de très nombreuses propriétés et méthodes de mise à jour.
- `Step14.tsx` contient des composants d'affichage complexes et un rendu riche, ce qui en fait un composant volumineux difficile à maintenir.

## 6.2 Duplication et redondance

- `machineStore.ts` stocke à la fois `reactances` et `leakageReactance` ; ces deux états semblent redondants.
- `main.cjs` et `electron/main.cjs` sont deux fichiers identiques, ce qui crée une duplication inutile.
- Le fichier `src/pages/Index.tsx` n'est pas importé dans `App.tsx` et semble être un vestige de scaffolding.
- Les dossiers `dist/`, `dist_electron/`, `dist-electron/`, `release/` contiennent des artefacts de build qui ne font pas partie de la logique métier.

## 6.3 Manque d'abstraction de domaine

- La logique de calcul est exposée via des méthodes statiques, sans interface ni injection.
- `Step1.tsx` utilise directement `CalculationEngine.validateInputs()` pour la validation, ce qui couple l'UI aux règles métiers.
- La gestion des erreurs dans `recalculate()` est très grossière : un `try/catch` attrape toutes les exceptions, sans rollback d'état complet.

## 6.4 Risques de cohérence d'état

- `recalculate()` réinitialise certaines données en cas d'erreurs de validation, mais pour les erreurs d'exécution internes il se contente de `set({ isCalculated: false })`.
- La valeur `isCalculated` est manipulée à la fois dans `recalculate()` et dans `Step1.tsx`, ce qui ouvre la voie à des incohérences.
- Le commentaire dans `machineStore.ts` indique que `noLoadData` est recalculé dans les étapes 7, 9, 11, 14, ce qui suggère une duplication de logique de calcul hors du store.

## 6.5 Mauvaise séparation des responsabilités

- Les composants de page contiennent des détails de présentation et parfois de logique métier de second niveau.
- L’orchestration du workflow n’est pas clairement séparée de l’état.
- La couche UI et la couche métier sont trop étroitement liées par l’export de `useMachineStore()`.

## 6.6 Décisions de conception risquées

- Le moteur de calcul est fortement couplé à des constantes physiques et à des tableaux de référence dans un seul fichier.
- L’usage d’une classe statique empêche facilement la substitution de calculs ou la création de tests unitaires ciblés par injection.
- L’absence de tests visibles dans le workspace sur les calculs métiers est un risque de régression.

# 7. Plan de Refactorisation

## 7.1 Séparer le moteur de calcul

- Fractionner `CalculationEngine.ts` en modules plus petits :
  - `NominalCalculator`
  - `DimensionCalculator`
  - `StatorCalculator`
  - `AirGapCalculator`
  - `RotorCalculator`
  - `ExcitationCalculator`
  - `LossCalculator`
- Extraire les fonctions utilitaires de `magnetic_curves.ts` dans un package `physics/` ou `calculations/`.

## 7.2 Réduire la charge du store

- Transformer `machineStore.ts` en gestionnaire d'état simple + orchestrateur minimal.
- Extraire `recalculate()` dans un service métier dédié, par exemple `src/services/CalculationPipeline.ts`.
- Réduire les setters exposés : ne conserver que les setters nécessaires à l'UI et un état immuable par étape.

## 7.3 Clarifier le workflow

- Introduire un contrôleur de workflow séparé pour la progression des étapes et le verrouillage.
- Remplacer le verrouillage actuel de `AppSidebar` par une logique de route guard si nécessaire.
- Stocker `currentStep` et `isCalculated` dans un modèle de progression de calcul distinct.

## 7.4 Éliminer les duplications

- Supprimer le fichier racine `main.cjs` si `electron/main.cjs` est le fichier de production réel.
- Supprimer `src/pages/Index.tsx` si la page d'accueil est désormais `LandingPage`.
- Gitignorer ou nettoyer les dossiers `dist/`, `dist_electron/`, `dist-electron/`, `release/` des sources si ce sont des artefacts de build.

## 7.5 Simplifier la couche UI

- Extraire les éléments réutilisables de `Step14.tsx` dans des composants dédiés (ex. `FormulaBlock`, `KpiCard`, `EfficiencyGauge`).
- Créer des composants de formulaire et de visualisation partagés pour les étapes répétitives.

# 8. Recommandations

## 8.1 Architecturales

- Maintenir le style « monolithe frontend/Electron » mais y appliquer une architecture en couches stricte :
  - Présentation (Pages + Components)
  - Application/Workflow (Store + Orchestrateur)
  - Domaine/Calcul (Services + Types)
  - Infrastructure (Electron, Bundling)

- Adopter une architecture en couches claire plutôt qu'un god object unique.

## 8.2 Testabilité

- Ajouter des tests unitaires pour `CalculationEngine` et ses nouveaux modules.
- Tester `machineStore.recalculate()` séparément du rendu UI.
- Couvrir les validations d'entrée et les calculs critiques.

## 8.3 Maintenabilité

- Remplacer la classe statique `CalculationEngine` par des services instanciables avec injection de dépendances.
- Réduire la taille des composants de pages en créant des composants métiers réutilisables.
- Utiliser des fichiers de configuration distincts pour les constantes physiques et les données de courbes.

## 8.4 Performance et scalabilité

- Calculer `noLoadData` une seule fois et le stocker si plusieurs étapes l’utilisent.
- Éviter de recalculer des mêmes données dans différentes étapes.
- Limiter les rerenders en utilisant des sélecteurs Zustand plus précis.

## 8.5 Nettoyage du workspace

- Conserver uniquement `electron/main.cjs` et supprimer le doublon `main.cjs` à la racine.
- Placer les artefacts de build hors du repository ou dans `.gitignore`.
- Archiver ou supprimer les fichiers d’exemple inutilisés (`src/pages/Index.tsx`) pour clarifier le périmètre.

---

En synthèse, l’application est structurée comme un monolithe frontend/Electron fonctionnel, mais elle souffre d'un couplage excessif entre état, orchestration et logique métier, et d’un moteur de calcul trop centralisé. Une refonte progressive vers une architecture en couches plus modulaire améliorerait nettement la maintenabilité et la testabilité.
