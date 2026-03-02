import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

export default function Step11() {
  const { inputs, nominal, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(11);
    recalculate();
  }, []);

  // For now, show placeholder until reactances and other dependencies are calculated
  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout 
      stepNumber={11} 
      title="Paramètres dynamiques" 
      description="Réactances synchrones, transitoires et constantes de temps"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-5 bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground mb-4">Réactances de réaction d'induit</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-card border border-border">
                <p className="text-xs text-muted-foreground">Réactance longitudinale</p>
                <p className="text-lg font-mono text-foreground font-bold">xad</p>
                <p className="text-xs text-muted-foreground">p.u.</p>
              </div>
              <div className="p-3 rounded-md bg-card border border-border">
                <p className="text-xs text-muted-foreground">Réactance transversale</p>
                <p className="text-lg font-mono text-foreground font-bold">xaq</p>
                <p className="text-xs text-muted-foreground">p.u.</p>
              </div>
            </div>
          </div>

          <FormulaResult
            label="Réactance synchrone longitudinale"
            tex={`x_d = x_\\sigma + x_{ad} \\; (\\text{p.u.})`}
            result="—"
            unit="p.u."
          />
        </div>

        <div className="space-y-4">
          <ResultTable
            title="Réactances & Résistances"
            rows={[
              { label: 'Réactance dispersion', symbol: 'xσ', value: '—', unit: 'p.u.' },
              { label: 'Réactance ad', symbol: 'xad', value: '—', unit: 'p.u.' },
              { label: 'Réactance aq', symbol: 'xaq', value: '—', unit: 'p.u.' },
              { label: 'Réactance synchrone d', symbol: 'xd', value: '—', unit: 'p.u.' },
              { label: 'Réactance synchrone q', symbol: 'xq', value: '—', unit: 'p.u.' },
              { label: 'Réactance excitation', symbol: 'xB', value: '—', unit: 'p.u.' },
              { label: 'Réactance dispersion exc.', symbol: 'xBσ', value: '—', unit: 'p.u.' },
              { label: 'Réactance transitoire d', symbol: "xd'", value: '—', unit: 'p.u.' },
              { label: 'Réactance inverse', symbol: 'x2', value: '—', unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Constantes de temps"
            rows={[
              { label: 'Temps à vide', symbol: 'Td0', value: '—', unit: 's' },
              { label: 'Temps transitoire', symbol: "Td'", value: '—', unit: 's' },
              { label: 'Temps induit', symbol: 'Ta', value: '—', unit: 's' },
            ]}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-5 bg-info/10">
        <p className="text-xs text-info font-medium">
          ℹ Cette étape calcule les paramètres de fonctionnement dynamique à partir des données des étapes précédentes.
        </p>
      </div>
    </StepLayout>
  );
}
