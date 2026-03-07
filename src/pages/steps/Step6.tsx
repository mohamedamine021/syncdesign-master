import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step6() {
  const { inputs, nominal, mainDimensions: dim, stator, airGap, setCurrentStep, recalculate } = useMachineStore();
  useEffect(() => { setCurrentStep(6); recalculate(); }, []);

  if (!airGap || !dim || !stator || !nominal)
    return <StepLayout stepNumber={6} title="Entrefer & Carter"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={6} title="Entrefer & Coefficient de Carter" description="Calcul de l'entrefer et du coefficient de Carter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Longueur de l'entrefer"
            tex={`\\delta = \\frac{0{,}36 \\cdot A \\cdot \\tau}{K' \\cdot (x_d^* - x_\\sigma^*) \\cdot B_{\\delta 0}}`}
            result={fmt(airGap.delta)}
            unit="cm"
          />
          <FormulaResult
            label="Entrefer en mm"
            tex={`\\delta_{mm} = \\delta \\times 10`}
            result={fmt(airGap.delta * 10, 1)}
            unit="mm"
          />
          <FormulaResult
            label="Coefficient de Carter"
            tex={`K_\\delta = f\\!\\left(\\frac{b_{oe}}{\\delta}\\right)`}
            result={fmt(airGap.Kdelta)}
          />
        </div>

        <ResultTable title="Résumé entrefer" rows={[
          { label: 'Entrefer', symbol: 'δ', value: fmt(airGap.delta), unit: 'cm' },
          { label: 'Entrefer', symbol: 'δ', value: fmt(airGap.delta * 10, 1), unit: 'mm' },
          { label: 'Coefficient de Carter', symbol: 'Kδ', value: fmt(airGap.Kdelta) },
          { label: 'Charge linéique', symbol: 'A', value: fmt(dim.A, 0), unit: 'A/cm' },
          { label: 'Pas polaire', symbol: 'τ', value: fmt(dim.tau, 1), unit: 'cm' },
          { label: 'Induction entrefer', symbol: 'Bδ0', value: fmt(stator.Bd0, 0), unit: 'Gauss' },
        ]} />
      </div>
    </StepLayout>
  );
}
