// StatorVisualization.tsx
import React, { useEffect, useRef, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StatorVisualizationProps {
  D?:    number;
  Da?:   number;
  delta?: number;
  hc?:   number;
  he?:   number;
  be?:   number;
  bd1?:  number;
  Z1?:   number;
  q1?:   number;
  w1?:   number;
  Bd0?:  number;
  Bd1?:  number;
  Bc?:   number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  bg:         '#0b1628',
  gridMaj:    '#1e3f55',
  gridMin:    '#1a3055',
  yokeFill:   '#1e3a5a',
  yokeHatch:  '#4a7fa5',
  yokeStroke: '#4a90c4',
  slotBg:     '#030810',
  insulation: '#d0e8f0',
  airgap:     '#3a9acc',
  axes:       '#2a6496',
  textHalo:   '#0b1628',
  dimD:       '#b794f4',
  dimHc:      '#f6c90e',
  dimHe:      '#fc8181',
  dimBe:      '#68d391',
  dimBd1:     '#63b3ed',
};

const PHASE_L1 = ['#e25822', '#2255cc', '#22aa55'];
const PHASE_L2 = ['#a03d12', '#14288a', '#146633'];
const PHASE_S1 = ['#ff9955', '#4488ff', '#55dd77'];
const PHASE_S2 = ['#cc7733', '#2244aa', '#228844'];

function fmt(v: number | null | undefined, d = 2): string {
  if (v == null || isNaN(v as number) || !isFinite(v as number)) return '—';
  return (v as number).toFixed(d);
}

// ─── Composant principal ──────────────────────────────────────────────────────
export const StatorVisualization: React.FC<StatorVisualizationProps> = (props) => {
  const {
    D   = 66.0,
    Da  = 90.0,
    delta = 0,
    hc  = 4.38,
    he  = 76.3,
    be  = 13.5,
    bd1 = 1.526,
    Z1  = 24,
    q1  = 3,
    w1  = 360,
    Bd0 = 6552,
    Bd1 = 15774,
    Bc  = 16840,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const radii = useMemo(() => {
    const MAX_R = 290;
    const scale = MAX_R / (Da / 2);
    const Ro    = (Da / 2) * scale;
    const Ri    = (D  / 2) * scale;
    const Rs    = Math.min(Ri + (he / 10) * scale, Ro - 2);
    return { Ro, Ri, Rs, scale };
  }, [D, Da, he]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W  = canvas.width;
    const H  = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const { Ro, Ri, Rs } = radii;
    const slotAngle = (2 * Math.PI) / Z1;
    const slotRatio = 0.65;

    ctx.clearRect(0, 0, W, H);

    // ── Fond ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H);
    drawTechBackground(ctx, W, H);  // ← appel du fond décoratif HUD/Blueprint

    // ── Disque statorique complet ─────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, Ro, 0, 2 * Math.PI);
    ctx.arc(CX, CY, Ri, 0, 2 * Math.PI, true);
    ctx.fillStyle = COLORS.yokeFill;
    ctx.fill();
    ctx.restore();

    // ── Culasse ───────────────────────────────────────────────────────────────
    drawYokeRing(ctx, CX, CY, Ro, Rs);

    // ── Encoches ──────────────────────────────────────────────────────────────
    for (let i = 0; i < Z1; i++) {
      const angle = (i / Z1) * 2 * Math.PI - Math.PI / 2;
      drawSlot(ctx, CX, CY, angle, slotAngle, Ri, Rs, i, q1, slotRatio);
    }

    // ── Dents ─────────────────────────────────────────────────────────────────
    for (let i = 0; i < Z1; i++) {
      const angle = (i / Z1) * 2 * Math.PI - Math.PI / 2;
      drawTooth(ctx, CX, CY, angle, slotAngle, Ri, Rs, slotRatio);
    }

    // ── Centre vide ───────────────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, Ri - 1, 0, 2 * Math.PI);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
    ctx.restore();

    // ── Cercle alésage ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(CX, CY, Ri, 0, 2 * Math.PI);
    ctx.strokeStyle = COLORS.airgap;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Texte centre ──────────────────────────────────────────────────────────
    drawTextHalo(ctx, 'ROTOR',            CX, CY - 11, '#2a6496', 'bold 14px "Courier New", monospace');
    drawTextHalo(ctx, '(non représenté)', CX, CY +  8, '#1a4060', '10px "Courier New", monospace');

    // ── Axes de symétrie ──────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = COLORS.axes;
    ctx.lineWidth   = 0.6;
    ctx.setLineDash([6, 4]);
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(CX, 20);   ctx.lineTo(CX, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, CY);   ctx.lineTo(W - 20, CY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Flèche entrefer ───────────────────────────────────────────────────────
    drawEntreферArrow(ctx, CX, CY, Ri, delta ?? 0);

    // ── Cotes dynamiques ──────────────────────────────────────────────────────
    drawDimensions(ctx, CX, CY, radii, { D, Da, hc, he, be, bd1 }, slotAngle, Z1, slotRatio);

  }, [radii, Z1, q1, D, Da, delta, hc, he, be, bd1, props]);

  // ─── Sidebar data ─────────────────────────────────────────────────────────
  const dynParams = [
    { label: 'D int (alésage)',  val: `${fmt(D,  1)} cm`,  color: '#f6e05e' },
    { label: 'Da ext (culasse)', val: `${fmt(Da, 1)} cm`,  color: '#f6e05e' },
    { label: 'δ — Entrefer',     val: delta > 0 ? `${fmt(delta, 3)} cm` : '—', color: '#3a9acc' },
    { label: 'hc — culasse',     val: `${fmt(hc,  2)} cm`, color: '#f6c90e' },
    { label: 'he — encoche',     val: `${fmt(he,  1)} mm`, color: '#fc8181' },
    { label: 'be — l. encoche',  val: `${fmt(be,  1)} mm`, color: '#68d391' },
    { label: 'bd₁ — l. dent',   val: `${fmt(bd1, 3)} cm`, color: '#63b3ed' },
  ];
  const windParams = [
    { label: 'Z₁ — Encoches',     val: `${Z1}`, color: '#b794f4' },
    { label: 'q₁ — Enc/pôle/ph',  val: `${q1}`, color: '#b794f4' },
    { label: 'w₁ — Spires/phase', val: `${w1}`, color: '#b794f4' },
  ];
  const indParams = [
    { label: 'Bδ0 — entrefer', val: `${fmt(Bd0, 0)} G`, color: '#fbd38d' },
    { label: 'Bd1 — dents',    val: `${fmt(Bd1, 0)} G`, color: '#fbd38d' },
    { label: 'Bc  — culasse',  val: `${fmt(Bc,  0)} G`, color: '#fbd38d' },
  ];

  const legendItems = [
    { bg: '#1e3a5a', border: '#4a90c4', label: 'Tôle statorique (culasse)' },
    { bg: PHASE_L1[0], border: 'transparent', label: 'Phase A — couche 1' },
    { bg: PHASE_L2[0], border: 'transparent', label: 'Phase A — couche 2' },
    { bg: PHASE_L1[1], border: 'transparent', label: 'Phase B' },
    { bg: PHASE_L1[2], border: 'transparent', label: 'Phase C' },
    { bg: '#d0e8f0',   border: 'transparent', label: 'Isolation inter-couche', opacity: 0.75 },
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
      {/* ── En-tête ── */}
      <div style={{
        background: '#0d2040',
        borderBottom: '1px solid #2a6496',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, color: '#3a6a9a' }}>DWG-S4-001</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#7eb8e8', letterSpacing: '0.12em' }}>
          STATOR — COUPE RADIALE 360° · VUE CAO · {Z1} ENCOCHES
        </span>
        <span style={{ fontSize: 9, color: '#3a6a9a' }}>REV.A</span>
      </div>

      {/* ── Corps ── */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            width={760}
            height={760}
            style={{ display: 'block', width: '100%', height: 'auto' }}
            aria-label="Coupe radiale 360° du stator"
          />
        </div>

        {/* Sidebar */}
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
            {dynParams.map(({ label, val, color }) => (
              <ParamRow key={label} label={label} val={val} color={color} />
            ))}
          </SideBox>
          <SideBox title="ENROULEMENTS">
            {windParams.map(({ label, val, color }) => (
              <ParamRow key={label} label={label} val={val} color={color} />
            ))}
          </SideBox>
          <SideBox title="INDUCTIONS">
            {indParams.map(({ label, val, color }) => (
              <ParamRow key={label} label={label} val={val} color={color} />
            ))}
          </SideBox>
          <SideBox title="LÉGENDE">
            {legendItems.map(({ bg, border, label, opacity }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <div style={{
                  width: 13, height: 10, borderRadius: 2, flexShrink: 0,
                  background: bg,
                  border: `1px solid ${border}`,
                  opacity: opacity ?? 1,
                }} />
                <span style={{ fontSize: 9, color: '#7eb8e8' }}>{label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <div style={{ width: 13, height: 0, borderTop: '1.5px dashed #3a9acc' }} />
              <span style={{ fontSize: 9, color: '#3a9acc' }}>Entrefer / alésage</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
              <svg width="13" height="10" style={{ flexShrink: 0 }}>
                <line x1="6" y1="5" x2="13" y2="5" stroke="#3a9acc" strokeWidth="1.5"/>
                <polygon points="13,5 9,3 9,7" fill="#3a9acc"/>
                <line x1="7" y1="5" x2="0" y2="5" stroke="#3a9acc" strokeWidth="1.5"/>
                <polygon points="0,5 4,3 4,7" fill="#3a9acc"/>
              </svg>
              <span style={{ fontSize: 9, color: '#3a9acc' }}>Flèche entrefer (δ)</span>
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

// ─── Sous-composants UI ───────────────────────────────────────────────────────
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

// ─── Fonctions Canvas ─────────────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.strokeStyle = COLORS.gridMin;
  ctx.lineWidth   = 0.3;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = COLORS.gridMaj;
  ctx.lineWidth   = 0.6;
  for (let x = 0; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

function drawYokeRing(ctx: CanvasRenderingContext2D, CX: number, CY: number, Ro: number, Rs: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Ro, 0, 2 * Math.PI);
  ctx.arc(CX, CY, Rs, 0, 2 * Math.PI, true);
  ctx.fillStyle = COLORS.yokeFill;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = COLORS.yokeHatch;
  ctx.lineWidth   = 0.7;
  ctx.globalAlpha = 0.25;
  for (let d = -Ro * 2; d < Ro * 2; d += 7) {
    ctx.beginPath();
    ctx.moveTo(CX + d, CY - Ro);
    ctx.lineTo(CX + d + Ro * 2, CY + Ro);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.beginPath(); ctx.arc(CX, CY, Ro, 0, 2 * Math.PI);
  ctx.strokeStyle = COLORS.yokeStroke; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(CX, CY, Rs, 0, 2 * Math.PI);
  ctx.strokeStyle = COLORS.yokeStroke; ctx.lineWidth = 0.8; ctx.stroke();
}

function drawSlot(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  centerAngle: number, slotAngle: number,
  Ri: number, Rs: number,
  slotIndex: number, q1: number, slotRatio: number,
) {
  const halfSlot = (slotAngle * slotRatio) / 2;
  const aL = centerAngle - halfSlot;
  const aR = centerAngle + halfSlot;
  const pad = 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rs, aL, aR);
  ctx.arc(CX, CY, Ri, aR, aL, true);
  ctx.closePath();
  ctx.fillStyle = COLORS.slotBg;
  ctx.fill();
  ctx.restore();

  const phase = Math.floor(slotIndex / q1) % 3;
  const c1 = PHASE_L1[phase];
  const c2 = PHASE_L2[phase];
  const s1 = PHASE_S1[phase];
  const s2 = PHASE_S2[phase];
  const midR = (Ri + Rs) / 2;

  // Couche 1 (extérieure)
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rs - pad, aL + pad / Rs, aR - pad / Rs);
  ctx.arc(CX, CY, midR + 1, aR - pad / Rs, aL + pad / Rs, true);
  ctx.closePath();
  ctx.fillStyle = c1;
  ctx.fill();
  ctx.strokeStyle = s1;
  ctx.lineWidth   = 0.4;
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ffcc88';
  ctx.lineWidth   = 0.35;
  for (let k = 1; k < 5; k++) {
    const r = midR + 1 + (k / 5) * (Rs - pad - midR - 1);
    ctx.beginPath(); ctx.arc(CX, CY, r, aL + pad / Rs, aR - pad / Rs); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Isolation inter-couche
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, midR + 1,   aL, aR);
  ctx.arc(CX, CY, midR - 1.5, aR, aL, true);
  ctx.closePath();
  ctx.fillStyle   = COLORS.insulation;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Couche 2 (intérieure)
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, midR - 1.5, aL + pad / Ri, aR - pad / Ri);
  ctx.arc(CX, CY, Ri  + pad,  aR - pad / Ri, aL + pad / Ri, true);
  ctx.closePath();
  ctx.fillStyle = c2;
  ctx.fill();
  ctx.strokeStyle = s2;
  ctx.lineWidth   = 0.4;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ffcc88';
  ctx.lineWidth   = 0.35;
  for (let k = 1; k < 5; k++) {
    const r = Ri + pad + (k / 5) * (midR - 1.5 - Ri - pad);
    ctx.beginPath(); ctx.arc(CX, CY, r, aL + pad / Ri, aR - pad / Ri); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTooth(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  centerAngle: number, slotAngle: number,
  Ri: number, Rs: number, slotRatio: number,
) {
  const toothCenter = centerAngle + slotAngle / 2;
  const halfTooth   = (slotAngle * (1 - slotRatio)) / 2;
  const tL = toothCenter - halfTooth;
  const tR = toothCenter + halfTooth;

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rs, tL, tR);
  ctx.arc(CX, CY, Ri, tR, tL, true);
  ctx.closePath();
  ctx.fillStyle = COLORS.yokeFill;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = COLORS.yokeHatch;
  ctx.lineWidth   = 0.7;
  ctx.globalAlpha = 0.18;
  for (let d = -Rs * 2; d < Rs * 2; d += 7) {
    ctx.beginPath();
    ctx.moveTo(CX + d, CY - Rs);
    ctx.lineTo(CX + d + Rs, CY + Rs);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Rs, tL, tR);
  ctx.arc(CX, CY, Ri, tR, tL, true);
  ctx.closePath();
  ctx.strokeStyle = COLORS.yokeStroke;
  ctx.lineWidth   = 0.7;
  ctx.stroke();
  ctx.restore();
}

// ─── Texte avec halo ──────────────────────────────────────────────────────────
function drawTextHalo(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color: string, font: string,
  align: CanvasTextAlign = 'center',
  baseline: CanvasTextBaseline = 'middle',
) {
  ctx.save();
  ctx.font          = font;
  ctx.textAlign     = align;
  ctx.textBaseline  = baseline;
  ctx.strokeStyle   = COLORS.textHalo;
  ctx.lineWidth     = 4;
  ctx.lineJoin      = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle     = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── Flèche ───────────────────────────────────────────────────────────────────
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -3.5);
  ctx.lineTo(-8,  3.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// ─── Cote radiale ─────────────────────────────────────────────────────────────
function drawRadialDim(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  angle: number,
  color: string,
  label: string,
  perpOff = 28,
) {
  const px = -Math.sin(angle) * perpOff;
  const py =  Math.cos(angle) * perpOff;

  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 0.7; ctx.setLineDash([3, 2]); ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + px, y1 + py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 + px, y2 + py); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x1 + px, y1 + py);
  ctx.lineTo(x2 + px, y2 + py);
  ctx.stroke();

  const a = Math.atan2(y2 - y1, x2 - x1);
  drawArrowHead(ctx, x1 + px, y1 + py, a + Math.PI, color);
  drawArrowHead(ctx, x2 + px, y2 + py, a, color);

  const mx = (x1 + x2) / 2 + px * 2.2;
  const my = (y1 + y2) / 2 + py * 2.2;
  drawTextHalo(ctx, label, mx, my, color, 'bold 10px "Courier New", monospace');
  ctx.restore();
}

// ─── Cote diamétrale ──────────────────────────────────────────────────────────
function drawDiameterDim(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  radius: number,
  angle: number,
  offset: number,
  color: string,
  label: string,
  side: 'left' | 'right' = 'right',
) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const perpX = -sinA * offset;
  const perpY =  cosA * offset;

  const x1 = CX - cosA * radius + perpX;
  const y1 = CY - sinA * radius + perpY;
  const x2 = CX + cosA * radius + perpX;
  const y2 = CY + sinA * radius + perpY;

  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 0.7; ctx.setLineDash([3, 2]); ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(CX - cosA * radius, CY - sinA * radius);
  ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CX + cosA * radius, CY + sinA * radius);
  ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;

  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  const la = Math.atan2(y2 - y1, x2 - x1);
  drawArrowHead(ctx, x1, y1, la + Math.PI, color);
  drawArrowHead(ctx, x2, y2, la, color);

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const s  = side === 'right' ? 14 : -14;
  const align: CanvasTextAlign = side === 'right' ? 'left' : 'right';
  drawTextHalo(ctx, label, mx - sinA * s, my + cosA * s, color,
    'bold 10px "Courier New", monospace', align);
  ctx.restore();
}

// ─── Arc leader (cote angulaire avec dog-leg) ─────────────────────────────────
function drawArcLeader(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  arcR: number,
  a1: number,
  a2: number,
  Ro: number,
  color: string,
  label: string,
  labelSide: 'top' | 'bottom' | 'left' | 'right' = 'top',
) {
  const midA  = (a1 + a2) / 2;
  const cosM  = Math.cos(midA);
  const sinM  = Math.sin(midA);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.4;
  ctx.beginPath();
  ctx.arc(CX, CY, arcR, a1, a2);
  ctx.stroke();

  const px1 = CX + arcR * Math.cos(a1), py1 = CY + arcR * Math.sin(a1);
  const px2 = CX + arcR * Math.cos(a2), py2 = CY + arcR * Math.sin(a2);
  drawArrowHead(ctx, px1, py1, a1 - Math.PI / 2, color);
  drawArrowHead(ctx, px2, py2, a2 + Math.PI / 2, color);

  ctx.lineWidth   = 0.7;
  ctx.setLineDash([3, 2]);
  ctx.globalAlpha = 0.55;
  for (const a of [a1, a2]) {
    ctx.beginPath();
    ctx.moveTo(CX + (arcR - 10) * Math.cos(a), CY + (arcR - 10) * Math.sin(a));
    ctx.lineTo(CX + (arcR + 12) * Math.cos(a), CY + (arcR + 12) * Math.sin(a));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  const kneeR    = Ro + 20;
  const textOffR = Ro + 42;

  const kx = CX + kneeR * cosM,   ky = CY + kneeR * sinM;
  const tx = CX + textOffR * cosM, ty = CY + textOffR * sinM;

  ctx.lineWidth   = 0.9;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(CX + arcR * cosM, CY + arcR * sinM);
  ctx.lineTo(kx, ky);
  ctx.stroke();

  const legLen  = 26;
  const legSign = cosM >= 0 ? 1 : -1;
  const ex = kx + legLen * legSign;
  const ey = ky;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const textAlign: CanvasTextAlign = legSign > 0 ? 'left' : 'right';
  drawTextHalo(ctx, label, ex + legSign * 4, ey, color,
    'bold 10px "Courier New", monospace', textAlign, 'middle');

  ctx.restore();
}

// ─── Flèche entrefer ──────────────────────────────────────────────────────────
function drawEntreферArrow(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  Ri: number,
  delta: number,
) {
  const gapPx  = Math.max(Ri * 0.06, 10);
  const rInner = Ri - gapPx;
  const rOuter = Ri;

  const annAngle = -Math.PI / 4;
  const cosA = Math.cos(annAngle);
  const sinA = Math.sin(annAngle);

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, rOuter, annAngle - 0.21, annAngle + 0.21);
  ctx.arc(CX, CY, rInner, annAngle + 0.21, annAngle - 0.21, true);
  ctx.closePath();
  ctx.fillStyle   = '#3a9acc';
  ctx.globalAlpha = 0.18;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  const tipOuter = { x: CX + rOuter * cosA, y: CY + rOuter * sinA };
  const tipInner = { x: CX + rInner * cosA, y: CY + rInner * sinA };

  ctx.save();
  ctx.strokeStyle = COLORS.airgap;
  ctx.lineWidth   = 1.6;
  ctx.beginPath();
  ctx.moveTo(tipInner.x, tipInner.y);
  ctx.lineTo(tipOuter.x, tipOuter.y);
  ctx.stroke();
  drawArrowHead(ctx, tipOuter.x, tipOuter.y, annAngle, COLORS.airgap);
  drawArrowHead(ctx, tipInner.x, tipInner.y, annAngle + Math.PI, COLORS.airgap);
  ctx.restore();

  const midR = (rInner + rOuter) / 2;
  const kR   = Ri + 55;
  const mx   = CX + midR * cosA, my = CY + midR * sinA;
  const kx   = CX + kR   * cosA, ky = CY + kR   * sinA;

  ctx.save();
  ctx.strokeStyle = COLORS.airgap;
  ctx.lineWidth   = 0.9;
  ctx.globalAlpha = 0.8;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(kx, ky);
  const legLen = 40;
  const ex     = kx + legLen;
  const ey     = ky;
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();

  const label = delta > 0 ? `ENTREFER  δ = ${delta.toFixed(3)} cm` : 'ENTREFER';
  drawTextHalo(ctx, label, ex + 5, ey, COLORS.airgap,
    'bold 10px "Courier New", monospace', 'left', 'middle');

  ctx.save();
  ctx.strokeStyle = COLORS.airgap;
  ctx.lineWidth   = 0.7;
  ctx.globalAlpha = 0.55;
  const perpX = -sinA * 6, perpY = cosA * 6;
  ctx.beginPath();
  ctx.moveTo(tipOuter.x - perpX, tipOuter.y - perpY);
  ctx.lineTo(tipOuter.x + perpX, tipOuter.y + perpY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tipInner.x - perpX, tipInner.y - perpY);
  ctx.lineTo(tipInner.x + perpX, tipInner.y + perpY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Ensemble des cotes ───────────────────────────────────────────────────────
interface RadiiType {
  Ro: number; Ri: number; Rs: number; scale: number;
}

function drawDimensions(
  ctx: CanvasRenderingContext2D,
  CX: number, CY: number,
  r: RadiiType,
  p: { D?: number; Da?: number; hc?: number; he?: number; be?: number; bd1?: number },
  slotAngle: number,
  Z1: number,
  slotRatio: number,
) {
  const { Ro, Ri, Rs } = r;
  const { hc, he, be, bd1, D, Da } = p;

  drawDiameterDim(ctx, CX, CY, Ri, 0, Ri * 0.30, COLORS.dimD, `D = ${fmt(D, 1)} cm`, 'right');
  drawDiameterDim(ctx, CX, CY, Ro, -Math.PI / 2, -Ro * 0.15, COLORS.dimD, `Da = ${fmt(Da, 1)} cm`, 'left');

  {
    const a = -Math.PI / 4;
    drawRadialDim(ctx,
      CX + Rs * Math.cos(a), CY + Rs * Math.sin(a),
      CX + Ro * Math.cos(a), CY + Ro * Math.sin(a),
      a, COLORS.dimHc, `hc=${fmt(hc, 2)}cm`, 30);
  }

  {
    const a = 3 * Math.PI / 4;
    drawRadialDim(ctx,
      CX + Ri * Math.cos(a), CY + Ri * Math.sin(a),
      CX + Rs * Math.cos(a), CY + Rs * Math.sin(a),
      a, COLORS.dimHe, `he=${fmt(he, 1)}mm`, 30);
  }

  {
    const sCtr     = -Math.PI / 2;
    const halfSlot = (slotAngle * slotRatio) / 2;
    const arcR     = (Ri + Rs) / 2 + (Rs - Ri) * 0.20;
    drawArcLeader(ctx, CX, CY,
      arcR,
      sCtr - halfSlot,
      sCtr + halfSlot,
      Ro,
      COLORS.dimBe,
      `be=${fmt(be, 1)}mm`,
      'top',
    );
  }

  {
    const iRight    = Math.round(Z1 / 4);
    const tCtr      = (iRight / Z1) * 2 * Math.PI - Math.PI / 2 + slotAngle / 2;
    const halfTooth = (slotAngle * (1 - slotRatio)) / 2;
    const arcR      = (Ri + Rs) / 2 + (Rs - Ri) * 0.20;
    drawArcLeader(ctx, CX, CY,
      arcR,
      tCtr - halfTooth,
      tCtr + halfTooth,
      Ro,
      COLORS.dimBd1,
      `bd₁=${fmt(bd1, 2)}cm`,
      'right',
    );
  }
}

// ─── Fond technique décoratif (HUD / Blueprint) ───────────────────────────────
// Copié et adapté depuis RotorVisualization.tsx — textes mis à jour pour le stator
function drawTechBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();

  const border  = '#2a5080';
  const border2 = '#1e3a5f';
  const hatch   = '#2e5a8a';

  // ── Utilitaire : rectangle imbriqué avec contour double ───────────────────
  function nestedRect(x: number, y: number, w: number, h: number, margin = 6) {
    ctx.strokeStyle = border;
    ctx.lineWidth   = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = border2;
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(x + margin, y + margin, w - margin * 2, h - margin * 2);
  }

  // ── Utilitaire : hachures diagonales dans un rect ─────────────────────────
  function hatchRect(x: number, y: number, w: number, h: number, step = 8) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.clip();
    ctx.strokeStyle = hatch;
    ctx.lineWidth   = 0.4;
    for (let d = -(h + w); d < (h + w); d += step) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d + h, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Utilitaire : texte micro-annotation ───────────────────────────────────
  function microText(text: string, x: number, y: number, align: CanvasTextAlign = 'left') {
    ctx.font         = '8px "Courier New", monospace';
    ctx.fillStyle    = '#2a5a8a';
    ctx.textAlign    = align;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GROUPE 1 — Coin bas-gauche : bloc avec hachures + annotations
  // ════════════════════════════════════════════════════════════════════════════
  ctx.globalAlpha = 0.30;
  {
    const gx = 18, gy = H - 130, gw = 110, gh = 100;
    hatchRect(gx, gy, gw, gh, 9);
    nestedRect(gx, gy, gw, gh, 7);

    ctx.globalAlpha = 0.40;
    microText('REF-STA-01', gx + 4, gy + 4);   // ← adapté stator
    microText(`W=${W}px`,   gx + 4, gy + 14);

    // Croix de repère interne
    ctx.strokeStyle = border;
    ctx.lineWidth   = 0.5;
    const cx = gx + gw / 2, cy = gy + gh / 2;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy,  6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.30;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GROUPE 2 — Coin bas-droit : bloc hachures + micro-annotations
  // ════════════════════════════════════════════════════════════════════════════
  {
    const gx = W - 128, gy = H - 130, gw = 110, gh = 100;
    hatchRect(gx, gy, gw, gh, 9);
    nestedRect(gx, gy, gw, gh, 7);

    ctx.globalAlpha = 0.40;
    microText('REF-STA-02', gx + 4, gy + 4);   // ← adapté stator
    microText(`H=${H}px`,   gx + 4, gy + 14);

    // Petit réticule
    const cx = gx + gw / 2, cy = gy + gh / 2;
    ctx.strokeStyle = border;
    ctx.lineWidth   = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.30;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GROUPE 3 — Coin haut-gauche : rectangles emboîtés + annotations stator
  // ════════════════════════════════════════════════════════════════════════════
  {
    const gx = 18, gy = 18, gw = 100, gh = 80;
    nestedRect(gx, gy, gw, gh, 6);
    ctx.strokeStyle = '#1a304e';
    ctx.lineWidth   = 0.4;
    ctx.strokeRect(gx + 14, gy + 14, gw - 28, gh - 28);

    ctx.globalAlpha = 0.40;
    microText('DWG-S4-001',  gx + 4, gy + 4);   // ← adapté stator
    microText('STATOR VIEW', gx + 4, gy + 14);   // ← adapté stator
    microText('RADIAL CUT',  gx + 4, gy + 24);   // ← adapté stator

    // Flèche nord décorative
    const ax = gx + gw / 2, ay = gy + gh - 22;
    ctx.strokeStyle = border;
    ctx.lineWidth   = 0.7;
    ctx.beginPath(); ctx.moveTo(ax, ay);      ctx.lineTo(ax, ay - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(ax - 4, ay - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(ax + 4, ay - 8); ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.font         = '7px "Courier New", monospace';
    ctx.fillStyle    = '#2a5a8a';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('N', ax, ay - 22);
    ctx.globalAlpha = 0.30;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GROUPE 4 — Coin haut-droit : hachures + légende technique
  // ════════════════════════════════════════════════════════════════════════════
  {
    const gx = W - 128, gy = 18, gw = 110, gh = 80;
    hatchRect(gx, gy, gw, gh, 10);
    nestedRect(gx, gy, gw, gh, 6);

    ctx.globalAlpha = 0.40;
    microText('TOLÉRANCE',      gx + 4, gy + 4);
    microText('±0.05 cm',       gx + 4, gy + 14);
    microText('MATIÈRE: FeSi',  gx + 4, gy + 24);
    microText('LAMINAGE 0.5mm', gx + 4, gy + 34);

    // Petit tableau 2×2
    const tx = gx + 8, ty = gy + gh - 26, tw = gw - 16, th = 18;
    ctx.strokeStyle = border2;
    ctx.lineWidth   = 0.4;
    ctx.strokeRect(tx, ty, tw, th);
    ctx.beginPath(); ctx.moveTo(tx + tw / 2, ty); ctx.lineTo(tx + tw / 2, ty + th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx, ty + th / 2); ctx.lineTo(tx + tw, ty + th / 2); ctx.stroke();
    ctx.globalAlpha = 0.30;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GROUPE 5 — Bande horizontale bas : règle graduée
  // ════════════════════════════════════════════════════════════════════════════
  {
    const ry = H - 26, rx = 18, rw = W - 36;
    ctx.strokeStyle = border;
    ctx.lineWidth   = 0.6;
    ctx.strokeRect(rx, ry, rw, 14);

    ctx.lineWidth = 0.4;
    for (let x = rx; x <= rx + rw; x += 20) {
      const isMaj = ((x - rx) % 100 === 0);
      const tickH = isMaj ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.lineTo(x, ry + tickH);
      ctx.stroke();
      if (isMaj && x > rx && x < rx + rw - 20) {
        ctx.globalAlpha = 0.35;
        ctx.font         = '7px "Courier New", monospace';
        ctx.fillStyle    = '#2a5a8a';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${x - rx}`, x, ry + 2);
        ctx.globalAlpha = 0.30;
      }
    }
  }

  ctx.restore();
}

export default StatorVisualization;