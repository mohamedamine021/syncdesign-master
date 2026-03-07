import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Step8() {
  const { inputs, nominal, mainDimensions: dim, stator, airGap, rotor, reactances, setCurrentStep, recalculate } = useMachineStore();
  useEffect(() => { setCurrentStep(8); recalculate(); }, []);

  if (!reactances || !nominal || !stator || !airGap || !dim)
    return <StepLayout stepNumber={8} title="Réactances"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 3) => v.toFixed(d);

  // Blondel diagram data
  const cosPhi = inputs.cosPhi;
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
  const Un = 1;

  const diagramPoints = [
    { name: 'O', x: 0, y: 0 },
    { name: 'U', x: Un * cosPhi, y: Un * sinPhi },
    { name: 'E', x: Un * cosPhi + reactances.xSigma * sinPhi, y: Un * sinPhi + reactances.xSigma * cosPhi },
    { name: "E'", x: Un * cosPhi + reactances.xd * sinPhi, y: Un * sinPhi + reactances.xd * cosPhi },
  ];

  return (
    <StepLayout stepNumber={8} title="Réactances Xd, Xq" description="Réactances synchrones et diagramme vectoriel de Blondel">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Réactance de dispersion (Ohm)"
            tex={`x_\\sigma = 0{,}158 \\cdot \\frac{f}{100} \\cdot \\left(\\frac{w_1}{100}\\right)^2 \\cdot \\frac{l'_\\delta}{p \\cdot q_1} \\cdot \\sum \\lambda`}
            result={fmt(reactances.xSigma)}
            unit="p.u."
          />
          <FormulaResult
            label="F.M.M. de réaction d'induit"
            tex={`F_a = 2{,}7 \\cdot w_1 \\cdot K_{w1} \\cdot I_n`}
            result={fmt(2.7 * stator.w1 * stator.Kw1 * nominal.In, 0)}
            unit="A"
          />
          <FormulaResult
            label="F.M.M. de l'entrefer à vide"
            tex={`F_{\\delta 0} = 1{,}6 \\cdot \\delta \\cdot K_\\delta \\cdot B_{\\delta 0}`}
            result={fmt(1.6 * airGap.delta * airGap.Kdelta * stator.Bd0, 0)}
            unit="A"
          />
          <FormulaResult
            label="Réactance longitudinale de réaction d'induit"
            tex={`x_{ad} = \\frac{k_{ad} \\cdot F_a}{1{,}04 \\cdot F_{\\delta 0}}`}
            result={fmt(reactances.xad)}
            unit="p.u."
          />
          <FormulaResult
            label="Réactance transversale de réaction d'induit"
            tex={`x_{aq} = \\frac{k_{aq} \\cdot F_a \\cdot (1 + K_\\delta)}{2 \\cdot F_{\\delta 0}}`}
            result={fmt(reactances.xaq)}
            unit="p.u."
          />
          <FormulaResult
            label="Réactance synchrone longitudinale"
            tex={`x_d = x_\\sigma + x_{ad}`}
            result={fmt(reactances.xd)}
            unit="p.u."
          />
          <FormulaResult
            label="Réactance synchrone transversale"
            tex={`x_q = x_\\sigma + x_{aq}`}
            result={fmt(reactances.xq)}
            unit="p.u."
          />
          <FormulaResult
            label="Réactance transitoire"
            tex={`x'_d = x_\\sigma + \\frac{x_{ad} \\cdot x_{B\\sigma}}{x_{ad} + x_{B\\sigma}}`}
            result={fmt(reactances.xPrimeD)}
            unit="p.u."
          />
          <FormulaResult
            label="Réactance inverse"
            tex={`x_2 = \\sqrt{x'_d \\cdot x_q}`}
            result={fmt(reactances.x2)}
            unit="p.u."
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Diagramme vectoriel de Blondel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={diagramPoints} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="x" type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} label={{ value: 'Axe d (p.u.)', position: 'insideBottom', offset: -10, style: { fill: 'hsl(var(--muted-foreground))' } }} />
                <YAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} label={{ value: 'Axe q (p.u.)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Line type="linear" dataKey="y" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ResultTable title="Résumé des réactances" rows={[
            { label: 'Réactance de dispersion', symbol: 'xσ', value: fmt(reactances.xSigma), unit: 'p.u.' },
            { label: 'Réactance xad', symbol: 'xad', value: fmt(reactances.xad), unit: 'p.u.' },
            { label: 'Réactance xaq', symbol: 'xaq', value: fmt(reactances.xaq), unit: 'p.u.' },
            { label: 'Réactance xd', symbol: 'xd', value: fmt(reactances.xd), unit: 'p.u.' },
            { label: 'Réactance xq', symbol: 'xq', value: fmt(reactances.xq), unit: 'p.u.' },
            { label: 'Réactance transitoire', symbol: "x'd", value: fmt(reactances.xPrimeD), unit: 'p.u.' },
            { label: 'Réactance inverse', symbol: 'x₂', value: fmt(reactances.x2), unit: 'p.u.' },
          ]} />
        </div>
      </div>
    </StepLayout>
  );
}
