import { useState, useMemo, useEffect, useRef } from 'react';
import './index.css';

// M107 HE Ballistic Data for Charges 1-5
const CHARGES = [
  {
    id: 1,
    min: 950,
    max: 1500,
    dispersion: 69,
    data: [
        { range: 950, elev: 1245, tof: 24.4 },
        { range: 1000, elev: 1221, tof: 24.2 },
        { range: 1050, elev: 1197, tof: 24.0 },
        { range: 1100, elev: 1171, tof: 23.7 },
        { range: 1150, elev: 1144, tof: 23.4 },
        { range: 1200, elev: 1115, tof: 23.1 },
        { range: 1250, elev: 1084, tof: 22.7 },
        { range: 1300, elev: 1050, tof: 22.3 },
        { range: 1350, elev: 1011, tof: 21.8 },
        { range: 1400, elev: 965, tof: 21.2 },
        { range: 1450, elev: 907, tof: 20.3 },
        { range: 1500, elev: 800, tof: 18.6 }
    ]
  },
  {
    id: 2,
    min: 1500,
    max: 2500,
    dispersion: 69,
    data: [
        { range: 1500, elev: 1270, tof: 33.1 },
        { range: 1550, elev: 1257, tof: 33.0 },
        { range: 1600, elev: 1243, tof: 32.9 },
        { range: 1650, elev: 1229, tof: 32.7 },
        { range: 1700, elev: 1214, tof: 32.5 },
        { range: 1750, elev: 1200, tof: 32.4 },
        { range: 1800, elev: 1185, tof: 32.1 },
        { range: 1850, elev: 1169, tof: 31.9 },
        { range: 1900, elev: 1153, tof: 31.7 },
        { range: 1950, elev: 1136, tof: 31.5 },
        { range: 2000, elev: 1119, tof: 31.2 },
        { range: 2050, elev: 1101, tof: 31.0 },
        { range: 2100, elev: 1082, tof: 30.7 },
        { range: 2150, elev: 1062, tof: 30.3 },
        { range: 2200, elev: 1041, tof: 30.0 },
        { range: 2250, elev: 1018, tof: 29.6 },
        { range: 2300, elev: 995, tof: 29.2 },
        { range: 2350, elev: 967, tof: 28.7 },
        { range: 2400, elev: 938, tof: 28.1 },
        { range: 2450, elev: 904, tof: 27.5 },
        { range: 2500, elev: 860, tof: 26.5 }
    ]
  },
  {
    id: 3,
    min: 2100,
    max: 3600,
    dispersion: 69,
    data: [
        { range: 2100, elev: 1272, tof: 41.0 },
        { range: 2200, elev: 1253, tof: 40.8 },
        { range: 2300, elev: 1233, tof: 40.5 },
        { range: 2400, elev: 1213, tof: 40.2 },
        { range: 2500, elev: 1192, tof: 39.9 },
        { range: 2600, elev: 1170, tof: 39.5 },
        { range: 2700, elev: 1147, tof: 39.1 },
        { range: 2800, elev: 1123, tof: 38.7 },
        { range: 2900, elev: 1098, tof: 38.3 },
        { range: 3000, elev: 1070, tof: 37.7 },
        { range: 3100, elev: 1042, tof: 37.2 },
        { range: 3200, elev: 1010, tof: 36.5 },
        { range: 3300, elev: 975, tof: 35.7 },
        { range: 3400, elev: 936, tof: 34.9 },
        { range: 3500, elev: 890, tof: 33.7 },
        { range: 3600, elev: 828, tof: 32.1 }
    ]
  },
  {
    id: 4,
    min: 2600,
    max: 4500,
    dispersion: 69,
    data: [
        { range: 2600, elev: 1271, tof: 47.2 },
        { range: 2700, elev: 1255, tof: 47.0 },
        { range: 2800, elev: 1240, tof: 46.7 },
        { range: 2900, elev: 1224, tof: 46.5 },
        { range: 3000, elev: 1207, tof: 46.2 },
        { range: 3100, elev: 1190, tof: 45.9 },
        { range: 3200, elev: 1172, tof: 45.6 },
        { range: 3300, elev: 1154, tof: 45.2 },
        { range: 3400, elev: 1135, tof: 44.9 },
        { range: 3500, elev: 1116, tof: 44.5 },
        { range: 3600, elev: 1095, tof: 44.0 },
        { range: 3700, elev: 1074, tof: 43.6 },
        { range: 3800, elev: 1052, tof: 43.1 },
        { range: 3900, elev: 1028, tof: 42.5 },
        { range: 4000, elev: 1003, tof: 41.9 },
        { range: 4100, elev: 976, tof: 41.3 },
        { range: 4200, elev: 946, tof: 40.5 },
        { range: 4300, elev: 912, tof: 39.6 },
        { range: 4400, elev: 874, tof: 38.5 },
        { range: 4500, elev: 828, tof: 37.2 }
    ]
  },
  {
    id: 5,
    min: 3000,
    max: 5300,
    dispersion: 69,
    data: [
        { range: 3000, elev: 1271, tof: 52.2 },
        { range: 3100, elev: 1258, tof: 52.0 },
        { range: 3200, elev: 1244, tof: 51.8 },
        { range: 3300, elev: 1230, tof: 51.5 },
        { range: 3400, elev: 1216, tof: 51.3 },
        { range: 3500, elev: 1202, tof: 51.0 },
        { range: 3600, elev: 1187, tof: 50.7 },
        { range: 3700, elev: 1172, tof: 50.4 },
        { range: 3800, elev: 1156, tof: 50.1 },
        { range: 3900, elev: 1140, tof: 49.8 },
        { range: 4000, elev: 1124, tof: 49.4 },
        { range: 4100, elev: 1107, tof: 49.0 },
        { range: 4200, elev: 1089, tof: 48.6 },
        { range: 4300, elev: 1071, tof: 48.2 },
        { range: 4400, elev: 1052, tof: 47.7 },
        { range: 4500, elev: 1032, tof: 47.2 },
        { range: 4600, elev: 1011, tof: 46.7 },
        { range: 4700, elev: 989, tof: 46.1 },
        { range: 4800, elev: 966, tof: 45.5 },
        { range: 4900, elev: 941, tof: 44.7 },
        { range: 5000, elev: 913, tof: 44.0 },
        { range: 5100, elev: 883, tof: 43.1 },
        { range: 5200, elev: 850, tof: 42.0 },
        { range: 5300, elev: 809, tof: 40.7 }
    ]
  }
];

