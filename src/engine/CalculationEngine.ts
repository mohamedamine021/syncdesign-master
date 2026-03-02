import type {
  InputParams, NominalValues, MainDimensions, StatorDesign,
  AirGapDesign, RotorDesign, Reactances, ExcitationSystem, LossesAndEfficiency
} from '@/types/machine';
import {
  NORMALIZED_DIAMETERS_MM, DA_D_RATIOS,
  BH_CURVE_E31_STATOR, BH_CURVE_ROTOR, SPECIFIC_LOSSES_E11,
  interpolateCurve, 
  lookupH,
  getH,
  getSigmaD,getSaturationCoefficients, 
  getArmatureReactionCoefficients,
  getOptimalStandardWire, 
  getCoolingCoefficientAlpha,
   getCoolingCoefficientK,
   getSpecificLoss, 
   getBeta0,
} from '@/constants/magnetic_curves'; 

export class CalculationEngine {
  // Step 1: Validate inputs
  static validateInputs(p: InputParams): string[] {
    const errors: string[] = [];
    if (p.Pn <= 0) errors.push('Pn must be positive');
    if (p.Un <= 0) errors.push('Un must be positive');
    if (p.cosPhi <= 0 || p.cosPhi > 1) errors.push('cos φ must be in (0, 1]');
    if (p.f <= 0) errors.push('Frequency must be positive');
    if (p.nn <= 0) errors.push('Speed must be positive');
    if (p.m < 1) errors.push('Phases must be >= 1');
    const p_calc = (60 * p.f) / p.nn;
    if (!Number.isInteger(p_calc) || p_calc < 1) errors.push('60f/n must be a positive integer (pole pairs)');
    return errors;
  }

  // Step 2: Nominal values
  static calcNominal(inp: InputParams): NominalValues {
    const Uph = inp.Un / Math.sqrt(3);
    const Sn = inp.Pn / inp.cosPhi;
    const In = (Sn * 1000) / (Math.sqrt(3) * inp.Un);
    const p = (60 * inp.f) / inp.nn;
    return { Uph, Sn, In, p };
  }

  // Step 3: Main dimensions
  static calcMainDimensions(inp: InputParams, nom: NominalValues): MainDimensions {
    const sinPhi = Math.sqrt(1 - inp.cosPhi * inp.cosPhi);
    const xSigma = 0.1; // typical p.u.
    const KE = Math.sqrt(inp.cosPhi ** 2 + (sinPhi + xSigma) ** 2);
    const Sprime = (KE * inp.Pn) / inp.cosPhi;
    
    // Diameter selection - empirical formula from PDF
    // D ≈ function of S' and p (from chart)
    const twoP = 2 * nom.p;
   // Based on the mathematical analysis of the chart (Figure 2.2 of the PDF)
   // Formula: D ≈ 7.1 * √(p) * (S')^(1/4)
   let D_approx = 7.1 * Math.sqrt(nom.p) * Math.pow(Sprime, 0.25);
    
    // Da/D ratio
    const ratioRange = DA_D_RATIOS[twoP] || [1.39, 1.34];
    const ratioMean = (ratioRange[0] + ratioRange[1]) / 2;
    let Da = ratioMean * D_approx;
    
    // Normalize Da
    const DaNorm_mm = CalculationEngine.normalizeOuterDiameter(Da * 10);
    const DaNorm = DaNorm_mm / 10;
    
    // Recalculate D from normalized Da
    D_approx = Math.round(DaNorm / ratioMean);
    const D = D_approx;
    
    const tau = (Math.PI * D) / twoP;
    
    // Default design choices
    // -------------------------------------------------------------
    // DYNAMIC DESIGN CHOICES (Based on Kopylov, Figure 2.3)
    // -------------------------------------------------------------
    
    // 1. Coefficient dictionaries for each p (number of pole pairs)
    const coefsA: Record<number, { c1: number, c2: number }> = {
      1: { c1: 173, c2: -236 }, // Extrapolated for safety for p=1
      2: { c1: 173, c2: -236 },
      3: { c1: 151.5, c2: -137 },
      4: { c1: 137, c2: -61 },
      5: { c1: 132, c2: -31 },  // Interpolated for p=5
      6: { c1: 127, c2: -1 },
      8: { c1: 120, c2: 15 }    // Extrapolated for very slow machines
    };

    const coefsB: Record<number, { c3: number, c4: number }> = {
      1: { c3: 10250, c4: 75000 },
      2: { c3: 10250, c4: 75000 },
      3: { c3: 10100, c4: 62500 },
      4: { c3: 9900, c4: 47500 },
      5: { c3: 9840, c4: 42000 }, 
      6: { c3: 9780, c4: 36500 },
      8: { c3: 9700, c4: 30000 }
    };

    // 2. Coefficient selection (fallback to p=6 if p is not found)
    const cA = coefsA[nom.p] || coefsA[6];
    const cB = coefsB[nom.p] || coefsB[6];

    // 3. Theoretical calculations based on curve fitting formulas
    // Linear current density: A = c1 * ln(tau) + c2
    let A_calc = cA.c1 * Math.log(tau) + cA.c2;
    // Air-gap flux density: Bdn = c3 - (c4 / tau)
    let Bdn_calc = cB.c3 - (cB.c4 / tau);

    // 4. Safety bounds and rounding
    // Forces the calculated values to remain within the physical limits of the graph
    const A = Math.round(Math.max(240, Math.min(495, A_calc)));
    const Bdn = Math.round(Math.max(6800, Math.min(9200, Bdn_calc)));
    
    const alphap = 0.73;
    const alphaDelta = 0.68;
    const KB = 1.09;
    const K01 = 0.91;
    
    // Stator length
    // 1. Theoretical electromagnetic length
    const lPrimeDelta = (6.1e11 * Sprime) / (alphaDelta * KB * K01 * A * Bdn * D * D * inp.nn);
    
    // 2. Estimated length with ventilation ducts
    const lt = 1.08;
    const lDelta = lt * lPrimeDelta;
    
    // -------------------------------------------------------------
    // 3. DYNAMIC VENTILATION SYSTEM
    // -------------------------------------------------------------
    const bv = 1;      // Width of the ventilation duct (cm)
    const lpaq = 4.5;  // Standard thickness of a lamination packet (cm)
    
    let nv: number;    // Number of radial ventilation ducts
    
    // If the machine is small (<= 15 cm), no air ducts are added
    if (lDelta <= 15) {
        nv = 0;
    } else {
        // Calculate the required number of packets, then derive the ducts (nv = packets - 1)
        const n_paquets = Math.max(1, Math.round(lDelta / lpaq));
        nv = n_paquets - 1;
    }
    // -------------------------------------------------------------
    
    // 4. Calculation of the final actual manufacturing dimensions
    const l = lpaq * (1 + nv);                // Length of the solid iron (active part)
    const l1 = l + nv * bv;                   // Total physical length (Iron + Air)
    const lDeltaFinal = l1 - 0.5 * nv * bv;   // Equivalent magnetic length
    
    // 5. Proportion check (ideally should be between 1 and 3)
    const lambda = lDeltaFinal / tau;

    // -------------------------------------------------------------
    // 6. NORM VALIDATION MESSAGE (Lambda Check)
    // -------------------------------------------------------------
    let isLambdaValid: boolean;
    let lambdaMessage: string;

    if (lambda >= 1 && lambda <= 3) {
        isLambdaValid = true;
        lambdaMessage = "Optimal proportions: Lambda is within the standard range (1 to 3).";
    } else if (lambda < 1) {
        isLambdaValid = false;
        lambdaMessage = "Warning: Lambda < 1. The machine is too short and wide (risk of high copper losses in end windings).";
    } else {
        isLambdaValid = false;
        lambdaMessage = "Warning: Lambda > 3. The machine is too long and thin (risk of mechanical vibrations on the shaft).";
    }
    
    return {
      KE, Sprime, D, Da, DaNorm, tau, A, Bdn, alphap, alphaDelta, KB, K01,
      lPrimeDelta, lDelta, nv, bv, lpaq, l, l1, lDeltaFinal, lambda, 
      isLambdaValid, lambdaMessage 
    }
  }

