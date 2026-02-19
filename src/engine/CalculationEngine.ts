import type {
  InputParams, NominalValues, MainDimensions, StatorDesign,
  AirGapDesign, RotorDesign, Reactances, ExcitationSystem, LossesAndEfficiency
} from '@/types/machine';
import {
  NORMALIZED_DIAMETERS_MM, DA_D_RATIOS,
  BH_CURVE_E31_STATOR, BH_CURVE_ROTOR, SPECIFIC_LOSSES_E11,
  interpolateCurve
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
    // Empirical: D (cm) ≈ k * S'^0.25 adjusted by pole count
    const kD: Record<number, number> = { 2: 18, 4: 22, 6: 25, 8: 28, 10: 30, 12: 32, 16: 36 };
    const k = kD[twoP] || 28;
    let D_approx = k * Math.pow(Sprime, 0.25);
    
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
    const A = 425;    // A/cm - charge linéique
    const Bdn = 8200; // Gauss
    const alphap = 0.73;
    const alphaDelta = 0.68;
    const KB = 1.09;
    const K01 = 0.91;
    
    // Stator length
    const lPrimeDelta = (6.1e11 * Sprime) / (alphaDelta * KB * K01 * A * Bdn * D * D * inp.nn);
    
    const lt = 1.08;
    const lDelta = lt * lPrimeDelta;
    
    const nv = 8;
    const bv = 1;
    const lpaq = 4.5;
    const l = lpaq * (1 + nv);
    const l1 = l + nv * bv;
    const lDeltaFinal = l1 - 0.5 * nv * bv;
    const lambda = lDeltaFinal / tau;
    
    return {
      KE, Sprime, D, Da, DaNorm, tau, A, Bdn, alphap, alphaDelta, KB, K01,
      lPrimeDelta, lDelta, nv, bv, lpaq, l, l1, lDeltaFinal, lambda
    };
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
    
    let up1 = Math.round((dim.A * t1) / nom.In);
    if (up1 < 1) up1 = 1;
    
    const w1 = nom.p * q1 * up1;
    const Y = Math.round(Z1 / (2 * nom.p) * 0.778);
    const tauSlots = Z1 / (2 * nom.p);
    const beta = Y / tauSlots;
    const Kw1 = 0.902; // typical winding factor
    
    const Phi0 = (4 * 1.0 * nom.Uph * 1e8) / (0.09 * inp.f * w1 * Kw1);
    const PhiCh = 1.08 * Phi0;
    
    const Bd0 = Phi0 / (dim.alphaDelta * dim.tau * dim.lDeltaFinal);
    const BdN = 1.08 * Bd0;
    
    const be = 0.47 * t1 * 10; // mm
    const Sc = nom.In / 5; // 5 A/mm² density
    const DeltaC = nom.In / Sc;
    
    const he = 68; // mm, typical from PDF
    const bd1 = t1 - be / 10;
    const Kf = 0.93;
    const Bd1 = (BdN * t1 * dim.lDeltaFinal) / (bd1 * dim.l * Kf);
    
    const hc = (dim.DaNorm - dim.D - he / 10) / 2;
    const Bc = PhiCh / (2 * hc * dim.l * Kf);
    
    const lmoy = dim.l1 + 49.4; // approximate
    const Lc = 2 * w1 * lmoy * 1e-2;
    const Ra75 = (1 / 46) * (Lc / Sc);
    const Ra75pu = (nom.In * Ra75) / nom.Uph;
    const Gm = 8.9 * inp.m * Lc * Sc * 1e-3;
    
    return {
      q1, Z1, t1, up1, w1, Y, beta, Kw1, Phi0, PhiCh, Bd0, BdN,
      be, he, bd1, Bd1, hc, Bc, Sc, DeltaC, Ra75, Ra75pu, Lc, Gm
    };
  }

  // Step 5: Air gap
  static calcAirGap(dim: MainDimensions, nom: NominalValues, stator: StatorDesign): AirGapDesign {
    const xd_star = 1.35;
    const xSigma_star = 0.1;
    const Kprime = 1.06;
    const delta = (0.36 * dim.A * dim.tau) / (Kprime * (xd_star - xSigma_star) * stator.Bd0);
    const Kdelta = 1.22; // from Carter coefficient curve
    return { delta: Math.round(delta * 100) / 100, Kdelta };
  }

  // Step 6: Rotor
  static calcRotor(inp: InputParams, nom: NominalValues, dim: MainDimensions, stator: StatorDesign, airGap: AirGapDesign): RotorDesign {
    const bp = dim.alphap * dim.tau;
    const deltaM = 1.5 * airGap.delta;
    const Rp = (dim.D / 2) + (8 * dim.D * (deltaM - airGap.delta)) / (bp * bp);
    const hPrime = 0.9;
    const hp = hPrime + Rp - Math.sqrt(Rp * Rp - (bp / 2) * (bp / 2));
    
    const Ksigma = 0.67;
    const sigmaN = 1 + Ksigma * (35 * airGap.delta) / (dim.tau * dim.tau);
    
    const PhiN = stator.PhiCh;
    const PhiM = sigmaN * PhiN;
    
    const BM = 15600; // target Gauss
    const SM = PhiM / BM;
    const bM = SM / (0.97 * dim.l1);
    
    const hM = 10.5 * airGap.delta + 8;
    
    const dArbre = 20; // cm
    const Ha = dim.D - 2 * airGap.delta - 2 * (hp + hM) - dArbre;
    
    const la = dim.l1 + 11.5;
    const Ba = (2 * PhiM) / (Ha * la);
    
    return { bp, Rp, hp, sigmaN, PhiM, bM, hM, Ha, Ba };
  }

  // Step 7: Reactances
  static calcReactances(inp: InputParams, nom: NominalValues, stator: StatorDesign, airGap: AirGapDesign, dim: MainDimensions): Reactances {
    // Leakage reactance
    const lambdaE1 = 1.528; // from PDF
    const lambdaDi1 = 0.36;
    const lambdaL1 = 0.81;
    const sumLambda = lambdaE1 + lambdaDi1 + lambdaL1;
    
    const xSigmaOhm = 0.158 * (inp.f / 100) * Math.pow(stator.w1 / 100, 2) * (dim.lDeltaFinal / (nom.p * stator.q1)) * sumLambda;
    const xSigma = (nom.In * xSigmaOhm) / nom.Uph;
    
    const Fa = 2.7 * stator.w1 * stator.Kw1 * nom.In;
    const Fdelta0 = 1.6 * airGap.delta * airGap.Kdelta * stator.Bd0;
    
    const kad = 0.83;
    const kaq = 0.46;
    
    const xad = (kad * Fa) / (1.04 * Fdelta0);
    const xaq = (kaq * Fa * (1 + airGap.Kdelta)) / (Fdelta0 * 2);
    
    const xd = xSigma + xad;
    const xq = xSigma + xaq;
    
    const xBSigma = 0.21;
    const xPrimeD = xSigma + (xad * xBSigma) / (xad + xBSigma);
    const x2 = Math.sqrt(xPrimeD * xq);
    
    return { xSigma, xad, xaq, xd, xq, xPrimeD, x2 };
  }

  // Step 8: Excitation
  static calcExcitation(inp: InputParams, nom: NominalValues, stator: StatorDesign, airGap: AirGapDesign, rotor: RotorDesign, dim: MainDimensions, react: Reactances): ExcitationSystem {
    const Uexc = 50;
    const Uprime = 48;
    
    const Fa = 2.7 * stator.w1 * stator.Kw1 * nom.In;
    const Fdelta0 = 1.6 * airGap.delta * airGap.Kdelta * stator.Bd0;
    
    const Fbn = 2.06 * Fdelta0; // from Blondel diagram
    
    // Conductor dimensions
    const delta1 = 0.15;
    const x = 2.1;
    const bCond = (5 * (Math.PI * (dim.D - 2 * airGap.delta - 2 * rotor.hp - 2 * rotor.hM) / (2 * nom.p) - rotor.bM - 2 * delta1 - x)) / 10;
    
    const lBmoy = 2 * (dim.l1 - 2 * 1.5) + Math.PI * (rotor.bM + 2 * delta1 + 2 * 0.15);
    
    const rhoT = 0.0256;
    const SBprime = (1.15 * rhoT * 2 * nom.p * Fbn * lBmoy * 1e-2) / Uprime;
    const SB = 50.7; // from standardized conductor table
    
    const wB = 31; // turns per pole
    const DeltaB = 5.12;
    const ThetaB = 80;
    const IB = DeltaB * SB;
    
    const LB = 2 * nom.p * 2 * wB * lBmoy * 1e-2;
    const rB = rhoT * LB / SB;
    
    const IBmax = Uprime / rB;
    const PBn = Uexc * IBmax * 1e-3;
    const GB = 8.9 * LB * SB * 1e-3;
    
    return { Uexc, Fbn, IB, DeltaB, ThetaB, wB, SB, rB, PBn, GB };
  }

  // Step 9: Losses & Efficiency
  static calcLosses(inp: InputParams, nom: NominalValues, stator: StatorDesign, dim: MainDimensions, airGap: AirGapDesign, rotor: RotorDesign, excit: ExcitationSystem): LossesAndEfficiency {
    // Iron losses - yoke
    const Kdc = 1.3;
    const rhoC = interpolateCurve(SPECIFIC_LOSSES_E11, stator.Bc);
    const Sc_section = stator.hc * dim.l * 0.93;
    const lc = (Math.PI * (dim.DaNorm - stator.hc)) / (2 * nom.p);
    const Gc = Sc_section * lc * 2 * nom.p * 7.65 * 1e-3;
    const Pc = Kdc * rhoC * Gc * 1e-3;
    
    // Iron losses - teeth
    const Kd = 1.7;
    const Bd_mid = stator.Bd1 * 0.78;
    const rhoCd = interpolateCurve(SPECIFIC_LOSSES_E11, Bd_mid);
    const Gd = stator.Z1 * (stator.bd1) * (stator.he / 10) * dim.l * 0.93 * 7.65 * 1e-3;
    const Pcd = Kd * rhoCd * Gd * 1e-3;
    
    // Surface losses
    const Psur = 1.32; // kW typical
    
    // Mechanical losses
    const vp = dim.tau; // peripheral velocity proxy
    const Pmec = 0.8 * 2 * nom.p * Math.pow(vp, 3) * Math.sqrt(dim.l1) * 1e-6;
    const PmecFinal = Math.max(Pmec, 3.75); // minimum from PDF
    
    // Electrical losses stator
    const Pelec = inp.m * nom.In * nom.In * stator.Ra75 * 1e-3;
    
    // Supplementary losses
    const Psup = 0.005 * inp.Pn;
    
    // Excitation losses
    const PB = excit.IB * excit.IB * excit.rB * 1e-3 + 2 * excit.IB * 1e-3;
    
    const totalLosses = Pc + Pcd + Psur + PmecFinal + Pelec + Psup + PB;
    const efficiency = inp.Pn / (inp.Pn + totalLosses);
    
    return { Pc, Pcd, Psur: Psur, Pmec: PmecFinal, Pelec, Psup, PB, totalLosses, efficiency };
  }
}
