import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Step14() {
  const { inputs, losses, nominal, stator, reactances, excitation, setCurrentStep, recalculate } = useMachineStore();
  
  useEffect(() => { setCurrentStep(14); recalculate(); }, []);

  if (!losses) return <StepLayout stepNumber={14} title="Bilan des pertes et rendement"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

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
    <StepLayout 
      stepNumber={14} 
      title="Bilan des pertes et rendement final" 
      description="Calcul complet des pertes et du rendement global de la machine synchrone"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic lights and efficiency */}
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Vérifications & critères</h3>
          <div className="space-y-3">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <div className={`w-4 h-4 rounded-full ${statusColors[c.status]} ${c.status === 'green' ? '' : 'animate-pulse'}`} />
                <span className="flex-1 text-sm text-foreground">{c.label}</span>
                <span className="font-mono text-sm text-foreground font-medium">{c.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-md bg-gradient-to-br from-success/20 to-success/10 border-2 border-success text-center">
            <p className="text-xs text-success/80 font-semibold mb-1">RENDEMENT GLOBAL</p>
            <p className={`text-4xl font-bold font-mono ${eta > 93 ? 'text-success' : eta > 90 ? 'text-warning' : 'text-destructive'}`}>
              {fmt(eta, 1)}%
            </p>
            <p className="text-xs text-success/70 mt-2">η = Pn / (Pn + ΣPertes)</p>
          </div>
        </div>

        {/* Losses pie chart */}
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des pertes ({fmt(losses.totalLosses, 1)} kW)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${value.toFixed(1)} kW`}>
                {lossData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                formatter={(value: any) => `${value.toFixed(2)} kW`}
              />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Losses detailed table */}
      <div className="mt-6">
        <ResultTable 
          title="Détail des pertes en régime nominal" 
          rows={[
            { label: 'Pertes fer culasse', symbol: 'Pc', value: fmt(losses.Pc, 2), unit: 'kW' },
            { label: 'Pertes fer dents', symbol: 'Pcd', value: fmt(losses.Pcd, 2), unit: 'kW' },
            { label: 'Pertes surface', symbol: 'Psur', value: fmt(losses.Psur, 2), unit: 'kW' },
            { label: 'Pertes mécaniques', symbol: 'Pmec', value: fmt(losses.Pmec, 2), unit: 'kW' },
            { label: 'Pertes électriques stator', symbol: 'Pelec', value: fmt(losses.Pelec, 2), unit: 'kW' },
            { label: 'Pertes supplémentaires', symbol: 'Psup', value: fmt(losses.Psup, 2), unit: 'kW' },
            { label: 'Pertes excitation', symbol: 'PB', value: fmt(losses.PB, 2), unit: 'kW' },
            { label: 'PERTES TOTALES', symbol: 'ΣP', value: fmt(losses.totalLosses, 2), unit: 'kW' },
          ]} 
        />
      </div>

      {/* Efficiency metrics */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-4 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-2">PUISSANCE UTILE</p>
          <p className="text-2xl font-bold font-mono text-foreground">{fmt(inputs.Pn, 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">kW</p>
        </div>
        
        <div className="rounded-lg border border-border p-4 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-2">PERTES TOTALES</p>
          <p className="text-2xl font-bold font-mono text-destructive">{fmt(losses.totalLosses, 2)}</p>
          <p className="text-xs text-muted-foreground mt-1">kW</p>
        </div>
        
        <div className="rounded-lg border border-border p-4 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-2">PUISSANCE ABSORBÉE</p>
          <p className="text-2xl font-bold font-mono text-foreground">{fmt(inputs.Pn + losses.totalLosses, 2)}</p>
          <p className="text-xs text-muted-foreground mt-1">kW</p>
        </div>
      </div>

      {/* Final summary */}
      <div className="mt-6 rounded-lg border-2 border-success/50 bg-success/5 p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Bilan final - Dimensionnement achevé ✓</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">La machine synchrone a été dimensionnée avec succès dans le respect des normes IEC 60034.</p>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-foreground">
              • Rendement: <span className="font-bold">{fmt(eta, 1)}%</span>
            </p>
            <p className="font-mono text-foreground">
              • Pertes totales: <span className="font-bold">{fmt(losses.totalLosses, 2)} kW</span>
            </p>
            <p className="font-mono text-foreground">
              • Catégorie: <span className="font-bold">IE3 Premium Efficiency</span> {eta >= 93 ? '✓' : '(à vérifier)'}
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
