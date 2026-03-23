import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step2() {
  const { inputs, nominal, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(2);
    recalculate();
  }, [setCurrentStep, recalculate]);

  if (!nominal) return <StepLayout stepNumber={2} title="Valeurs nominales"><p className="text-destructive">Veuillez corriger les paramètres d'entrée.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={2} title="Valeurs nominales" description="Calcul automatique des grandeurs nominales de la machine">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Calculs des paramètres nominaux</h3>
          <FormulaResult
            label="Tension par phase (couplage étoile)"
            tex={`U_{ph} = \\frac{U_n}{\\sqrt{3}}`}
            result={fmt(nominal.Uph, 1)}
            unit="V"
          />
          <FormulaResult
            label="Puissance apparente nominale"
            tex={`S_n = \\frac{P_n}{\\cos\\varphi}`}
            result={fmt(nominal.Sn, 1)}
            unit="kVA"
          />
          <FormulaResult
            label="Courant nominal par phase"
            tex={`I_n = \\frac{S_n \\times 10^3}{\\sqrt{3} \\cdot U_n}`}
            result={fmt(nominal.In, 1)}
            unit="A"
          />
          <FormulaResult
            label="Nombre de paires de pôles"
            tex={`p = \\frac{60f}{n_n}`}
            result={String(nominal.p)}
          />
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Résumé des valeurs nominales</h3>
          <ResultTable
            title=""
            rows={[
              { label: 'Tension par phase', symbol: 'Uph', value: fmt(nominal.Uph, 1), unit: 'V' },
              { label: 'Puissance apparente', symbol: 'Sn', value: fmt(nominal.Sn, 1), unit: 'kVA' },
              { label: 'Courant nominal', symbol: 'In', value: fmt(nominal.In, 1), unit: 'A' },
              { label: 'Paires de pôles', symbol: 'p', value: String(nominal.p) },
              { label: 'Nombre de pôles', symbol: '2p', value: String(2 * nominal.p) },
            ]}
          />
        </div>
      </div>
    </StepLayout>
  );
}
