import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Step10() {
  const { inputs, losses, nominal, stator, reactances, excitation, setCurrentStep, recalculate } = useMachineStore();
  useEffect(() => { setCurrentStep(10); recalculate(); }, []);

  if (!losses) return <StepLayout stepNumber={10} title="Dashboard"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);
  const eta = losses.efficiency * 100;

  const lossData = [
    { name: 'Fer culasse', value: parseFloat(losses.Pc.toFixed(2)) },
    { name: 'Fer dents', value: parseFloat(losses.Pcd.toFixed(2)) },
    { name: 'Surface', value: parseFloat(losses.Psur.toFixed(2)) },
    { name: 'Mécaniques', value: parseFloat(losses.Pmec.toFixed(2)) },
    { name: 'Électriques', value: parseFloat(losses.Pelec.toFixed(2)) },
    { name: 'Supplémentaires', value: parseFloat(losses.Psup.toFixed(2)) },
    { name: 'Excitation', value: parseFloat(losses.PB.toFixed(2)) },
  ];

  const COLORS = [
    'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))',
    'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--warning))',
    'hsl(var(--muted-foreground))',
  ];

  type Check = { label: string; value: string; status: 'green' | 'yellow' | 'red' };
  const checks: Check[] = [
    { label: 'Rendement', value: `${fmt(eta, 1)}%`, status: eta > 93 ? 'green' : eta > 90 ? 'yellow' : 'red' },
    { label: 'Pertes totales', value: `${fmt(losses.totalLosses, 1)} kW`, status: losses.totalLosses < inputs.Pn * 0.08 ? 'green' : losses.totalLosses < inputs.Pn * 0.12 ? 'yellow' : 'red' },
    { label: 'Densité courant stator', value: stator ? `${fmt(stator.DeltaC, 1)} A/mm²` : '—', status: stator && stator.DeltaC <= 6 ? 'green' : stator && stator.DeltaC <= 8 ? 'yellow' : 'red' },
    { label: 'Densité courant excitation', value: excitation ? `${fmt(excitation.DeltaB, 1)} A/mm²` : '—', status: excitation && excitation.DeltaB <= 6 ? 'green' : excitation && excitation.DeltaB <= 8 ? 'yellow' : 'red' },
    { label: 'Réactance xd', value: reactances ? `${fmt(reactances.xd)} p.u.` : '—', status: reactances && reactances.xd < 1.5 ? 'green' : reactances && reactances.xd < 2.0 ? 'yellow' : 'red' },
  ];

  const statusColors = { green: 'bg-success', yellow: 'bg-warning', red: 'bg-destructive' };

  return (
    <StepLayout stepNumber={10} title="Dashboard final" description="Synthèse, pertes, rendement et vérifications">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic lights */}
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Vérifications</h3>
          <div className="space-y-3">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <div className={`w-4 h-4 rounded-full ${statusColors[c.status]} ${c.status === 'green' ? '' : 'animate-pulse-glow'}`} />
                <span className="flex-1 text-sm text-foreground">{c.label}</span>
                <span className="font-mono text-sm text-foreground font-medium">{c.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-md bg-card border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">RENDEMENT GLOBAL</p>
            <p className={`text-3xl font-bold font-mono ${eta > 93 ? 'text-success' : eta > 90 ? 'text-warning' : 'text-destructive'}`}>
              {fmt(eta, 1)}%
            </p>
          </div>
        </div>

        {/* Losses pie chart */}
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des pertes ({fmt(losses.totalLosses, 1)} kW)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value} kW`}>
                {lossData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Losses table */}
      <div className="mt-6">
        <ResultTable title="Détail des pertes en régime nominal" rows={[
          { label: 'Pertes fer culasse', symbol: 'Pc', value: fmt(losses.Pc, 2), unit: 'kW' },
          { label: 'Pertes fer dents', symbol: 'Pcd', value: fmt(losses.Pcd, 2), unit: 'kW' },
          { label: 'Pertes surface', symbol: 'Psur', value: fmt(losses.Psur, 2), unit: 'kW' },
          { label: 'Pertes mécaniques', symbol: 'Pmec', value: fmt(losses.Pmec, 2), unit: 'kW' },
          { label: 'Pertes électriques stator', symbol: 'Pelec', value: fmt(losses.Pelec, 2), unit: 'kW' },
          { label: 'Pertes supplémentaires', symbol: 'Psup', value: fmt(losses.Psup, 2), unit: 'kW' },
          { label: 'Pertes excitation', symbol: 'PB', value: fmt(losses.PB, 2), unit: 'kW' },
          { label: 'PERTES TOTALES', symbol: 'ΣP', value: fmt(losses.totalLosses, 2), unit: 'kW' },
          { label: 'RENDEMENT', symbol: 'η', value: `${fmt(eta, 1)}%`, unit: '' },
        ]} />
      </div>
    </StepLayout>
  );
}
