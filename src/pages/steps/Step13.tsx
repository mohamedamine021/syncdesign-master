import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step13() {
  const { inputs, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(13);
    recalculate();
  }, []);

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout 
      stepNumber={13} 
      title="Surcharge statique et stabilité" 
      description="Évaluation de la capacité de surcharge de la machine synchrone"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Tension interne fictive"
            tex={`E_{00}'^* = E_0'^* \\times I_{Bn}^*`}
            result="—"
            unit="p.u."
          />

          <FormulaResult
            label="Coefficient de saillance"
            tex={`\\varepsilon = \\frac{x_d - x_q}{E_{00}'^* \\times x_q}`}
            result="—"
          />

          <FormulaResult
            label="Facteur de correction k"
            tex={`k = 1 + 0.11 \\times \\varepsilon`}
            result="—"
          />

          <FormulaResult
            label="Surcharge statique maximale"
            tex={`S = \\frac{I_{ccn}}{\\cos\\varphi} \\times k = \\frac{I_{ccn}}{${fmt(inputs.cosPhi)}} \\times k`}
            result="—"
          />
        </div>

        <div className="space-y-4">
          <ResultTable
            title="Paramètres de réaction d'induit"
            rows={[
              { label: 'Réactance synchrone d', symbol: 'xd', value: '—', unit: 'p.u.' },
              { label: 'Réactance synchrone q', symbol: 'xq', value: '—', unit: 'p.u.' },
              { label: 'Courant court-circuit', symbol: 'Iccn', value: '—', unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Stabilité de la machine"
            rows={[
              { label: 'E00\'* (p.u.)', symbol: 'E₀₀\'*', value: '—', unit: 'p.u.' },
              { label: 'Coefficient ε', symbol: 'ε', value: '—', unit: '' },
              { label: 'Facteur k', symbol: 'k', value: '—', unit: '' },
              { label: 'Surcharge S', symbol: 'S', value: '—', unit: '(multiples de Pn)' },
            ]}
          />

          <div className="rounded-lg border border-success/50 bg-success/10 p-4">
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
              <p className="text-sm text-foreground font-mono">S > 1.5</p>
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
