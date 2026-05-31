import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 3;

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
  approx: <span className="mx-1">≈</span>,
  pi: <span className="mx-0.5">π</span>,
  tau: <span className="mx-0.5">τ</span>,
  lambda: <span className="mx-0.5">λ</span>,
  alpha: <span className="mx-0.5">α</span>,
  delta: <span className="mx-0.5">δ</span>,
  cos: <span className="mr-1">cos(φ)</span>,
  sin: <span className="mr-1">sin(φ)</span>,
  sqrt: (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
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
              Dimensions Principales
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul du diamètre, du pas polaire, des charges électromagnétiques et de la longueur du stator
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">📐</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              Dimensions
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
                const step = i + 1;
                const isDone = step < CURRENT_STEP;
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
          { label: 'Diamètre stator',        color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Pas polaire',             color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Charge linéique',         color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Induction entrefer',      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Longueur stator',         color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
          { label: 'Ventilation',             color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
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
// COMPOSANT PRINCIPAL : STEP 3
// ─────────────────────────────────────────────────────────────────────────────
export default function Step3() {
  const { inputs, nominal, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  // Calcul local sécurisé
  const results = useMemo(() => {
    if (!inputs || !inputs.Pn || !nominal || !nominal.p) {
      return null;
    }
    try {
      return CalculationEngine.calcMainDimensions(inputs, nominal);
    } catch (error) {
      console.error("Erreur lors du calcul des dimensions :", error);
      return null;
    }
  }, [inputs, nominal]);

  // Formatage des nombres
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensions Principales">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres d'entrée ou nominaux manquants.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vérifier que les étapes 1 et 2 (Valeurs nominales) ont bien été calculées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensions Principales"
      description="Calcul du diamètre, du pas polaire, des charges électromagnétiques et de la longueur du stator"
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

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Diamètre Intérieur (D)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.D, 1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">cm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Pas Polaire (τ)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.tau, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">cm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Charge Linéique (A)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.A, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A/cm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Induction (Bdn)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.Bdn, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">G</span>
              </p>
            </div>
          </div>

          {/* Bannière d'alerte pour le ratio Lambda */}
          <div
            className={`p-4 rounded-lg border-2 shadow-sm ${
              results.isLambdaValid
                ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
                : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{results.isLambdaValid ? '✅' : '⚠️'}</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">
                Ratio de proportion (λ = {fmt(results.lambda, 2)})
              </h4>
            </div>
            <p className="text-xs font-medium opacity-90 ml-8">
              {results.lambdaMessage}
            </p>
          </div>

          {/* Tableau détaillé */}
          <ResultTable
            title="Détail des Dimensions"
            rows={[
              { label: 'Coefficient KE',          symbol: 'K_E',        value: fmt(results.KE, 3),           unit: '' },
              { label: "Puissance apparente calcul", symbol: "S'",      value: fmt(results.Sprime, 1),       unit: 'kVA' },
              { label: 'Diamètre intérieur stator', symbol: 'D',        value: fmt(results.D, 1),            unit: 'cm' },
              { label: 'Diamètre extérieur calculé', symbol: 'D_a',     value: fmt(results.Da, 1),           unit: 'cm' },
              { label: 'Diamètre extérieur normé',   symbol: 'D_a (normé)', value: fmt(results.DaNorm, 1),  unit: 'cm' },
              { label: 'Pas polaire',                symbol: 'τ',       value: fmt(results.tau, 2),          unit: 'cm' },
              { label: 'Charge linéique',            symbol: 'A',       value: fmt(results.A, 0),            unit: 'A/cm' },
              { label: "Induction dans l'entrefer",  symbol: 'B_dn',    value: fmt(results.Bdn, 0),          unit: 'G' },
              { label: 'Arc polaire relatif',        symbol: 'α_p',     value: fmt(results.alphap, 3),       unit: '—' },
              { label: "Coefficient arc de flux",    symbol: 'α_δ',     value: fmt(results.alphaDelta, 3),   unit: '—' },
              { label: "Coefficient d'induction",    symbol: 'K_B',     value: fmt(results.KB, 3),           unit: '—' },
              { label: 'Coefficient de bobinage',    symbol: 'K_01',    value: fmt(results.K01, 3),          unit: '—' },
              { label: "Longueur électromagnétique", symbol: "l'_δ",    value: fmt(results.lPrimeDelta, 1),  unit: 'cm' },
              { label: 'Longueur estimée (conduites)', symbol: 'l_δ',  value: fmt(results.lDelta, 1),       unit: 'cm' },
              { label: 'Canaux de ventilation',      symbol: 'n_v',     value: fmt(results.nv, 0),           unit: 'canaux' },
              { label: "Largeur d'un canal de vent.", symbol: 'b_v',    value: fmt(results.bv, 1),           unit: 'cm' },
              { label: "Épaisseur d'un paquet tôles", symbol: 'l_paq', value: fmt(results.lpaq, 1),         unit: 'cm' },
              { label: 'Longueur physique active',    symbol: 'l',      value: fmt(results.l, 1),            unit: 'cm' },
              { label: 'Longueur totale (fer + air)', symbol: 'l_1',    value: fmt(results.l1, 1),           unit: 'cm' },
              { label: "Longueur magnétique équiv.",  symbol: 'l_{δ,fin}', value: fmt(results.lDeltaFinal, 2), unit: 'cm' },
              { label: 'Ratio de proportion',         symbol: 'λ',      value: fmt(results.lambda, 2),       unit: '—' },
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
              Équations analytiques utilisées pour l'Étape 3
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="Puissance Apparente de Calcul (S')">
              <span className="italic font-semibold mr-2">S'</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>K<sub>E</sub> {sym.dot} P<sub>n</sub></span>}
                den={sym.cos}
              />
              <span className="ml-4 text-xs opacity-50 border-l border-current pl-2">
                K<sub>E</sub> = {sym.sqrt(
                  <span>
                    cos²φ + (sinφ + x<sub>σ</sub>)²
                  </span>
                )}
              </span>
            </Formula>

            <Formula label="Diamètre Intérieur Empirique (D)">
              <span className="italic font-semibold mr-2">D</span>
              {sym.approx}
              <span>7.1 {sym.dot} {sym.sqrt('p')} {sym.dot} (S')<sup>0.25</sup></span>
            </Formula>

            <Formula label="Pas Polaire (τ)">
              <span className="italic font-semibold mr-2">{sym.tau}</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>{sym.pi} {sym.dot} D</span>}
                den={<span>2p</span>}
              />
            </Formula>

            <Formula label="Charge Linéique (A) et Induction (Bdn)">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">A</span>
                  <span className="mr-2">=</span>
                  <span>c<sub>1</sub> {sym.dot} ln({sym.tau}) + c<sub>2</sub></span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">B<sub>dn</sub></span>
                  <span className="mr-2">=</span>
                  <span>c<sub>3</sub> − <Frac num={<span>c<sub>4</sub></span>} den={sym.tau} /></span>
                </div>
              </div>
            </Formula>

            <Formula label="Longueur Électromagnétique (l'δ)">
              <span className="italic font-semibold mr-2">l'<sub>{sym.delta}</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>6.1 {sym.dot} 10<sup>11</sup> {sym.dot} S'</span>}
                den={
                  <span>
                    {sym.alpha}<sub>{sym.delta}</sub> {sym.dot} K<sub>B</sub> {sym.dot} K<sub>01</sub> {sym.dot}
                    A {sym.dot} B<sub>dn</sub> {sym.dot} D² {sym.dot} n<sub>n</sub>
                  </span>
                }
              />
            </Formula>

            <Formula label="Longueur Estimée avec Conduites (lδ)">
              <span className="italic font-semibold mr-2">l<sub>{sym.delta}</sub></span>
              <span className="mr-2">=</span>
              <span>1.08 {sym.dot} l'<sub>{sym.delta}</sub></span>
            </Formula>

            <Formula label="Longueur Physique du Fer Actif (l)">
              <span className="italic font-semibold mr-2">l</span>
              <span className="mr-2">=</span>
              <span>l<sub>paq</sub> {sym.dot} (1 + n<sub>v</sub>)</span>
            </Formula>

            <Formula label="Longueur Totale Fer + Air (l₁)">
              <span className="italic font-semibold mr-2">l<sub>1</sub></span>
              <span className="mr-2">=</span>
              <span>l + n<sub>v</sub> {sym.dot} b<sub>v</sub></span>
            </Formula>

            <Formula label="Longueur Magnétique Équivalente Finale (lδ,fin)">
              <span className="italic font-semibold mr-2">l<sub>{sym.delta},fin</sub></span>
              <span className="mr-2">=</span>
              <span>l<sub>1</sub> − 0.5 {sym.dot} n<sub>v</sub> {sym.dot} b<sub>v</sub></span>
            </Formula>

            <Formula label="Ratio de Proportionnalité (λ)">
              <span className="italic font-semibold mr-2">{sym.lambda}</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>l<sub>{sym.delta},final</sub></span>}
                den={sym.tau}
              />
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}