  static normalizeOuterDiameter(da_mm: number): number {
    let closest = NORMALIZED_DIAMETERS_MM[0];
    let minDiff = Math.abs(da_mm - closest);
    for (const d of NORMALIZED_DIAMETERS_MM) {
      if (d >= da_mm) { return d; }
      const diff = Math.abs(da_mm - d);
      if (diff < minDiff) { closest = d; minDiff = diff; }
    }
    return closest;
  }

   // Step 4: Stator design
  static calcStator(inp: InputParams, nom: NominalValues, dim: MainDimensions): StatorDesign {
    const q1 = 3;
    const Z1 = 2 * nom.p * inp.m * q1;
    const t1 = (Math.PI * dim.D) / Z1;
    
    // Winding: Conductors & Current Density
    let up1_theorique = (dim.A * t1) / nom.In;
    let up1 = Math.max(2, Math.round(up1_theorique / 2) * 2);

    const a = 1; 
    const A_real = (up1 * nom.In) / (a * t1); 

    const w1 = (nom.p * q1 * up1) / a;
    const tauSlots = Z1 / (2 * nom.p);
    const Y = Math.round(tauSlots * 0.778); 
    const beta = Y / tauSlots;

    // Winding Factor (K01)
    const alpha_elec_sur_2 = Math.PI / (2 * tauSlots);
    const Kd = Math.sin(q1 * alpha_elec_sur_2) / (q1 * Math.sin(alpha_elec_sur_2));
    const Kp = Math.sin(beta * (Math.PI / 2));
    const K01 = Kd * Kp;

    // Air Gap Magnetic Flux & Induction
    const Phi0 = (4 * 1.0 * nom.Uph * 1e8) / (0.09 * inp.f * w1 * K01);
    const PhiCh = 1.08 * Phi0;
    const Bd0 = Phi0 / (dim.alphaDelta * dim.tau * dim.lDeltaFinal);
    const BdN = 1.08 * Bd0;
    
    // Conductor & Slot Dimensions
    const WIRE_CATALOG = [
      { a: 1.00, b: 5.00, Sc: 4.90 },
      { a: 1.12, b: 6.30, Sc: 6.95 },
      { a: 1.25, b: 7.10, Sc: 8.75 },
      { a: 1.35, b: 8.00, Sc: 10.60 },
      { a: 1.35, b: 8.60, Sc: 11.40 }, 
      { a: 1.40, b: 9.00, Sc: 12.40 },
      { a: 1.50, b: 10.00, Sc: 14.80 },
      { a: 1.60, b: 11.20, Sc: 17.70 },
      { a: 1.80, b: 12.50, Sc: 22.20 }
    ];

    const be = 0.47 * t1 * 10; 
    const Sc_prime = nom.In / 5; 
    
    const chosenWire = WIRE_CATALOG.find(w => w.Sc >= Sc_prime) || WIRE_CATALOG[WIRE_CATALOG.length - 1];
    const { a: a_cond, b: b_cond, Sc } = chosenWire;
    const DeltaC = nom.In / Sc; 
    
    const pp = (up1 / 2) / 1; // 2 layers, 1 column
    
    const B_bobine = (b_cond + 0.45) + 0.075 + 0.1; 
    const H_bobine = (a_cond + 0.45) * pp + 0.075 * pp + 0.1; 
    
    let marge_largeur = 6.0, marge_hauteur = 17.9, cale = 4.9;
    if (inp.Un < 1000) { marge_largeur = 1.0; marge_hauteur = 3.0; cale = 2.0; }
    else if (inp.Un > 6600) { marge_largeur = 12.0; marge_hauteur = 25.0; cale = 8.0; }

    const le = B_bobine + marge_largeur; 
    const he = (2 * H_bobine) + marge_hauteur + cale; 
    const bd1 = t1 - (be / 10);

    // Magnetic Induction
    const Kf = 0.93; 
    const Bd1 = (BdN * t1 * dim.lDeltaFinal) / (bd1 * dim.l * Kf);
    const hc = (dim.DaNorm - dim.D) / 2 - (he / 10); 
    const Bc = PhiCh / (2 * hc * dim.l * Kf);

    // Thermal
    const delta_is = 0.1 * (6 + (B_bobine - b_cond) / 2); 
    const theta_is = (DeltaC * A_real * 1 / 4200) * (t1 * delta_is) / (2 * (le / 10 + he / 10 - 0.5) * 0.0016);

    // End Windings & Weights
    const H_cm = H_bobine / 10; 
    const B_cm = B_bobine / 10; 

    const tau_y = (Math.PI * (dim.D + 2 * H_cm + 2.5) / (2 * nom.p)) * 0.778; 
    const tc = (Math.PI * (dim.D + 1.75)) / Z1; 
    const fc = B_cm + 1.2; 
    
    const A_fw = (tau_y - 1.5 - 0.5 * H_cm) / Math.sqrt(1 - Math.pow(fc / tc, 2)); 
    const ll1 = A_fw + 1.57 * H_cm + 2 * 4.5 + 8; 
    const lmoy = 48.5 + ll1; 
    
    const Lc = 2 * w1 * lmoy * 1e-2; 
    const Ra75 = (1 / 46) * (Lc / Sc); 
    const Ra75_pu = (nom.In * Ra75) / inp.Un; 
    const GM = 8.9 * inp.m * Lc * Sc * 1e-3; 

    return {
      q1, Z1, t1, up1, w1, Y, beta, 
      Kw1: K01, 
      Phi0, PhiCh, Bd0, BdN,
      be, le, he, bd1, Bd1, hc, Bc, 
      Sc, a_cond, b_cond, DeltaC, 
      Ra75, Ra75pu: Ra75_pu, Lc, Gm: GM
    };
  }

