import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

export default function Step11() {
  const { inputs, nominal, reactances, stator, airGap, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(11);
    }
  }, [setCurrentStep]);

  // Safety check: ensure all required data is available
  if (!reactances || !stator || !airGap || !mainDimensions || !nominal || !inputs) {
    return (
      <StepLayout 
        stepNumber={11} 
        title="Paramètres dynamiques" 
        description="Réactances synchrones, transitoires et constantes de temps"
      >
        <p className="text-destructive">Données manquantes. Veuillez compléter les étapes précédentes.</p>
      </StepLayout>
    );
  }

  const fmt = (v: number | null | undefined | string, d = 3) => {
    if (typeof v === 'string') return v;
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toFixed(d);
  };

  return (
    <StepLayout 
      stepNumber={11} 
      title="Paramètres dynamiques" 
      description="Réactances synchrones, transitoires et constantes de temps"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Réactances de réaction d'induit</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-card border border-border">
              <p className="text-xs text-muted-foreground">Réactance longitudinale</p>
              <p className="text-lg font-mono text-foreground font-bold">{fmt(reactances?.xad)}</p>
              <p className="text-xs text-muted-foreground">p.u.</p>
            </div>
            <div className="p-3 rounded-md bg-card border border-border">
              <p className="text-xs text-muted-foreground">Réactance transversale</p>
              <p className="text-lg font-mono text-foreground font-bold">{fmt(reactances?.xaq)}</p>
              <p className="text-xs text-muted-foreground">p.u.</p>
            </div>
          </div>

          <FormulaResult
            label="Réactance synchrone longitudinale"
            tex={`x_d = x_\\sigma + x_{ad}`}
            result={fmt(reactances?.xd)}
            unit="p.u."
          />
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Résumé - Réactances & Constantes</h3>
          <ResultTable
            title="Réactances"
            rows={[
              { label: 'Réactance dispersion', symbol: 'xσ', value: fmt(reactances?.xSigma) || '—', unit: 'p.u.' },
              { label: 'Réactance ad', symbol: 'xad', value: fmt(reactances?.xad) || '—', unit: 'p.u.' },
              { label: 'Réactance aq', symbol: 'xaq', value: fmt(reactances?.xaq) || '—', unit: 'p.u.' },
              { label: 'Réactance synchrone d', symbol: 'xd', value: fmt(reactances?.xd) || '—', unit: 'p.u.' },
              { label: 'Réactance synchrone q', symbol: 'xq', value: fmt(reactances?.xq) || '—', unit: 'p.u.' },
              { label: 'Réactance excitation', symbol: 'xB', value: fmt(reactances?.x_B) || '—', unit: 'p.u.' },
              { label: 'Réactance dispersion exc.', symbol: 'xBσ', value: fmt(reactances?.x_Bsigma) || '—', unit: 'p.u.' },
              { label: 'Réactance transitoire d', symbol: "xd'", value: fmt(reactances?.xPrimeD) || '—', unit: 'p.u.' },
              { label: 'Réactance inverse', symbol: 'x2', value: fmt(reactances?.x2) || '—', unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Constantes de temps"
            rows={[
              { label: 'Temps à vide', symbol: 'Td0', value: (reactances?.timeConstants_s?.T_d0?.toFixed(3) || '—'), unit: 's' },
              { label: 'Temps transitoire', symbol: "Td'", value: (reactances?.timeConstants_s?.T_d_prime?.toFixed(3) || '—'), unit: 's' },
              { label: 'Temps induit', symbol: 'Ta', value: (reactances?.timeConstants_s?.T_a?.toFixed(3) || '—'), unit: 's' },
            ]}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-5 bg-info/10">
        <p className="text-xs text-info font-medium">
          ℹ Paramètres calculés à partir des réactances de l'étape 8 et des dimensions de la machine.
        </p>
      </div>
    </StepLayout>
  );
}
