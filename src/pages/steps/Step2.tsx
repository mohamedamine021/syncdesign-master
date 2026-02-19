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
  }, []);

  if (!nominal) return <StepLayout stepNumber={2} title="Valeurs nominales"><p className="text-destructive">Veuillez corriger les paramètres d'entrée.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={2} title="Valeurs nominales" description="Calcul automatique des grandeurs nominales de la machine">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Tension par phase (couplage étoile)"
            tex={`U_{ph} = \\frac{U_n}{\\sqrt{3}} = \\frac{${inputs.Un}}{\\sqrt{3}} = ${fmt(nominal.Uph, 1)} \\; V`}
            result={fmt(nominal.Uph, 1)}
            unit="V"
          />
          <FormulaResult
            label="Puissance apparente nominale"
            tex={`S_n = \\frac{P_n}{\\cos\\varphi} = \\frac{${inputs.Pn}}{${inputs.cosPhi}} = ${fmt(nominal.Sn, 1)} \\; kVA`}
            result={fmt(nominal.Sn, 1)}
            unit="kVA"
          />
          <FormulaResult
            label="Courant nominal par phase"
            tex={`I_n = \\frac{S_n \\times 10^3}{\\sqrt{3} \\cdot U_n} = \\frac{${fmt(nominal.Sn, 1)} \\times 10^3}{\\sqrt{3} \\times ${inputs.Un}} = ${fmt(nominal.In, 1)} \\; A`}
            result={fmt(nominal.In, 1)}
            unit="A"
          />
          <FormulaResult
            label="Nombre de paires de pôles"
            tex={`p = \\frac{60f}{n_n} = \\frac{60 \\times ${inputs.f}}{${inputs.nn}} = ${nominal.p}`}
            result={String(nominal.p)}
          />
        </div>

        <ResultTable
          title="Résumé des valeurs nominales"
          rows={[
            { label: 'Tension par phase', symbol: 'Uph', value: fmt(nominal.Uph, 1), unit: 'V' },
            { label: 'Puissance apparente', symbol: 'Sn', value: fmt(nominal.Sn, 1), unit: 'kVA' },
            { label: 'Courant nominal', symbol: 'In', value: fmt(nominal.In, 1), unit: 'A' },
            { label: 'Paires de pôles', symbol: 'p', value: String(nominal.p) },
            { label: 'Nombre de pôles', symbol: '2p', value: String(2 * nominal.p) },
          ]}
        />
      </div>
    </StepLayout>
  );
}
