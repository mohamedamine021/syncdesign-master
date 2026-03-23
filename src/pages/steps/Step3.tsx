import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step3() {
  const { inputs, nominal, mainDimensions: dim, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(3);
    recalculate();
  }, [setCurrentStep, recalculate]);

  if (!dim || !nominal) return <StepLayout stepNumber={3} title="Dimensions principales"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={3} title="Dimensions principales" description="Diamètres, pas polaire et longueur du stator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Calculs des dimensions</h3>
          <FormulaResult
            label="Coefficient KE (impact réactance dispersion)"
            tex={`K_E = \\sqrt{\\cos^2\\varphi + (\\sin\\varphi + x_\\sigma)^2}`}
            result={fmt(dim.KE, 3)}
          />
          <FormulaResult
            label="Puissance apparente de calcul"
            tex={`S' = \\frac{K_E \\cdot P_n}{\\cos\\varphi}`}
            result={fmt(dim.Sprime, 1)}
            unit="kVA"
          />
          <FormulaResult
            label="Diamètre d'alésage (formule empirique)"
            tex={`D \\approx 7.1 \\sqrt{p} \\cdot (S')^{1/4}`}
            result={fmt(dim.D, 0)}
            unit="cm"
          />
          <FormulaResult
            label="Densité de flux à l'entrefer"
            tex={`B_{dn} = c_3 - \\frac{c_4}{\\tau}`}
            result={fmt(dim.Bdn, 0)}
            unit="G"
          />
          <FormulaResult
            label="Densité de courant linéaire"
            tex={`A = c_1 \\ln(\\tau) + c_2`}
            result={fmt(dim.A, 0)}
            unit="A/cm"
          />
          <FormulaResult
            label="Pas polaire"
            tex={`\\tau = \\frac{\\pi D}{2p}`}
            result={fmt(dim.tau, 2)}
            unit="cm"
          />
          <FormulaResult
            label="Longueur théorique du stator"
            tex={`l'_\\delta = \\frac{6.1 \\times 10^{11} S'}{\\alpha_\\delta K_B K_{01} A B_{dn} D^2 n_n}`}
            result={fmt(dim.lPrimeDelta, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Longueur réelle avec ventilation"
            tex={`l_\\delta = l_t \\cdot l'_\\delta`}
            result={fmt(dim.lDelta, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Rapport longueur/pas (λ)"
            tex={`\\lambda = \\frac{l_\\delta}{\\tau}`}
            result={fmt(dim.lambda, 2)}
          />
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Résumé des dimensions</h3>
          <ResultTable
            title=""
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
          <div className={`mt-4 p-3 rounded-md border text-sm ${dim.lambda >= 1 && dim.lambda <= 3 ? 'border-success/50 bg-success/10 text-success' : 'border-warning/50 bg-warning/10 text-warning'}`}>
            {dim.lambda >= 1 && dim.lambda <= 3
              ? '✓ λ est dans les normes (1 ≤ λ ≤ 3)'
              : '⚠ λ hors normes — vérifiez les dimensions'}
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
