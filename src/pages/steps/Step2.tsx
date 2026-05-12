import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS HTML POUR RENDU MATHÉMATIQUE SÉCURISÉ (ZÉRO LATEX)
// ─────────────────────────────────────────────────────────────────────────────
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex justify-center items-center py-2 overflow-x-auto text-slate-800 dark:text-slate-200 text-sm font-serif">
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle">
      <span className="border-b border-current px-1 leading-tight text-sm pb-0.5">{num}</span>
      <span className="px-1 leading-tight text-sm pt-0.5">{den}</span>
    </span>
  );
}

const sym = {
  dot: <span className="mx-0.5">·</span>,
  sqrt3: (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">3</span>
    </span>
  ),
  cos: <span className="mr-1">cos(φ)</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 2
// ─────────────────────────────────────────────────────────────────────────────
export default function Step2() {
  const { inputs, setCurrentStep } = useMachineStore();

  // 1. Mise à jour sécurisée de l'étape courante (Évite les boucles infinies)
  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(2);
    }
  }, [setCurrentStep]);

  // 2. Calcul des valeurs nominales strict (basé sur votre code manuel)
  const results = useMemo(() => {
    // Vérification de sécurité : si les inputs n'existent pas ou sont incomplets, on annule.
    if (!inputs || !inputs.Un || !inputs.Pn || !inputs.cosPhi || !inputs.f || !inputs.nn) {
      return null;
    }

    // Calculs manuels exacts selon votre cahier des charges
    const Uph = inputs.Un / Math.sqrt(3);
    const Sn = inputs.Pn / inputs.cosPhi;
    const In = (Sn * 1000) / (Math.sqrt(3) * inputs.Un);
    const p = (60 * inputs.f) / inputs.nn;

    return { Uph, Sn, In, p };
  }, [inputs]);

  // Formatage des nombres
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // 3. Bouclier de sécurité si les données sont manquantes
  if (!results) {
    return (
      <StepLayout stepNumber={2} title="Step 2 : Valeurs Nominales">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres d'entrée manquants ou invalides.</p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez retourner à l'Étape 1 et vérifier que Un, Pn, cosPhi, f et nn sont bien remplis.
          </p>
        </div>
      </StepLayout>
    );
  }

  // 4. Rendu de l'interface
  return (
    <StepLayout
      stepNumber={2}
      title="Step 2 : Valeurs Nominales"
      description="Calcul des grandeurs électriques et mécaniques de base de l'alternateur"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAU DES RÉSULTATS          */}
        {/* ================================================================ */}
        <div className="space-y-6">
          
          {/* Cartes de rappel des entrées */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Puissance Utile (Pn)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(inputs.Pn, 0)} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Tension Réseau (Un)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(inputs.Un, 0)} <span className="text-sm font-normal text-muted-foreground">V</span></p>
            </div>
          </div>

          {/* Tableau des résultats exacts calculés */}
          <ResultTable
            title="Résultats Calculés"
            rows={[
              { label: 'Tension par phase',     symbol: 'U_ph', value: fmt(results.Uph, 2), unit: 'V' },
              { label: 'Puissance apparente',   symbol: 'S_n',  value: fmt(results.Sn, 2),  unit: 'kVA' },
              { label: 'Courant nominal',       symbol: 'I_n',  value: fmt(results.In, 2),  unit: 'A' },
              { label: 'Nombre de paires de pôles', symbol: 'p', value: fmt(results.p, 0),  unit: '—' },
            ]}
          />
        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Rappel des équations utilisées pour l'Étape 2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="Tension de Phase">
              <span className="italic font-semibold mr-2">U<sub>ph</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>U<sub>n</sub></span>} den={sym.sqrt3} />
            </Formula>

            <Formula label="Puissance Apparente">
              <span className="italic font-semibold mr-2">S<sub>n</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>P<sub>n</sub></span>} den={sym.cos} />
            </Formula>

            <Formula label="Courant Nominal">
              <span className="italic font-semibold mr-2">I<sub>n</sub></span>
              <span className="mr-2">=</span>
              <Frac 
                num={<span>S<sub>n</sub> {sym.dot} 1000</span>} 
                den={<span>{sym.sqrt3} {sym.dot} U<sub>n</sub></span>} 
              />
            </Formula>

            <Formula label="Nombre de Paires de Pôles">
              <span className="italic font-semibold mr-2">p</span>
              <span className="mr-2">=</span>
              <Frac 
                num={<span>60 {sym.dot} f</span>} 
                den={<span>n<sub>n</sub></span>} 
              />
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}