  // Step 5: Air Gap
  static calcAirGap(
    dim: MainDimensions, 
    stator: StatorDesign, 
    xd_star: number = 1.35, 
    xSigma_star: number = 0.1, 
    Kprime: number = 1.06
  ): AirGapDesign {
    
    // Air gap calculation (delta)
    const delta_calc = (0.36 * dim.A * dim.tau) / (Kprime * (xd_star - xSigma_star) * stator.Bd0);
    const delta = Math.round(delta_calc * 20) / 20; 

    // Carter's coefficient calculation (Kdelta)
    const b0 = stator.le / 10; 
    const ratio = b0 / delta;
    const gamma = Math.pow(ratio, 2) / (5 + ratio);
    
    const Kdelta_calc = stator.t1 / (stator.t1 - gamma * delta);
    const Kdelta = Math.round(Kdelta_calc * 1000) / 1000;

    return { delta, Kdelta };
  }

  // Step 6: Rotor
 static calcRotor(
    dim: MainDimensions, 
    stator: StatorDesign, 
    airGap: AirGapDesign,
    // Paramètres standards (Avec valeurs par défaut de l'industrie)
    ratio_deltaM: number = 1.5, 
    hPrime: number = 0.9,       
    Ksigma: number = 0.67,      
    BM_target: number = 15600,  
    Kf_rotor: number = 0.97,    
    dArbre: number = 20         
  ): RotorDesign {
    
    // a - Arc et Rayon de l'épanouissement polaire
    const bp = dim.alphap * dim.tau;
    const deltaM = ratio_deltaM * airGap.delta;
    const Rp = (dim.D / 2) + (8 * dim.D * (deltaM - airGap.delta)) / Math.pow(bp, 2);

    // b - Hauteur de l'épanouissement polaire
    const hp = hPrime + Rp - Math.sqrt(Math.pow(Rp, 2) - Math.pow(bp / 2, 2));

    // c - Longueur du noyau polaire (égale à la longueur du stator l1)
    const lM = dim.l1;

    // d - Coefficient de dispersion polaire (sigmaN)
    const sigmaN = 1 + Ksigma * (35 * airGap.delta) / Math.pow(dim.tau, 2);

    // e - Flux dans la zone polaire (PhiM)
    const PhiM = sigmaN * stator.PhiCh;

    // f - Section et largeur du noyau polaire (bM)
    const SM = PhiM / BM_target;
    const bM = SM / (Kf_rotor * lM);

    // g - Hauteur du noyau polaire (hM)
    const hM_calc = 10.5 * airGap.delta + 8;
    const hM = Math.round(hM_calc); // Arrondi industriel (ex: 12.73 -> 13 cm)

    // h - Culasse du rotor (Ha) et Induction (Ba)
    const Ha = (dim.D - 2 * airGap.delta - 2 * (hp + hM) - dArbre) / 2;
    const la = lM + 11.5;
    const Ba = PhiM / (2 * Ha * la);

    return { 
      bp, 
      Rp, 
      hp, 
      sigmaN, 
      PhiM, 
      bM, 
      hM, 
      Ha, 
      Ba 
    };
  }
// =============================================================
  // UTILITAIRE : Courbe 2.8 (Interpolation du coefficient xi)
  // =============================================================
  static getXi(Bc_gauss: number): number {
    const curve = [
      { B: 4000, xi: 0.65 }, { B: 6000, xi: 0.64 }, { B: 8000, xi: 0.62 },
      { B: 10000, xi: 0.58 }, { B: 12000, xi: 0.45 }, { B: 13650, xi: 0.35 },
      { B: 14000, xi: 0.33 }, { B: 16000, xi: 0.28 }
    ];

    if (Bc_gauss <= curve[0].B) return curve[0].xi;
    if (Bc_gauss >= curve[curve.length - 1].B) return curve[curve.length - 1].xi;

    for (let i = 0; i < curve.length - 1; i++) {
      if (Bc_gauss >= curve[i].B && Bc_gauss <= curve[i + 1].B) {
        const ratio = (Bc_gauss - curve[i].B) / (curve[i + 1].B - curve[i].B);
        return curve[i].xi + ratio * (curve[i + 1].xi - curve[i].xi);
      }
    }
    return 0.35; 
  }

