import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { BH_CURVE_E31_STATOR, BH_CURVE_ROTOR } from '@/constants/magnetic_curves';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Step5() {
  const { setCurrentStep, stator, airGap } = useMachineStore();
  useEffect(() => { setCurrentStep(5); }, [setCurrentStep]);

  const statorData = BH_CURVE_E31_STATOR.filter((_, i) => i % 3 === 0).map(([b, h]) => ({ B: b, H: h }));
  const rotorData = BH_CURVE_ROTOR.filter((_, i) => i % 2 === 0).map(([b, h]) => ({ B: b, H: h }));

  return (
    <StepLayout stepNumber={5} title="Circuit magnétique" description="Courbes B-H et calcul des FMM dans les différentes zones">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Courbe B-H — Acier E31 (Stator)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={statorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="B" label={{ value: 'B (Gauss)', position: 'insideBottom', offset: -5, style: { fill: 'hsl(var(--muted-foreground))' } }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis label={{ value: 'H (A/cm)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="H" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Courbe B-H — Acier Rotor (1-2mm)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={rotorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="B" label={{ value: 'B (Gauss)', position: 'insideBottom', offset: -5, style: { fill: 'hsl(var(--muted-foreground))' } }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis label={{ value: 'H (A/cm)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="H" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stator && (
        <div className="mt-6 rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Points de fonctionnement</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Bδ₀ (entrefer)', value: stator.Bd0.toFixed(0), unit: 'Gauss' },
              { label: 'Bδₙ (charge)', value: stator.BdN.toFixed(0), unit: 'Gauss' },
              { label: 'Bd₁ (dent)', value: stator.Bd1.toFixed(0), unit: 'Gauss' },
              { label: 'Bc (culasse)', value: stator.Bc.toFixed(0), unit: 'Gauss' },
            ].map((p, i) => (
              <div key={i} className="p-3 rounded-md bg-muted/50 border border-border text-center">
                <p className="text-xs text-muted-foreground">{p.label}</p>
                <p className="result-highlight text-lg mt-1">{p.value}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {airGap && (
        <div className="mt-6 rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Paramètres de l'entrefer</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Entrefer nominal', 
                value: airGap.delta && airGap.delta > 0 ? airGap.delta.toFixed(2) : '—', 
                unit: 'mm' 
              },
              { 
                label: 'Coefficient Carter', 
                value: airGap.Kdelta && !isNaN(airGap.Kdelta) && isFinite(airGap.Kdelta) ? airGap.Kdelta.toFixed(3) : '—', 
                unit: '' 
              },
              { 
                label: 'Entrefer apparent', 
                value: airGap.delta && airGap.Kdelta && !isNaN(airGap.Kdelta) ? (airGap.delta * airGap.Kdelta).toFixed(2) : '—', 
                unit: 'mm' 
              },
              { 
                label: 'Induction entrefer', 
                value: stator?.Bd0 ? stator.Bd0.toFixed(0) : '—', 
                unit: 'Gauss' 
              },
            ].map((p, i) => (
              <div key={i} className="p-3 rounded-md bg-muted/50 border border-border text-center">
                <p className="text-xs text-muted-foreground">{p.label}</p>
                <p className="result-highlight text-lg mt-1">{p.value}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </StepLayout>
  );
}
