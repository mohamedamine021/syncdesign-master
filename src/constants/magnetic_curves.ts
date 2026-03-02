// ============================================================================
// FICHIER CENTRAL DE CONSTANTES ET COURBES MAGNÉTIQUES
// PFE - Dimensionnement d'une machine synchrone
// ============================================================================

// ============================================================================
// MOTEURS D'INTERPOLATION (UTILITAIRES)
// ============================================================================

/** Linear interpolation on a sorted [x,y] curve */
export function interpolateCurve(curve: [number, number][], x: number): number {
  if (x <= curve[0][0]) return curve[0][1];
  if (x >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];
  for (let i = 0; i < curve.length - 1; i++) {
    if (x >= curve[i][0] && x <= curve[i + 1][0]) {
      const t = (x - curve[i][0]) / (curve[i + 1][0] - curve[i][0]);
      return curve[i][1] + t * (curve[i + 1][1] - curve[i][1]);
    }
  }
  return curve[curve.length - 1][1];
}

/** Calculates the exact value between 2 points on a graph (1D Linear Interpolation) */
export function interpolate1D(xVal: number, xArr: number[], yArr: number[]): number {
  xVal = Math.max(xArr[0], Math.min(xVal, xArr[xArr.length - 1]));
  let i = 0;
  while (i < xArr.length - 2 && xVal >= xArr[i + 1]) i++;
  const xRatio = (xVal - xArr[i]) / (xArr[i + 1] - xArr[i]);
  return yArr[i] + xRatio * (yArr[i + 1] - yArr[i]);
}

/** Calculates the exact value between 4 points of a matrix (2D Bilinear Interpolation) */
export function interpolate2D(xVal: number, yVal: number, xArr: number[], yArr: number[], grid: number[][]): number {
  xVal = Math.max(xArr[0], Math.min(xVal, xArr[xArr.length - 1]));
  yVal = Math.max(yArr[0], Math.min(yVal, yArr[yArr.length - 1]));

  let xi = 0, yi = 0;
  while (xi < xArr.length - 2 && xVal >= xArr[xi + 1]) xi++;
  while (yi < yArr.length - 2 && yVal >= yArr[yi + 1]) yi++;

  const x1 = xArr[xi], x2 = xArr[xi + 1];
  const y1 = yArr[yi], y2 = yArr[yi + 1];

  const q11 = grid[xi][yi];
  const q21 = grid[xi + 1][yi];
  const q12 = grid[xi][yi + 1];
  const q22 = grid[xi + 1][yi + 1];

  const xRatio = (xVal - x1) / (x2 - x1);
  const yRatio = (yVal - y1) / (y2 - y1);

  const r1 = q11 + xRatio * (q21 - q11);
  const r2 = q12 + xRatio * (q22 - q12);

  return Math.round((r1 + yRatio * (r2 - r1)) * 1000) / 1000;
}

// ============================================================================
// DIMENSIONS GÉNÉRALES
// ============================================================================

/** Normalized stator diameters (mm) from Table 2.1 */
export const NORMALIZED_DIAMETERS_MM = [
  133, 180, 248, 343, 458, 520, 590, 660, 740, 830, 900, 
  990, 1090, 1200, 1320, 1430, 1560, 1700, 1860, 2040, 2170, 2380
];

/** Da/D ratio ranges per pole count */
export const DA_D_RATIOS: Record<number, [number, number]> = {
  2: [1.95, 1.85],
  4: [1.61, 1.56],
  6: [1.44, 1.41],
  8: [1.39, 1.34],
};

// ============================================================================
// MATÉRIAUX MAGNÉTIQUES (B-H Curves)
// ============================================================================

/** B-H Curve data for Iron E31 steel (stator laminations, 0.5mm thickness) */
export const BH_CURVE_E31_STATOR: [number, number][] = [
  [2000, 0.44], [3000, 0.56], [4000, 0.67], [5000, 0.77], [6000, 0.90],
  [7000, 1.09], [8000, 1.33], [9000, 1.66], [10000, 2.17], [11000, 2.98],
  [12000, 4.44], [13000, 7.22], [14000, 14.1], [15000, 31.4], [16000, 59.8],
  [17000, 101], [18000, 181], [18900, 311] 
]; // (Version allégée pour l'exemple, vous pouvez garder votre long tableau ici)