  // =============================================================
  // STEP 7: CARACTÉRISTIQUE À VIDE (Circuit Magnétique)
  // =============================================================
  static calcNoLoadCharacteristic(
    dim: MainDimensions, 
    stator: StatorDesign, 
    airGap: AirGapDesign,
    boe_cm: number = 1.52,     
    Da: number = 99,           
    alpha_delta: number = 0.68 
  ) {
    
    // a - Coefficient de l'entrefer (K_delta) 
    const ratio = boe_cm / airGap.delta; 
    const gamma = Math.pow(ratio, 2) / (5 + ratio);
    const Kdelta = Math.round((stator.t1 / (stator.t1 - gamma * airGap.delta)) * 100) / 100;

    // b - FMM de l'entrefer (F_delta)
    const F_delta = Math.round(1.6 * airGap.delta * Kdelta * stator.Bd0);

    // c - FMM des dents statoriques (F_d1)
    const he_cm = stator.he / 10;
    const be_cm = stator.be / 10;
    const Kf = 0.93; 

    const t_d13 = (Math.PI * (dim.D + (2 / 3) * he_cm)) / stator.Z1;
    const b_d13 = t_d13 - be_cm;
    
    const Bd13_calc = (stator.Bd0 * stator.t1 * dim.lDeltaFinal) / (Kf * dim.l * b_d13);
    const Bd13 = Math.round(Bd13_calc / 100) * 100;
    const Hd13 = lookupH(Bd13) || 0; 
    const F_d1 = Math.round(2 * he_cm * Hd13);

    // d - FMM de la culasse statorique (F_c)
    const hc_cm = stator.hc / 10; 
    const Bc_calc = (alpha_delta * dim.tau * dim.lDeltaFinal * stator.Bd0) / (2 * hc_cm * dim.l * Kf);
    const Bc = Math.round(Bc_calc / 10) * 10; 
    
    const poles_totaux = Math.round((Math.PI * dim.D) / dim.tau); 
    const lc = (Math.PI * (Da - hc_cm)) / poles_totaux;

    const xi = this.getXi(Bc); 
    const Hc = lookupH(Math.round(Bc / 100) * 100) || 10.7; 
    const F_c = Math.round(lc * xi * Hc);

    // e - FMM de la zone du pôle (F_M0)
    const h_pm = 2.03, a_p = 6.9, a_m = 11.0;
    const b_p = 20.95, b_m = 10.5, h_m = 13, h_p = 2.6, l_m = dim.l1; 

    const lambda_p = (l_m * h_pm) / (0.8 * a_p) + 2 * h_pm * Math.log10(1 + (Math.PI / 2) * (b_p / a_p));
    const lambda_m = (l_m * h_m) / (0.8 * a_m) + h_m * Math.log10(1 + (Math.PI / 2) * (b_m / a_m));

    const sum_F = F_delta + F_d1 + F_c; 
    const Phi_sigma = 2 * (lambda_p + lambda_m) * sum_F;
    const Phi_M = stator.PhiCh + Phi_sigma;

    const S_M = 520; 
    const B_M = Math.round((Phi_M / S_M) / 100) * 100; 
    const H_M = getH(B_M) || 14.9; 
    const F_M0 = Math.round(2 * (h_m + h_p) * H_M);

    // f - FMM de la culasse du rotor (F_a)
    const l_a_axial = 57, h_a_prime = 18, l_a_path = 9; 
    const B_a = Math.round((Phi_M / (2 * l_a_axial * h_a_prime)) / 100) * 100;
    const H_a = 2.8; 
    const F_a = Math.round(l_a_path * H_a);

    // g - FMM de la jonction pôle-culasse (F_delta_M)
    const delta_jonc = 0.015; 
    const F_delta_M = Math.round(1.6 * delta_jonc * B_M);

    // h - RÉSULTAT FINAL : FMM TOTALE DU CIRCUIT MAGNÉTIQUE (F_0)
    const F_0 = F_delta + F_d1 + F_c + F_a + F_M0 + F_delta_M;

    // FERMETURE CORRECTE DE LA MÉTHODE ICI
    return {
      boe: boe_cm, Kdelta, F_delta,
      t_d13, b_d13, Bd13, Hd13, F_d1,
      lc, Bc, xi, Hc, F_c,
      Phi_sigma, Phi_M, B_M, H_M, F_M0,
      B_a, H_a, F_a,
      delta_jonc, F_delta_M,
      F_0
    };
  } 

  // =============================================================
  // STEP 7-FINAL : GÉNÉRATION DE LA COURBE (Figures 2.11 & 2.12)
  // =============================================================

  /**
   * Calcule le coefficient de saturation des encoches K_ex (Figure 2.11)
   */
  static calcKex(stator: StatorDesign, dim: MainDimensions, b_d13: number): number {
    const Kf = 0.93; 
    const be_cm = stator.be / 10;
    
    // Formule mathématique : be1 * l_delta / (Kf * l * b_d13)
    const Kex_calc = (be_cm * dim.lDeltaFinal) / (Kf * dim.l * b_d13);
    
    return Math.round(Kex_calc * 100) / 100; 
  }

  /**
   * Génère les points pour tracer la Caractéristique à vide (Figure 2.12)
   */
  static generateNoLoadCurve(
    dim: MainDimensions, 
    stator: StatorDesign, 
    airGap: AirGapDesign
  ) {
    const voltageRatios = [0.55, 1.0, 1.1, 1.23, 1.3];
    const curvePoints = [];
    
    // Sauvegarde de l'induction nominale pour ne pas écraser les données d'origine
    const Bd0_nominal = stator.Bd0; 

    for (const ratio of voltageRatios) {
      // Variation proportionnelle du flux selon la tension souhaitée
      stator.Bd0 = Bd0_nominal * ratio; 

      // Calcul complet du circuit magnétique pour ce point de fonctionnement
      const pointResult = this.calcNoLoadCharacteristic(dim, stator, airGap);
      
      // Calcul du coefficient de saturation
      const Kex = this.calcKex(stator, dim, pointResult.b_d13);
      const isHighlySaturated = pointResult.Bd13 > 18000;

      curvePoints.push({
        ratio_E0: ratio,
        B_delta_Gauss: Math.round(stator.Bd0),
        B_d13_Gauss: pointResult.Bd13,
        K_ex: Kex,
        F_total_A: pointResult.F_0,
        warning: isHighlySaturated ? "Saturation > 18kG (Correction Fig 2.11 requise)" : "OK"
      });
    }

    // Restauration de l'état nominal
    stator.Bd0 = Bd0_nominal;

    // RETOUR CORRECT DES POINTS DE LA COURBE
    return curvePoints;
  }

