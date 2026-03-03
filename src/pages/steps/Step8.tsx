import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Step8() {
  const { reactances, nominal, setCurrentStep } = useMachineStore();
  useEffect(() => { setCurrentStep(8); }, [setCurrentStep]);

  if (!reactances || !nominal) {
    return (
      <StepLayout stepNumber={8} title="Réactances" description="Réactances synchrones et diagramme vectoriel de Blondel">
        <p className="text-destructive">Données manquantes. Veuillez compléter les étapes précédentes.</p>
      </StepLayout>
    );
  }

  const fmt = (v: number, d = 3) => v.toFixed(d);

  // Blondel diagram data points (simplified vector diagram)
  const Un = 1; // p.u.
  const cosPhi = 0.8;
  const sinPhi = 0.6;
  const xsig = reactances.xSigma;

  const diagramPoints = [
    { name: 'O', x: 0, y: 0 },
    { name: 'U', x: Un * cosPhi, y: Un * sinPhi },
    { name: 'E', x: Un * cosPhi + xsig * sinPhi, y: Un * sinPhi + xsig * cosPhi },
    { name: "E'", x: Un * cosPhi + reactances.xd * sinPhi, y: Un * sinPhi + reactances.xd * cosPhi },
  ];

  return (
    <StepLayout stepNumber={8} title="Réactances Xd, Xq" description="Réactances synchrones et diagramme vectoriel de Blondel">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult label="Réactance de dispersion" tex={`x_\\sigma^* = \\frac{I_n \\cdot x_\\sigma}{U_{ph}} = ${fmt(reactances.xSigma)} \\; p.u.`} result={fmt(reactances.xSigma)} unit="p.u." />
          <FormulaResult label="Réactance synchrone longitudinale" tex={`x_d = x_\\sigma + x_{ad} = ${fmt(reactances.xSigma)} + ${fmt(reactances.xad)} = ${fmt(reactances.xd)} \\; p.u.`} result={fmt(reactances.xd)} unit="p.u." />
          <FormulaResult label="Réactance synchrone transversale" tex={`x_q = x_\\sigma + x_{aq} = ${fmt(reactances.xSigma)} + ${fmt(reactances.xaq)} = ${fmt(reactances.xq)} \\; p.u.`} result={fmt(reactances.xq)} unit="p.u." />
          <FormulaResult label="Réactance transitoire" tex={`x'_d = x_\\sigma + \\frac{x_{ad} \\cdot x_{B\\sigma}}{x_{ad} + x_{B\\sigma}} = ${fmt(reactances.xPrimeD)} \\; p.u.`} result={fmt(reactances.xPrimeD)} unit="p.u." />
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
