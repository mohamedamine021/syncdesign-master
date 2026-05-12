// =============================================================================
// src/types/machine.ts
// Interfaces TypeScript — synchronisées avec CalculationEngine.ts
// Source de vérité : les objets `return` de chaque méthode statique du moteur.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 : ENTRÉES
// Source : InputParams (paramètre d'entrée, non calculé)
// ─────────────────────────────────────────────────────────────────────────────
export interface InputParams {
  Pn: number;      // Puissance nominale (kW)
  Un: number;      // Tension nominale ligne (V)
  cosPhi: number;  // Facteur de puissance
  f: number;       // Fréquence (Hz)
  nn: number;      // Vitesse nominale (tr/min)
  m: number;       // Nombre de phases
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 : GRANDEURS NOMINALES
// Source : calcNominal() → return { Uph, Sn, In, p }
// ─────────────────────────────────────────────────────────────────────────────
export interface NominalValues {
  Uph: number;     // Tension de phase (V)
  Sn: number;      // Puissance apparente (kVA)
  In: number;      // Courant nominal stator (A)
  p: number;       // Paires de pôles
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 : DIMENSIONS PRINCIPALES
// Source : calcMainDimensions() → return { KE, Sprime, D, Da, DaNorm, tau,
//   A, Bdn, alphap, alphaDelta, KB, K01, lPrimeDelta, lDelta, nv, bv, lpaq,
//   l, l1, lDeltaFinal, lambda, isLambdaValid, lambdaMessage }
// ─────────────────────────────────────────────────────────────────────────────
export interface MainDimensions {
  KE: number;           // Coefficient d'utilisation
  Sprime: number;       // Puissance de calcul S' (kVA)
  D: number;            // Diamètre intérieur stator (cm)
  Da: number;           // Diamètre extérieur initial (cm)
  DaNorm: number;       // Diamètre extérieur normalisé (cm)
  tau: number;          // Pas polaire (cm)
  A: number;            // Charge linéique (A/cm)
  Bdn: number;          // Induction entrefer de calcul (Gauss)
  alphap: number;       // Arc polaire relatif
  alphaDelta: number;   // Coefficient arc de flux
  KB: number;           // Coefficient de forme d'induction
  K01: number;          // Coefficient de bobinage initial
  lPrimeDelta: number;  // Longueur électromagnétique calculée (cm)
  lDelta: number;       // Longueur estimée avec duites (cm)
  nv: number;           // Nombre de canaux de ventilation
  bv: number;           // Largeur canal de ventilation (cm)
  lpaq: number;         // Longueur paquet de tôles (cm)
  l: number;            // Longueur fer actif (cm)
  l1: number;           // Longueur totale (fer + air) (cm)
  lDeltaFinal: number;  // Longueur magnétique équivalente finale (cm)
  lambda: number;       // Rapport d'élancement
  isLambdaValid: boolean;
  lambdaMessage: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 : STATOR
// Source : calcStator() → return { q1, Z1, t1, up1, w1, Y, beta, Kw1,
//   Phi0, PhiCh, Bd0, BdN, be, le, he, bd1, Bd1, hc, Bc,
//   Sc, a_cond, b_cond, DeltaC, Ra75, Ra75pu, Lc, Gm }
// ─────────────────────────────────────────────────────────────────────────────
export interface StatorDesign {
  q1: number;       // Encoches par pôle et par phase
  Z1: number;       // Nombre total d'encoches
  t1: number;       // Pas d'encoche (cm)
  up1: number;      // Conducteurs par encoche
  w1: number;       // Spires par phase
  Y: number;        // Pas de bobinage (en encoches)
  beta: number;     // Raccourcissement relatif
  Kw1: number;      // Facteur de bobinage (K01)
  Phi0: number;     // Flux à vide (Maxwell / Wb·1e-8)
  PhiCh: number;    // Flux en charge nominale (Maxwell)
  Bd0: number;      // Induction entrefer à vide (Gauss)
  BdN: number;      // Induction entrefer à charge (Gauss)
  be: number;       // Ouverture d'encoche (mm)
  le: number;       // Largeur de bobine (mm)
  he: number;       // Hauteur totale d'encoche (mm)
  bd1: number;      // Largeur de dent stator (cm)
  Bd1: number;      // Induction dans les dents (Gauss)
  hc: number;       // Hauteur de culasse stator (cm)
  Bc: number;       // Induction culasse stator (Gauss)
  Sc: number;       // Section du conducteur (mm²)
  a_cond: number;   // Hauteur du conducteur, dim. a (mm)
  b_cond: number;   // Largeur du conducteur, dim. b (mm)
  DeltaC: number;   // Densité de courant stator (A/mm²)
  Ra75: number;     // Résistance de l'enroulement à 75°C (Ω)
  Ra75pu: number;   // Résistance stator en p.u.
  Lc: number;       // Longueur totale de conducteur (m)
  Gm: number;       // Poids du cuivre stator (kg)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 : ENTREFER
// Source : calcAirGap() → return { delta, Kdelta }
// ─────────────────────────────────────────────────────────────────────────────
export interface AirGapDesign {
  delta: number;    // Épaisseur de l'entrefer (cm)
  Kdelta: number;   // Coefficient de Carter
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 : ROTOR
// Source : calcRotor() → return { bp, Rp, hp, sigmaN, PhiM, bM, hM, Ha, Ba }
// ─────────────────────────────────────────────────────────────────────────────
export interface RotorDesign {
  bp: number;       // Arc polaire (cm)
  Rp: number;       // Rayon d'épanouissement polaire (cm)
  hp: number;       // Hauteur d'épanouissement polaire (cm)
  sigmaN: number;   // Coefficient de dispersion polaire
  PhiM: number;     // Flux dans la zone polaire (Maxwell)
  bM: number;       // Largeur du noyau polaire (cm)
  hM: number;       // Hauteur du noyau polaire (cm)
  Ha: number;       // Hauteur de la culasse rotor (cm)
  Ba: number;       // Induction dans la culasse rotor (Gauss)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 : CARACTÉRISTIQUE À VIDE
// Source : calcNoLoadCharacteristic() → return {
//   boe, Kdelta, F_delta, t_d13, b_d13, Bd13, Hd13, F_d1,
//   lc, Bc, xi, Hc, F_c, Phi_sigma, Phi_M, B_M, H_M, F_M0,
//   B_a, H_a, F_a, delta_jonc, F_delta_M, F_0, F_deltadc_A }
// ─────────────────────────────────────────────────────────────────────────────
export interface NoLoadCharacteristic {
  boe: number;          // Ouverture d'encoche utilisée (cm)
  Kdelta: number;       // Coefficient de Carter (recalculé à vide)
  F_delta: number;      // FMM de l'entrefer (A)
  t_d13: number;        // Pas dentaire au 1/3 de la hauteur (cm)
  b_d13: number;        // Largeur de dent au 1/3 de la hauteur (cm)
  Bd13: number;         // Induction dans les dents au 1/3 (Gauss)
  Hd13: number;         // Champ magnétique dans les dents Hd13 (A/cm)
  F_d1: number;         // FMM des dents statoriques (A)
  lc: number;           // Chemin moyen dans la culasse stator (cm)
  Bc: number;           // Induction dans la culasse stator à vide (Gauss)
  xi: number;           // Coefficient de saturation (courbe 2.8)
  Hc: number;           // Champ magnétique dans la culasse stator (A/cm)
  F_c: number;          // FMM de la culasse statorique (A)
  Phi_sigma: number;    // Flux de fuite polaire (Maxwell)
  Phi_M: number;        // Flux total dans le pôle (Maxwell)
  B_M: number;          // Induction dans le noyau polaire (Gauss)
  H_M: number;          // Champ magnétique dans le noyau polaire (A/cm)
  F_M0: number;         // FMM du noyau polaire (A)
  B_a: number;          // Induction dans la culasse rotor (Gauss)
  H_a: number;          // Champ magnétique dans la culasse rotor (A/cm)
  F_a: number;          // FMM de la culasse rotor (A)
  delta_jonc: number;   // Jeu à la jonction pôle-culasse (cm)
  F_delta_M: number;    // FMM de jonction pôle-culasse (A)
  F_0: number;          // FMM totale du circuit magnétique à vide (A)
  F_deltadc_A: number;  // Alias de F_0 — rétrocompatibilité (A)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 : RÉACTANCES DE FUITE
// Source : calcLeakageReactance() → return {
//   lambda_e1, lambda_di1, lambda_l1, sum_lambda,
//   x_sigma_ohm, x_sigma_pu, x_B, x_Bsigma,
//   timeConstants_s: { T_d0, T_d_prime, T_a } }
// ─────────────────────────────────────────────────────────────────────────────
export interface LeakageReactance {
  lambda_e1: number;    // Perméance de fuite d'encoche
  lambda_di1: number;   // Perméance de fuite différentielle
  lambda_l1: number;    // Perméance de fuite des têtes de bobines
  sum_lambda: number;   // Somme totale des perméances de fuite
  x_sigma_ohm: number;  // Réactance de dispersion stator (Ω)
  x_sigma_pu: number;   // Réactance de dispersion stator (p.u.)
  x_B: number;          // Réactance d'excitation estimée (p.u.)
  x_Bsigma: number;     // Réactance de dispersion excitation estimée (p.u.)
  timeConstants_s: {
    T_d0: number;        // Constante de temps à vide estimée (s)
    T_d_prime: number;   // Constante de temps transitoire estimée (s)
    T_a: number;         // Constante de temps d'amortissement estimée (s)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9 : DIAGRAMME DE BLONDEL (Excitation en charge)
// Source : calcLoadExcitation() → return {
//   F_a, F_a_star, saturationRatio,
//   coefficients: { ...satCoeffs, ...armCoeffs },
//   blondel: { psi_deg, E_rd_star, sin_psi, cos_psi },
//   F_ad_star, F_Bn_star, F_Bn }
// Note : satCoeffs et armCoeffs sont des spreads dynamiques — on les type
//        via un objet indexé pour rester flexible.
// ─────────────────────────────────────────────────────────────────────────────
export interface LoadExcitation {
  F_a: number;            // FMM d'induit nominale (A)
  F_a_star: number;       // FMM d'induit en p.u.
  saturationRatio: number;// Taux de saturation F_deltadc / F_delta
  coefficients: {
    // Coefficients de saturation (getSaturationCoefficients)
    x_d?: number;
    x_q?: number;
    k?: number;
    // Coefficients de réaction d'induit (getArmatureReactionCoefficients)
    k_ad?: number;
    k_aq?: number;
    [key: string]: number | undefined; // autres champs dynamiques
  };
  blondel: {
    psi_deg: number;      // Angle interne psi (degrés)
    E_rd_star: number;    // Tension résultante projetée (p.u.)
    sin_psi: number;
    cos_psi: number;
  };
  F_ad_star: number;      // FMM de réaction d'induit axe d (p.u.)
  F_Bn_star: number;      // FMM totale d'excitation en charge (p.u.)
  F_Bn: number;           // FMM totale d'excitation en charge (A)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10 : SYSTÈME D'EXCITATION (Bobinage rotor)
// Source : calcExcitationSystem() → return {
//   commercialWire: { b_max_limit_mm, b_standard_mm, a_standard_mm, section_mm2 },
//   thermal: { v_p_ms, alpha_coeff, k_coeff, delta_B_A_mm2 },
//   coilSizing: { omega_B_turns, L_Bmoy_cm, h_bobine_cm, h_M_pole_cm,
//                 weight_copper_kg, weight_per_kVA },
//   electricalSpecs: { I_B_Nominal_A, I_B_Max_A, R_B_120_Ohm, R_B_75_Ohm,
//                      k_dispo, P_Excitation_kW } }
// ─────────────────────────────────────────────────────────────────────────────
export interface ExcitationSystem {
  commercialWire: {
    b_max_limit_mm: number;  // Largeur maximale disponible (mm)
    b_standard_mm: number;   // Largeur du fil commercial sélectionné (mm)
    a_standard_mm: number;   // Hauteur du fil commercial sélectionné (mm)
    section_mm2: number;     // Section du fil commercial (mm²)
  };
  thermal: {
    v_p_ms: number;          // Vitesse périphérique rotor (m/s)
    alpha_coeff: number;     // Coefficient de refroidissement alpha
    k_coeff: number;         // Coefficient de forme du pôle k
    delta_B_A_mm2: number;   // Densité de courant admissible (A/mm²)
  };
  coilSizing: {
    omega_B_turns: number;   // Nombre de spires du bobinage rotor
    L_Bmoy_cm: number;       // Longueur moyenne d'une spire rotor (cm)
    h_bobine_cm: number;     // Hauteur de la bobine rotor (cm)
    h_M_pole_cm: number;     // Hauteur totale noyau polaire calculée (cm)
    weight_copper_kg: number;// Masse du cuivre rotor (kg)
    weight_per_kVA: number;  // Masse cuivre rotor par kVA (kg/kVA)
  };
  electricalSpecs: {
    I_B_Nominal_A: number;   // Courant d'excitation nominal (A)
    I_B_Max_A: number;       // Courant d'excitation maximum (A)
    R_B_120_Ohm: number;     // Résistance bobine à 120°C (Ω)
    R_B_75_Ohm: number;      // Résistance bobine à 75°C (Ω)
    k_dispo: number;         // Coefficient de disponibilité I_Bmax / I_B
    P_Excitation_kW: number; // Puissance d'excitation maximale (kW)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 11 : PARAMÈTRES DYNAMIQUES (Réactances & Constantes de temps)
// Source : calcMachineParameters() → return {
//   reactances_pu: { x_ad, x_aq, x_d, x_q, x_B, x_Bsigma, x_d_prime, x_2 },
//   resistances_pu: { r_B, r_a },
//   timeConstants_s: { omega_rad_s, T_d0, T_d_prime, T_a } }
// ─────────────────────────────────────────────────────────────────────────────
export interface MachineParameters {
  reactances_pu: {
    x_ad: number;       // Réactance de réaction d'induit axe d (p.u.)
    x_aq: number;       // Réactance de réaction d'induit axe q (p.u.)
    x_d: number;        // Réactance synchrone directe (p.u.)
    x_q: number;        // Réactance synchrone transversale (p.u.)
    x_B: number;        // Réactance de l'enroulement d'excitation (p.u.)
    x_Bsigma: number;   // Réactance de dispersion excitation (p.u.)
    x_d_prime: number;  // Réactance transitoire directe x'd (p.u.)
    x_2: number;        // Réactance d'ordre inverse (p.u.)
  };
  resistances_pu: {
    r_B: number;        // Résistance de l'enroulement d'excitation (p.u.)
    r_a: number;        // Résistance d'armature stator (p.u.)
  };
  timeConstants_s: {
    omega_rad_s: number; // Pulsation nominale (rad/s)
    T_d0: number;        // Constante de temps à vide (s)
    T_d_prime: number;   // Constante de temps transitoire (s)
    T_a: number;         // Constante de temps d'armature (s)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 12 : COURANTS DE COURT-CIRCUIT
// Source : calcShortCircuitCurrents() → return {
//   inputs: { E0_prime_star, x_d_pu, F_Bn_star_pu },
//   results_pu: { I_cc0, I_ccn },
//   results_real: { I_ccn_A } }
// ─────────────────────────────────────────────────────────────────────────────
export interface ShortCircuitCurrents {
  inputs: {
    E0_prime_star: number;  // Tension induite interne à vide (p.u.)
    x_d_pu: number;         // Réactance synchrone directe utilisée (p.u.)
    F_Bn_star_pu: number;   // FMM d'excitation nominale (p.u.)
  };
  results_pu: {
    I_cc0: number;          // Courant de CC pour excitation à vide (p.u.)
    I_ccn: number;          // Courant de CC pour excitation nominale (p.u.)
  };
  results_real: {
    I_ccn_A: number;        // Courant de CC nominal (Ampères)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 13 : SURCHARGE STATIQUE
// Source : calcStaticOverload() → return {
//   E00_prime_star, epsilon, k_factor, static_overload_S }
// ─────────────────────────────────────────────────────────────────────────────
export interface StaticOverload {
  E00_prime_star: number;    // Tension interne fictive E00'* (p.u.)
  epsilon: number;           // Coefficient de saillance
  k_factor: number;          // Coefficient de correction k
  static_overload_S: number; // Capacité de surcharge statique (p.u.)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 14 : PERTES ET RENDEMENT
// Source : calcLossesAndEfficiency() → return {
//   losses_kW: { iron_yoke_Pc, iron_teeth_Pcd, pole_surface_Psur,
//                mechanical_Pmec, stator_copper_Pelec, supplementary_Psup,
//                excitation_PB, total_SigmaP },
//   efficiency: { P_active_nominal_kW, eta_per_unit, eta_percentage } }
// ─────────────────────────────────────────────────────────────────────────────
export interface LossesAndEfficiency {
  losses_kW: {
    iron_yoke_Pc: number;        // Pertes fer culasse stator (kW)
    iron_teeth_Pcd: number;      // Pertes fer dents stator (kW)
    pole_surface_Psur: number;   // Pertes de surface pôles rotor (kW)
    mechanical_Pmec: number;     // Pertes mécaniques (kW)
    stator_copper_Pelec: number; // Pertes Joule stator (kW)
    supplementary_Psup: number;  // Pertes supplémentaires 5% (kW)
    excitation_PB: number;       // Pertes d'excitation rotor (kW)
    total_SigmaP: number;        // Somme totale des pertes ΣP (kW)
  };
  efficiency: {
    P_active_nominal_kW: number; // Puissance active utile (kW)
    eta_per_unit: number;        // Rendement en p.u.
    eta_percentage: number;      // Rendement en % (ex: 93.7)
  };
}

// =============================================================================
// ÉTAT GLOBAL DE LA MACHINE (Store Zustand / Context)
// Regroupe tous les résultats intermédiaires de la chaîne de calcul.
// Propriétés optionnelles (?) car chaque étape est calculée séquentiellement.
// =============================================================================
export interface MachineState {
  // Entrées utilisateur
  inputs: InputParams | null;

  // Résultats par étape
  nominal: NominalValues | null;
  mainDimensions: MainDimensions | null;
  stator: StatorDesign | null;
  airGap: AirGapDesign | null;
  rotor: RotorDesign | null;
  noLoad: NoLoadCharacteristic | null;
  leakageReactance: LeakageReactance | null;
  loadExcitation: LoadExcitation | null;
  excitation: ExcitationSystem | null;
  machineParams: MachineParameters | null;
  shortCircuit: ShortCircuitCurrents | null;
  staticOverload: StaticOverload | null;
  losses: LossesAndEfficiency | null;

  // Navigation
  currentStep: number;

  // Objet store brut (pour le store Zustand — propriété injectée dans Step14)
  reactances: LeakageReactance | null;

  // Fonctions du store (setters)
  setCurrentStep: (step: number) => void;
  setInputs: (inputs: InputParams) => void;
  setNominal: (nominal: NominalValues) => void;
  setMainDimensions: (dim: MainDimensions) => void;
  setStator: (stator: StatorDesign) => void;
  setAirGap: (airGap: AirGapDesign) => void;
  setRotor: (rotor: RotorDesign) => void;
  setNoLoad: (noLoad: NoLoadCharacteristic) => void;
  setLeakageReactance: (lr: LeakageReactance) => void;
  setLoadExcitation: (le: LoadExcitation) => void;
  setExcitation: (exc: ExcitationSystem) => void;
  setMachineParams: (mp: MachineParameters) => void;
  setShortCircuit: (sc: ShortCircuitCurrents) => void;
  setStaticOverload: (so: StaticOverload) => void;
  setLosses: (losses: LossesAndEfficiency) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/** Statut d'avancement d'une étape dans l'UI */
export type StepStatus = 'pending' | 'active' | 'complete' | 'error';

/** Point de la courbe à vide (generateNoLoadCurve) */
export interface NoLoadCurvePoint {
  ratio_E0: number;        // Ratio de tension (0.55 … 1.3)
  B_delta_Gauss: number;   // Induction entrefer (Gauss)
  B_d13_Gauss: number;     // Induction dents au 1/3 (Gauss)
  K_ex: number;            // Coefficient d'excitation
  F_total_A: number;       // FMM totale (A)
  warning: string;         // "OK" ou "Saturation > 18kG"
}