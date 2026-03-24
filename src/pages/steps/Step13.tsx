import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

export default function Step13() {
  const { inputs, nominal, reactances, stator, airGap, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(13);
    }
  }, [setCurrentStep]);

  const fmt = (v: number | null | undefined, d = 2) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toFixed(d);
  };

  // Calculate static overload capacity
  let overloadData: any = null;
  if (reactances && stator && airGap && mainDimensions && nominal) {
    try {
      overloadData = CalculationEngine.calcStaticOverload(
        inputs,
        nominal,
        mainDimensions,
        stator,
        airGap,
        reactances
      );
    } catch (e) {
      console.error('Error calculating static overload:', e);
    }
  }

  const xd = reactances?.xd || 1.9;
  const xq = reactances?.xq || 1.7;
  const icc0 = nominal ? 1 / xd : 0;
  const epsilon = overloadData?.epsilon || (xd && xq ? (xd - xq) / (1.08 * xq) : 0);
  const k = 1 + 0.11 * (epsilon || 0);
  const S = overloadData?.S_overload_pu || (icc0 ? (icc0 / inputs.cosPhi) * k : 0);

  return (
    <StepLayout 
      stepNumber={13} 
      title="Surcharge statique et stabilité" 
      description="Évaluation de la capacité de surcharge de la machine synchrone"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Calculs de stabilité</h3>
          <FormulaResult
            label="Tension interne fictive"
            tex={`E_{00}'^* = 1.08`}
            result="1.08"
            unit="p.u."
          />

          <FormulaResult
            label="Coefficient de saillance"
            tex={`\\varepsilon = \\frac{x_d - x_q}{E_{00}'^* \\times x_q} = \\frac{${fmt(xd)} - ${fmt(xq)}}{1.08 \\times ${fmt(xq)}}`}
            result={fmt(epsilon)}
          />

          <FormulaResult
            label="Facteur de correction k"
            tex={`k = 1 + 0.11 \\times ${fmt(epsilon)}`}
            result={fmt(k)}
          />

          <FormulaResult
            label="Surcharge statique maximale"
            tex={`S = \\frac{I_{cc0}}{\\cos\\varphi} \\times k`}
            result={fmt(S)}
          />
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Résumé - Stabilité</h3>
          <ResultTable
            title="Paramètres de réaction d'induit"
            rows={[
              { label: 'Réactance synchrone d', symbol: 'xd', value: fmt(xd), unit: 'p.u.' },
              { label: 'Réactance synchrone q', symbol: 'xq', value: fmt(xq), unit: 'p.u.' },
              { label: 'Courant court-circuit', symbol: 'Icc0', value: fmt(icc0), unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Stabilité de la machine"
            rows={[
              { label: 'E00\'* (p.u.)', symbol: 'E₀₀\'*', value: '1.08', unit: 'p.u.' },
              { label: 'Coefficient ε', symbol: 'ε', value: fmt(epsilon), unit: '' },
              { label: 'Facteur k', symbol: 'k', value: fmt(k), unit: '' },
              { label: 'Surcharge S', symbol: 'S', value: fmt(S), unit: '(multiples de Pn)' },
            ]}
          />

          <div className="rounded-lg border border-success/50 bg-success/10 p-4 mt-4">
            <h4 className="text-sm font-semibold text-success mb-2">Interprétation</h4>
            <p className="text-xs text-success/90 leading-relaxed">
              S représente le multiple de puissance nominale que la machine peut fournir en surcharge avant de perdre la stabilité.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-lg border border-border p-5 bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Critères de stabilité</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Machine stable si</p>
              <p className="text-sm text-foreground font-mono">S {'>'}  1.5</p>
              <p className="text-xs text-muted-foreground mt-1">Bonne marge d'instabilité</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Limite de stabilité</p>
              <p className="text-sm text-foreground font-mono">S ≈ 1.0</p>
              <p className="text-xs text-muted-foreground mt-1">Point de basculement (Pull-out)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-5 bg-info/10">
        <p className="text-xs text-info font-medium">
          ℹ La surcharge statique indique le multiple de puissance nominale avant perte de synchronisme de la machine.
        </p>
      </div>
    </StepLayout>
  );
}
