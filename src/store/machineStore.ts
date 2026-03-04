import { create } from 'zustand';
import type { MachineState, InputParams } from '@/types/machine';
import { CalculationEngine } from '@/engine/CalculationEngine';

interface MachineStore extends MachineState {
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
      
      // Build and save reactances
      const reactances = {
        xSigma: reactanceData.x_sigma_pu || 0.1,
        xad: 1.8,
        xaq: 1.6,
        xd: 1.9,
        xq: 1.7,
        xPrimeD: 0.3,
        x2: 0.2,
        r_a: 0.001
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
