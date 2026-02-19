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
      const airGap = CalculationEngine.calcAirGap(mainDimensions, nominal, stator);
      const rotor = CalculationEngine.calcRotor(inputs, nominal, mainDimensions, stator, airGap);
      const reactances = CalculationEngine.calcReactances(inputs, nominal, stator, airGap, mainDimensions);
      const excitation = CalculationEngine.calcExcitation(inputs, nominal, stator, airGap, rotor, mainDimensions, reactances);
      const losses = CalculationEngine.calcLosses(inputs, nominal, stator, mainDimensions, airGap, rotor, excitation);

      set({ nominal, mainDimensions, stator, airGap, rotor, reactances, excitation, losses });
    } catch (e) {
      console.error('Calculation error:', e);
    }
  },
}));
