import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 2;

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
// BANDEAU TITRE DE L'ÉTAPE
// ─────────────────────────────────────────────────────────────────────────────
function StepBanner() {
  const progressPercent = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-8">
      {/* Fond dégradé */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">

          {/* Badge numéro */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-2xl tracking-tight">{CURRENT_STEP}</span>
          </div>

          {/* Textes */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight truncate">
              Valeurs Nominales
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul des grandeurs électriques et mécaniques de base de l'alternateur
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Ω</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              Nominal
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-5">
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
            <span>Progression globale</span>
            <span>{CURRENT_STEP} / {TOTAL_STEPS} — {Math.round(progressPercent)} %</span>
          </div>

          {/* Barre principale */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Marqueurs des 14 étapes */}
          <div className="relative w-full mt-1.5">
            <div className="flex justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const step      = i + 1;
                const isDone    = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / TOTAL_STEPS}%` }}
                  >
                    {/* Pastille */}
                    <div
                      className={`
                        w-3 h-3 rounded-full border-2 transition-all duration-300
                        ${isCurrent
                          ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] scale-125'
                          : isDone
                            ? 'bg-sky-400 border-sky-300'
                            : 'bg-white/15 border-white/25'
                        }
                      `}
                    />

                    {/* Numéro sous la pastille — étapes clés seulement */}
                    {(step === 1 ||
                      step === CURRENT_STEP ||
                      step === TOTAL_STEPS ||
                      step % 7 === 0) && (
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          isCurrent
                            ? 'text-emerald-300'
                            : isDone
                              ? 'text-sky-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {step}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tags thématiques */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Tension de phase',           color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'           },
          { label: 'Puissance apparente',         color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Courant nominal',             color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Paires de pôles',             color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
        ].map(tag => (
          <span
            key={tag.label}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tag.color}`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉPARATEUR DE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SectionSeparator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-3 text-center">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 2
// ─────────────────────────────────────────────────────────────────────────────
export default function Step2() {
  const { inputs, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  // Calcul des valeurs nominales
  const results = useMemo(() => {
    if (!inputs || !inputs.Un || !inputs.Pn || !inputs.cosPhi || !inputs.f || !inputs.nn) {
      return null;
    }

    const Uph = inputs.Un / Math.sqrt(3);
    const Sn  = inputs.Pn / inputs.cosPhi;
    const In  = (Sn * 1000) / (Math.sqrt(3) * inputs.Un);
    const p   = (60 * inputs.f) / inputs.nn;

    return { Uph, Sn, In, p };
  }, [inputs]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Valeurs Nominales">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres d'entrée manquants ou invalides.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez retourner à l'Étape 1 et vérifier que U<sub>n</sub>, P<sub>n</sub>,
            cos(φ), f et n<sub>n</sub> sont bien remplis.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Valeurs Nominales"
      description="Calcul des grandeurs électriques et mécaniques de base de l'alternateur"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. BANDEAU TITRE EN FRANÇAIS                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. SÉPARATEUR                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. RÉSULTATS ET FORMULES                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE GAUCHE : CARTES KPI ET TABLEAU                          */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Cartes de rappel des entrées */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Puissance Utile (Pn)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(inputs.Pn, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">kW</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Tension Réseau (Un)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(inputs.Un, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">V</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Courant Nominal (In)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.In, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Paires de pôles (p)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.p, 0)}
              </p>
            </div>
          </div>

          {/* Tableau des résultats calculés */}
          <ResultTable
            title="Résultats Calculés"
            rows={[
              { label: 'Tension par phase',          symbol: 'U_ph', value: fmt(results.Uph, 2), unit: 'V'   },
              { label: 'Puissance apparente',        symbol: 'S_n',  value: fmt(results.Sn, 2),  unit: 'kVA' },
              { label: 'Courant nominal',            symbol: 'I_n',  value: fmt(results.In, 2),  unit: 'A'   },
              { label: 'Nombre de paires de pôles', symbol: 'p',    value: fmt(results.p, 0),   unit: '—'   },
            ]}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES                                       */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>
              Rappel des équations utilisées pour l'Étape 2
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="Tension de Phase">
              <span className="italic font-semibold mr-2">U<sub>ph</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>U<sub>n</sub></span>}
                den={sym.sqrt3}
              />
            </Formula>

            <Formula label="Puissance Apparente">
              <span className="italic font-semibold mr-2">S<sub>n</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>P<sub>n</sub></span>}
                den={sym.cos}
              />
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