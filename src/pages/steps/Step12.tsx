import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

export default function Step12() {
  const { inputs, nominal, reactances, stator, airGap, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(12);
    }
  }, [setCurrentStep]);

  const fmt = (v: number | null | undefined, d = 2) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toFixed(d);
  };

  // Calculate short-circuit currents if necessary data exists
  let shortCircuit: any = null;
  if (reactances && stator && airGap && mainDimensions && nominal) {
    try {
      shortCircuit = CalculationEngine.calcShortCircuitCurrents(
        inputs,
        nominal,
        mainDimensions,
        stator,
        airGap,
        reactances
      );
    } catch (e) {
      console.error('Error calculating short-circuit currents:', e);
    }
  }

  const icc0 = shortCircuit?.Icc0_pu || (nominal ? 1 / (reactances?.xd || 1.9) : 0);
  const iccnA = shortCircuit?.Iccn_A || (nominal && icc0 ? icc0 * nominal.In : 0);
  const kcc = icc0 || null;

  return (
    <StepLayout 
      stepNumber={12} 
      title="Courants de court-circuit" 
      description="Calcul des courants de court-circuit en régime à vide et en charge"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Calculs court-circuit</h3>
          <FormulaResult
            label="Courant de court-circuit à vide"
            tex={`I_{cc0} = \\frac{1}{x_d}`}
            result={fmt(icc0)}
            unit="p.u."
          />

          <FormulaResult
            label="Courant de court-circuit nominal"
            tex={`I_{ccn} = I_{cc0} \\times I_n`}
            result={fmt(iccnA)}
            unit="A"
          />

          <div className="mt-4 rounded-lg border border-border p-4 bg-warning/10">
            <h4 className="text-sm font-semibold text-foreground mb-3">Courant de court-circuit réel</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Iccn (Ampères)</span>
                <span className="text-lg font-mono font-bold text-foreground">{fmt(iccnA)}</span>
              </div>
              <div className="text-xs text-warning">
                ⚠ Le courant de court-circuit dépend directement de la réactance synchrone xd = {fmt(reactances?.xd)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Résumé court-circuit</h3>
          <ResultTable
            title="Données d'entrée"
            rows={[
              { label: 'Tension induite interne', symbol: 'E₀\'*', value: '1.08', unit: 'p.u.' },
              { label: 'Réactance synchrone d', symbol: 'xd', value: fmt(reactances?.xd), unit: 'p.u.' },
              { label: 'Courant nominal', symbol: 'In', value: fmt(nominal?.In), unit: 'A' },
            ]}
          />

          <ResultTable
            title="Résultats"
            rows={[
              { label: 'Courant cc à vide', symbol: 'Icc0', value: fmt(icc0), unit: 'p.u.' },
              { label: 'Courant cc à vide', symbol: 'Icc0', value: fmt(icc0 && nominal ? icc0 * nominal.In : 0), unit: 'A' },
              { label: 'Courant cc nominal', symbol: 'Iccn', value: fmt(iccnA), unit: 'A' },
            ]}
          />

          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Facteur de court-circuit</h4>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">kcc = 1/xd</p>
              <p className="text-2xl font-mono font-bold text-foreground">{fmt(kcc)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-5 bg-info/10">
        <p className="text-xs text-info font-medium">
          ℹ Les courants de court-circuit sont essentiels pour dimensionner les appareils de protection (disjoncteurs, fusibles).
        </p>
      </div>
    </StepLayout>
  );
}
