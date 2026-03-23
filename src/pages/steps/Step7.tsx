import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step7() {
  const { rotor, airGap, mainDimensions: dim, setCurrentStep, recalculate } = useMachineStore();
  useEffect(() => { setCurrentStep(7); recalculate(); }, [setCurrentStep, recalculate]);

  if (!rotor || !airGap || !dim) return <StepLayout stepNumber={7} title="Rotor & Pôles"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={7} title="Rotor & Pôles" description="Dimensionnement des pôles et de la culasse rotorique">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Calculs du rotor</h3>
          <FormulaResult label="Arc polaire" tex={`b_p = \\alpha_p \\cdot \\tau`} result={fmt(rotor.bp, 1)} unit="cm" />
          <FormulaResult label="Distance pôle (de l'arbre)" tex={`\\Delta M = K_{\\Delta M} \\cdot \\delta`} result={fmt(airGap.delta, 2)} unit="cm" />
          <FormulaResult label="Rayon d'épanouissement" tex={`R_p = \\frac{D}{2} + \\frac{8 D (\\Delta M - \\delta)}{b_p^2}`} result={fmt(rotor.Rp, 1)} unit="cm" />
          <FormulaResult label="Hauteur d'épanouissement" tex={`h_p = h' + R_p - \\sqrt{R_p^2 - (b_p/2)^2}`} result={fmt(rotor.hp, 1)} unit="cm" />
          <FormulaResult label="Coefficient de dispersion polaire" tex={`\\sigma_n = 1 + K_\\sigma \\frac{35\\delta}{\\tau^2}`} result={fmt(rotor.sigmaN, 3)} />
          <FormulaResult label="Flux dans le pôle" tex={`\\Phi_M = \\sigma_n \\cdot \\Phi_{ch}`} result={`${fmt(rotor.PhiM / 1e6, 2)} × 10⁶`} unit="Mx" />
          <FormulaResult label="Largeur noyau polaire" tex={`b_M = \\frac{\\Phi_M}{B_M^* \\cdot K_f \\cdot l_M}`} result={fmt(rotor.bM, 1)} unit="cm" />
          <FormulaResult label="Hauteur noyau polaire" tex={`h_M = 10.5 \\delta + 8`} result={fmt(rotor.hM, 1)} unit="cm" />
          <FormulaResult label="Hauteur culasse rotor" tex={`H_a = \\frac{D - 2\\delta - 2(h_p + h_M) - d_{arbre}}{2}`} result={fmt(rotor.Ha, 1)} unit="cm" />
          <FormulaResult label="Induction culasse rotor" tex={`B_a = \\frac{\\Phi_M}{2 H_a l_a}`} result={fmt(rotor.Ba, 0)} unit="Gauss" />

          {/* Pole SVG */}
          <div className="formula-card mt-6">
            <p className="text-sm text-muted-foreground font-medium mb-3">Profil du pôle</p>
            <svg viewBox="0 0 200 180" className="w-full max-w-xs mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Pole body */}
              <rect x="60" y="40" width="80" height="100" rx="2" className="fill-primary/10 stroke-primary" />
              {/* Pole shoe */}
              <path d="M 30 40 Q 100 10, 170 40 L 170 55 Q 100 35, 30 55 Z" className="fill-accent/15 stroke-accent" />
              {/* Labels */}
              <text x="90" y="95" className="fill-muted-foreground text-[9px]">bM={fmt(rotor.bM,1)}</text>
              <text x="15" y="48" className="fill-accent text-[8px]">bp={fmt(rotor.bp,1)}</text>
              <text x="145" y="95" className="fill-muted-foreground text-[8px]">hM={fmt(rotor.hM,1)}</text>
              {/* Air gap */}
              <line x1="30" y1="25" x2="170" y2="25" className="stroke-info" strokeDasharray="4 2" />
              <text x="75" y="20" className="fill-info text-[8px]">δ={fmt(airGap.delta)}</text>
            </svg>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Résumé - Dimensions du rotor</h3>
          <ResultTable title="" rows={[
            { label: 'Arc polaire', symbol: 'bp', value: fmt(rotor.bp, 1), unit: 'cm' },
            { label: 'Rayon contour', symbol: 'Rp', value: fmt(rotor.Rp, 1), unit: 'cm' },
            { label: 'Hauteur épanouissement', symbol: 'hp', value: fmt(rotor.hp, 1), unit: 'cm' },
            { label: 'Largeur noyau polaire', symbol: 'bM', value: fmt(rotor.bM, 1), unit: 'cm' },
            { label: 'Hauteur noyau polaire', symbol: 'hM', value: fmt(rotor.hM, 1), unit: 'cm' },
            { label: 'Flux dans le pôle', symbol: 'ΦM', value: `${fmt(rotor.PhiM/1e6, 2)} × 10⁶`, unit: 'Mx' },
            { label: 'Coeff. dispersion', symbol: 'σn', value: fmt(rotor.sigmaN, 3) },
            { label: 'Hauteur rotor', symbol: 'Ha', value: fmt(rotor.Ha, 1), unit: 'cm' },
            { label: 'Induction rotor', symbol: 'Ba', value: fmt(rotor.Ba, 0), unit: 'Gauss' },
          ]} />
        </div>
      </div>
    </StepLayout>
  );
}
