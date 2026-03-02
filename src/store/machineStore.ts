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

      // STEP 7: No-load characteristic (needed for Steps 8-10)
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);

      // STEP 8: Leakage reactance
      const reactanceData = CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      // Build reactances object from calculated data
      const reactances = {
        xSigma: reactanceData.x_sigma_pu || 0.1,
        xad: 1.8, // Will be refined in Step 11
        xaq: 1.6, // Will be refined in Step 11
        xd: 1.9,
        xq: 1.7,
        xPrimeD: 0.3,
        x2: 0.2,
        r_a: (stator.Ra75pu || 0.001)
      };

      // STEP 9-10: Load excitation and excitation system
      const loadExcitation = CalculationEngine.calcLoadExcitation(
        nominal,
        stator,
        airGap,
        mainDimensions,
        noLoadData,
        reactanceData
      );

      const excitationSystem = CalculationEngine.calcExcitationSystem(
        nominal,
        mainDimensions,
        airGap,
        loadExcitation.F_Bn
      );

      // Build excitation object from calculated data
      const excitation = {
        Uexc: excitationSystem.electricalSpecs?.U_Excitation_V || 120,
        Fbn: loadExcitation.F_Bn || 5000,
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
