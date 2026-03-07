import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step6() {
  const { airGap, mainDimensions: dim, setCurrentStep } = useMachineStore();
  useEffect(() => { setCurrentStep(6); }, [setCurrentStep]);

  if (!airGap || !dim) {
    return (
      <StepLayout stepNumber={6} title="Entrefer & Carter" description="Calcul de l'entrefer et du coefficient de Carter">
        <p className="text-destructive">Données manquantes. Veuillez compléter les étapes précédentes.</p>
      </StepLayout>
    );
  }

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={6} title="Entrefer & Coefficient de Carter" description="Calcul de l'entrefer et du coefficient de Carter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Longueur de l'entrefer"
            tex={`\\delta = \\frac{0.36 \\cdot A \\cdot \\tau}{K' \\cdot (x_d^* - x_\\sigma^*) \\cdot B_{\\delta 0}}`}
            result={fmt(airGap.delta)}
            unit="cm"
          />
          <FormulaResult
            label="Rapport d'ouverture d'encoche"
            tex={`\\text{ratio} = \\frac{b_{oe}}{\\delta}`}
            result={fmt(airGap.delta, 3)}
          />
          <FormulaResult
            label="Coefficient de saturation de l'entrefer"
            tex={`\\gamma = \\frac{\\text{ratio}^2}{5 + \\text{ratio}}`}
            result={fmt(airGap.Kdelta, 3)}
          />
          <FormulaResult
            label="Coefficient de Carter"
            tex={`K_\\delta = \\frac{t_1}{t_1 - \\gamma \\cdot \\delta}`}
            result={fmt(airGap.Kdelta)}
          />
        </div>

        <ResultTable title="Résumé entrefer" rows={[
          { label: 'Entrefer', symbol: 'δ', value: fmt(airGap.delta), unit: 'cm' },
          { label: 'Entrefer (mm)', symbol: 'δ', value: fmt(airGap.delta * 10, 1), unit: 'mm' },
          { label: 'Coefficient Carter', symbol: 'Kδ', value: fmt(airGap.Kdelta) },
          { label: 'Charge linéique', symbol: 'A', value: fmt(dim.A, 0), unit: 'A/cm' },
        ]} />
      </div>
    </StepLayout>
  );
}
