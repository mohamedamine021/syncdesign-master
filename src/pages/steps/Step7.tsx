import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { FormulaResult } from '@/components/FormulaResult';
import { ResultTable } from '@/components/ResultTable';

export default function Step7() {
  const { inputs, nominal, mainDimensions: dim, stator, airGap, rotor, setCurrentStep, recalculate } = useMachineStore();
  useEffect(() => { setCurrentStep(7); recalculate(); }, []);

  if (!rotor || !airGap || !dim || !stator || !nominal)
    return <StepLayout stepNumber={7} title="Rotor & Pôles"><p className="text-destructive">Calcul impossible.</p></StepLayout>;

  const fmt = (v: number, d = 2) => v.toFixed(d);

  return (
    <StepLayout stepNumber={7} title="Rotor & Pôles" description="Dimensionnement des pôles et de la culasse rotorique">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormulaResult
            label="Arc polaire"
            tex={`b_p = \\alpha_p \\cdot \\tau`}
            result={fmt(rotor.bp, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Entrefer maximal sous le pôle"
            tex={`\\delta_M = 1{,}5 \\cdot \\delta`}
            result={fmt(1.5 * airGap.delta, 2)}
            unit="cm"
          />
          <FormulaResult
            label="Rayon du contour polaire"
            tex={`R_p = \\frac{D}{2} + \\frac{8 \\, D \\, (\\delta_M - \\delta)}{b_p^2}`}
            result={fmt(rotor.Rp, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Hauteur de l'épanouissement polaire"
            tex={`h_p = h' + R_p - \\sqrt{R_p^2 - \\left(\\frac{b_p}{2}\\right)^2}`}
            result={fmt(rotor.hp, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Coefficient de dispersion"
            tex={`\\sigma_n = 1 + K_\\sigma \\, \\frac{35 \\, \\delta}{\\tau^2}`}
            result={fmt(rotor.sigmaN, 3)}
          />
          <FormulaResult
            label="Flux dans le pôle"
            tex={`\\Phi_M = \\sigma_n \\cdot \\Phi_N`}
            result={`${fmt(rotor.PhiM / 1e6, 2)} × 10⁶`}
            unit="Mx"
          />
          <FormulaResult
            label="Largeur du noyau polaire"
            tex={`b_M = \\frac{S_M}{0{,}97 \\cdot l_1} = \\frac{\\Phi_M}{B_M \\cdot 0{,}97 \\cdot l_1}`}
            result={fmt(rotor.bM, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Hauteur du noyau polaire"
            tex={`h_M = 10{,}5 \\cdot \\delta + 8`}
            result={fmt(rotor.hM, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Hauteur de la culasse rotorique"
            tex={`H_a = D - 2\\delta - 2(h_p + h_M) - d_{arbre}`}
            result={fmt(rotor.Ha, 1)}
            unit="cm"
          />
          <FormulaResult
            label="Induction dans la culasse rotorique"
            tex={`B_a = \\frac{2 \\, \\Phi_M}{H_a \\cdot l_a}`}
            result={fmt(rotor.Ba, 0)}
            unit="Gauss"
          />
        </div>

        <div className="space-y-4">
          {/* Pole SVG */}
          <div className="formula-card">
            <p className="text-sm text-muted-foreground font-medium mb-3">Profil du pôle</p>
            <svg viewBox="0 0 200 180" className="w-full max-w-xs mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="60" y="40" width="80" height="100" rx="2" className="fill-primary/10 stroke-primary" />
              <path d="M 30 40 Q 100 10, 170 40 L 170 55 Q 100 35, 30 55 Z" className="fill-accent/15 stroke-accent" />
              <text x="90" y="95" className="fill-muted-foreground text-[9px]">bM={fmt(rotor.bM, 1)}</text>
              <text x="15" y="48" className="fill-accent text-[8px]">bp={fmt(rotor.bp, 1)}</text>
              <text x="145" y="95" className="fill-muted-foreground text-[8px]">hM={fmt(rotor.hM, 1)}</text>
              <line x1="30" y1="25" x2="170" y2="25" className="stroke-info" strokeDasharray="4 2" />
              <text x="75" y="20" className="fill-info text-[8px]">δ={fmt(airGap.delta)}</text>
            </svg>
          </div>

          <ResultTable title="Dimensions du rotor" rows={[
            { label: 'Arc polaire', symbol: 'bp', value: fmt(rotor.bp, 1), unit: 'cm' },
            { label: 'Rayon contour', symbol: 'Rp', value: fmt(rotor.Rp, 1), unit: 'cm' },
            { label: 'Hauteur épanouissement', symbol: 'hp', value: fmt(rotor.hp, 1), unit: 'cm' },
            { label: 'Largeur noyau polaire', symbol: 'bM', value: fmt(rotor.bM, 1), unit: 'cm' },
            { label: 'Hauteur noyau polaire', symbol: 'hM', value: fmt(rotor.hM, 1), unit: 'cm' },
            { label: 'Flux dans le pôle', symbol: 'ΦM', value: `${fmt(rotor.PhiM / 1e6, 2)} × 10⁶`, unit: 'Mx' },
            { label: 'Coeff. dispersion', symbol: 'σn', value: fmt(rotor.sigmaN, 3) },
            { label: 'Hauteur culasse rotor', symbol: 'Ha', value: fmt(rotor.Ha, 1), unit: 'cm' },
            { label: 'Induction culasse rotor', symbol: 'Ba', value: fmt(rotor.Ba, 0), unit: 'Gauss' },
          ]} />
        </div>
      </div>
    </StepLayout>
  );
}
