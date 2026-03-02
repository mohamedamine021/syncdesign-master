import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

export default function Step11() {
  const { inputs, nominal, reactances, stator, airGap, mainDimensions, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(11);
  }, [setCurrentStep]);

  const fmt = (v: number | null | undefined, d = 3) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toFixed(d);
  };

  // Calculate machine parameters if reactances exist
  let machineParams: any = null;
  if (reactances && stator && airGap && mainDimensions && nominal) {
    try {
      machineParams = CalculationEngine.calcMachineParameters(
        inputs,
        nominal,
        mainDimensions,
        stator,
        airGap,
        reactances
      );
    } catch (e) {
      console.error('Error calculating machine parameters:', e);
    }
  }

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
                <p className="text-lg font-mono text-foreground font-bold">{fmt(machineParams?.xad || reactances?.xad)}</p>
                <p className="text-xs text-muted-foreground">p.u.</p>
              </div>
              <div className="p-3 rounded-md bg-card border border-border">
                <p className="text-xs text-muted-foreground">Réactance transversale</p>
                <p className="text-lg font-mono text-foreground font-bold">{fmt(machineParams?.xaq || reactances?.xaq)}</p>
                <p className="text-xs text-muted-foreground">p.u.</p>
              </div>
            </div>
          </div>

          <FormulaResult
            label="Réactance synchrone longitudinale"
            tex={`x_d = x_\\sigma + x_{ad}`}
            result={fmt(machineParams?.xd || (reactances?.xSigma || 0) + (reactances?.xad || 0))}
            unit="p.u."
          />
        </div>

        <div className="space-y-4">
          <ResultTable
            title="Réactances & Résistances"
            rows={[
              { label: 'Réactance dispersion', symbol: 'xσ', value: fmt(reactances?.xSigma), unit: 'p.u.' },
              { label: 'Réactance ad', symbol: 'xad', value: fmt(machineParams?.xad || reactances?.xad), unit: 'p.u.' },
              { label: 'Réactance aq', symbol: 'xaq', value: fmt(machineParams?.xaq || reactances?.xaq), unit: 'p.u.' },
              { label: 'Réactance synchrone d', symbol: 'xd', value: fmt(machineParams?.xd), unit: 'p.u.' },
              { label: 'Réactance synchrone q', symbol: 'xq', value: fmt(machineParams?.xq), unit: 'p.u.' },
              { label: 'Réactance excitation', symbol: 'xB', value: fmt(machineParams?.xB), unit: 'p.u.' },
              { label: 'Réactance dispersion exc.', symbol: 'xBσ', value: fmt(machineParams?.xBsigma), unit: 'p.u.' },
              { label: 'Réactance transitoire d', symbol: "xd'", value: fmt(machineParams?.xdPrime), unit: 'p.u.' },
              { label: 'Réactance inverse', symbol: 'x2', value: fmt(machineParams?.x2), unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Constantes de temps"
            rows={[
              { label: 'Temps à vide', symbol: 'Td0', value: fmt(machineParams?.Td0), unit: 's' },
              { label: 'Temps transitoire', symbol: "Td'", value: fmt(machineParams?.TdPrime), unit: 's' },
              { label: 'Temps induit', symbol: 'Ta', value: fmt(machineParams?.Ta), unit: 's' },
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