/** B-H Curve for rotor steel (1-2mm thickness) */
export const BH_CURVE_ROTOR: [number, number][] = [
  [1000, 1.0], [2000, 1.4], [3000, 1.8], [4000, 2.1], [5000, 2.5], 
  [6000, 2.95], [7000, 3.45], [8000, 4.05], [9000, 4.8], [10000, 5.7],
  [11000, 6.9], [12000, 8.45], [13000, 10.8], [14000, 14.9], [15000, 22.7],
  [16000, 40.0]
]; // (Version allégée, gardez votre long tableau ici)

// ============================================================================
// CARACTÉRISTIQUE MAGNÉTIQUE (Étape 7)
// ============================================================================

export interface MagneticFieldRow {
  B_gauss: number;
  H: (number | null)[];
}
export const columnOffsets = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export const magneticFieldTable: MagneticFieldRow[] = [
  { B_gauss:  2000, H: [0.44, 0.45, 0.47, 0.48, 0.49, 0.50, 0.51, 0.52, 0.54, 0.55] },
  { B_gauss:  3000, H: [0.56, 0.57, 0.58, 0.59, 0.60, 0.61, 0.63, 0.64, 0.65, 0.66] },
  // ... (Gardez le reste de votre tableau magneticFieldTable)
];

export function lookupH(B: number): number | null {
  const base = Math.floor(B / 1000) * 1000;
  const offset = Math.round((B - base) / 100) * 100;
  const row = magneticFieldTable.find(r => r.B_gauss === base);
  if (!row) return null;
  const colIndex = columnOffsets.indexOf(offset as typeof columnOffsets[number]);
  if (colIndex === -1) return null;
  return row.H[colIndex] ?? null;
}

// --- Zone du pôle (Tableau 2.3) ---
export type MagneticTableRow = {
  B_Gauss: number;
  H: Partial<Record<0 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, number>>;
};
export const magneticTable: MagneticTableRow[] = [
  { B_Gauss: 1000,  H: { 0: 1 } },
  { B_Gauss: 2000,  H: { 0: 1.4 } },
  // ... (Gardez le reste de votre tableau magneticTable)
];

export function getH(B_Gauss: number): number | null {
  const roundedB = Math.round(B_Gauss / 100) * 100;
  const rowB = Math.floor(roundedB / 1000) * 1000;
  const offset = roundedB - rowB;
  const row = magneticTable.find(r => r.B_Gauss === rowB);
  if (!row) return null;
  const key = offset as keyof typeof row.H;
  return row.H[key] ?? null;
}

// --- Modèle Mathématique Figure 2.11 ---
export const tableFig2_11 = {
  B_Gauss: [17000, 19000, 21000, 23000, 25000, 27000],
  K_ex: [0, 0.5, 1.0, 1.5, 2.0],
  H_Acm: [
    [50,   60,   70,   80,   90],
    [200,  250,  300,  350,  400],
    [1000, 1200, 1400, 1600, 1800],
    [2000, 2300, 2600, 2900, 3200],
    [3200, 3600, 4000, 4400, 4800],
    [4600, 5100, 5600, 6100, 6600]
  ]
};

export function getHd_Fig2_11(B_Gauss: number, K_ex: number): number {
  return interpolate2D(B_Gauss, K_ex, tableFig2_11.B_Gauss, tableFig2_11.K_ex, tableFig2_11.H_Acm);
}

// ============================================================================
// RÉACTANCES DE DISPERSION (Tableau 2.4 - Étape 8)
// ============================================================================

export type CellValue = [number, number];
export interface Tableau24Row {
  ukoro: number;
  values: { [q: number]: CellValue | null };
}

const v = (x: number): CellValue => [x, x];
const r = (min: number, max: number): CellValue => [min, max];

export const table2_4_sigmaD: Tableau24Row[] = [
  { ukoro: 0,  values: { 1: v(9.7), 2: v(2.85), 3: v(1.41), 4: v(0.89), 5: v(0.65), 6: v(0.52), 7: v(0.44), 8: v(0.39), 9: v(0.35), 10: v(0.31), 11: r(0.29, 0.30) } },
  { ukoro: 1,  values: { 1: v(9.7), 2: v(2.35), 3: v(1.15), 4: v(0.74), 5: v(0.53), 6: v(0.45), 7: v(0.37), 8: v(0.33), 9: v(0.32), 10: v(0.26), 11: r(0.28, 0.28) } },
  // ... (Gardez le reste de table2_4_sigmaD)
];

