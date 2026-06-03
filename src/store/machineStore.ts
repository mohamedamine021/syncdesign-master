import { create } from 'zustand';
import type {
  MachineState,
  InputParams,
  NominalValues,
  MainDimensions,
  StatorDesign,
  AirGapDesign,
  RotorDesign,
  LeakageReactance,
  ExcitationSystem,
  LossesAndEfficiency,
} from '@/types/machine';
import { CalculationEngine } from '@/engine/CalculationEngine';

// =============================================================================
// STORE INTERFACE
// Étend MachineState (machine.ts) avec les helpers propres au store.
// =============================================================================
interface MachineStore extends MachineState {
  /** true dès que recalculate() a terminé avec succès */
  isCalculated: boolean;
  setIsCalculated: (status: boolean) => void;

  /** Mise à jour partielle des entrées (remet isCalculated à false) */
  setInputs: (inputs: Partial<InputParams>) => void;

  setCurrentStep: (step: number) => void;

  /** Lance la chaîne de calcul complète (étapes 2 → 14) */
  recalculate: () => void;
}

// =============================================================================
// VALEURS PAR DÉFAUT — structures conformes aux interfaces de machine.ts
// =============================================================================
const defaultInputs: InputParams = {
  Pn: 0, Un: 0, cosPhi: 0, f: 0, nn: 0, m: 0,
};

const defaultNominal: NominalValues = {
  Uph: 0, Sn: 0, In: 0, p: 0,
};

const defaultMainDimensions: MainDimensions = {
  KE: 0, Sprime: 0, D: 0, Da: 0, DaNorm: 0, tau: 0, A: 0, Bdn: 0,
  alphap: 0, alphaDelta: 0, KB: 0, K01: 0, lPrimeDelta: 0, lDelta: 0,
  nv: 0, bv: 0, lpaq: 0, l: 0, l1: 0, lDeltaFinal: 0,
  lambda: 0, isLambdaValid: false, lambdaMessage: '',
};

const defaultStator: StatorDesign = {
  q1: 0, Z1: 0, t1: 0, up1: 0, w1: 0, Y: 0, beta: 0, Kw1: 0,
  Phi0: 0, PhiCh: 0, Bd0: 0, BdN: 0,
  be: 0, le: 0, he: 0, bd1: 0, Bd1: 0, hc: 0, Bc: 0,
  Sc: 0, a_cond: 0, b_cond: 0, DeltaC: 0,
  Ra75: 0, Ra75pu: 0, Lc: 0, Gm: 0,
};

const defaultAirGap: AirGapDesign = {
  delta: 0, Kdelta: 0,
};

const defaultRotor: RotorDesign = {
  bp: 0, Rp: 0, hp: 0, sigmaN: 0, PhiM: 0, bM: 0, hM: 0, Ha: 0, Ba: 0,
};

// LeakageReactance — champs exacts de calcLeakageReactance()
const defaultReactances: LeakageReactance = {
  lambda_e1: 0,
  lambda_di1: 0,
  lambda_l1: 0,
  sum_lambda: 0,
  x_sigma_ohm: 0,
  x_sigma_pu: 0,
  x_B: 0,
  x_Bsigma: 0,
  timeConstants_s: { T_d0: 0, T_d_prime: 0, T_a: 0 },
};

// ExcitationSystem — champs exacts de calcExcitationSystem()
const defaultExcitation: ExcitationSystem = {
  commercialWire: { b_max_limit_mm: 0, b_standard_mm: 0, a_standard_mm: 0, section_mm2: 0 },
  thermal:        { v_p_ms: 0, alpha_coeff: 0, k_coeff: 0, delta_B_A_mm2: 0 },
  coilSizing:     { omega_B_turns: 0, L_Bmoy_cm: 0, h_bobine_cm: 0, h_M_pole_cm: 0, weight_copper_kg: 0, weight_per_kVA: 0 },
  electricalSpecs:{ I_B_Nominal_A: 0, I_B_Max_A: 0, R_B_120_Ohm: 0, R_B_75_Ohm: 0, k_dispo: 0, P_Excitation_kW: 0 },
};

// LossesAndEfficiency — champs exacts de calcLossesAndEfficiency()
const defaultLosses: LossesAndEfficiency = {
  losses_kW: {
    iron_yoke_Pc: 0,
    iron_teeth_Pcd: 0,
    pole_surface_Psur: 0,
    mechanical_Pmec: 0,
    stator_copper_Pelec: 0,
    supplementary_Psup: 0,
    excitation_PB: 0,
    total_SigmaP: 0,
  },
  efficiency: {
    P_active_nominal_kW: 0,
    eta_per_unit: 0,
    eta_percentage: 0,
  },
};