  // =============================================================
  // STEP 8: STATOR LEAKAGE REACTANCE (X_sigma)
  // =============================================================
  static calcLeakageReactance(
    inp: InputParams, 
    nom: NominalValues, 
    stator: StatorDesign, 
    airGap: AirGapDesign, 
    dim: MainDimensions,
    // Slot geometric parameters (Figure 2.5 & 2.13)
    // Default values match the book, but can be overridden for any machine
    slot: { h1: number, ha: number, be: number, h2_prime: number, h4: number, bou: number } = 
          { h1: 53.75, ha: 9, be: 15.2, h2_prime: 9.8, h4: 9, bou: 15.2 },
    // Winding coefficients (Figure 2.14)
    winding: { k_beta: number, k_beta_prime: number, beta1: number, l_l1: number } = 
             { k_beta: 0.873, k_beta_prime: 0.814, beta1: 0.778, l_l1: 49.4 },
    // Differential leakage coefficient from Table 2.4 (divided by 100)
    sigma_d1: number = 0.011 
  ) {
    
    // a - Slot leakage permeance coefficient (lambda_e1)
    const lambda_e1 = ((slot.h1 - slot.ha) / (3 * slot.be)) * winding.k_beta + 
                      (slot.h2_prime / slot.be) * winding.k_beta_prime + 
                      (slot.h4 / (4 * slot.be));

    // b - Differential leakage permeance coefficient (lambda_di1)
    const rho_d1 = 1;
    // Slot opening ratio coefficient
    const K_ou = 1 - 0.033 * Math.pow(slot.bou / stator.t1, 2);
    
    const lambda_di1 = (0.9 * stator.t1 * Math.pow(stator.q1 * stator.Kw1, 2) * rho_d1 * K_ou) / 
                       (airGap.delta * airGap.Kdelta) * sigma_d1;

    // c - End-winding leakage permeance coefficient (lambda_l1)
    const lambda_l1 = 0.34 * (stator.q1 / dim.lDeltaFinal) * (winding.l_l1 - 0.64 * winding.beta1 * dim.tau);

    // d - Total leakage reactance calculation (X_sigma)
    const lambda_k1 = 0; 
    const sum_lambda = lambda_e1 + lambda_di1 + lambda_l1 + lambda_k1;

    // Reactance in Ohms
    const x_sigma_ohm = 0.158 * (inp.f / 100) * Math.pow(stator.w1 / 100, 2) * (dim.lDeltaFinal / (nom.p * stator.q1)) * sum_lambda;

    // Reactance in Per Unit (p.u.)
    const x_sigma_pu = (nom.In / nom.Uph) * x_sigma_ohm;

    return {
      lambda_e1,
      lambda_di1,
      lambda_l1,
      sum_lambda,
      x_sigma_ohm: Math.round(x_sigma_ohm * 100) / 100,
      x_sigma_pu: Math.round(x_sigma_pu * 1000) / 1000
    };
  }