export function getSigmaD(ukoro: number, q: number): number | null {
  const row = table2_4_sigmaD.find((r) => r.ukoro === ukoro);
  if (!row) return null;
  const col = q >= 11 ? 11 : q;
  const cell = row.values[col];
  if (!cell) return null;
  const averageValue = (cell[0] + cell[1]) / 2;
  return averageValue / 100;
}

// ============================================================================
// RÉACTION D'INDUIT & DIAGRAMME DE BLONDEL (Étape 9 & 11)
// ============================================================================

// --- Figure 2.17: Saturation ---
export const tableFig2_17 = {
  ratio: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6],
  x_d: [1.00, 0.99, 0.98, 0.96, 0.95, 0.93, 0.92],
  x_q: [1.00, 0.88, 0.78, 0.69, 0.62, 0.55, 0.50],
  k:   [0.000, 0.0040, 0.0052, 0.0055, 0.0052, 0.0048, 0.0040]
};

export function getSaturationCoefficients(satRatio: number) {
  return {
    x_d: interpolate1D(satRatio, tableFig2_17.ratio, tableFig2_17.x_d),
    x_q: interpolate1D(satRatio, tableFig2_17.ratio, tableFig2_17.x_q),
    k: interpolate1D(satRatio, tableFig2_17.ratio, tableFig2_17.k)
  };
}

// --- Figure 2.18: Armature Reaction ---
const tableFig2_18_Kad = {
  alpha_p: [0.4, 0.6, 0.8, 1.0],
  K_ad_10: [0.94, 0.89, 0.85, 0.78],
  K_ad_15: [0.94, 0.89, 0.84, 0.79],
  K_ad_20: [0.96, 0.90, 0.85, 0.80] 
};

const tableFig2_18_Kaq = {
  alpha_p: [0.4, 0.6, 0.8, 1.0],
  delta_tau: [0, 0.01, 0.03, 0.05],
  K_aq_10: [[0.12, 0.18, 0.29, 0.37], [0.25, 0.32, 0.42, 0.48], [0.44, 0.51, 0.59, 0.63], [0.78, 0.78, 0.78, 0.78]],
  K_aq_15: [[0.14, 0.20, 0.29, 0.36], [0.26, 0.33, 0.42, 0.48], [0.46, 0.52, 0.59, 0.64], [0.68, 0.68, 0.68, 0.68]],
  K_aq_20: [[0.15, 0.22, 0.30, 0.38], [0.28, 0.35, 0.44, 0.50], [0.48, 0.54, 0.60, 0.65], [0.61, 0.61, 0.61, 0.61]]
};

export function getArmatureReactionCoefficients(alpha_p: number, delta_tau: number, delta_ratio: number = 1.0) {
  const Kad_10 = interpolate1D(alpha_p, tableFig2_18_Kad.alpha_p, tableFig2_18_Kad.K_ad_10);
  const Kad_15 = interpolate1D(alpha_p, tableFig2_18_Kad.alpha_p, tableFig2_18_Kad.K_ad_15);
  const Kad_20 = interpolate1D(alpha_p, tableFig2_18_Kad.alpha_p, tableFig2_18_Kad.K_ad_20);

  const Kaq_10 = interpolate2D(alpha_p, delta_tau, tableFig2_18_Kaq.alpha_p, tableFig2_18_Kaq.delta_tau, tableFig2_18_Kaq.K_aq_10);
  const Kaq_15 = interpolate2D(alpha_p, delta_tau, tableFig2_18_Kaq.alpha_p, tableFig2_18_Kaq.delta_tau, tableFig2_18_Kaq.K_aq_15);
  const Kaq_20 = interpolate2D(alpha_p, delta_tau, tableFig2_18_Kaq.alpha_p, tableFig2_18_Kaq.delta_tau, tableFig2_18_Kaq.K_aq_20);

  let final_Kad = 0; let final_Kaq = 0;

  if (delta_ratio <= 1.0) { final_Kad = Kad_10; final_Kaq = Kaq_10; } 
  else if (delta_ratio >= 2.0) { final_Kad = Kad_20; final_Kaq = Kaq_20; } 
  else if (delta_ratio <= 1.5) {
    const ratio = (delta_ratio - 1.0) / 0.5;
    final_Kad = Kad_10 + ratio * (Kad_15 - Kad_10);
    final_Kaq = Kaq_10 + ratio * (Kaq_15 - Kaq_10);
  } else {
    const ratio = (delta_ratio - 1.5) / 0.5;
    final_Kad = Kad_15 + ratio * (Kad_20 - Kad_15);
    final_Kaq = Kaq_15 + ratio * (Kaq_20 - Kaq_15);
  }

  return { k_ad: Math.round(final_Kad * 1000) / 1000, k_aq: Math.round(final_Kaq * 1000) / 1000 };
}

