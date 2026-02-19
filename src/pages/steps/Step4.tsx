import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step4() {
  const { stator, nominal, mainDimensions: dim, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => { setCurrentStep(4); recalculate(); }, []);

  if (!stator || !nominal || !dim) return <StepLayout stepNumber={4} title="Stator"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={4} title="Enroulements, encoches et culasse du stator" description="Dimensionnement complet de la partie statorique">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult label="Nombre d'encoches" tex={`Z_1 = 2p \\cdot m \\cdot q_1 = ${2*nominal.p} \\times ${3} \\times ${stator.q1} = ${stator.Z1}`} result={String(stator.Z1)} />
          <FormulaResult label="Pas dentaire" tex={`t_1 = \\frac{\\pi D}{Z_1} = \\frac{\\pi \\times ${fmt(dim.D,0)}}{${stator.Z1}} = ${fmt(stator.t1, 2)} \\; cm`} result={fmt(stator.t1, 2)} unit="cm" />
          <FormulaResult label="Spires par phase" tex={`w_1 = p \\cdot q_1 \\cdot u_{p1} = ${nominal.p} \\times ${stator.q1} \\times ${stator.up1} = ${stator.w1}`} result={String(stator.w1)} />
          <FormulaResult label="Flux à vide" tex={`\\Phi_0 = \\frac{4 \\cdot K \\cdot U_{ph} \\times 10^8}{0.09 \\cdot f \\cdot w_1 \\cdot K_{01}} = ${fmt(stator.Phi0 / 1e6, 2)} \\times 10^6 \\; Mx`} result={`${fmt(stator.Phi0 / 1e6, 2)} × 10⁶`} unit="Maxwell" />

          {/* Slot SVG */}
          <div className="formula-card">
            <p className="text-sm text-muted-foreground font-medium mb-3">Géométrie de l'encoche</p>
            <svg viewBox="0 0 120 280" className="w-32 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="30" y="10" width="60" height="260" rx="3" className="stroke-muted-foreground" strokeDasharray="4 2" />
              {/* Slot opening */}
              <rect x="45" y="10" width="30" height="15" className="fill-primary/20 stroke-primary" />
              {/* Upper coil side */}
              <rect x="35" y="30" width="50" height="100" rx="2" className="fill-accent/20 stroke-accent" />
              {/* Insulation */}
              <line x1="35" y1="135" x2="85" y2="135" className="stroke-warning" strokeDasharray="3 2" />
              {/* Lower coil side */}
              <rect x="35" y="140" width="50" height="100" rx="2" className="fill-accent/20 stroke-accent" />
              {/* Dimensions */}
              <text x="95" y="140" className="fill-muted-foreground text-[8px]">{fmt(stator.he, 0)}mm</text>
              <text x="48" y="278" className="fill-muted-foreground text-[8px]">{fmt(stator.be, 1)}mm</text>
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <ResultTable title="Enroulements" rows={[
            { label: 'Encoches/pôle/phase', symbol: 'q₁', value: String(stator.q1) },
            { label: 'Nombre d\'encoches', symbol: 'Z₁', value: String(stator.Z1) },
            { label: 'Pas dentaire', symbol: 't₁', value: fmt(stator.t1, 2), unit: 'cm' },
            { label: 'Conducteurs/encoche', symbol: 'up₁', value: String(stator.up1) },
            { label: 'Spires par phase', symbol: 'w₁', value: String(stator.w1) },
            { label: 'Pas d\'enroulement', symbol: 'Y', value: String(stator.Y) },
            { label: 'Facteur d\'enroulement', symbol: 'Kw₁', value: fmt(stator.Kw1, 3) },
          ]} />
          <ResultTable title="Flux & Inductions" rows={[
            { label: 'Flux à vide', symbol: 'Φ₀', value: `${fmt(stator.Phi0/1e6, 2)} × 10⁶`, unit: 'Mx' },
            { label: 'Flux en charge', symbol: 'Φch', value: `${fmt(stator.PhiCh/1e6, 2)} × 10⁶`, unit: 'Mx' },
            { label: 'Induction entrefer vide', symbol: 'Bδ₀', value: fmt(stator.Bd0, 0), unit: 'Gauss' },
            { label: 'Induction dent', symbol: 'Bd₁', value: fmt(stator.Bd1, 0), unit: 'Gauss' },
            { label: 'Induction culasse', symbol: 'Bc', value: fmt(stator.Bc, 0), unit: 'Gauss' },
          ]} />
          <ResultTable title="Résistance & Poids" rows={[
            { label: 'Section conducteur', symbol: 'Sc', value: fmt(stator.Sc, 1), unit: 'mm²' },
            { label: 'Densité courant', symbol: 'Δc', value: fmt(stator.DeltaC, 2), unit: 'A/mm²' },
            { label: 'Résistance 75°C', symbol: 'Ra₇₅', value: fmt(stator.Ra75, 3), unit: 'Ω' },
            { label: 'Résistance p.u.', symbol: 'Ra₇₅*', value: fmt(stator.Ra75pu, 4) },
            { label: 'Poids cuivre', symbol: 'Gm', value: fmt(stator.Gm, 1), unit: 'kg' },
          ]} />
        </div>
      </div>
    </StepLayout>
  );
}
