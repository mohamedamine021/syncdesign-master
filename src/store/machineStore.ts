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
      const nominal = CalculationEngine.calcNominal(inputs);
      const mainDimensions = CalculationEngine.calcMainDimensions(inputs, nominal);
      const stator = CalculationEngine.calcStator(inputs, nominal, mainDimensions);
      const airGap = CalculationEngine.calcAirGap(mainDimensions, stator);
      const rotor = CalculationEngine.calcRotor(mainDimensions, stator, airGap);
      
      // Placeholder reactances and excitation for compatibility with existing steps
      const reactances = {
        xSigma: 0.1,
        xad: 1.8,
        xaq: 1.6,
        xd: 1.9,
        xq: 1.7,
        xPrimeD: 0.3,
        x2: 0.2,
        r_a: 0.001
      };
      
      const excitation = {
        Uexc: 120,
        Fbn: 5000,
        IB: 50,
        DeltaB: 2.5,
        ThetaB: 80,
        wB: 240,
        SB: 1.5,
        rB: 0.5,
        PBn: 5,
        GB: 8
      };
      
      // Placeholder losses for compatibility
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