// ============================================================================
// ENROULEMENT D'EXCITATION & ROTOR (Étape 10)
// ============================================================================

export const THICKNESSES_A_MM: number[] = [
  0.80, 0.90, 1.00, 1.06, 1.12, 1.18, 1.25, 1.32, 1.40, 1.50,
  1.60, 1.70, 1.80, 1.90, 2.00, 2.10, 2.24, 2.36, 2.44, 2.50, 2.65, 2.80
];

export const WIDTHS_B_MM: number[] = [
  2.00, 2.12, 2.24, 2.36, 2.50, 2.65, 2.80, 3.00, 3.15, 3.35,
  3.55, 3.75, 4.00, 4.25, 4.50, 4.75, 5.00, 5.30, 5.60, 6.00,
  6.30, 6.70, 7.10, 7.50, 8.00, 8.50, 9.00, 9.50, 10.0, 10.6,
  11.2, 11.8, 12.5, 13.2, 14.0, 15.0, 15.6, 16.0, 17.0, 18.0, 19.0, 20.0,
  21.2, 22.4, 23.6, 25.0, 26.5, 28.0, 30.0
];

export function getOptimalStandardWire(b_max_mm: number, S_theo_mm2: number) {
  let best_b = WIDTHS_B_MM[0];
  for (const width of WIDTHS_B_MM) {
    if (width <= b_max_mm) best_b = width;
    else break;
  }

  const a_theo = S_theo_mm2 / best_b;

  let best_a = THICKNESSES_A_MM[0];
  let min_diff = Math.abs(THICKNESSES_A_MM[0] - a_theo);

  for (const thickness of THICKNESSES_A_MM) {
    const diff = Math.abs(thickness - a_theo);
    if (diff < min_diff) {
      min_diff = diff;
      best_a = thickness;
    }
  }

  const S_commercial_mm2 = Math.round((best_a * best_b) * 100) / 100;

  return { a_mm: best_a, b_mm: best_b, S_mm2: S_commercial_mm2 };
}

// --- Figure 2.19 : Modèle Thermique du Rotor ---
export const tableFig2_19_alpha = {
  v_p: [0, 10, 20, 30, 40, 50, 60, 70, 80],
  alpha: [0.000, 0.008, 0.013, 0.0165, 0.0185, 0.0205, 0.0215, 0.0225, 0.0235]
};

export function getCoolingCoefficientAlpha(v_p: number): number {
  return interpolate1D(v_p, tableFig2_19_alpha.v_p, tableFig2_19_alpha.alpha);
}

export function getCoolingCoefficientK(l1_tau_ratio: number): number {
  return Math.pow(l1_tau_ratio, -0.4);
}

// ============================================================================
// PERTES ET RENDEMENT (Étape 14)
// ============================================================================

export type HarmonicKey = 0 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type SpecificLossRow = Record<HarmonicKey, number>;
export type SpecificLossTable = Record<number, SpecificLossRow>;