function parseGridPiece(p: string) {
  if (!p || p.trim() === '') return null;
  const clean = p.replace(/[^0-9]/g, '');
  if (clean.length === 0) return null;

  // 3-digit MGRS block (100m precision) -> e.g. "048" means 4800m
  if (clean.length === 3) return parseInt(clean, 10) * 100;
  // 1 or 2 digit MGRS block (1km precision) -> e.g. "04" means 4000m
  if (clean.length <= 2) return parseInt(clean, 10) * 1000;
  // >= 4 digits: treat as absolute exact meters from drone output
  return parseInt(clean, 10);
}

function calculateAzimuthAndRange(gx: string, gy: string, tx: string, ty: string, an: string, as: string, ae: string, aw: string) {
  const g_x = parseGridPiece(gx);
  const g_y = parseGridPiece(gy);
  let t_x = parseGridPiece(tx);
  let t_y = parseGridPiece(ty);
  
  if (g_x === null || g_y === null || t_x === null || t_y === null) return null;

  t_x += parseFloat(ae || '0');
  t_x -= parseFloat(aw || '0');
  t_y += parseFloat(an || '0');
  t_y -= parseFloat(as || '0');

  const dx = t_x - g_x;
  const dy = t_y - g_y;

  const dist = Math.sqrt(dx * dx + dy * dy);
  
  let azRad = Math.atan2(dx, dy); // dy is North, dx is East
  if (azRad < 0) azRad += 2 * Math.PI;
  const azMil = Math.round(azRad * (6400 / (2 * Math.PI)));

  return { range: Math.round(dist), azimuth: azMil };
}