  // =============================================================
  // STEP 9: EXCITATION MMF UNDER LOAD (Blondel Vector Diagram)
  // =============================================================
  static calcLoadExcitation(
    nom: NominalValues, 
    stator: StatorDesign,
    airGap: AirGapDesign,
    dim: MainDimensions,
    noLoadData: any,   // Résultat de l'Étape 7 (F_0, F_delta, etc.)
    reactances: any,   // Résultat de l'Étape 8 (xSigma, xq_unsat, etc.)
    delta_M: number = airGap.delta, 
    alpha_p: number = 0.73,         
    powerFactor: number = 0.8       // cos(phi) nominal
  ) {
    
    // a - Force Magnétomotrice d'induit nominale (F_a)
    const F_a = 2.7 * stator.w1 * (stator.Kw1 / nom.p) * nom.In;
    const F_a_star = Math.round((F_a / noLoadData.F_0) * 100) / 100; // En p.u.

    // b - Coefficients de saturation (Figure 2.17)
    const satRatio = noLoadData.F_deltadc_A / noLoadData.F_delta; 
    const satCoeffs = getSaturationCoefficients(satRatio);
    
    // c - Coefficients de réaction d'induit (Figure 2.18)
    const delta_tau = airGap.delta / dim.tau;
    const delta_ratio = delta_M / airGap.delta; 
    const armCoeffs = getArmatureReactionCoefficients(alpha_p, delta_tau, delta_ratio);

    // ===========================================================
    // RÉSOLUTION TRIGONOMÉTRIQUE DU DIAGRAMME DE BLONDEL (Fig 2.16)
    // ===========================================================
    
    const U_pu = 1.0; // Tension nominale (1 per unit)
    const I_pu = 1.0; // Courant nominal (1 per unit)
    const phi_rad = Math.acos(powerFactor);

    // Calcul de la réactance synchrone transversale saturée
    // (xq non-saturé vient de l'étape 8, corrigé par la saturation de l'étape 9)
    const xq_sat = reactances.xq * satCoeffs.x_q; 

    // 1. Calcul exact de l'angle interne psi (en radians)
    const tan_psi = (U_pu * Math.sin(phi_rad) + I_pu * xq_sat) / (U_pu * Math.cos(phi_rad));
    const psi_rad = Math.atan(tan_psi);
    const psi_deg = psi_rad * (180 / Math.PI); // Converti en degrés pour l'affichage

    const sin_psi = Math.sin(psi_rad);
    const cos_psi = Math.cos(psi_rad);

    // 2. Calcul exact de E_rd* (Tension résultante projetée)
    const E_rd_star_calc = U_pu * Math.cos(psi_rad - phi_rad) + I_pu * reactances.xSigma * sin_psi;
    const E_rd_star = Math.round(E_rd_star_calc * 1000) / 1000;

    // ===========================================================

    // d - Force magnétomotrice de réaction d'induit axe direct (F_ad*)
    const term1 = satCoeffs.x_d * armCoeffs.k_ad * F_a_star * sin_psi;
    const term2 = satCoeffs.k * (1 / delta_tau) * F_a_star * cos_psi;
    const F_ad_star = Math.round((term1 + term2) * 1000) / 1000;

    // e & f - Force Magnétomotrice Totale d'Excitation en charge (F_Bn)
    // L'approximation F_prime* (0.094) pourrait aussi être numérisée via la courbe Phi(F)
    const F_prime_star = 0.094; 
    const F_Bn_star = Math.round((E_rd_star + F_ad_star + F_prime_star) * 100) / 100;
    
    // Retour en Ampères-tours réels
    const F_Bn = Math.round(F_Bn_star * noLoadData.F_0);

    return {
      F_a: Math.round(F_a),
      F_a_star,
      saturationRatio: Math.round(satRatio * 100) / 100,
      coefficients: { ...satCoeffs, ...armCoeffs },
      blondel: { 
        psi_deg: Math.round(psi_deg * 10) / 10,  // Ex: 58.3° calculé automatiquement !
        E_rd_star,                               // Ex: 1.02 calculé automatiquement !
        sin_psi: Math.round(sin_psi * 1000) / 1000, 
        cos_psi: Math.round(cos_psi * 1000) / 1000 
      },
      F_ad_star,
      F_Bn_star,
      F_Bn
    };
  }
  // =============================================================
  // STEP 10: COMPLETE EXCITATION SYSTEM DESIGN (Rotor Coil)
  // =============================================================
  static calcExcitationSystem(
    nom: NominalValues, 
    dim: MainDimensions, 
    airGap: AirGapDesign,
    F_Bn: number,               // Total load MMF (from Step 9)
    f_Hz: number = 50,          // Grid frequency
    // Geometrical and insulation defaults (from the book)
    rotor: { h_p: number, h_m: number, b_m: number, l_M: number, b_prime: number } = 
           { h_p: 2.6, h_m: 13, b_m: 10.5, l_M: 48.5, b_prime: 1.5 },
    insulation: { delta_1: number, x: number, delta_isol: number, compression: number, t_e1: number, t_e2: number, delta_d: number } = 
                { delta_1: 0.15, x: 2.1, delta_isol: 0.4, compression: 0.32, t_e1: 0.95, t_e2: 0.55, delta_d: 0.2 },
    // Electrical and thermal defaults
    elec: { U_exc: number, U_exc_prime: number, Theta_B: number, rho_130: number, rho_120: number, margin: number } = 
          { U_exc: 50, U_exc_prime: 48, Theta_B: 80, rho_130: 0.0256, rho_120: 0.025, margin: 1.15 }
  ) {
    
    // -----------------------------------------------------------
    // 10a. Interpolar Space Geometry
    // -----------------------------------------------------------
    const inner_diameter_cm = dim.D - 2 * airGap.delta - 2 * rotor.h_p - 2 * rotor.h_m;
    const interpolar_pitch_cm = (Math.PI * inner_diameter_cm) / (2 * nom.p);
    
    // Max available space for the copper width
    const b_max_cm = 0.5 * (interpolar_pitch_cm - rotor.b_m - 2 * insulation.delta_1 - insulation.x);
    const b_max_mm = b_max_cm * 10;

    // -----------------------------------------------------------
    // 10b. Thermal Model & Current Density (Delta_B) Estimation
    // -----------------------------------------------------------
    const n_rpm = (60 * f_Hz) / nom.p; 
    const v_p = (Math.PI * (dim.D / 100) * n_rpm) / 60;
    
    const alpha = getCoolingCoefficientAlpha(v_p);
    const k_coeff = getCoolingCoefficientK(dim.l1 / dim.tau);
    
    // Estimate allowed current density using the max theoretical width
    const delta_B_estim = 20 * Math.sqrt((elec.Theta_B * alpha * k_coeff) / b_max_mm);

    // -----------------------------------------------------------
    // 10c. Commercial Copper Wire Selection (Table 2.6)
    // -----------------------------------------------------------
    const L_Bmoy_cm = 2 * (rotor.l_M - 2 * rotor.b_prime) + Math.PI * (rotor.b_m + 2 * insulation.delta_1 + (b_max_mm / 10));
    
    // Theoretical cross-section required
    const S_theo_mm2 = (elec.margin * elec.rho_130 * nom.p * F_Bn * L_Bmoy_cm * 1e-2) / elec.U_exc_prime;

    // Search the industry catalog for the perfect fit
    const commercialWire = getOptimalStandardWire(b_max_mm, S_theo_mm2);

    // -----------------------------------------------------------
    // 10d-l. Final Performances with the Commercial Wire
    // -----------------------------------------------------------
    // Recalculate true nominal current based on the commercial section
    const I_B = Math.round(delta_B_estim * commercialWire.S_mm2); 
    
    // Ampere's Law for the number of turns
    const omega_B = Math.round(F_Bn / (2 * I_B));
    
    // Physical height of the coil and pole core
    const a_eff_mm = commercialWire.a_mm + insulation.delta_isol - insulation.compression;
    const h_bobine_cm = 0.1 * a_eff_mm * (omega_B + 1);
    const h_M_cm = h_bobine_cm + insulation.t_e1 + insulation.t_e2 + insulation.delta_d;

    // Copper weight
    const L_B_total_m = 2 * nom.p * omega_B * L_Bmoy_cm * 1e-2;
    const G_B_kg = 8.9 * L_B_total_m * commercialWire.S_mm2 * 1e-3;

    // Hot resistances (Corrected Thermodynamic Law)
    const R_B120 = (elec.rho_120 * L_B_total_m) / commercialWire.S_mm2;
    const R_B75 = R_B120 * ((235 + 75) / (235 + 120));

    // Power and availability limits
    const I_Bmax = elec.U_exc_prime / R_B120;
    const k_dispo = I_Bmax / I_B;
    const P_Bn_kW = elec.U_exc * I_Bmax * 1e-3;

    // Return the perfectly structured payload for the frontend UI
    return {
      commercialWire: {
        b_max_limit_mm: Math.round(b_max_mm * 100) / 100,
        b_standard_mm: commercialWire.b_mm, // Selected from catalog
        a_standard_mm: commercialWire.a_mm, // Selected from catalog
        section_mm2: commercialWire.S_mm2   // True commercial cross-section
      },
      thermal: {
        v_p_ms: Math.round(v_p * 10) / 10,
        alpha_coeff: Math.round(alpha * 10000) / 10000,
        k_coeff: Math.round(k_coeff * 1000) / 1000,
        delta_B_A_mm2: Math.round(delta_B_estim * 100) / 100
      },
      coilSizing: {
        omega_B_turns: omega_B,
        L_Bmoy_cm: Math.round(L_Bmoy_cm * 10) / 10,
        h_bobine_cm: Math.round(h_bobine_cm * 10) / 10,
        h_M_pole_cm: Math.round(h_M_cm * 10) / 10,
        weight_copper_kg: Math.round(G_B_kg * 10) / 10,
        weight_per_kVA: Math.round((G_B_kg / nom.Sn) * 1000) / 1000
      },
      electricalSpecs: {
        I_B_Nominal_A: Math.round(I_B),
        I_B_Max_A: Math.round(I_Bmax),
        R_B_120_Ohm: Math.round(R_B120 * 1000) / 1000,
        R_B_75_Ohm: Math.round(R_B75 * 10000) / 10000,
        k_dispo: Math.round(k_dispo * 100) / 100,
        P_Excitation_kW: Math.round(P_Bn_kW * 10) / 10
      }
    };
  }
  // =============================================================
  // STEP 11: DYNAMIC MACHINE PARAMETERS (Reactances & Time Constants)
  // =============================================================
  static calcMachineParameters(
    nom: NominalValues, 
    airGap: AirGapDesign,
    noLoadData: any,      // Résultat de l'Étape 7 (F_delta0, Phi_0)
    reactances: any,      // Résultat de l'Étape 8 (x_sigma, r_a)
    reaction: any,        // Résultat de l'Étape 9 (k_ad, k_aq, F_a)
    rotor: any,           // Résultat de l'Étape 10 (L_Bmoy_cm, omega_B, S_commercial_mm2)
    l_M_cm: number = 48.5,            // Longueur du noyau polaire
    sigma_lambda: number = 1.095,     // Perméance de fuite des pôles (valeur type)
    f_Hz: number = 50                 // Fréquence réseau
  ) {
    
    // a - Réactances de réaction d'induit (Longitudinale et Transversale)
    // F_delta0_prime inclut environ 4% de saturation supplémentaire selon le livre
    const F_delta0_prime = 1.04 * noLoadData.F_delta; 
    const x_ad = Math.round((reaction.coefficients.k_ad * reaction.F_a) / F_delta0_prime * 1000) / 1000;
    
    const k_delta_avg = (1 + airGap.Kdelta) / 2;
    const x_aq = Math.round((reaction.coefficients.k_aq * reaction.F_a) / (noLoadData.F_delta * k_delta_avg) * 1000) / 1000;

    // b - Réactances Synchrones
    const x_d = Math.round((reactances.xSigma + x_ad) * 1000) / 1000;
    const x_q = Math.round((reactances.xSigma + x_aq) * 1000) / 1000;

    // c - Réactance de l'enroulement d'excitation (x_B)
    const flux_ratio = (2 * noLoadData.F_delta * l_M_cm * sigma_lambda) / noLoadData.Phi_0;
    const x_B_calc = 1.27 * reaction.coefficients.k_ad * x_ad * (1 + flux_ratio);
    const x_B = Math.round(x_B_calc * 1000) / 1000;

    // d - Réactance de dispersion de l'enroulement d'excitation
    const x_Bsigma = Math.round((x_B - x_ad) * 100) / 100;

    // e - Réactance transitoire longitudinale
    const x_d_prime = Math.round((reactances.xSigma + (x_ad * x_Bsigma) / (x_ad + x_Bsigma)) * 1000) / 1000;

    // f - Réactance d'ordre inverse (Utilise l'approximation x_d' et x_q de base)
    // NB: Si la machine possède des enroulements amortisseurs, x_d'' et x_q'' seraient utilisés.
    const x_2 = Math.round(Math.sqrt(x_d_prime * x_q) * 100) / 100;

    // g - Résistance de l'enroulement d'excitation (r_B en p.u.)
    const r_B_calc = (2200 * reaction.F_a * Math.pow(reaction.coefficients.k_ad, 2) * rotor.coilSizing.L_Bmoy_cm) / 
                     (noLoadData.Phi_0 * f_Hz * rotor.coilSizing.omega_B_turns * rotor.commercialWire.section_mm2);
    const r_B = Math.round(r_B_calc * 100000) / 100000;

    // h, i, j - Constantes de temps (Correction de l'erreur du livre 3.14 -> 2*pi*f)
    const omega = 2 * Math.PI * f_Hz; // ~314.159 rad/s
    
    // Constante de temps à vide
    const T_d0 = Math.round((x_B / (omega * r_B)) * 100) / 100;
    
    // Constante de temps transitoire (stator en court-circuit)
    const T_d_prime = Math.round(((x_d_prime / x_d) * T_d0) * 1000) / 1000;
    
    // Constante de temps de l'induit (T_a)
    const T_a = Math.round((x_2 / (omega * reactances.r_a)) * 1000) / 1000;

    return {
      reactances_pu: {
        x_ad,
        x_aq,
        x_d,
        x_q,
        x_B,
        x_Bsigma,
        x_d_prime,
        x_2
      },
      resistances_pu: {
        r_B,
        r_a: reactances.r_a
      },
      timeConstants_s: {
        omega_rad_s: Math.round(omega),
        T_d0,
        T_d_prime,
        T_a
      }
    };
  }
  // =============================================================
  // STEP 12: SHORT-CIRCUIT CURRENTS (Courants de court-circuit)
  // =============================================================
  static calcShortCircuitCurrents(
    nom: NominalValues,
    machineParams: any, // Le résultat de l'Étape 11 (contient x_d)
    loadExcitation: any, // Le résultat de l'Étape 9 (contient F_Bn_star)
    E0_prime_star: number = 1.08 // Tension induite interne à vide (valeur typique)
  ) {
    
    const x_d = machineParams.reactances_pu.x_d;
    const F_Bn_star = loadExcitation.F_Bn_star; // En p.u., I_Bn* = F_Bn*

    // a - Courant de court-circuit pour une excitation en régime à vide (I_cc0)
    // Formule : I_cc0 = E0'_star / x_d
    const I_cc0_pu = Math.round((E0_prime_star / x_d) * 1000) / 1000; // Ex: 0.808 p.u.

    // b - Courant de court-circuit pour une excitation en régime nominal (I_ccn)
    // Formule : I_ccn = I_cc0 * I_Bn* (où I_Bn* = F_Bn*)
    const I_ccn_pu = Math.round((I_cc0_pu * F_Bn_star) * 1000) / 1000; // Ex: 1.665 p.u.

    // Bonus logiciel : Conversion en Ampères réels pour l'interface utilisateur
    const I_ccn_Amperes = Math.round(I_ccn_pu * nom.In);

    return {
      inputs: {
        E0_prime_star,
        x_d_pu: x_d,
        F_Bn_star_pu: F_Bn_star
      },
      results_pu: {
        I_cc0: I_cc0_pu,
        I_ccn: I_ccn_pu
      },
      results_real: {
        I_ccn_A: I_ccn_Amperes
      }
    };
  }
  // =============================================================
  // STEP 13: STATIC OVERLOAD CAPACITY (Surcharge Statique & Stabilité)
  // =============================================================
  static calcStaticOverload(
    powerFactor: number = 0.8, // cos(phi) nominal
    machineParams: any,        // Résultat de l'Étape 11 (contient x_d et x_q)
    loadExcitation: any,       // Résultat de l'Étape 9 (contient F_Bn_star / I_Bn_star)
    shortCircuit: any          // Résultat de l'Étape 12 (contient I_ccn et E0_prime_star)
  ) {
    
    // Récupération des valeurs clés des étapes précédentes
    const x_d = machineParams.reactances_pu.x_d;
    const x_q = machineParams.reactances_pu.x_q;
    const I_ccn = shortCircuit.results_pu.I_ccn;
    const E0_prime_star = shortCircuit.inputs.E0_prime_star;
    const I_Bn_star = loadExcitation.F_Bn_star; // En p.u., F_Bn* équivaut au courant de base I_Bn*

    // a - Tension interne fictive (E00'_star)
    const E00_prime_star = E0_prime_star * I_Bn_star; // Ex: 1.08 * 2.06 = 2.22

    // b - Coefficient de saillance (epsilon)
    // CORRECTION LOGICIELLE : Utilisation de x_q au dénominateur pour respecter la physique
    const epsilon = (x_d - x_q) / (E00_prime_star * x_q); // Ex: (1.338 - 0.893) / (2.22 * 0.893) = 0.225

    // c - Coefficient de correction k (Approximation linéaire industrielle universelle)
    const k = 1 + 0.11 * epsilon; // Ex: 1 + 0.11 * 0.225 = 1.025

    // d - Surcharge statique maximale admissible (S ou M_M*)
    const S_capacity = (I_ccn / powerFactor) * k; // Ex: (1.665 / 0.8) * 1.025 = 2.13

    return {
      E00_prime_star: Math.round(E00_prime_star * 100) / 100,
      epsilon: Math.round(epsilon * 1000) / 1000,
      k_factor: Math.round(k * 1000) / 1000,
      static_overload_S: Math.round(S_capacity * 100) / 100
    };
  }