// --- Tableau 2.7 : Pertes spécifiques E11 ---
export const tableau2_7: SpecificLossTable = {
  5000:  { 0: 1,    100: 1.04,  200: 1.08,  300: 1.11,  400: 1.14,  500: 1.2,   600: 1.2,   700: 1.25,  800: 1.31,  900: 1.35  },
  6000:  { 0: 1.4,  100: 1.45,  200: 1.5,   300: 1.55,  400: 1.6,   500: 1.65,  600: 1.7,   700: 1.75,  800: 1.8,   900: 1.85  },
  7000:  { 0: 1.9,  100: 1.95,  200: 2,     300: 2.05,  400: 2.1,   500: 2.15,  600: 2.15,  700: 2.15,  800: 2.2,   900: 2.25  },
  8000:  { 0: 2.3,  100: 2.35,  200: 2.4,   300: 2.45,  400: 2.5,   500: 2.55,  600: 2.6,   700: 2.65,  800: 2.7,   900: 2.75  },
  9000:  { 0: 2.8,  100: 2.85,  200: 2.9,   300: 2.95,  400: 3.0,   500: 3.05,  600: 3.1,   700: 3.15,  800: 3.2,   900: 3.25  },
  10000: { 0: 3.3,  100: 3.36,  200: 3.42,  300: 3.48,  400: 3.55,  500: 3.62,  600: 3.7,   700: 3.78,  800: 3.86,  900: 3.94  },
  11000: { 0: 4.02, 100: 4.1,   200: 4.18,  300: 4.26,  400: 4.34,  500: 4.42,  600: 4.5,   700: 4.6,   800: 4.7,   900: 4.8   },
  12000: { 0: 4.9,  100: 5.0,   200: 5.1,   300: 5.2,   400: 5.3,   500: 5.4,   600: 5.5,   700: 5.6,   800: 5.7,   900: 5.8   },
  13000: { 0: 5.9,  100: 6.0,   200: 6.1,   300: 6.2,   400: 6.3,   500: 6.4,   600: 6.5,   700: 6.6,   800: 6.7,   900: 6.8   },
  14000: { 0: 6.9,  100: 7.0,   200: 7.1,   300: 7.2,   400: 7.3,   500: 7.4,   600: 7.5,   700: 7.6,   800: 7.7,   900: 7.8   },
  15000: { 0: 7.9,  100: 8.0,   200: 8.1,   300: 8.2,   400: 8.3,   500: 8.4,   600: 8.5,   700: 8.6,   800: 8.7,   900: 8.8   },
  16000: { 0: 9.0,  100: 9.1,   200: 9.1,   300: 9.2,   400: 9.3,   500: 9.4,   600: 9.5,   700: 9.6,   800: 9.7,   900: 9.8   },
  17000: { 0: 9.9,  100: 10,    200: 10.1,  300: 10.2,  400: 10.3,  500: 10.4,  600: 10.52, 700: 10.6,  800: 10.76, 900: 10.88 },
  18000: { 0: 11.0, 100: 11.15, 200: 11.3,  300: 11.45, 400: 11.6,  500: 11.75, 600: 11.9,  700: 12.15, 800: 12.2,  900: 12.35 },
  19000: { 0: 12.5, 100: 12.65, 200: 12.8,  300: 12.95, 400: 13.1,  500: 13.25, 600: 13.4,  700: 13.55, 800: 13.7,  900: 13.9  },
};

export function getSpecificLoss(bAc: number, harmonic: HarmonicKey = 0): number {
  const keys = Object.keys(tableau2_7).map(Number).sort((a, b) => a - b);
  
  if (bAc <= keys[0]) return tableau2_7[keys[0]][harmonic];
  if (bAc >= keys[keys.length - 1]) return tableau2_7[keys[keys.length - 1]][harmonic];

  for (let i = 0; i < keys.length - 1; i++) {
    if (bAc >= keys[i] && bAc <= keys[i + 1]) {
      const k1 = keys[i];
      const k2 = keys[i + 1];
      const val1 = tableau2_7[k1 as keyof SpecificLossTable][harmonic];
      const val2 = tableau2_7[k2 as keyof SpecificLossTable][harmonic];
      return val1 + ((bAc - k1) / (k2 - k1)) * (val2 - val1);
    }
  }
  return 0;
}

// --- Figure 2.20 : Coefficient de pulsation de flux ---
export const tableFig2_20_beta0 = {
  ratio_bou_delta: [0, 1.0, 2.0, 3.0, 3.37, 4.0, 5.0, 6.0],
  beta_0:          [0, 0.05, 0.12, 0.18, 0.21, 0.25, 0.30, 0.34]
};

export function getBeta0(ratio_bou_delta: number): number {
  return interpolate1D(ratio_bou_delta, tableFig2_20_beta0.ratio_bou_delta, tableFig2_20_beta0.beta_0);
}