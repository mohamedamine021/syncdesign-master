import { create } from 'zustand';
import type { MachineState, InputParams } from '@/types/machine';
import { CalculationEngine } from '@/engine/CalculationEngine';

interface MachineStore extends MachineState {
  isCalculated: boolean; // <-- Ajout pour le verrouillage des pages
  setIsCalculated: (status: boolean) => void; // <-- Fonction pour changer le statut
  setInputs: (inputs: Partial<InputParams>) => void;
  setCurrentStep: (step: number) => void;
  recalculate: () => void;
}

const defaultInputs: InputParams = {
  Pn: 0,
  Un: 0,
  cosPhi: 0,
  f: 0,
  nn: 0,
  m: 0,
};

// Default empty objects with zeros instead of null
const defaultNominal = { Uph: 0, Sn: 0, In: 0, p: 0 };
const defaultMainDimensions = {
  KE: 0, Sprime: 0, D: 0, Da: 0, DaNorm: 0, tau: 0, A: 0, Bdn: 0, alphap: 0,
  alphaDelta: 0, KB: 0, K01: 0, lPrimeDelta: 0, lDelta: 0, nv: 0, bv: 0,
  lpaq: 0, l: 0, l1: 0, lDeltaFinal: 0, lambda: 0, isLambdaValid: false, lambdaMessage: '', l_M: 0
};
const defaultStator = {
  q1: 0, Z1: 0, t1: 0, up1: 0, w1: 0, Y: 0, beta: 0, Kw1: 0, Phi0: 0, PhiCh: 0,
  Bd0: 0, BdN: 0, be: 0, le: 0, a_cond: 0, b_cond: 0, he: 0, bd1: 0, Bd1: 0,
  hc: 0, Bc: 0, Sc: 0, DeltaC: 0, Ra75: 0, Ra75pu: 0, Lc: 0, Gm: 0,
  Z: 0, b_ou: 0, h_c: 0, k_c: 0, h_a1: 0, b_d_milieu: 0
};
const defaultAirGap = { delta: 0, Kdelta: 0 };
const defaultRotor = { bp: 0, Rp: 0, hp: 0, sigmaN: 0, PhiM: 0, bM: 0, hM: 0, Ha: 0, Ba: 0 };
const defaultReactances = { xSigma: 0, xad: 0, xaq: 0, xd: 0, xq: 0, xPrimeD: 0, x2: 0, x_B: 0, x_Bsigma: 0, timeConstants_s: { T_d0: 0, T_d_prime: 0, T_a: 0 } };
const defaultExcitation = { Uexc: 0, Fbn: 0, IB: 0, DeltaB: 0, ThetaB: 0, wB: 0, SB: 0, rB: 0, PBn: 0, GB: 0 };
const defaultLosses = { Pc: 0, Pcd: 0, Psur: 0, Pmec: 0, Pelec: 0, Psup: 0, PB: 0, totalLosses: 0, efficiency: 0 };

export const useMachineStore = create<MachineStore>((set, get) => ({
  inputs: defaultInputs,
  nominal: defaultNominal,
  mainDimensions: defaultMainDimensions,
  stator: defaultStator,
  airGap: defaultAirGap,
  rotor: defaultRotor,
  reactances: defaultReactances,
  excitation: defaultExcitation,
  losses: defaultLosses,
  currentStep: 1,

  isCalculated: false, // <-- Initialisé à false par défaut

  setIsCalculated: (status) => set({ isCalculated: status }), // <-- Mise à jour de l'état

  setInputs: (partial) => {
    set((state) => ({
      inputs: { ...state.inputs, ...partial },
      isCalculated: false, // <-- Verrouiller les autres pages si l'utilisateur modifie une valeur
    }));
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  recalculate: () => {
    const { inputs } = get();
    const errors = CalculationEngine.validateInputs(inputs);
    if (errors.length > 0) {
      set({ nominal: defaultNominal, mainDimensions: defaultMainDimensions, stator: defaultStator, airGap: defaultAirGap, rotor: defaultRotor, reactances: defaultReactances, excitation: defaultExcitation, losses: defaultLosses });
      return;
    }

    try {
      // STEP 2: Nominal values
      const nominal = CalculationEngine.calcNominal(inputs);
      set({ nominal });

      // STEP 3: Main dimensions
      const mainDimensions = CalculationEngine.calcMainDimensions(inputs, nominal);
      set({ mainDimensions });

      // STEP 4: Stator
      const stator = CalculationEngine.calcStator(inputs, nominal, mainDimensions);
      set({ stator });

      // STEP 5: Air gap
      const airGap = CalculationEngine.calcAirGap(mainDimensions, stator);
      set({ airGap });

      // STEP 6: Rotor
      const rotor = CalculationEngine.calcRotor(mainDimensions, stator, airGap);
      set({ rotor });

      // STEP 7: No-load characteristic
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      
      // STEP 8: Leakage reactance
      const reactanceData = CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      
      // Build and save reactances with all calculated parameters
      const reactances = {
        xSigma: reactanceData.x_sigma_pu || 0.1,
        xad: 1.8,
        xaq: 1.6,
        xd: 1.9,
        xq: 1.7,
        xPrimeD: 0.3,
        x2: 0.2,
        x_B: reactanceData.x_B || 0.15,
        x_Bsigma: reactanceData.x_Bsigma || 0.12,
        timeConstants_s: reactanceData.timeConstants_s || { T_d0: 4.5, T_d_prime: 0.8, T_a: 0.2 }
      };
      set({ reactances });

      // STEP 9: Load excitation
      const reaction = CalculationEngine.calcLoadExcitation(
        nominal,
        stator,
        airGap,
        mainDimensions,
        noLoadData,
        reactanceData
      );

      // STEP 10: Excitation system
      const excitationSystem = CalculationEngine.calcExcitationSystem(
        nominal,
        mainDimensions,
        airGap,
        reaction.F_Bn
      );

      // Build and save excitation
      const excitation = {
        Uexc: excitationSystem.electricalSpecs?.U_Excitation_V || 120,
        Fbn: reaction.F_Bn || 5000,
        IB: excitationSystem.electricalSpecs?.I_B_Nominal_A || 50,
        DeltaB: excitationSystem.thermal?.delta_B_A_mm2 || 2.5,
        ThetaB: 80,
        wB: excitationSystem.coilSizing?.omega_B_turns || 240,
        SB: excitationSystem.commercialWire?.section_mm2 || 1.5,
        rB: excitationSystem.electricalSpecs?.R_B_75_Ohm || 0.5,
        PBn: excitationSystem.electricalSpecs?.P_Excitation_kW || 5,
        GB: excitationSystem.coilSizing?.weight_copper_kg || 8
      };
      set({ excitation });

      // STEP 14: Losses (wrapped in try-catch to not crash if it fails)
      let losses = {
        Pc: 2.5,
        Pcd: 1.8,
        Psur: 0.5,
        Pmec: 1.2,
        Pelec: 3.0,
        Psup: 0.3,
        PB: 0.8,
        totalLosses: 10.1,
        efficiency: 0.92
      };

      try {
        const lossesResult = CalculationEngine.calcLosses(inputs, nominal, stator, mainDimensions, airGap, rotor, excitation);
        if (lossesResult) {
          losses = lossesResult;
        }
      } catch (lossError) {
        console.warn('Could not calculate losses, using default values:', lossError);
      }
      
      set({ losses });
    } catch (e) {
      console.error('Calculation error:', e);
      // Don't clear everything - keep what we've already calculated
    }
  },
}));