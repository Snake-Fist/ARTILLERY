import { useState, useMemo, useEffect } from 'react';
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
    dispersion: 85,
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
    dispersion: 110,
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
    dispersion: 135,
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
    dispersion: 160,
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
  
  const [fireStart, setFireStart] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (fireStart !== null) {
      interval = setInterval(() => setNow(Date.now()), 100);
    }
    return () => clearInterval(interval);
  }, [fireStart]);

  const gridData = useMemo(() => calculateAzimuthAndRange(gunX, gunY, tgtX, tgtY, adjN, adjS, adjE, adjW), [gunX, gunY, tgtX, tgtY, adjN, adjS, adjE, adjW]);

  const activeRange = gridData ? gridData.range.toString() : '';

  const calculation = useMemo(() => {
    try {
        if (!activeRange) return { valid: false, message: 'WAITING FOR DATA...' };

        const r = parseFloat(activeRange);
        
        if (isNaN(r)) return { valid: false, message: 'INVALID RANGE' };
        
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
    
    if (deltaH !== 0 && activeCharge.data.length > 1) {
        // Derive local slope to calculate accurate high-angle parallax correction
        let idx = lowerIndex;
        if (idx >= activeCharge.data.length - 1) {
            idx = activeCharge.data.length - 2;
        }
        
        const currentData = activeCharge.data[idx];
        const nextData = activeCharge.data[idx + 1];
        
        const dRange = nextData.range - currentData.range;
        const dElev_dRange = (nextData.elev - currentData.elev) / dRange;
        const dTof_dRange = (nextData.tof - currentData.tof) / dRange;
        
        // M777 High Angle: 100m height diff corresponds perfectly to 50m horizontal range diff (2:1 slope at impact).
        // effective step = deltaH * 0.5
        angleFix = -dElev_dRange * (deltaH * 0.5);
        tofFix = -dTof_dRange * (deltaH * 0.5);
    }
    
    const finalElev = Math.round(baseElev - angleFix);
    const finalTof = Math.round((tof - tofFix) * 10) / 10;

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
  }, [activeRange, gunElevStr, tgtElevStr, forcedCharge]);

  const azMilStr = gridData ? gridData.azimuth.toString().padStart(4, '0') : '----';
  const azDegStr = gridData ? (gridData.azimuth * (360 / 6400)).toFixed(1) : '--.-';

  const elMilStr = (calculation.valid && calculation.elev !== undefined) ? calculation.elev.toString().padStart(4, '0') : '----';
  const elDegStr = (calculation.valid && calculation.elev !== undefined) ? (calculation.elev * (360 / 6400)).toFixed(1) : '--.-';

  const tofStr = (calculation.valid && calculation.tof !== undefined) ? calculation.tof.toFixed(1) : '--.-';

  const chargeStr = (calculation.valid && calculation.charge !== undefined) ? calculation.charge : '-';

  const handleFire = () => {
    if (calculation.valid) {
      setFireStart(Date.now());
      setNow(Date.now());
    }
  };

  let timerRender = null;
  if (fireStart !== null && calculation.valid && calculation.tof) {
    const elapsed = (now - fireStart) / 1000;
    const remaining = Math.max(0, calculation.tof - elapsed);

    if (remaining > 0) {
      timerRender = (
        <div style={{ marginTop: '15px', border: '2px dashed var(--term-border)', padding: '10px', textAlign: 'center' }}>
            <div>ROUNDS IN AIR (ETA)</div>
            <div>-{remaining.toFixed(1)}s</div>
        </div>
      );
    } else {
      timerRender = (
        <div className="splash-alert">
            IMPACT // SPLASH!
            <div style={{ marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFireStart(null)}>
                [ ACKNOWLEDGE ]
            </div>
        </div>
      );
    }
  }

  return (
    <div className="terminal-container">
      <h1>M777 BALLISTIC COMPUTER</h1>

      <div className="input-section">
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
        
        <div className="input-group" style={{ marginTop: '5px' }}>
            <label>ADJUST FIRE:</label>
            <div className="grid-inputs" style={{ gap: '3px' }}>
                <div className="grid-input-wrapper">
                    <span>N:</span>
                    <input type="number" step="10" placeholder="0" value={adjN} onChange={(e) => { setAdjN(e.target.value); setAdjS(''); setFireStart(null); }} />
                </div>
                <div className="grid-input-wrapper">
                    <span>S:</span>
                    <input type="number" step="10" placeholder="0" value={adjS} onChange={(e) => { setAdjS(e.target.value); setAdjN(''); setFireStart(null); }} />
                </div>
                <div className="grid-input-wrapper">
                    <span>E:</span>
                    <input type="number" step="10" placeholder="0" value={adjE} onChange={(e) => { setAdjE(e.target.value); setAdjW(''); setFireStart(null); }} />
                </div>
                <div className="grid-input-wrapper">
                    <span>W:</span>
                    <input type="number" step="10" placeholder="0" value={adjW} onChange={(e) => { setAdjW(e.target.value); setAdjE(''); setFireStart(null); }} />
                </div>
            </div>
        </div>
      </div>

      <div className="results-section">
        {!calculation.valid && calculation.message !== 'WAITING FOR DATA...' && (
            <div className="alert">{calculation.message}</div>
        )}
        
        <div className="result-row">
            <span>TGT (RANGE):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{gridData ? gridData.range : '----'} M</div>
                <div style={{ opacity: 0.8 }}>{' '}</div>
            </div>
        </div>

        <div className="result-row">
            <span>C (CHARGE):</span>
            <div style={{ textAlign: 'right' }}>
                <div style={{ color: forcedCharge ? '#fff' : 'inherit' }}>CHG {chargeStr}</div>
                <div style={{ opacity: 0.8 }}>{' '}</div>
            </div>
        </div>

        <div className="result-row" style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '10px' }}>
            <span>X (AZIMUTH):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{azMilStr} MILS</div>
                <div style={{ opacity: 0.8 }}>{azDegStr}°</div>
            </div>
        </div>
        
        <div className="result-row">
            <span>Y (ELEVATION):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{elMilStr} MILS</div>
                <div style={{ opacity: 0.8 }}>{elDegStr}°</div>
            </div>
        </div>

        <div className="result-row">
            <span>T (FLIGHT):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{tofStr} SEC</div>
            </div>
        </div>

        <div className="result-row" style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '10px' }}>
            <span>D (DISPERSION):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion} M` : '-- M'}</div>
            </div>
        </div>
      </div>

      {calculation.valid && fireStart === null && (
          <button onClick={handleFire}>
              FIRE ROUND
          </button>
      )}

      {timerRender}
    </div>
  );
}

export default App;
