import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step3() {
  const { nominal, mainDimensions: dim, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(3);
    recalculate();
  }, []);

  if (!dim || !nominal) return <StepLayout stepNumber={3} title="Dimensions principales"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={3} title="Dimensions principales" description="Diamètres, pas polaire et longueur du stator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Coefficient KE (impact réactance dispersion)"
            tex={`K_E = \\sqrt{\\cos^2\\varphi + (\\sin\\varphi + x_\\sigma)^2} = \\sqrt{${inputs.cosPhi}^2 + (\\sqrt{1-${inputs.cosPhi}^2} + 0.1)^2} = ${fmt(dim.KE, 3)}`}
            result={fmt(dim.KE, 3)}
          />
          <FormulaResult
            label="Puissance apparente de calcul"
            tex={`S' = \\frac{K_E \\cdot P_n}{\\cos\\varphi} = \\frac{${fmt(dim.KE, 3)} \\times ${inputs.Pn}}{${inputs.cosPhi}} = ${fmt(dim.Sprime, 1)} \\; kVA`}
            result={fmt(dim.Sprime, 1)}
            unit="kVA"
          />
          <FormulaResult
            label="Diamètre d'alésage"
            tex={`D \\approx 7.1 \\sqrt{p} \\cdot (S')^{0.25} = 7.1 \\sqrt{${nominal.p}} \\times ${fmt(dim.Sprime, 1)}^{0.25} \\approx ${fmt(dim.D, 0)} \\; cm`}
            result={fmt(dim.D, 0)}
            unit="cm"
          />
          <FormulaResult
            label="Pas polaire"
            tex={`\\tau = \\frac{\\pi D}{2p} = \\frac{\\pi \\times ${fmt(dim.D, 0)}}{${2 * nominal.p}} = ${fmt(dim.tau, 2)} \\; cm`}
            result={fmt(dim.tau, 2)}
            unit="cm"
          />
          <FormulaResult
            label="Rapport longueur/pas (λ)"
            tex={`\\lambda = \\frac{l_\\delta}{\\tau} = \\frac{${fmt(dim.lDeltaFinal, 1)}}{${fmt(dim.tau, 2)}} = ${fmt(dim.lambda, 2)}`}
            result={fmt(dim.lambda, 2)}
          />
        </div>

        <div className="space-y-4">
          <ResultTable
            title="Dimensions du stator"
            rows={[
              { label: 'Diamètre intérieur', symbol: 'D', value: fmt(dim.D, 0), unit: 'cm' },
              { label: 'Diamètre extérieur', symbol: 'Da', value: fmt(dim.Da, 1), unit: 'cm' },
              { label: 'Diamètre normalisé', symbol: 'Da,norm', value: fmt(dim.DaNorm, 1), unit: 'cm' },
              { label: 'Pas polaire', symbol: 'τ', value: fmt(dim.tau, 1), unit: 'cm' },
              { label: 'Longueur calculée', symbol: "l'δ", value: fmt(dim.lPrimeDelta, 1), unit: 'cm' },
              { label: 'Longueur réelle', symbol: 'lδ', value: fmt(dim.lDelta, 1), unit: 'cm' },
              { label: 'Longueur totale', symbol: 'l₁', value: fmt(dim.l1, 1), unit: 'cm' },
              { label: 'Longueur effective', symbol: 'lδ,final', value: fmt(dim.lDeltaFinal, 1), unit: 'cm' },
              { label: 'Ratio λ', symbol: 'λ', value: fmt(dim.lambda, 2) },
            ]}
          />
          <div className={`p-3 rounded-md border text-sm ${dim.lambda >= 1 && dim.lambda <= 3 ? 'border-success/50 bg-success/10 text-success' : 'border-warning/50 bg-warning/10 text-warning'}`}>
            {dim.lambda >= 1 && dim.lambda <= 3
              ? '✓ λ est dans les normes (1 ≤ λ ≤ 3)'
              : '⚠ λ hors normes — vérifiez les dimensions'}
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
