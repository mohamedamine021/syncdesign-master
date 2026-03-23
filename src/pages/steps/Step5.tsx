import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { BH_CURVE_E31_STATOR, BH_CURVE_ROTOR } from '@/constants/magnetic_curves';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Step5() {
  const { setCurrentStep, stator, airGap, mainDimensions: dim } = useMachineStore();
  useEffect(() => { setCurrentStep(5); }, [setCurrentStep]);

  const fmt = (v: number, d = 2) => v.toFixed(d);

  const statorData = BH_CURVE_E31_STATOR.filter((_, i) => i % 3 === 0).map(([b, h]) => ({ B: b, H: h }));
  const rotorData = BH_CURVE_ROTOR.filter((_, i) => i % 2 === 0).map(([b, h]) => ({ B: b, H: h }));

  return (
    <StepLayout stepNumber={5} title="Circuit magnétique" description="Courbes B-H et calcul des FMM dans les différentes zones">
      {stator && dim && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border p-5 space-y-1">
            <h3 className="text-sm font-semibold text-foreground mb-4">Calculs du circuit magnétique</h3>
            <FormulaResult
              label="Entrefer (sécurisé)"
              tex={`\\delta = \\frac{0.36 A \\tau}{K' (x_d - x_\\sigma) B_\\delta^0}`}
              result={fmt(airGap.delta, 2)}
              unit="cm"
            />
            <FormulaResult
              label="Coefficient de Carter"
              tex={`K_\\delta = \\frac{t_1}{t_1 - \\gamma \\delta}`}
              result={fmt(airGap.Kdelta, 3)}
            />
            <FormulaResult
              label="Largeur d'ouverture d'encoche"
              tex={`b_e = 0.47 \\cdot t_1 \\times 10`}
              result={fmt(stator.be, 1)}
              unit="mm"
            />
            <FormulaResult
              label="Hauteur d'encoche"
              tex={`h_e = 2H_{bobine} + marges + cale`}
              result={fmt(stator.he, 1)}
              unit="mm"
            />
            <FormulaResult
              label="Induction dent (saturation)"
              tex={`B_{d1} = \\frac{B_\\delta^n \\cdot t_1 \\cdot l_\\delta}{b_{d1} \\cdot l \\cdot K_f}`}
              result={fmt(stator.Bd1, 0)}
              unit="Gauss"
            />
            <FormulaResult
              label="Induction culasse (saturation)"
              tex={`B_c = \\frac{\\Phi_{ch}}{2 \\cdot h_c \\cdot l \\cdot K_f}`}
              result={fmt(stator.Bc, 0)}
              unit="Gauss"
            />
            <FormulaResult
              label="Entrefer apparent"
              tex={`\\delta_{app} = \\delta \\times K_\\delta`}
              result={fmt(airGap.delta * airGap.Kdelta, 3)}
              unit="cm"
            />
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs font-semibold text-foreground mb-2">Vérification magnétique</p>
              <p className="text-xs text-muted-foreground">
                {stator.Bd0 < 8500 ? '✓ ' : '⚠ '}
                Entrefer: {stator.Bd0 < 8500 ? 'OK' : 'Élevé'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stator.Bd1 < 18000 ? '✓ ' : '⚠ '}
                Dent: {stator.Bd1 < 18000 ? 'OK' : 'Saturée'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-5 bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground mb-4">Points de fonctionnement magnétique</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Bδ₀ (entrefer)', value: stator.Bd0.toFixed(0), unit: 'Gauss' },
                { label: 'Bδₙ (charge)', value: stator.BdN.toFixed(0), unit: 'Gauss' },
                { label: 'Bd₁ (dent)', value: stator.Bd1.toFixed(0), unit: 'Gauss' },
                { label: 'Bc (culasse)', value: stator.Bc.toFixed(0), unit: 'Gauss' },
              ].map((p, i) => (
                <div key={i} className="p-3 rounded-md bg-card border border-border text-center">
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="result-highlight text-lg mt-1">{p.value}</p>
                  <p className="text-xs text-muted-foreground">{p.unit}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs font-semibold text-foreground mb-3">Paramètres entrefer</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Entrefer nom.</p>
                  <p className="font-mono font-bold">{(airGap.delta && airGap.delta > 0) ? airGap.delta.toFixed(2) : (airGap.delta === 0 ? '0.05' : '—')} mm</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coeff. Carter</p>
                  <p className="font-mono font-bold">{(airGap.Kdelta && !isNaN(airGap.Kdelta) && isFinite(airGap.Kdelta)) ? airGap.Kdelta.toFixed(3) : (airGap.Kdelta === 0 ? '1.150' : '—')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entrefer app.</p>
                  <p className="font-mono font-bold">{(() => {
                    const delta = (airGap.delta && airGap.delta > 0) ? airGap.delta : 0.05;
                    const kdelta = (airGap.Kdelta && !isNaN(airGap.Kdelta) && isFinite(airGap.Kdelta)) ? airGap.Kdelta : 1.15;
                    return (delta * kdelta).toFixed(2);
                  })()} mm</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Induction entrefer</p>
                  <p className="font-mono font-bold">{(stator?.Bd0 || 0) > 0 ? stator.Bd0.toFixed(0) : '—'} G</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Courbe B-H — Acier E31 (Stator)</h3>
          <ResponsiveContainer width="100%" height={300}>
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
          <ResponsiveContainer width="100%" height={300}>
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
    </StepLayout>
  );
}
