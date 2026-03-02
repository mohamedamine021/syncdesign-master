import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step12() {
  const { nominal, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(12);
    recalculate();
  }, []);

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout 
      stepNumber={12} 
      title="Courants de court-circuit" 
      description="Calcul des courants de court-circuit en régime à vide et en charge"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Courant de court-circuit à vide"
            tex={`I_{cc0} = \\frac{E_0'}{x_d} \\quad (\\text{p.u.})`}
            result="—"
            unit="p.u."
          />

          <FormulaResult
            label="Courant de court-circuit nominal"
            tex={`I_{ccn} = I_{cc0} \\times F_{Bn}^* \\quad (\\text{p.u.})`}
            result="—"
            unit="p.u."
          />

          <div className="rounded-lg border border-border p-4 bg-warning/10">
            <h4 className="text-sm font-semibold text-foreground mb-3">Courant de court-circuit réel</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Iccn (Ampères)</span>
                <span className="text-lg font-mono font-bold text-foreground">—</span>
              </div>
              <div className="text-xs text-warning">
                ⚠ Le courant de court-circuit dépend directement de la réactance synchrone xd
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ResultTable
            title="Données d'entrée"
            rows={[
              { label: 'Tension induite interne', symbol: 'E₀\'*', value: '1.08', unit: 'p.u.' },
              { label: 'Réactance synchrone d', symbol: 'xd', value: '—', unit: 'p.u.' },
              { label: 'MMF excitation', symbol: 'FBn*', value: '—', unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Résultats"
            rows={[
              { label: 'Courant cc à vide', symbol: 'Icc0', value: '—', unit: 'p.u.' },
              { label: 'Courant cc nominal', symbol: 'Iccn', value: '—', unit: 'p.u.' },
              { label: 'Courant cc nominal', symbol: 'Iccn', value: '—', unit: 'A' },
            ]}
          />

          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Facteur de court-circuit</h4>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">kcc</p>
              <p className="text-2xl font-mono font-bold text-foreground">—</p>
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
