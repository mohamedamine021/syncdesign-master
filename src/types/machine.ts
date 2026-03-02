export interface InputParams {
  Pn: number;       // Puissance nominale (kW)
  Un: number;       // Tension nominale (V)
  cosPhi: number;   // Facteur de puissance
  f: number;        // Fréquence (Hz)
  nn: number;       // Vitesse nominale (tr/min)
  m: number;        // Nombre de phases
}

export interface NominalValues {
  Uph: number;      // Tension par phase (V)
  Sn: number;       // Puissance apparente (kVA)
  In: number;       // Courant nominal (A)
  p: number;        // Paires de pôles
}

export interface MainDimensions {
  KE: number;
  Sprime: number;   // Puissance apparente calculée (kVA)
  D: number;        // Diamètre intérieur stator (cm)
  Da: number;       // Diamètre extérieur stator (cm)
  DaNorm: number;   // Diamètre normalisé (cm)
  tau: number;      // Pas polaire (cm)
  A: number;        // Charge linéique (A/cm)
  Bdn: number;      // Induction entrefer (Gauss)
  alphap: number;   // Coefficient arc polaire
  alphaDelta: number;
  KB: number;
  K01: number;
  lPrimeDelta: number; // Longueur calculée (cm)
  lDelta: number;   // Longueur réelle (cm)
  nv: number;       // Canaux ventilation
  bv: number;       // Largeur canal (cm)
  lpaq: number;     // Longueur paquet (cm)
  l: number;        // Longueur totale (cm)
  l1: number;       // l + nv*bv
  lDeltaFinal: number;
  lambda: number;   // Ratio vérification
  isLambdaValid: boolean;
  lambdaMessage: string;
  l_M: number; // Longueur du noyau polaire en cm (ex: 48.5)
}

export interface StatorDesign {
  q1: number;       // Encoches par pôle par phase
  Z1: number;       // Nombre d'encoches
  t1: number;       // Pas dentaire (cm)
  up1: number;      // Conducteurs par encoche
  w1: number;       // Spires par phase
  Y: number;        // Pas d'enroulement
  beta: number;
  Kw1: number;      // K01 winding factor
  Phi0: number;     // Flux à vide (Maxwell)
  PhiCh: number;    // Flux en charge (Maxwell)
  Bd0: number;      // Induction entrefer vide (Gauss)
  BdN: number;      // Induction entrefer charge (Gauss)
  be: number;       // Largeur encoche (mm)
  le: number;       // Largeur encoche finale (mm)
  a_cond: number;   // Hauteur fil cuivre (mm)
  b_cond: number;   // Largeur fil cuivre (mm)
  he: number;       // Hauteur encoche (mm)
  bd1: number;      // Largeur dent (cm)
  Bd1: number;      // Induction dent (Gauss)
  hc: number;       // Hauteur culasse (cm)
  Bc: number;       // Induction culasse (Gauss)
  Sc: number;       // Section conducteur (mm²)
  DeltaC: number;   // Densité courant (A/mm²)
  Ra75: number;     // Résistance 75°C (Ohm)
  Ra75pu: number;   // Résistance p.u.
  Lc: number;       // Longueur enroulement (m)
  Gm: number;       // Poids cuivre (kg)
  Z: number;          // Nombre total d'encoches du stator (ex: 72)
  b_ou: number;       // Ouverture de l'encoche en cm (ex: 1.52)
  h_c: number;        // Hauteur de la culasse en cm (ex: 6.2)
  k_c: number;        // Coefficient de remplissage du fer (ex: 0.93)
  h_a1: number;       // Hauteur de la dent/encoche en cm (ex: 6.8)
  b_d_milieu: number; // Largeur de la dent au milieu en cm (ex: 1.955)
}

export interface AirGapDesign {
  delta: number;    // Entrefer (cm)
  Kdelta: number;   // Coefficient Carter
}

export interface RotorDesign {
  bp: number;       // Longueur arc polaire (cm)
  Rp: number;       // Rayon contour (cm)
  hp: number;       // Hauteur épanouissement (cm)
  sigmaN: number;   // Coeff dispersion
  PhiM: number;     // Flux pole (Maxwell)
  bM: number;       // Largeur noyau polaire (cm)
  hM: number;       // Hauteur noyau polaire (cm)
  Ha: number;       // Hauteur rotor (cm)
  Ba: number;       // Induction rotor (Gauss)
}

export interface Reactances {
  xSigma: number;   // Réactance dispersion p.u.
  xad: number;      // Réactance longitudinale
  xaq: number;      // Réactance transversale
  xd: number;       // Réactance synchrone longitudinale
  xq: number;       // Réactance synchrone transversale
  xPrimeD: number;  // Réactance transitoire
  x2: number;       // Réactance inverse
}

export interface ExcitationSystem {
  Uexc: number;     // Tension excitation (V)
  Fbn: number;      // FMM excitation (A)
  IB: number;       // Courant excitation (A)
  DeltaB: number;   // Densité courant (A/mm²)
  ThetaB: number;   // Température (°C)
  wB: number;       // Nombre de spires
  SB: number;       // Section conducteur (mm²)
  rB: number;       // Résistance (Ohm)
  PBn: number;      // Puissance excitation (kW)
  GB: number;       // Poids cuivre (kg)
}

export interface LossesAndEfficiency {
  Pc: number;       // Pertes fer culasse (kW)
  Pcd: number;      // Pertes fer dents (kW)
  Psur: number;     // Pertes surface (kW)
  Pmec: number;     // Pertes mécaniques (kW)
  Pelec: number;    // Pertes électriques (kW)
  Psup: number;     // Pertes supplémentaires (kW)
  PB: number;       // Pertes excitation (kW)
  totalLosses: number;
  efficiency: number;
}

export interface MachineState {
  inputs: InputParams;
  nominal: NominalValues | null;
  mainDimensions: MainDimensions | null;
  stator: StatorDesign | null;
  airGap: AirGapDesign | null;
  rotor: RotorDesign | null;
  reactances: Reactances | null;
  excitation: ExcitationSystem | null;
  losses: LossesAndEfficiency | null;
  currentStep: number;
}

export type StepStatus = 'pending' | 'active' | 'complete';
