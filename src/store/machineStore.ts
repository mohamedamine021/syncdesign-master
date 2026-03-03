import { create } from 'zustand';
import type { MachineState, InputParams } from '@/types/machine';
import { CalculationEngine } from '@/engine/CalculationEngine';

interface MachineStore extends MachineState {
  setInputs: (inputs: Partial<InputParams>) => void;
  setCurrentStep: (step: number) => void;
  recalculate: () => void;
}

const defaultInputs: InputParams = {
  Pn: 500,
  Un: 6300,
  cosPhi: 0.8,
  f: 50,
  nn: 750,
  m: 3,
};

export const useMachineStore = create<MachineStore>((set, get) => ({
  inputs: defaultInputs,
  nominal: null,
  mainDimensions: null,
  stator: null,
  airGap: null,
  rotor: null,
  reactances: null,
  excitation: null,
  losses: null,
  currentStep: 1,

  setInputs: (partial) => {
    set((state) => ({
      inputs: { ...state.inputs, ...partial },
    }));
    get().recalculate();
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  recalculate: () => {
    const { inputs } = get();
    const errors = CalculationEngine.validateInputs(inputs);
    if (errors.length > 0) {
      set({ nominal: null, mainDimensions: null, stator: null, airGap: null, rotor: null, reactances: null, excitation: null, losses: null });
      return;
    }

    try {
      // STEPS 1-7: Core machine geometry
      const nominal = CalculationEngine.calcNominal(inputs);
      const mainDimensions = CalculationEngine.calcMainDimensions(inputs, nominal);
      const stator = CalculationEngine.calcStator(inputs, nominal, mainDimensions);
      const airGap = CalculationEngine.calcAirGap(mainDimensions, stator);
      const rotor = CalculationEngine.calcRotor(mainDimensions, stator, airGap);
      
      // STEP 7: No-load characteristic (needed for Steps 8-11)
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);

      // STEP 8: Leakage reactance
      const reactanceData = CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      // STEP 9: Load excitation (reaction field)
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

      // STEP 11: Machine parameters (Réactances synchrones, transitoires, constantes de temps)
      // IMPORTANT: Respect the exact signature: (nom, airGap, noLoadData, reactances, reaction, rotor, ...)
      const machineParams = CalculationEngine.calcMachineParameters(
        nominal,
        airGap,
        noLoadData,
        reactanceData,  // This contains x_sigma, r_a, etc.
        reaction,       // This contains k_ad, k_aq, F_a from Étape 9
        excitationSystem.coilSizing  // This contains L_Bmoy_cm, omega_B, S_commercial_mm2
      );

      // Build reactances object with exact mapping as specified
      const reactances = {
        xSigma: reactanceData.x_sigma_pu,
        xad: machineParams.reactances_pu.x_ad,
        xaq: machineParams.reactances_pu.x_aq,
        xd: machineParams.reactances_pu.x_d,
        xq: machineParams.reactances_pu.x_q,
        x_B: machineParams.reactances_pu.x_B,
        x_Bsigma: machineParams.reactances_pu.x_Bsigma,
        xPrimeD: machineParams.reactances_pu.x_d_prime,
        x2: machineParams.reactances_pu.x_2,
        timeConstants_s: machineParams.timeConstants_s,
        r_a: reactanceData.r_a
      };

      // Build excitation object from calculated data
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

      // Build losses object (will be populated in Step 14)
      const losses = {
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

      set({ nominal, mainDimensions, stator, airGap, rotor, reactances, excitation, losses });
    } catch (e) {
      console.error('Calculation error:', e);
      set({ nominal: null, mainDimensions: null, stator: null, airGap: null, rotor: null, reactances: null, excitation: null, losses: null });
    }
  },
}));