function interpolate(x: number, x0: number, x1: number, y0: number, y1: number) {
  if (x0 === x1) return y0;
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

function App() {
  const [gunX, setGunX] = useState<string>('');
  const [gunY, setGunY] = useState<string>('');
  const [tgtX, setTgtX] = useState<string>('');
  const [tgtY, setTgtY] = useState<string>('');
  const [adjN, setAdjN] = useState<string>('');
  const [adjS, setAdjS] = useState<string>('');
  const [adjE, setAdjE] = useState<string>('');
  const [adjW, setAdjW] = useState<string>('');
  const [gunElevStr, setGunElevStr] = useState<string>('0');
  const [tgtElevStr, setTgtElevStr] = useState<string>('0');
  const [forcedCharge, setForcedCharge] = useState<number | null>(null);
  
  const [mapSize, setMapSize] = useState<number>(8);
  const [mapMode, setMapMode] = useState<'gun' | 'tgt' | null>(null);

  const [showDPad, setShowDPad] = useState<boolean>(true);
  const [showBDT, setShowBDT] = useState<boolean>(true);
  const [rangeCorrection, setRangeCorrection] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('COORDS');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fireStart, setFireStart] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (fireStart !== null) {
      interval = setInterval(() => setNow(Date.now()), 100);
    }
    return () => clearInterval(interval);
  }, [fireStart]);

  const gridData = useMemo(() => calculateAzimuthAndRange(gunX, gunY, tgtX, tgtY, '0', '0', '0', '0'), [gunX, gunY, tgtX, tgtY]);

  const handleCommitAdj = () => {
      let t_x = parseGridPiece(tgtX);
      let t_y = parseGridPiece(tgtY);
      const isAdjusted = (parseFloat(adjN||'0') !== 0 || parseFloat(adjS||'0') !== 0 || parseFloat(adjE||'0') !== 0 || parseFloat(adjW||'0') !== 0);
      
      if (isAdjusted && t_x !== null && t_y !== null) {
          t_x += parseFloat(adjE || '0');
          t_x -= parseFloat(adjW || '0');
          t_y += parseFloat(adjN || '0');
          t_y -= parseFloat(adjS || '0');
          
          setTgtX(String(Math.abs(Math.round(t_x))).padStart(4, '0'));
          setTgtY(String(Math.abs(Math.round(t_y))).padStart(4, '0'));
          
          setAdjN('');
          setAdjS('');
          setAdjE('');
          setAdjW('');
          setFireStart(null);
      }
  };

  const activeRange = gridData ? gridData.range.toString() : '';

  const calculation = useMemo(() => {
    try {
        if (!activeRange) return { valid: false, message: 'WAITING FOR DATA...' };

        const rawR = parseFloat(activeRange);
        
        if (isNaN(rawR)) return { valid: false, message: 'INVALID RANGE' };
        const r = rangeCorrection ? rawR * 0.96 : rawR;
        
        // Find viable charge
        let activeCharge = null;
    
    if (forcedCharge !== null) {
        activeCharge = CHARGES.find(c => c.id === forcedCharge);
        if (activeCharge && (r < activeCharge.min || r > activeCharge.max)) {
            return { valid: false, message: `RANGE OUT OF BOUNDS FOR CHG ${forcedCharge} (${activeCharge.min}M-${activeCharge.max}M)` };
        }
    } else {
        // Auto select lowest charge that can reach it
        for (const charge of CHARGES) {
            if (r >= charge.min && r <= charge.max) {
                activeCharge = charge;
                break;
            }
        }
    }

    if (!activeCharge && r < CHARGES[0].min) return { valid: false, message: `OUT OF RANGE (MIN ${CHARGES[0].min}M)` };
    if (!activeCharge && r > CHARGES[CHARGES.length - 1].max) return { valid: false, message: `OUT OF RANGE (MAX ${CHARGES[CHARGES.length - 1].max}M)` };
    if (!activeCharge) return { valid: false, message: 'NO CHARGE AVAILABLE FOR RANGE' };

    let lowerIndex = 0;
    for (let i = 0; i < activeCharge.data.length; i++) {
        if (activeCharge.data[i].range <= r) {
            lowerIndex = i;
        }
    }

    let baseElev = 0;
    let tof = 0;

    if (activeCharge.data[lowerIndex].range === r) {
        baseElev = activeCharge.data[lowerIndex].elev;
        tof = activeCharge.data[lowerIndex].tof;
    } else {
        const upperIndex = lowerIndex + 1;
        const lower = activeCharge.data[lowerIndex];
        const upper = activeCharge.data[upperIndex];

        baseElev = interpolate(r, lower.range, upper.range, lower.elev, upper.elev);
        tof = interpolate(r, lower.range, upper.range, lower.tof, upper.tof);
    }

    const gunElevAlt = parseFloat(gunElevStr);
    const tgtElevAlt = parseFloat(tgtElevStr);
    let deltaH = 0;
    if (!isNaN(gunElevAlt) && !isNaN(tgtElevAlt)) {
        deltaH = tgtElevAlt - gunElevAlt;
    }

    let angleFix = 0;
    let tofFix = 0;

    if (deltaH !== 0 && r > 0) {
        // Correct geometric elevation correction:
        // The vertical angle to the target (in mils) must be added to the flat-earth table elevation.
        // This is: atan(deltaH / range) converted from radians to NATO mils (6400 / 2π).
        const vertAngleRad = Math.atan2(deltaH, r);
        const vertAngleMils = vertAngleRad * (6400 / (2 * Math.PI));
        angleFix = vertAngleMils; // positive = target higher = need more elevation

        // TOF correction: tgt altitude changes effective range slightly.
        // Approximate via slope of the charge table at current range.
        let idx = lowerIndex;
        if (idx >= activeCharge.data.length - 1) idx = activeCharge.data.length - 2;
        const dRange = activeCharge.data[idx + 1].range - activeCharge.data[idx].range;
        const dTof_dRange = (activeCharge.data[idx + 1].tof - activeCharge.data[idx].tof) / dRange;
        // Slant range correction: actual slant = sqrt(r² + deltaH²), not r
        const slantRange = Math.sqrt(r * r + deltaH * deltaH);
        tofFix = dTof_dRange * (slantRange - r);
    }

    const finalElev = Math.round(baseElev + angleFix);
    const finalTof = Math.round((tof + tofFix) * 10) / 10;

    if (finalElev < 0 || finalElev > 1300) {
        return { valid: false, message: 'SOLUTION IMPOSSIBLE (TRAVERSAL LIMIT)' };
    }
    
    if (finalTof <= 0) {
        return { valid: false, message: 'SOLUTION IMPOSSIBLE (COLLISION/TOF)' };
    }

    return {
        valid: true,
        charge: activeCharge.id,
        dispersion: activeCharge.dispersion,
        elev: finalElev,
        tof: finalTof
    };
    } catch (err: any) {
        return { valid: false, message: `CRASH: ${err.message}` };
    }
  }, [activeRange, gunElevStr, tgtElevStr, forcedCharge, rangeCorrection]);

  useEffect(() => {
    if (fireStart !== null && calculation.valid && calculation.tof) {
        const elapsed = (now - fireStart) / 1000;
        if (calculation.tof - elapsed < -3) {
            setFireStart(null);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireStart, now, calculation.valid, calculation.tof]);

  const azMilStr = gridData ? gridData.azimuth.toString().padStart(4, '0') : '----';
  const azDegStr = gridData ? (gridData.azimuth * (360 / 6400)).toFixed(1) : '--.-';

  const elMilStr = (calculation.valid && calculation.elev !== undefined) ? calculation.elev.toString().padStart(4, '0') : '----';
  const elDegStr = (calculation.valid && calculation.elev !== undefined) ? (calculation.elev * (360 / 6400)).toFixed(1) : '--.-';

  const tofStr = (calculation.valid && calculation.tof !== undefined) ? calculation.tof.toFixed(1) : '--.-';

  const chargeStr = (calculation.valid && calculation.charge !== undefined) ? calculation.charge : '-';

  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mapMeters = mapSize * 1000;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 100m Sub-grid (Faint)
      ctx.strokeStyle = '#ffbb0040';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([]); 
      ctx.beginPath();
      for (let i = 0; i <= mapSize * 10; i++) {
          if (i % 10 === 0) continue; // Skip the 1km major lines
          const px = Math.floor((i * 100 / mapMeters) * canvas.width) + 0.5;
          ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
          
          const py = Math.floor(canvas.height - (i * 100 / mapMeters) * canvas.height) + 0.5;
          ctx.moveTo(0, py); ctx.lineTo(canvas.width, py);
      }
      ctx.stroke();

      // 1km Major grid (Solid)
      ctx.strokeStyle = '#ffbb0080';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i <= mapSize; i++) {
          const px = Math.floor((i * 1000 / mapMeters) * canvas.width) + 0.5;
          ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
          
          const py = Math.floor(canvas.height - (i * 1000 / mapMeters) * canvas.height) + 0.5;
          ctx.moveTo(0, py); ctx.lineTo(canvas.width, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = '#ffbb00';
      ctx.font = '10px monospace';
      for (let i = 0; i <= mapSize; i++) {
          const px = (i * 1000 / mapMeters) * canvas.width;
          ctx.fillText((i).toString().padStart(2,'0'), px + 2, canvas.height - 2);
          const py = canvas.height - (i * 1000 / mapMeters) * canvas.height;
          if (i > 0) ctx.fillText((i).toString().padStart(2,'0'), 2, py - 2);
      }

      const drawPoint = (x: number | null, y: number | null, label: string) => {
          if (x === null || y === null) return null;
          const px = (x / mapMeters) * canvas.width;
          const py = canvas.height - (y / mapMeters) * canvas.height;
          
          ctx.strokeStyle = '#ffbb00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - 5, py); ctx.lineTo(px + 5, py);
          ctx.moveTo(px, py - 5); ctx.lineTo(px, py + 5);
          ctx.stroke();
          ctx.fillStyle = '#ffbb00';
          ctx.fillText(label, px + 8, py - 8);
          return {px, py};
      };

      const g_x = parseGridPiece(gunX);
      const g_y = parseGridPiece(gunY);
      const t_x = parseGridPiece(tgtX);
      const t_y = parseGridPiece(tgtY);

      let gunPos = drawPoint(g_x, g_y, 'GUN');

      if (gunPos) {
          let minR = 950;
          let maxR = 5300;
          
          if (forcedCharge !== null) {
              const fc = CHARGES.find(c => c.id === forcedCharge);
              if (fc) {
                  minR = fc.min;
                  maxR = fc.max;
              }
          }

          const minRPx = (minR / mapMeters) * canvas.width;
          const maxRPx = (maxR / mapMeters) * canvas.width;
          
          ctx.strokeStyle = '#ffbb00';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);

          // Draw Min Range Ring
          ctx.beginPath();
          ctx.arc(gunPos.px, gunPos.py, Math.max(1, minRPx), 0, 2 * Math.PI);
          ctx.stroke();

          // Draw Max Range Ring
          ctx.beginPath();
          ctx.arc(gunPos.px, gunPos.py, Math.max(1, maxRPx), 0, 2 * Math.PI);
          ctx.stroke();
          
          ctx.setLineDash([]);
      }
      
      let tgtOrigPos = drawPoint(t_x, t_y, 'TGT');
      
      const isAdjusted = (parseFloat(adjN||'0') !== 0 || parseFloat(adjS||'0') !== 0 || parseFloat(adjE||'0') !== 0 || parseFloat(adjW||'0') !== 0);
      
      let final_tx = t_x;
      let final_ty = t_y;
      if (final_tx !== null) {
          final_tx += parseFloat(adjE || '0');
          final_tx -= parseFloat(adjW || '0');
      }
      if (final_ty !== null) {
          final_ty += parseFloat(adjN || '0');
          final_ty -= parseFloat(adjS || '0');
      }
      
      let tgtAdjPos = null;
      if (isAdjusted) {
          tgtAdjPos = drawPoint(final_tx, final_ty, 'ADJ');
          if (tgtOrigPos && tgtAdjPos) {
              ctx.strokeStyle = '#ffbb0080';
              ctx.setLineDash([2, 4]);
              ctx.beginPath();
              ctx.moveTo(tgtOrigPos.px, tgtOrigPos.py);
              ctx.lineTo(tgtAdjPos.px, tgtAdjPos.py);
              ctx.stroke();
              ctx.setLineDash([]);
          }
      }

      const activeTgtPos = tgtOrigPos;

      if (gunPos && activeTgtPos) {
          ctx.strokeStyle = '#ffbb00';
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(gunPos.px, gunPos.py);
          ctx.lineTo(activeTgtPos.px, activeTgtPos.py);
          ctx.stroke();
          ctx.setLineDash([]);

          let isHit = false;
          let progress = 0;
          if (fireStart !== null && calculation.valid && calculation.tof) {
              const elapsed = (Date.now() - fireStart) / 1000;
              progress = elapsed / calculation.tof;
              if (progress >= 1) isHit = true;
          }
          
          if (calculation.valid && calculation.dispersion) {
              const rPx = (calculation.dispersion / mapMeters) * canvas.width;
              ctx.beginPath();
              
              if (isHit) {
                  const blinkOn = Math.floor(Date.now() / 150) % 2 === 0;
                  ctx.setLineDash(blinkOn ? [] : [2, 4]); 
                  ctx.arc(activeTgtPos.px, activeTgtPos.py, Math.max(1, rPx), 0, 2 * Math.PI);
                  ctx.strokeStyle = '#ff0000';
                  ctx.lineWidth = blinkOn ? 3 : 1; 
                  ctx.stroke();
                  if (blinkOn) {
                      ctx.fillStyle = '#ff000080';
                      ctx.fill();
                  }
              } else {
                  ctx.setLineDash([2, 4]); 
                  ctx.arc(activeTgtPos.px, activeTgtPos.py, Math.max(1, rPx), 0, 2 * Math.PI);
                  ctx.strokeStyle = '#ffbb00';
                  ctx.lineWidth = 1;
                  ctx.stroke();
              }
              
              ctx.setLineDash([]);
              ctx.lineWidth = 1;
          }
          
          if (fireStart !== null && progress >= 0 && progress <= 1 && !isHit) {
              const currentPx = gunPos.px + (activeTgtPos.px - gunPos.px) * progress;
              const currentPy = gunPos.py + (activeTgtPos.py - gunPos.py) * progress;
              
              const blinkOn = Math.floor(Date.now() / 150) % 2 === 0;
              ctx.beginPath();
              ctx.arc(currentPx, currentPy, 4, 0, 2 * Math.PI);
              if (blinkOn) {
                  ctx.fillStyle = '#ffbb00';
                  ctx.fill();
              } else {
                  ctx.strokeStyle = '#ffbb00';
                  ctx.lineWidth = 2;
                  ctx.stroke();
              }
          }
      }
  }, [activePage, mapSize, gunX, gunY, tgtX, tgtY, adjN, adjS, adjE, adjW, calculation, now, fireStart]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!mapMode) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = xPx * scaleX;
      const py = yPx * scaleY;
      
      const mapMeters = mapSize * 1000;
      const coordX = Math.round((px / canvas.width) * mapMeters);
      const coordY = Math.round(((canvas.height - py) / canvas.height) * mapMeters);
      
      if (mapMode === 'gun') {
          setGunX(coordX.toString());
          setGunY(coordY.toString());
          setMapMode(null);
          setFireStart(null);
      } else if (mapMode === 'tgt') {
          setTgtX(coordX.toString());
          setTgtY(coordY.toString());
          setMapMode(null);
          setFireStart(null);
      }
  };

  const handleAdjust = (dir: 'N' | 'S' | 'E' | 'W') => {
      let n = parseInt(adjN || '0');
      let s = parseInt(adjS || '0');
      let e = parseInt(adjE || '0');
      let w = parseInt(adjW || '0');
      
      let yOffset = n - s;
      let xOffset = e - w;
      
      if (dir === 'N') yOffset += 10;
      if (dir === 'S') yOffset -= 10;
      if (dir === 'E') xOffset += 10;
      if (dir === 'W') xOffset -= 10;
      
      if (yOffset > 0) { setAdjN(yOffset.toString()); setAdjS(''); }
      else if (yOffset < 0) { setAdjN(''); setAdjS(Math.abs(yOffset).toString()); }
      else { setAdjN(''); setAdjS(''); }
      
      if (xOffset > 0) { setAdjE(xOffset.toString()); setAdjW(''); }
      else if (xOffset < 0) { setAdjE(''); setAdjW(Math.abs(xOffset).toString()); }
      else { setAdjE(''); setAdjW(''); }
      
      setFireStart(null);
  };

  const handleResetAdjust = () => {
      setAdjN('');
      setAdjS('');
      setAdjE('');
      setAdjW('');
      setFireStart(null);
  };

  const handleFire = () => {
    if (calculation.valid) {
      setFireStart(Date.now());
      setNow(Date.now());
    }
  };

  let timerRender = null;
  if (fireStart !== null && calculation.valid && calculation.tof) {
    const elapsed = (now - fireStart) / 1000;
    const remaining = calculation.tof - elapsed;

    if (remaining > 0) {
      timerRender = (
         <div style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '5px', background: 'var(--term-bg)', border: '1px dashed var(--term-border)', color: 'var(--term-text)', fontSize: '14px', zIndex: 10 }}>
             T - {remaining.toFixed(1)}
         </div>
      );
    } else if (remaining > -3) {
      const blinkOn = Math.floor(Date.now() / 250) % 2 === 0;
      timerRender = (
         <div style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '5px 10px', background: blinkOn ? '#ff0000' : 'var(--term-bg)', color: blinkOn ? '#000' : '#ff0000', border: '1px solid #ff0000', fontSize: '14px', fontWeight: 'bold', zIndex: 10 }}>
             SPLASH
         </div>
      );
    }
  }

  const adjNS = adjN ? `N ${adjN}` : (adjS ? `S ${adjS}` : '');
  const adjEW = adjE ? `E ${adjE}` : (adjW ? `W ${adjW}` : '');
  let adjStr = `${adjNS}  ${adjEW}`.trim();
  if (!adjStr) adjStr = '-- M';

  return (
    <div className="mfd-outer">
      <header className="terminal-header" style={{ borderBottom: '2px dashed var(--term-border)', paddingBottom: '10px', marginBottom: '10px' }}>
        <h1 style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>M777 BALLISTIC MFD</h1>
      </header>

      <div className="mfd-main">
        <div className="mfd-sidebar left">
            <button className={`osb-button ${activePage === 'COORDS' ? 'active' : ''}`} onClick={() => setActivePage('COORDS')}>COORDS</button>
            <div style={{ flex: 1 }} />
            <button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>
            <button className={`osb-button ${activePage === 'MAP' ? 'active' : ''}`} onClick={() => setActivePage('MAP')}>TACTCL<br/>MAP</button>
        </div>

        <div className="mfd-screen">
          {activePage === 'COORDS' && (
            <div className="input-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="input-group">
            <label>GUN GRID:</label>
            <div className="grid-inputs">
                <div className="grid-input-wrapper">
                    <span>X:</span>
                    <input 
                        type="text" 
                        value={gunX}
                        onChange={(e) => {
                            setGunX(e.target.value);
                            setFireStart(null);
                        }}
                    />
                </div>
                <div className="grid-input-wrapper">
                    <span>Y:</span>
                    <input 
                        type="text" 
                        value={gunY}
                        onChange={(e) => {
                            setGunY(e.target.value);
                            setFireStart(null);
                        }}
                    />
                </div>
            </div>
        </div>
        <div className="input-group">
            <label>TGT GRID:</label>
            <div className="grid-inputs">
                <div className="grid-input-wrapper">
                    <span>X:</span>
                    <input 
                        type="text" 
                        value={tgtX}
                        onChange={(e) => {
                            setTgtX(e.target.value);
                            setFireStart(null);
                        }}
                    />
                </div>
                <div className="grid-input-wrapper">
                    <span>Y:</span>
                    <input 
                        type="text" 
                        value={tgtY}
                        onChange={(e) => {
                            setTgtY(e.target.value);
                            setFireStart(null);
                        }}
                    />
                </div>
            </div>
        </div>
        <div className="input-group">
            <label>GUN ELEV:</label>
            <div className="grid-inputs">
                <div className="grid-input-wrapper">
                    <span>Z:</span>
                    <input 
                        type="number" 
                        step="5"
                        value={gunElevStr}
                        onChange={(e) => {
                            setGunElevStr(e.target.value);
                            setFireStart(null);
                        }}
                    />
                </div>
            </div>
        </div>
        <div className="input-group">
            <label>TGT ELEV:</label>
            <div className="grid-inputs">
                <div className="grid-input-wrapper">
                    <span>Z:</span>
                    <input 
                        type="number" 
                        step="5"
                        value={tgtElevStr}
                        onChange={(e) => {
                            setTgtElevStr(e.target.value);
                            setFireStart(null);
                        }}
                    />
                </div>
            </div>
        </div>
        <div className="input-group" style={{ marginTop: '5px' }}>
            <label>OVRRIDE CHG:</label>
            <div className="grid-inputs">
                <div className="grid-input-wrapper">
                    <span>C:</span>
                    <select 
                        value={forcedCharge === null ? 'AUTO' : forcedCharge.toString()}
                        onChange={(e) => {
                            setForcedCharge(e.target.value === 'AUTO' ? null : parseInt(e.target.value));
                            setFireStart(null);
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: '1px solid var(--term-border)',
                            color: 'var(--term-fg)',
                            fontFamily: 'inherit',
                            padding: '4px',
                            outline: 'none'
                        }}
                    >
                        <option value="AUTO" style={{ background: 'var(--term-bg)' }}>AUTO (OPTIMAL)</option>
                        <option value="1" style={{ background: 'var(--term-bg)' }}>CHARGE 1</option>
                        <option value="2" style={{ background: 'var(--term-bg)' }}>CHARGE 2</option>
                        <option value="3" style={{ background: 'var(--term-bg)' }}>CHARGE 3</option>
                        <option value="4" style={{ background: 'var(--term-bg)' }}>CHARGE 4</option>
                        <option value="5" style={{ background: 'var(--term-bg)' }}>CHARGE 5</option>
                    </select>
                </div>
            </div>
        </div>
        
            </div>
          )}





      
      {activePage === 'SETTINGS' && (
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px', fontSize: '11px', letterSpacing: '0.1em' }}>
                  SYSTEM CONFIGURATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input
                          id="range-correction-cb"
                          type="checkbox"
                          checked={rangeCorrection}
                          onChange={(e) => setRangeCorrection(e.target.checked)}
                          style={{ marginTop: '2px', accentColor: 'var(--term-fg)', cursor: 'pointer', width: '14px', height: '14px', flexShrink: 0 }}
                      />
                      <label htmlFor="range-correction-cb" style={{ cursor: 'pointer', lineHeight: 1.5 }}>
                          RANGE CORRECTION (×0.96)<br/>
                          <span style={{ opacity: 0.6, fontSize: '10px' }}>
                              Compensates for ~4% overshoot observed in current mod version.
                              Reduces effective range by 4% before table lookup.
                          </span>
                      </label>
                  </div>
              </div>
              <div style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '8px', opacity: 0.4, fontSize: '10px' }}>
                  M107 HE / M777A2 HOW / ARMA REFORGER MOD
              </div>
          </div>
      )}


      {activePage === 'MAP' && (
          <div className="map-page" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 600 }}>TACTICAL GRID</span>
                <div>
                   SIZE: <input 
                       type="number" 
                       value={mapSize} 
                       onChange={(e) => setMapSize(Math.max(1, parseInt(e.target.value) || 1))}
                       style={{ width: '40px', background: 'transparent', color: 'inherit', border: 'none', borderBottom: '1px dashed var(--term-border)', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} 
                   /> KM
                </div>
             </div>


             <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
                 <div style={{ position: 'relative', aspectRatio: '1/1', maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}>
                     <canvas 
                         ref={canvasRef} 
                         width={800} 
                         height={800} 
                         onClick={handleCanvasClick} 
                         style={{ 
                             border: '1px solid var(--term-border)',
                             width: '100%',
                             height: '100%',
                             display: 'block',
                             cursor: mapMode ? 'crosshair' : 'default'
                         }} 
                     />
                     
                     {showDPad && (
                         <div className="d-pad" style={{ position: 'absolute', top: '15px', right: '15px', display: 'grid', gridTemplateColumns: 'repeat(3, 12px)', gridTemplateRows: 'repeat(3, 12px)', gap: '2px', zIndex: 10, fontSize: '10px' }}>
                            <div />
                            <button onClick={() => handleAdjust('N')} style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>▲</button>
                            <div />
                            <button onClick={() => handleAdjust('W')} style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>◀</button>
                            <button onClick={handleResetAdjust} style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', borderStyle: 'dotted', fontSize: '8px' }}>⨯</button>
                            <button onClick={() => handleAdjust('E')} style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>▶</button>
                            <div />
                            <button onClick={() => handleAdjust('S')} style={{ padding: 0, margin: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>▼</button>
                            <div />
                        </div>
                     )}
                     
                     {timerRender}

                     {showBDT && (
                         <div style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 10, fontSize: '7px', lineHeight: '1.4', color: 'var(--term-text)', fontFamily: 'inherit', pointerEvents: 'none' }}>
                             {!calculation.valid && calculation.message !== 'WAITING FOR DATA...' && (
                                 <div style={{ color: '#ff4444', marginBottom: '2px' }}>{calculation.message}</div>
                             )}
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>RNG</span><span>{gridData ? gridData.range : '----'} M</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>ADJ</span><span>{adjStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--term-border)', marginTop: '2px', paddingTop: '2px' }}><span>CHG</span><span>{chargeStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>AZ</span><span>{azMilStr} / {azDegStr}°</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>EL</span><span>{elMilStr} / {elDegStr}°</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>TOF</span><span>{tofStr}s</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--term-border)', marginTop: '2px', paddingTop: '2px' }}><span>DISP</span><span>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion}` : '--'} M</span></div>
                         </div>
                     )}
                 </div>
             </div>
             

          </div>
      )}
        </div>

        <div className="mfd-sidebar right">
            {activePage === 'MAP' ? (
                <>
                    <button
                        className={`osb-button ${mapMode === 'gun' ? 'active' : ''}`}
                        onClick={() => setMapMode('gun')}
                        style={{ borderStyle: mapMode === 'gun' ? 'solid' : 'dashed' }}
                    >
                        {mapMode === 'gun' ? 'SETN GUN' : 'SET GUN'}
                    </button>
                    <button
                        className={`osb-button ${mapMode === 'tgt' ? 'active' : ''}`}
                        onClick={() => setMapMode('tgt')}
                        style={{ borderStyle: mapMode === 'tgt' ? 'solid' : 'dashed' }}
                    >
                        {mapMode === 'tgt' ? 'SETN TGT' : 'SET TGT'}
                    </button>
                    <button
                        className="osb-button"
                        onClick={handleCommitAdj}
                        disabled={!adjN && !adjS && !adjE && !adjW}
                        style={{
                            opacity: (adjN || adjS || adjE || adjW) ? 1 : 0.2,
                            borderStyle: (adjN || adjS || adjE || adjW) ? 'solid' : 'dashed'
                        }}
                    >
                        COMMIT<br/>ADJ
                    </button>
                    <button
                        className={`osb-button ${showDPad ? 'active' : ''}`}
                        onClick={() => setShowDPad(!showDPad)}
                        style={{ borderStyle: showDPad ? 'solid' : 'dashed' }}
                    >
                        {showDPad ? 'HIDE DPAD' : 'SHOW DPAD'}
                    </button>
                    <button
                        className={`osb-button ${showBDT ? 'active' : ''}`}
                        onClick={() => setShowBDT(!showBDT)}
                        style={{ borderStyle: showBDT ? 'solid' : 'dashed' }}
                    >
                        {showBDT ? 'HIDE BDT' : 'SHOW BDT'}
                    </button>
                    <button
                        className="osb-button"
                        onClick={calculation.valid && fireStart === null ? handleFire : undefined}
                        disabled={!calculation.valid || fireStart !== null}
                        style={{
                            opacity: (calculation.valid && fireStart === null) ? 1 : 0.2,
                            borderStyle: (calculation.valid && fireStart === null) ? 'solid' : 'dashed'
                        }}
                    >
                        FIRE
                    </button>
                </>
            ) : (
                <>
                    <button
                        className="osb-button"
                        onClick={calculation.valid && fireStart === null ? handleFire : undefined}
                        disabled={!calculation.valid || fireStart !== null}
                        style={{
                            opacity: (calculation.valid && fireStart === null) ? 1 : 0.2,
                            borderStyle: (calculation.valid && fireStart === null) ? 'solid' : 'dashed'
                        }}
                    >
                        FIRE
                    </button>
                    <button
                        className="osb-button"
                        onClick={handleCommitAdj}
                        disabled={!adjN && !adjS && !adjE && !adjW}
                        style={{
                            opacity: (adjN || adjS || adjE || adjW) ? 1 : 0.2,
                            borderStyle: (adjN || adjS || adjE || adjW) ? 'solid' : 'dashed'
                        }}
                    >
                        COMMIT<br/>ADJ
                    </button>
                    <button className="osb-button" style={{ opacity: 0.2 }} disabled>DATA</button>
                    <button className="osb-button" style={{ opacity: 0.2 }} disabled>SYS</button>
                    <button className="osb-button" style={{ opacity: 0.2 }} disabled>MENU</button>
                </>
            )}
            <div style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
}

export default App;