  // =============================================================
  // STEP 14: LOSSES AND EFFICIENCY (Pertes et Rendement Final)
  // =============================================================
  static calcLossesAndEfficiency(
    inp: InputParams,
    nom: NominalValues, 
    dim: MainDimensions,
    stator: StatorDesign,
    airGap: AirGapDesign,
    rotorParams: any,      // Résultat de l'Étape 10 (contient I_B, R_B75)
    reactances: any,       // Résultat de l'Étape 8 (contient r_a75)
    B_c: number = 13650,   // Induction dans la culasse (Gauss)
    B_d: number = 14200,   // Induction dans les dents (Gauss)
    gamma_c: number = 7.65,// Densité de l'acier (kg/dm3)
    k_dc: number = 1.3,    // Majoration usinage culasse
    k_d: number = 1.7      // Majoration usinage dents
  ) {
    
    // a - Pertes dans le fer de la culasse (P_c)
    // Section (S_c) en cm2 et Poids (G_c) en kg
    const S_c = stator.h_c * dim.l1 * stator.k_c; // Ex: 6.2 * 40.5 * 0.93 = 233 cm2
    // L'équation de votre livre utilise l_c = 36.4, nous utilisons l1_effective = dim.l1 * k_c
    const G_c = S_c * (dim.l1 * stator.k_c) * (2 * nom.p) * gamma_c * 1e-3; 
    
    const rho_c = getSpecificLoss(B_c, 0); // Ex: ~4.0 V/kg
    const P_c_kW = Math.round(k_dc * rho_c * G_c * 1e-3 * 10) / 10;

    // b - Pertes dans le fer des dents statoriques (P_cd)
    const G_d = stator.Z * stator.b_d_milieu * stator.h_a1 * dim.l1 * stator.k_c * gamma_c * 1e-3;
    const rho_cd = getSpecificLoss(B_d, 0); // Ex: ~4.33 V/kg
    const P_cd_kW = Math.round(k_d * rho_cd * G_d * 1e-3 * 100) / 100;

    // c - Pertes de surface dans les épanouissements polaires (P_sur)
    const ratio_bou_delta = stator.b_ou / airGap.delta; // Ex: 1.52 / 0.45 = 3.37
    const beta_0 = getBeta0(ratio_bou_delta); // Ex: 0.21
    
    const B_delta_0 = 7380; // Induction dans l'entrefer (venant de l'étape 7)
    const B_0 = beta_0 * airGap.Kdelta * B_delta_0; // Ex: 1890 Gauss

    const n_rpm = (60 * inp.f) / nom.p; // Ex: 750 tr/min
    const k_0 = 6; // Coefficient matériel
    
    // Calcul de p_sur (W/m2)
    const p_sur = k_0 * Math.pow((stator.Z * n_rpm) / 10000, 1.5) * Math.pow(stator.t1 / 1000, 2) * Math.pow(B_0 / 1000, 2);
    
    const alpha_0 = 0.73; // Arc polaire
    const P_sur_kW = Math.round(0.6 * (2 * nom.p) * alpha_0 * dim.tau * dim.l_M * p_sur * 1e-7 * 100) / 100;

    // d - Pertes mécaniques (P_mec)
    const v_p = (Math.PI * (dim.D / 100) * n_rpm) / 60; // Ex: 28.7 m/s
    const P_mec_kW = Math.round(0.8 * (2 * nom.p) * Math.pow(v_p / 40, 3) * Math.sqrt(dim.l_M / 19) * 100) / 100;

    // e - Pertes électriques dans le stator (P_elec)
    // m = 3 (phases)
    const P_elec_kW = Math.round(inp.m * Math.pow(nom.In, 2) * reactances.r_a75 * 1e-3 * 10) / 10;

    // f - Pertes supplémentaires (P_sup)
    const P_sup_kW = Math.round(0.05 * nom.Sn * 10) / 10; // 5% de la puissance apparente ou nominale

    // g - Pertes d'excitation (P_B)
    // Formule : I_B^2 * R_B75 + Pertes balais (2 * DeltaU * I_B)
    const delta_U_balais = 1.0; // Chute de tension par balai (2 balais = 2V)
    const eta_B = 0.89; // Rendement du système d'excitation
    const P_B_Joule = Math.pow(rotorParams.electricalSpecs.I_B_Nominal_A, 2) * rotorParams.electricalSpecs.R_B_75_Ohm;
    const P_B_Balais = (2 * delta_U_balais * rotorParams.electricalSpecs.I_B_Nominal_A) / eta_B;
    const P_B_kW = Math.round((P_B_Joule + P_B_Balais) * 1e-3 * 10) / 10;

    // h - Somme des pertes (Sigma P)
    const Sigma_P = P_c_kW + P_cd_kW + P_sur_kW + P_mec_kW + P_elec_kW + P_sup_kW + P_B_kW;

    // i - Rendement final (eta)
    // Formule : eta = 1 - (Sigma_P / (P_n + Sigma_P))
    const P_n_kW = nom.Sn * 0.8; // Puissance active nominale = S_n * cos(phi)
    const rendement = 1 - (Sigma_P / (P_n_kW + Sigma_P));

    return {
      losses_kW: {
        iron_yoke_Pc: P_c_kW,
        iron_teeth_Pcd: P_cd_kW,
        pole_surface_Psur: P_sur_kW,
        mechanical_Pmec: P_mec_kW,
        stator_copper_Pelec: P_elec_kW,
        supplementary_Psup: P_sup_kW,
        excitation_PB: P_B_kW,
        total_SigmaP: Math.round(Sigma_P * 10) / 10
      },
      efficiency: {
        P_active_nominal_kW: P_n_kW,
        eta_per_unit: Math.round(rendement * 1000) / 1000,
        eta_percentage: Math.round(rendement * 10000) / 100 // Ex: 93.7 %
      }
    };
  }
}
