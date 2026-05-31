// RotorVisualization.tsx
import React, { useEffect, useRef, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RotorVisualizationProps {
  D:      number;   // Diamètre intérieur stator = diamètre alésage (cm)
  delta:  number;   // Entrefer (cm)
  bp:     number;   // Arc polaire (cm)
  hp:     number;   // Hauteur épanouissement (cm)
  hM:     number;   // Hauteur noyau (cm)
  bM:     number;   // Largeur noyau (cm)
  Ha:     number;   // Hauteur culasse rotor (cm)
  PhiM?:  number;   // Flux polaire (Mx)
  Ba?:    number;   // Induction culasse (G)
}

function fmt(v: number | null | undefined, d = 2): string {
  if (v == null || isNaN(v as number) || !isFinite(v as number)) return '—';
  return (v as number).toFixed(d);
}

function formatScientific(val: number | undefined | null) {
  if (val == null || isNaN(val)) return '—';
  const exp = Math.floor(Math.log10(Math.abs(val)));
  const mantissa = (val / Math.pow(10, exp)).toFixed(2);
  return `${mantissa}×10⁶`;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export const RotorVisualization: React.FC<RotorVisualizationProps> = (props) => {
  const { D, delta, bp, hp, hM, bM, Ha, PhiM, Ba } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calcul des rayons en pixels — même logique que StatorVisualization
  const radii = useMemo(() => {
    // On utilise D (alésage stator) comme référence, comme dans le stator
    // Le stator utilise MAX_R = 285 pour Da/2
    // Ici on veut que Ri (rayon alésage = D/2) soit à ~285px pour cohérence
    const MAX_R = 255; // légèrement dézoommé vs stator
    const scale = MAX_R / (D / 2);

    const Ri        = (D / 2) * scale;                        // Rayon alésage (inner bore)
    const R_pole    = (D / 2 - delta) * scale;                // Rayon face polaire
    const R_noyauT  = R_pole - hp * scale;                    // Haut du noyau (bas épanouissement)
    const R_noyauB  = R_noyauT - hM * scale;                  // Bas du noyau (haut culasse)
    const R_arbre   = Math.max(R_noyauB - Ha * scale, 18);    // Rayon arbre (min 18px)

    const px_bp     = bp * scale;   // Arc polaire en pixels (corde)
    const px_bM     = bM * scale;   // Largeur noyau en pixels

    return { scale, Ri, R_pole, R_noyauT, R_noyauB, R_arbre, px_bp, px_bM };
  }, [D, delta, bp, hp, hM, bM, Ha]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const { Ri, R_pole, R_noyauT, R_noyauB, R_arbre, px_bp, px_bM } = radii;

    ctx.clearRect(0, 0, W, H);

    // ── Fond (identique StatorVisualization) ─────────────────────────────────
    ctx.fillStyle = '#0b1628';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H);

    // ── Cercle alésage statorique (pointillé bleu, identique stator) ─────────
    ctx.beginPath();
    ctx.arc(CX, CY, Ri, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3a9acc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Arbre central ─────────────────────────────────────────────────────────
    drawShaft(ctx, CX, CY, R_arbre);

    // ── Culasse rotorique (anneau entre R_arbre et R_noyauB) ─────────────────
    drawYokeRing(ctx, CX, CY, R_noyauB, R_arbre);

    // ── 4 pôles saillants (N–S–N–S à 90°, 0°, 270°, 180°) ──────────────────
    const poleAngles = [
      { angle: -Math.PI / 2, polarity: 'S' },   // haut
      { angle:  0,           polarity: 'N' },   // droite
      { angle:  Math.PI / 2, polarity: 'S' },   // bas
      { angle:  Math.PI,     polarity: 'N' },   // gauche
    ];

    for (const { angle, polarity } of poleAngles) {
      drawSalientPole(ctx, CX, CY, angle, {
        R_pole, R_noyauT, R_noyauB, px_bp, px_bM,
        hp: (R_pole - R_noyauT),   // en pixels
        hM: (R_noyauT - R_noyauB), // en pixels
      }, polarity);
    }

    // ── Bobinages inducteurs dans les 4 inter-pôles ───────────────────────────
    const coilAngles = [
      Math.PI / 4,
      3 * Math.PI / 4,
      5 * Math.PI / 4,
      7 * Math.PI / 4,
    ];
    for (const angle of coilAngles) {
      drawCoilSlot(ctx, CX, CY, angle, R_noyauB, R_noyauT, px_bp, R_pole);
    }

    // ── Flèches flux polaire (vertes) ─────────────────────────────────────────
    drawFluxArrows(ctx, CX, CY, R_arbre, R_noyauB, R_pole, Ri);

    // ── Axes de symétrie (identiques stator) ──────────────────────────────────
    ctx.save();
    ctx.strokeStyle = '#2a6496';
    ctx.lineWidth = 0.6;
    ctx.setLineDash([6, 4]);
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(CX, 20); ctx.lineTo(CX, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, CY); ctx.lineTo(W - 20, CY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Cotes dynamiques ──────────────────────────────────────────────────────
    drawDimensions(ctx, CX, CY, radii, props);

  }, [radii, props]);

  // ─── Sidebar ───────────────────────────────────────────────────────────────
  const sidebarParams = [
    { label: 'D int (alésage)',  val: `${fmt(D, 1)} cm`,     color: '#f6e05e' },
    { label: 'δ — Entrefer',     val: `${fmt(delta, 3)} cm`, color: '#63b3ed' },
    { label: 'bp — Arc pôle',    val: `${fmt(bp, 2)} cm`,    color: '#f6c90e' },
    { label: 'hp — Épanouis.',   val: `${fmt(hp, 2)} cm`,    color: '#fc8181' },
    { label: 'hM — Noyau',       val: `${fmt(hM, 2)} cm`,    color: '#fc8181' },
    { label: 'bM — L. noyau',    val: `${fmt(bM, 2)} cm`,    color: '#f6c90e' },
    { label: 'Ha — Culasse',     val: `${fmt(Ha, 2)} cm`,    color: '#68d391' },
  ];

  const inductionParams = [
    { label: 'ΦM — Flux pol.', val: PhiM != null ? `${formatScientific(PhiM)} Mx` : '—' },
    { label: 'Ba — Culasse',   val: Ba   != null ? `${fmt(Ba, 0)} G` : '—' },
  ];

  const legendItems = [
    { bg: '#1e3a5a', border: '#4a90c4', label: 'Fer rotorique (culasse)' },
    { bg: '#1e3a5a', border: '#4a90c4', label: 'Noyau & épanouissement' },
    { bg: '#e25822', border: 'transparent', label: 'Bobinage inducteur (Cu)' },
    { bg: '#11223a', border: '#2a4a70', label: 'Arbre du rotor (Shaft)' },
  ];

  return (
    <div style={{
      width: '100%',
      background: '#0a1628',
      borderRadius: '10px',
      border: '1px solid #1e3a5f',
      overflow: 'hidden',
      fontFamily: '"Courier New", monospace',
    }}>
      {/* ── En-tête (même style que stator) ── */}
      <div style={{
        background: '#0d2040',
        borderBottom: '1px solid #2a6496',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, color: '#3a6a9a' }}>DWG-R6-001</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#7eb8e8', letterSpacing: '0.12em' }}>
          ROTOR À PÔLES SAILLANTS — COUPE RADIALE 360° · VUE CAO · 4 PÔLES
        </span>
        <span style={{ fontSize: 9, color: '#3a6a9a' }}>REV.A</span>
      </div>

      {/* ── Corps principal ── */}
      <div style={{ display: 'flex' }}>

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            width={700}
            height={700}
            style={{ display: 'block', width: '100%', height: 'auto' }}
            aria-label="Coupe radiale 360° du rotor à pôles saillants"
          />
        </div>

        {/* ── Sidebar (même style que stator) ── */}
        <div style={{
          width: 224,
          flexShrink: 0,
          background: '#060f1e',
          borderLeft: '1px solid #1a3a5a',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <SideBox title="PARAMÈTRES DYNAMIQUES">
            {sidebarParams.map(({ label, val, color }) => (
              <ParamRow key={label} label={label} val={val} color={color} />
            ))}
          </SideBox>

          <SideBox title="RÉSULTATS MAGNÉTIQUES">
            {inductionParams.map(({ label, val }) => (
              <ParamRow key={label} label={label} val={val} color="#fbd38d" />
            ))}
          </SideBox>

          <SideBox title="TOPOLOGIE">
            <div style={{ fontSize: 9, color: '#7eb8e8', lineHeight: 1.8 }}>
              <div>• <strong style={{ color: '#f6c90e' }}>2p = 4</strong> pôles saillants</div>
              <div>• Alternance <strong style={{ color: '#fc8181' }}>N–S–N–S</strong></div>
              <div>• Épanouissements polaires</div>
              <div>• Bobinage inducteur DC</div>
              <div>• Entrefer variable</div>
            </div>
          </SideBox>

          <SideBox title="LÉGENDE">
            {legendItems.map(({ bg, border, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <div style={{
                  width: 13, height: 10, borderRadius: 2, flexShrink: 0,
                  background: bg,
                  border: `1px solid ${border}`,
                }} />
                <span style={{ fontSize: 9, color: '#7eb8e8' }}>{label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <div style={{ width: 13, height: 0, borderTop: '1.5px dashed #3a9acc' }} />
              <span style={{ fontSize: 9, color: '#3a9acc' }}>Entrefer / alésage</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
              <div style={{ width: 13, height: 0, borderTop: '2px solid #22cc44' }} />
              <span style={{ fontSize: 9, color: '#5aaa70' }}>Lignes de flux (Φ)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
              <div style={{ width: 13, height: 0, borderTop: '0.6px dashed #2a6496' }} />
              <span style={{ fontSize: 9, color: '#5a8aaa' }}>Axes de symétrie</span>
            </div>
          </SideBox>
        </div>
      </div>
    </div>
  );
};

// ─── Sous-composants UI (identiques stator) ───────────────────────────────────
function SideBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid #1e3a5f',
      borderRadius: 6,
      padding: 10,
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        color: '#7eb8e8',
        letterSpacing: '0.08em',
        marginBottom: 8,
        borderBottom: '1px solid #1a4a7a',
        paddingBottom: 5,
        fontFamily: '"Courier New", monospace',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ParamRow({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 9.5, color: '#5a8aaa', fontFamily: '"Courier New", monospace' }}>{label}</span>
      <span style={{ fontSize: 9.5, fontWeight: 700, color, fontFamily: '"Courier New", monospace' }}>{val}</span>
    </div>
  );
}

// ─── Fonctions de dessin ───────────────────────────────────────────────────────

/** Grille de fond — copie exacte du stator */
function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.strokeStyle = '#1a3055';
  ctx.lineWidth = 0.3;
  for (let x = 0; x < W; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 0.6;
  for (let x = 0; x < W; x += 100) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 100) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

/** Arbre central — même couleurs que la zone rotor du stator */
function drawShaft(ctx: CanvasRenderingContext2D, CX: number, CY: number, R: number) {
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.fillStyle = '#11223a';
  ctx.fill();
  ctx.strokeStyle = '#2a4a70';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Culasse rotorique — anneau de R_arbre à R_noyauB
 * Même style que drawYokeRing du stator (#1e3a5a + hachures #4a7fa5)
 */
function drawYokeRing(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  Rout: number,   // R_noyauB
  Rin: number,    // R_arbre
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rout, 0, 2 * Math.PI);
  ctx.arc(CX, CY, Rin,  0, 2 * Math.PI, true);
  ctx.fillStyle = '#1e3a5a';
  ctx.fill();

  // Hachures — même style stator
  ctx.clip();
  ctx.strokeStyle = '#4a7fa5';
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.25;
  for (let d = -Rout * 2; d < Rout * 2; d += 7) {
    ctx.beginPath();
    ctx.moveTo(CX + d, CY - Rout);
    ctx.lineTo(CX + d + Rout * 2, CY + Rout);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Contours
  ctx.beginPath();
  ctx.arc(CX, CY, Rout, 0, 2 * Math.PI);
  ctx.strokeStyle = '#4a90c4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, Rin, 0, 2 * Math.PI);
  ctx.strokeStyle = '#4a90c4';
  ctx.lineWidth = 1;
  ctx.stroke();
}

interface PoleDims {
  R_pole:   number;
  R_noyauT: number;
  R_noyauB: number;
  px_bp:    number;
  px_bM:    number;
  hp:       number;   // pixels
  hM:       number;   // pixels
}

/**
 * Un pôle saillant orienté selon `angle`
 * Couleurs identiques au stator (#1e3a5a, #4a90c4, #4a7fa5)
 */
function drawSalientPole(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  angle: number,
  dims: PoleDims,
  polarity: 'N' | 'S',
) {
  const { R_pole, R_noyauT, R_noyauB, px_bp, px_bM } = dims;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(angle);

  // Demi-angles de la face polaire et du noyau
  const alphaFace  = Math.asin(Math.min(px_bp / 2 / R_pole,   0.9999));
  const alphaNoyau = Math.asin(Math.min(px_bM / 2 / R_noyauB, 0.9999));

  // ── Noyau polaire + épanouissement (un seul path en T) ───────────────────
  ctx.beginPath();
  // Base du noyau (côté culasse, arc)
  ctx.arc(0, 0, R_noyauB, -Math.PI / 2 + alphaNoyau, -Math.PI / 2 - alphaNoyau, true);
  // Montée gauche du noyau
  ctx.lineTo(
    R_noyauT * Math.sin(-alphaNoyau + 0),   // approx: noyau droit
    -R_noyauT
  );

  // On refait en cartésien propre :
  ctx.restore();
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(angle);

  // Recalcul points clés en repère local (axe pôle = -Y)
  // Le pôle pointe vers le haut (-Y) dans le repère tourné
  const halfBp = px_bp / 2;
  const halfBm = px_bM / 2;

  const yNoyauB   = -R_noyauB;   // bas du noyau (côté culasse)
  const yNoyauT   = -R_noyauT;   // haut du noyau / bas épanouissement
  const yFaceBot  = -R_pole * Math.cos(alphaFace); // haut épanouissement

  // Path en T inversé (pointe vers –Y)
  ctx.beginPath();
  ctx.moveTo(-halfBm, yNoyauB);
  ctx.lineTo(-halfBm, yNoyauT);
  ctx.lineTo(-halfBp, yNoyauT);
  ctx.lineTo(-halfBp, yFaceBot);
  // Arc face polaire
  ctx.arc(0, 0, R_pole, -Math.PI / 2 - alphaFace, -Math.PI / 2 + alphaFace);
  ctx.lineTo(halfBp, yNoyauT);
  ctx.lineTo(halfBm, yNoyauT);
  ctx.lineTo(halfBm, yNoyauB);
  // Arc base noyau (côté culasse)
  ctx.arc(0, 0, R_noyauB, -Math.PI / 2 + alphaNoyau, -Math.PI / 2 - alphaNoyau, true);
  ctx.closePath();

  // Remplissage — même couleur que culasse stator
  ctx.fillStyle = '#1e3a5a';
  ctx.fill();

  // Hachures — même style stator
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = '#4a7fa5';
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.25;
  for (let d = -R_pole * 2; d < R_pole * 2; d += 7) {
    ctx.beginPath();
    ctx.moveTo(d, yNoyauB - 5);
    ctx.lineTo(d + R_pole, yFaceBot - R_pole);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Contour pôle
  ctx.beginPath();
  ctx.moveTo(-halfBm, yNoyauB);
  ctx.lineTo(-halfBm, yNoyauT);
  ctx.lineTo(-halfBp, yNoyauT);
  ctx.lineTo(-halfBp, yFaceBot);
  ctx.arc(0, 0, R_pole, -Math.PI / 2 - alphaFace, -Math.PI / 2 + alphaFace);
  ctx.lineTo(halfBp, yNoyauT);
  ctx.lineTo(halfBm, yNoyauT);
  ctx.lineTo(halfBm, yNoyauB);
  ctx.arc(0, 0, R_noyauB, -Math.PI / 2 + alphaNoyau, -Math.PI / 2 - alphaNoyau, true);
  ctx.closePath();
  ctx.strokeStyle = '#4a90c4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Label N / S ───────────────────────────────────────────────────────────
  const labelY = -(R_noyauT + R_pole) / 2;
  ctx.fillStyle = '#7eb8e8';
  ctx.font = `bold ${Math.max(13, px_bp * 0.18)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(polarity, 0, labelY);

  ctx.restore();
}

/**
 * Bobinage inducteur dans une encoche inter-polaire
 * Copie exacte du style drawSlot du stator (rouge #e25822 + lignes conducteurs)
 */
function drawCoilSlot(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  angle: number,       // angle du centre de l'inter-pôle
  Rin: number,         // R_noyauB (rayon intérieur du bobinage)
  Rout: number,        // R_noyauT (rayon extérieur du bobinage)
  px_bp: number,       // largeur arc polaire en pixels
  R_pole: number,
) {
  // Largeur angulaire de l'inter-pôle : 90° moins les deux demi-faces polaires
  const alphaFace = Math.asin(Math.min(px_bp / 2 / R_pole, 0.9999));
  const gapHalf   = Math.PI / 4 - alphaFace;
  const aL = angle - gapHalf * 0.88;
  const aR = angle + gapHalf * 0.88;

  const pad = 2;

  // ── Fond encoche (vide noir) ──────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rout - pad, aL, aR);
  ctx.arc(CX, CY, Rin  + pad, aR, aL, true);
  ctx.closePath();
  ctx.fillStyle = '#030810';
  ctx.fill();
  ctx.restore();

  const midR = (Rin + Rout) / 2;

  // ── Couche 1 (extérieure) — rouge vif, même que phase A stator ───────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rout - pad,  aL + pad / Rout, aR - pad / Rout);
  ctx.arc(CX, CY, midR + 1,    aR - pad / Rout, aL + pad / Rout, true);
  ctx.closePath();
  ctx.fillStyle = '#e25822';
  ctx.fill();
  ctx.strokeStyle = '#ff9955';
  ctx.lineWidth = 0.4;
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  // Lignes conducteurs
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ffcc88';
  ctx.lineWidth = 0.35;
  for (let k = 1; k < 5; k++) {
    const r = midR + 1 + k / 5 * (Rout - pad - midR - 1);
    ctx.beginPath();
    ctx.arc(CX, CY, r, aL + pad / Rout, aR - pad / Rout);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Isolation inter-couche (blanc bleuté, même que stator) ───────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, midR + 1,   aL, aR);
  ctx.arc(CX, CY, midR - 1.5, aR, aL, true);
  ctx.closePath();
  ctx.fillStyle = '#d0e8f0';
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Couche 2 (intérieure) — rouge foncé, même que phase A couche 2 stator ─
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, midR - 1.5,  aL + pad / Rin, aR - pad / Rin);
  ctx.arc(CX, CY, Rin  + pad,  aR - pad / Rin, aL + pad / Rin, true);
  ctx.closePath();
  ctx.fillStyle = '#a03d12';
  ctx.fill();
  ctx.strokeStyle = '#cc7733';
  ctx.lineWidth = 0.4;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  // Lignes conducteurs couche 2
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ffcc88';
  ctx.lineWidth = 0.35;
  for (let k = 1; k < 5; k++) {
    const r = Rin + pad + k / 5 * (midR - 1.5 - Rin - pad);
    ctx.beginPath();
    ctx.arc(CX, CY, r, aL + pad / Rin, aR - pad / Rin);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Flèches de flux polaire vertes dans la roue polaire */
function drawFluxArrows(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  R_arbre: number,
  R_noyauB: number,
  R_pole: number,
  Ri: number,
) {
  ctx.save();
  ctx.strokeStyle = '#22cc44';
  ctx.fillStyle   = '#22cc44';
  ctx.lineWidth   = 2;

  // 4 flèches radiales dans la culasse (croix)
  const fluxDirs = [
    { x1: CX,           y1: CY - R_arbre - 2,  x2: CX,            y2: CY - R_noyauB + 2  },
    { x1: CX,           y1: CY + R_arbre + 2,  x2: CX,            y2: CY + R_noyauB - 2  },
    { x1: CX - R_arbre - 2, y1: CY,            x2: CX - R_noyauB + 2, y2: CY             },
    { x1: CX + R_arbre + 2, y1: CY,            x2: CX + R_noyauB - 2, y2: CY             },
  ];

  for (const { x1, y1, x2, y2 } of fluxDirs) {
    drawArrowLine(ctx, x1, y1, x2, y2);
  }

  // Petites flèches dans l'entrefer (entre R_pole et Ri)
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  const entGap = (Ri - R_pole) / 2;
  const rEntrefer = R_pole + entGap;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 - Math.PI / 2;
    const x1e = CX + (rEntrefer - 8) * Math.cos(a);
    const y1e = CY + (rEntrefer - 8) * Math.sin(a);
    const x2e = CX + (rEntrefer + 8) * Math.cos(a);
    const y2e = CY + (rEntrefer + 8) * Math.sin(a);
    drawArrowLine(ctx, x1e, y1e, x2e, y2e);
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawArrowLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.translate(x2, y2);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -3.5);
  ctx.lineTo(-8,  3.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Tête de flèche — copie exacte stator */
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-6, -2.5);
  ctx.lineTo(-6,  2.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

interface RadiiType {
  scale:    number;
  Ri:       number;
  R_pole:   number;
  R_noyauT: number;
  R_noyauB: number;
  R_arbre:  number;
  px_bp:    number;
  px_bM:    number;
}

/** Cotes dynamiques — même style que drawDimensions du stator */
function drawDimensions(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  r: RadiiType,
  props: RotorVisualizationProps,
) {
  const { Ri, R_pole, R_noyauT, R_noyauB, R_arbre, px_bp, px_bM } = r;
  const { delta, bp, hM, bM, Ha } = props;

  // ── δ — entrefer (direction 45°) ─────────────────────────────────────────
  {
    const a = -Math.PI / 4;
    const x1 = CX + R_pole * Math.cos(a), y1 = CY + R_pole * Math.sin(a);
    const x2 = CX + Ri     * Math.cos(a), y2 = CY + Ri     * Math.sin(a);
    drawRadialDim(ctx, x1, y1, x2, y2, a, '#63b3ed', `δ=${fmt(delta, 3)}cm`);
  }

  // ── hM — hauteur noyau (direction 135°) ──────────────────────────────────
  {
    const a = -3 * Math.PI / 4;
    const x1 = CX + R_noyauT * Math.cos(a), y1 = CY + R_noyauT * Math.sin(a);
    const x2 = CX + R_noyauB * Math.cos(a), y2 = CY + R_noyauB * Math.sin(a);
    drawRadialDim(ctx, x1, y1, x2, y2, a, '#fc8181', `hM=${fmt(hM, 1)}cm`);
  }

  // ── Ha — hauteur culasse (direction 225°) ─────────────────────────────────
  {
    const a = -5 * Math.PI / 4;
    const x1 = CX + R_noyauB * Math.cos(a), y1 = CY + R_noyauB * Math.sin(a);
    const x2 = CX + R_arbre  * Math.cos(a), y2 = CY + R_arbre  * Math.sin(a);
    drawRadialDim(ctx, x1, y1, x2, y2, a, '#68d391', `Ha=${fmt(Ha, 2)}cm`);
  }

  // ── D/2 — rayon alésage (vertical, vers le haut) ─────────────────────────
  {
    ctx.save();
    ctx.strokeStyle = '#b794f4';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([5, 3]);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX, CY - Ri);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    drawArrowHead(ctx, CX, CY - Ri, -Math.PI / 2, '#b794f4');
    ctx.fillStyle = '#b794f4';
    ctx.font = '9.5px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('D/2', CX + 5, CY - Ri / 2);
    ctx.restore();
  }

  // ── bp — arc polaire (arc horizontal en haut, slot=0 à angle=-PI/2) ───────
  {
    const rDim = R_pole + 18;
    const alphaFace = Math.asin(Math.min(px_bp / 2 / R_pole, 0.9999));
    const aL = -Math.PI / 2 - alphaFace;
    const aR = -Math.PI / 2 + alphaFace;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, rDim, aL, aR);
    ctx.strokeStyle = '#f6c90e';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    drawArrowHead(ctx, CX + rDim * Math.cos(aL), CY + rDim * Math.sin(aL), aL - Math.PI / 2, '#f6c90e');
    drawArrowHead(ctx, CX + rDim * Math.cos(aR), CY + rDim * Math.sin(aR), aR + Math.PI / 2, '#f6c90e');
    const midA = (aL + aR) / 2;
    ctx.fillStyle = '#f6c90e';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`bp=${fmt(bp, 2)}cm`, CX + (rDim + 16) * Math.cos(midA), CY + (rDim + 16) * Math.sin(midA));
    ctx.restore();
  }

  // ── bM — largeur noyau (arc, noyau en haut) ───────────────────────────────
  {
    const alphaNoyau = Math.asin(Math.min(px_bM / 2 / R_noyauB, 0.9999));
    const rDim = R_noyauB - 16;
    const aL = -Math.PI / 2 - alphaNoyau;
    const aR = -Math.PI / 2 + alphaNoyau;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, rDim, aL, aR);
    ctx.strokeStyle = '#f6c90e';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    drawArrowHead(ctx, CX + rDim * Math.cos(aL), CY + rDim * Math.sin(aL), aL - Math.PI / 2, '#f6c90e');
    drawArrowHead(ctx, CX + rDim * Math.cos(aR), CY + rDim * Math.sin(aR), aR + Math.PI / 2, '#f6c90e');
    const midA = (aL + aR) / 2;
    ctx.fillStyle = '#f6c90e';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`bM=${fmt(bM, 2)}cm`, CX + (rDim - 16) * Math.cos(midA), CY + (rDim - 16) * Math.sin(midA));
    ctx.restore();
  }

  // ── Label entrefer ────────────────────────────────────────────────────────
  ctx.fillStyle = '#3a9acc';
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('← ENTREFER →', CX, CY - (Ri + R_pole) / 2);
}

/** drawRadialDim — copie exacte stator */
function drawRadialDim(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  angle: number,
  color: string,
  label: string,
) {
  const perpX = -Math.sin(angle) * 22;
  const perpY =  Math.cos(angle) * 22;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([3, 2]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + perpX, y1 + perpY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 + perpX, y2 + perpY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x1 + perpX, y1 + perpY);
  ctx.lineTo(x2 + perpX, y2 + perpY);
  ctx.stroke();

  const dx = x2 - x1, dy = y2 - y1;
  const a = Math.atan2(dy, dx);

  const ah = (x: number, y: number, ang: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -2.5); ctx.lineTo(-6, 2.5);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  };
  ah(x1 + perpX, y1 + perpY, a + Math.PI);
  ah(x2 + perpX, y2 + perpY, a);

  ctx.fillStyle = color;
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const mx = (x1 + x2) / 2 + perpX * 2.2;
  const my = (y1 + y2) / 2 + perpY * 2.2;
  ctx.fillText(label, mx, my);
  ctx.restore();
}