// =============================================================================
// STORE ZUSTAND
// =============================================================================
export const useMachineStore = create<MachineStore>((set, get) => ({
  // ── État initial ────────────────────────────────────────────────────────────
  inputs:         defaultInputs,
  nominal:        defaultNominal,
  mainDimensions: defaultMainDimensions,
  stator:         defaultStator,
  airGap:         defaultAirGap,
  rotor:          defaultRotor,
  reactances:     defaultReactances,
  excitation:     defaultExcitation,
  losses:         defaultLosses,

  // Champs MachineState non utilisés activement par le store (gérés dans les Steps)
  noLoad:           null,
  leakageReactance: null,
  loadExcitation:   null,
  machineParams:    null,
  shortCircuit:     null,
  staticOverload:   null,

  currentStep:  1,
  isCalculated: false,

  // ── Setters ─────────────────────────────────────────────────────────────────
  setIsCalculated: (status) => set({ isCalculated: status }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setInputs: (partial) =>
    set((state) => ({
      inputs: { ...state.inputs, ...partial },
      isCalculated: false, // invalide le cache dès qu'une entrée change
    })),

  // Setters MachineState (conformes aux signatures de machine.ts)
  setNominal:          (nominal)        => set({ nominal }),
  setMainDimensions:   (mainDimensions) => set({ mainDimensions }),
  setStator:           (stator)         => set({ stator }),
  setAirGap:           (airGap)         => set({ airGap }),
  setRotor:            (rotor)          => set({ rotor }),
  setNoLoad:           (noLoad)         => set({ noLoad }),
  setLeakageReactance: (lr)             => set({ reactances: lr, leakageReactance: lr }),
  setLoadExcitation:   (le)             => set({ loadExcitation: le }),
  setExcitation:       (exc)            => set({ excitation: exc }),
  setMachineParams:    (mp)             => set({ machineParams: mp }),
  setShortCircuit:     (sc)             => set({ shortCircuit: sc }),
  setStaticOverload:   (so)             => set({ staticOverload: so }),
  setLosses:           (losses)         => set({ losses }),

  // ── Chaîne de calcul complète ───────────────────────────────────────────────
  recalculate: () => {
    const { inputs } = get();

    // Validation des entrées
    const errors = CalculationEngine.validateInputs(inputs);
    if (errors.length > 0) {
      set({
        nominal:        defaultNominal,
        mainDimensions: defaultMainDimensions,
        stator:         defaultStator,
        airGap:         defaultAirGap,
        rotor:          defaultRotor,
        reactances:     defaultReactances,
        excitation:     defaultExcitation,
        losses:         defaultLosses,
        isCalculated:   false,
      });
      return;
    }

    try {
      // ── Étape 2 : Grandeurs nominales ──────────────────────────────────────
      const nominal = CalculationEngine.calcNominal(inputs);
      set({ nominal });

      // ── Étape 3 : Dimensions principales ───────────────────────────────────
      const mainDimensions = CalculationEngine.calcMainDimensions(inputs, nominal);
      set({ mainDimensions });

      // ── Étape 4 : Stator ───────────────────────────────────────────────────
      const stator = CalculationEngine.calcStator(inputs, nominal, mainDimensions);
      set({ stator });

      // ── Étape 5 : Entrefer ─────────────────────────────────────────────────
      const airGap = CalculationEngine.calcAirGap(mainDimensions, stator);
      set({ airGap });

      // ── Étape 6 : Rotor ────────────────────────────────────────────────────
      const rotor = CalculationEngine.calcRotor(mainDimensions, stator, airGap);
      set({ rotor });

      // ── Étape 7 : Caractéristique à vide ───────────────────────────────────
      // Note : noLoadData n'est pas stocké directement dans le store;
      // il est recalculé localement dans chaque Step qui en a besoin (7, 9, 11, 14).
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);

      // ── Étape 8 : Réactances de fuite ──────────────────────────────────────
      // Le store conserve le résultat natif de calcLeakageReactance (= LeakageReactance)
      const reactances: LeakageReactance = CalculationEngine.calcLeakageReactance(
        inputs, nominal, stator, airGap, mainDimensions
      );
      set({ reactances, leakageReactance: reactances });

      // ── Étape 9 : Diagramme de Blondel ─────────────────────────────────────
      const safeReactancesForBlondel = {
        xSigma:     reactances.x_sigma_pu || 0.1,
        xq:         1.0,
        r_a:        stator.Ra75pu || 0.02,
        x_sigma_pu: reactances.x_sigma_pu || 0.1,
        r_a75:      stator.Ra75pu || 0.02,
      };

      const loadExcitation = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData,
        safeReactancesForBlondel,
      );
      set({ loadExcitation });

      // ── Étape 10 : Système d'excitation ────────────────────────────────────
      // calcExcitationSystem retourne directement la structure ExcitationSystem
      const excitation: ExcitationSystem = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, loadExcitation.F_Bn, inputs.f,
      );
      set({ excitation });

      // ── Étape 14 : Pertes et rendement ─────────────────────────────────────
      // calcLossesAndEfficiency retourne directement la structure LossesAndEfficiency
      try {
        const losses: LossesAndEfficiency = CalculationEngine.calcLossesAndEfficiency(
          inputs, nominal, mainDimensions, stator, airGap,
          excitation,           // rotorParams = ExcitationSystem (étape 10)
          safeReactancesForBlondel, // reactances (étape 8)
        );
        set({ losses });
      } catch (lossError) {
        console.warn('[machineStore] calcLossesAndEfficiency a échoué :', lossError);
        // On garde les valeurs par défaut pour les pertes — le reste est calculé
      }

      set({ isCalculated: true });

    } catch (e) {
      console.error('[machineStore] Erreur dans recalculate() :', e);
      // On ne remet pas tout à zéro : on garde ce qui a été calculé correctement
      set({ isCalculated: false });
    }
  },
}));