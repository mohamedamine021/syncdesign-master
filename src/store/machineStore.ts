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
      
      // Step 7-9: No-load characteristics and load excitation
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      
      // Step 8: Leakage reactance
      const reactanceData = CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      
      // Build reactances object for legacy compatibility
      const reactances = {
        xSigma: reactanceData.x_sigma_pu,
        xad: 0, // Calculated in step 11
        xaq: 0, // Calculated in step 11
        xd: 0,
        xq: 0,
        xPrimeD: 0,
        x2: 0,
        r_a: 0.001 // Placeholder
      };
      
      // Step 9-10: Load excitation and excitation system
      const loadExcitation = CalculationEngine.calcLoadExcitation(nominal, stator, airGap, mainDimensions, noLoadData, reactanceData);
      const excitationSystem = CalculationEngine.calcExcitationSystem(nominal, mainDimensions, airGap, loadExcitation.F_Bn);
      
      // Build excitation object for legacy compatibility
      const excitation = {
        Uexc: excitationSystem.electricalSpecs.I_B_Nominal_A,
        Fbn: loadExcitation.F_Bn,
        IB: excitationSystem.electricalSpecs.I_B_Nominal_A,
        DeltaB: excitationSystem.thermal.delta_B_A_mm2,
        ThetaB: 80,
        wB: excitationSystem.coilSizing.omega_B_turns,
        SB: excitationSystem.commercialWire.section_mm2,
        rB: excitationSystem.electricalSpecs.R_B_75_Ohm,
        PBn: excitationSystem.electricalSpecs.P_Excitation_kW,
        GB: excitationSystem.coilSizing.weight_copper_kg
      };
      
      // Step 14: Losses and efficiency
      const lossesData = CalculationEngine.calcLossesAndEfficiency(inputs, nominal, mainDimensions, stator, airGap, excitationSystem, reactanceData);
      
      // Build losses object for legacy compatibility
      const losses = {
        Pc: lossesData.losses_kW.iron_yoke_Pc,
        Pcd: lossesData.losses_kW.iron_teeth_Pcd,
        Psur: lossesData.losses_kW.pole_surface_Psur,
        Pmec: lossesData.losses_kW.mechanical_Pmec,
        Pelec: lossesData.losses_kW.stator_copper_Pelec,
        Psup: lossesData.losses_kW.supplementary_Psup,
        PB: lossesData.losses_kW.excitation_PB,
        totalLosses: lossesData.losses_kW.total_SigmaP,
        efficiency: lossesData.efficiency.eta_per_unit
      };

      set({ nominal, mainDimensions, stator, airGap, rotor, reactances, excitation, losses });
    } catch (e) {
      console.error('Calculation error:', e);
      set({ nominal: null, mainDimensions: null, stator: null, airGap: null, rotor: null, reactances: null, excitation: null, losses: null });
    }
  },
}));
