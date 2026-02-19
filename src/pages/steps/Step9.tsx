import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step9() {
  const { excitation, setCurrentStep, recalculate } = useMachineStore();
  useEffect(() => { setCurrentStep(9); recalculate(); }, []);

  if (!excitation) return <StepLayout stepNumber={9} title="Excitation"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={9} title="Système d'excitation" description="Calcul du courant d'excitation et vérifications thermiques">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult label="Courant d'excitation" tex={`I_B = \\Delta_B \\cdot S_B = ${fmt(excitation.DeltaB)} \\times ${fmt(excitation.SB, 1)} = ${fmt(excitation.IB, 0)} \\; A`} result={fmt(excitation.IB, 0)} unit="A" />
          <FormulaResult label="FMM d'excitation nominale" tex={`F_{Bn} = 2.06 \\cdot F_{\\delta 0} = ${fmt(excitation.Fbn, 0)} \\; A`} result={fmt(excitation.Fbn, 0)} unit="A" />
          <FormulaResult label="Puissance d'excitation" tex={`P_{Bn} = U_{exc} \\cdot I_{B,max} \\times 10^{-3} = ${fmt(excitation.PBn, 1)} \\; kW`} result={fmt(excitation.PBn, 1)} unit="kW" />

          <div className={`p-3 rounded-md border text-sm ${excitation.ThetaB <= 100 ? 'border-success/50 bg-success/10 text-success' : 'border-destructive/50 bg-destructive/10 text-destructive'}`}>
            {excitation.ThetaB <= 100
              ? `✓ Température ${excitation.ThetaB}°C — dans les limites`
              : `✗ Température ${excitation.ThetaB}°C — DÉPASSEMENT`}
          </div>
        </div>

        <ResultTable title="Système d'excitation" rows={[
          { label: 'Tension d\'excitation', symbol: 'Uexc', value: fmt(excitation.Uexc, 0), unit: 'V' },
          { label: 'Courant d\'excitation', symbol: 'IB', value: fmt(excitation.IB, 0), unit: 'A' },
          { label: 'Densité courant', symbol: 'ΔB', value: fmt(excitation.DeltaB, 2), unit: 'A/mm²' },
          { label: 'Température', symbol: 'ΘB', value: fmt(excitation.ThetaB, 0), unit: '°C' },
          { label: 'Spires par pôle', symbol: 'wB', value: String(excitation.wB) },
          { label: 'Section conducteur', symbol: 'SB', value: fmt(excitation.SB, 1), unit: 'mm²' },
          { label: 'Résistance', symbol: 'rB', value: fmt(excitation.rB, 4), unit: 'Ω' },
          { label: 'Puissance excitation', symbol: 'PBn', value: fmt(excitation.PBn, 1), unit: 'kW' },
          { label: 'Poids cuivre', symbol: 'GB', value: fmt(excitation.GB, 1), unit: 'kg' },
        ]} />
      </div>
    </StepLayout>
  );
}
