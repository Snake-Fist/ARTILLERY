import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import './index.css';
import enterInSnd from './assets/enter-in.wav';
import enterOutSnd from './assets/enter-out.wav';
import keyIn2Snd from './assets/key-in-2.wav';
import keyOut2Snd from './assets/key-out-2.wav';
import keyIn3Snd from './assets/key-in-3.wav';
import keyOut3Snd from './assets/key-out-3.wav';

const BASE_VELOCITY = 100;
const AIR_FRICTION = 0.000226;
const GRAVITY = 9.80665;

const CHARGE_DEFS = [
    { id: 1, coef: 1.400, min: 950, max: 1500, dispersion: 69 },
    { id: 2, coef: 2.045, min: 1500, max: 2500, dispersion: 69 },
    { id: 3, coef: 2.790, min: 2100, max: 3600, dispersion: 69 },
    { id: 4, coef: 3.535, min: 2600, max: 4500, dispersion: 69 },
    { id: 5, coef: 4.280, min: 3000, max: 5300, dispersion: 69 }
];

function simulateTrajectory(V0: number, elevMils: number) {
    const angleRad = (elevMils * 360 / 6400) * (Math.PI / 180);
    let vx = V0 * Math.cos(angleRad);
    let vy = V0 * Math.sin(angleRad);
    let x = 0, y = 0, t = 0;
    const dt = 0.02;
    
    while (y >= 0 || t === 0) {
        const v = Math.sqrt(vx*vx + vy*vy);
        const ax = -AIR_FRICTION * v * vx;
        const ay = -GRAVITY - AIR_FRICTION * v * vy;
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
        t += dt;
        if (t > 120) break;
    }
    return { range: x, tof: t };
}


function simulate3D(V0: number, elevMils: number, azMils: number, wSpd: number, wDir: number, targetZ: number) {
    const elevRad = (elevMils * 360 / 6400) * (Math.PI / 180);
    const azRad = (azMils * 360 / 6400) * (Math.PI / 180);
    const windRad = wDir * (Math.PI / 180);
    
    // Arma applies a surface/altitude dampening to the weather UI wind speed.
    // Derived experimentally: effective wind is roughly 81% of the UI value.
    const coefWind = 0.81;
    const wx = -wSpd * Math.sin(windRad) * coefWind;
    const wy = -wSpd * Math.cos(windRad) * coefWind;
    
    let vx = V0 * Math.cos(elevRad) * Math.sin(azRad);
    let vy = V0 * Math.cos(elevRad) * Math.cos(azRad);
    let vz = V0 * Math.sin(elevRad);
    
    let x = 0, y = 0, z = 0, t = 0;
    const dt = 0.02;
    
    while (z >= targetZ || vz > 0) {
        const relVx = vx - wx;
        const relVy = vy - wy;
        const relVz = vz;
        const relV = Math.sqrt(relVx*relVx + relVy*relVy + relVz*relVz);
        
        const ax = -AIR_FRICTION * relV * relVx;
        const ay = -AIR_FRICTION * relV * relVy;
        const az = -GRAVITY - AIR_FRICTION * relV * relVz;
        
        vx += ax * dt;
        vy += ay * dt;
        vz += az * dt;
        
        x += vx * dt;
        y += vy * dt;
        
        const nextZ = z + vz * dt;
        if (nextZ < targetZ && vz < 0) {
            const fraction = (targetZ - z) / (nextZ - z);
            x = x - vx * dt + vx * (dt * fraction);
            y = y - vy * dt + vy * (dt * fraction);
            t = t + dt * fraction;
            break;
        }
        
        z = nextZ;
        t += dt;
        if (t > 150) break;
    }
    return { x, y, tof: t };
}

function solveFiringSolution(V0: number, targetDX: number, targetDY: number, targetZ: number, wSpd: number, wDir: number) {
    const trueRange = Math.sqrt(targetDX*targetDX + targetDY*targetDY);
    const trueAzRad = Math.atan2(targetDX, targetDY);
    let trueAzMils = trueAzRad * 6400 / (2 * Math.PI);
    if (trueAzMils < 0) trueAzMils += 6400;

    let bestEl = 1000;
    let bestAz = trueAzMils;
    let bestTof = 0;
    
    for (let i = 0; i < 15; i++) {
        let lowEl = 750;
        let highEl = 1400;
        for (let j = 0; j < 12; j++) {
            const midEl = (lowEl + highEl) / 2;
            const res = simulate3D(V0, midEl, bestAz, wSpd, wDir, targetZ);
            const landRange = Math.sqrt(res.x*res.x + res.y*res.y);
            if (landRange > trueRange) {
                lowEl = midEl;
            } else {
                highEl = midEl;
            }
        }
        bestEl = (lowEl + highEl) / 2;
        
        let lowAz = bestAz - 400;
        let highAz = bestAz + 400;
        for (let j = 0; j < 12; j++) {
            const midAz = (lowAz + highAz) / 2;
            const res = simulate3D(V0, bestEl, midAz, wSpd, wDir, targetZ);
            const cross = targetDX * res.y - targetDY * res.x;
            if (cross < 0) {
                highAz = midAz;
            } else {
                lowAz = midAz;
            }
            bestTof = res.tof;
        }
        bestAz = (lowAz + highAz) / 2;
    }
    
    let fix = bestAz - trueAzMils;
    if (fix > 3200) fix -= 6400;
    if (fix < -3200) fix += 6400;
    
    return { elev: Math.round(bestEl), azFix: Math.round(fix), tof: Number(bestTof.toFixed(1)) };
}

// Generate the high-resolution ballistics lookup table on load
const CHARGES = CHARGE_DEFS.map(charge => {
    const V0 = charge.coef * BASE_VELOCITY;
    const data = [];
    
    for (let r = charge.min; r <= charge.max; r += 50) {
        let lowElev = 750; // min High angle
        let highElev = 1400; // max High angle
        let bestElev = 1000;
        let bestTof = 0;
        
        for (let iter = 0; iter < 16; iter++) {
            const mid = (lowElev + highElev) / 2;
            const res = simulateTrajectory(V0, mid);
            if (res.range > r) {
                lowElev = mid;
            } else {
                highElev = mid;
            }
            bestElev = mid;
            bestTof = res.tof;
        }
        
        data.push({ range: r, elev: Math.round(bestElev), tof: Number(bestTof.toFixed(1)) });
    }
    
    return {
        id: charge.id,
        coef: charge.coef,
        min: charge.min,
        max: charge.max,
        dispersion: charge.dispersion,
        data: data
    };
});

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



const RepeatButton = ({ onClick, children, style, className }: any) => {
  const timeoutRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const delayRef = useRef(150);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  const startRepeating = () => {
    // Fire the initial click immediately
    onClickRef.current();
    
    delayRef.current = 200; 
    clearTimeout(timeoutRef.current);
    clearTimeout(intervalRef.current);
    
    timeoutRef.current = setTimeout(() => {
      const run = () => {
        onClickRef.current();
        delayRef.current = Math.max(20, delayRef.current * 0.85); // Accelerate rapidly
        intervalRef.current = setTimeout(run, delayRef.current);
      };
      run();
    }, 400); // Wait 400ms before repeat begins
  };

  const stopRepeating = () => {
    clearTimeout(timeoutRef.current);
    clearTimeout(intervalRef.current);
  };

  return (
    <button
      className={className}
      style={style}
      onPointerDown={(e) => { 
        e.preventDefault(); 
        e.currentTarget.setPointerCapture(e.pointerId);
        startRepeating(); 
      }}
      onPointerUp={(e) => { 
        e.preventDefault(); 
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        stopRepeating(); 
      }}
      onPointerLeave={(e) => { e.preventDefault(); stopRepeating(); }}
      onPointerCancel={(e) => { e.preventDefault(); stopRepeating(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
};

function App() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    const soundRegistry = {
      enter: { in: enterInSnd, out: enterOutSnd },
      keys: [
        { in: keyIn2Snd, out: keyOut2Snd },
        { in: keyIn3Snd, out: keyOut3Snd }
      ]
    };
    
    const activeSounds = new Map<number, { type: 'enter'|'zero'|'key', index?: number }>();
    
    const playSnd = (src: string) => {
      if (!soundEnabledRef.current) return;
      const audio = new Audio(src);
      audio.volume = 1.0;
      audio.play().catch(e => console.log('Audio playback prevented:', e));
    };

    const handleDown = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn || btn.disabled) return;
      
      const text = btn.innerText.trim();
      let data: { type: 'enter'|'zero'|'key', index?: number };
      
      if (text === '▶' || text.includes('COMMIT')) {
        playSnd(soundRegistry.enter.in);
        data = { type: 'enter' };
      } else {
        const idx = Math.floor(Math.random() * soundRegistry.keys.length);
        playSnd(soundRegistry.keys[idx].in);
        data = { type: 'key', index: idx };
      }
      activeSounds.set(e.pointerId, data);
    };

    const handleUp = (e: PointerEvent) => {
      const data = activeSounds.get(e.pointerId);
      if (data) {
        if (data.type === 'enter') playSnd(soundRegistry.enter.out);
        else if (data.type === 'key' && data.index !== undefined) playSnd(soundRegistry.keys[data.index].out);
        activeSounds.delete(e.pointerId);
      }
    };

    window.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

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
  const [forcedChargeStr, setForcedChargeStr] = useState<string>('');
  const forcedCharge = forcedChargeStr === '' ? null : parseInt(forcedChargeStr);
  
  const [isDelayOn, setIsDelayOn] = useState(false);
  const [fireDelayEnd, setFireDelayEnd] = useState<number | null>(null);

  const [baseMapSize, setBaseMapSize] = useState<number>(10);
  const [fitMapSize, setFitMapSize] = useState<number>(10);
  const [showMapSizeControls, setShowMapSizeControls] = useState<boolean>(false);
  const [mapOriginX, setMapOriginX] = useState<number>(0);
  const [mapOriginY, setMapOriginY] = useState<number>(0);
  const [mapMode, setMapMode] = useState<'gun' | 'tgt' | null>(null);

  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);

  const [theme, setTheme] = useState<'AMBER' | 'GREEN' | 'RED' | 'WHITE'>('AMBER');
  const [zoomMode, setZoomMode] = useState<'OFF' | '2X' | '4X' | '8X' | 'FIT'>('OFF');

  const mapSize = zoomMode === 'FIT' ? fitMapSize : 
                  zoomMode === '2X' ? baseMapSize / 2 : 
                  zoomMode === '4X' ? baseMapSize / 4 : 
                  zoomMode === '8X' ? baseMapSize / 8 : 
                  baseMapSize;

  const [dpadMode, setDpadMode] = useState<'GUN' | 'TGT' | 'ADJUST' | 'PAN'>('TGT');
  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS' | 'SPOTTER' | 'GUNNER'>('MAP');
  const [cursorPos, setCursorPos] = useState<{clientPx: number, clientPy: number, coord: string} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [windSpeed, setWindSpeed] = useState<string>('');
  const [windDir, setWindDir] = useState<string>('');
  const [spotterTargets, setSpotterTargets] = useState<Record<number, {x:string, y:string, alt:string}>>({});
  const [dpadTgtMode, setDpadTgtMode] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [justFocusedField, setJustFocusedField] = useState<string | null>(null);

  const [linkCode, setLinkCode] = useState<string>('');
  const [peerStatus, setPeerStatus] = useState<'OFFLINE' | 'WAITING' | 'CONNECTED' | 'HOSTING'>('OFFLINE');
  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<any[]>([]);
  const [connCount, setConnCount] = useState(0);
  const lastReceivedSyncRef = useRef<any>(null);
  const lastEditedRef = useRef<Record<string, number>>({});
  const isHostRef = useRef<boolean>(false);
  const latestStateRef = useRef<any>({});
  
  latestStateRef.current = { gunX, gunY, tgtX, tgtY, gunElevStr, tgtElevStr, forcedChargeStr, windSpeed, windDir, spotterTargets };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'AMBER') {
      root.style.setProperty('--term-bg', '#000000');
      root.style.setProperty('--term-fg', '#ffb000');
      root.style.setProperty('--term-border', '#ffb000');
    } else if (theme === 'GREEN') {
      root.style.setProperty('--term-bg', '#000000');
      root.style.setProperty('--term-fg', '#33ff33');
      root.style.setProperty('--term-border', '#33ff33');
    } else if (theme === 'RED') {
      root.style.setProperty('--term-bg', '#000000');
      root.style.setProperty('--term-fg', '#cc0000');
      root.style.setProperty('--term-border', '#cc0000');
    } else if (theme === 'WHITE') {
      root.style.setProperty('--term-bg', '#000000');
      root.style.setProperty('--term-fg', '#f4f4f4');
      root.style.setProperty('--term-border', '#f4f4f4');
    }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeField) return;
      
      const markEdited = () => { lastEditedRef.current[activeField] = Date.now(); };
      
      const updateVal = (updater: (prev: string) => string) => {
        markEdited();
        if (activeField === 'gunX') setGunX(updater);
        if (activeField === 'gunY') setGunY(updater);
        if (activeField === 'tgtX') setTgtX(updater);
        if (activeField === 'tgtY') setTgtY(updater);
        if (activeField === 'gunElev') setGunElevStr(updater);
        if (activeField === 'tgtElev') setTgtElevStr(updater);
        if (activeField === 'windSpeed') setWindSpeed(updater);
        if (activeField === 'windDir') setWindDir(updater);
        if (activeField === 'charge') setForcedChargeStr(updater);
        if (activeField === 'linkCode') setLinkCode(updater);
        if (activeField && activeField.startsWith('spot')) {
            const i = parseInt(activeField.charAt(4));
            const field = activeField.substring(5).toLowerCase();
            setSpotterTargets(prev => ({
                ...prev,
                [i]: {
                    ...(prev[i]||{x:'',y:'',alt:''}),
                    [field]: updater((prev[i] as any)?.[field] || '')
                }
            }));
        }
      };

      const isSpot = activeField && activeField.startsWith('spot');
      const spotFields = [1,2,3,4,5,6,7,8,9].flatMap(i => [`spot${i}X`, `spot${i}Y`, `spot${i}Alt`]);
      const tabFields = isSpot ? spotFields : ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];

      if (e.key === 'Backspace') {
          e.preventDefault();
          if (justFocusedField === activeField) {
              updateVal(() => '');
              setJustFocusedField(null);
          } else {
              updateVal(prev => prev.slice(0, -1));
          }
          return;
      }
      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          const currVals: any = { gunX, gunY, gunElev: gunElevStr, tgtX, tgtY, tgtElev: tgtElevStr, windSpeed, windDir, charge: forcedChargeStr, linkCode };
          let prevStr = '';
          if (isSpot) {
              const i = parseInt(activeField.charAt(4));
              const field = activeField.substring(5).toLowerCase();
              prevStr = (spotterTargets[i] as any)?.[field] || '';
          } else {
              prevStr = currVals[activeField] || '';
          }
          prevStr = justFocusedField === activeField ? '' : prevStr;
          const nextVal = prevStr + e.key;
          let willTab = false;
          
          if (isSpot && nextVal.length === 4) willTab = true;
          if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev', 'linkCode'].includes(activeField) && nextVal.length === 4) willTab = true;
          if (activeField === 'windDir' && nextVal.length === 3) willTab = true;
          if (activeField === 'charge' && /^[1-5]$/.test(e.key)) willTab = true;

          updateVal(prev => {
              const base = justFocusedField === activeField ? '' : prev;
              const nv = base + e.key;
              if (isSpot) {
                  if (nv.length > 4) return prev;
                  return nv;
              }
              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev', 'linkCode'].includes(activeField) && nv.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nv) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nv) > 360) return '360';
              if (activeField === 'charge') {
                  if (e.key === '0') return '';
                  if (/^[1-5]$/.test(e.key)) return e.key;
                  return prev;
              }
              return nv;
          });
          
          if (justFocusedField === activeField) setJustFocusedField(null);
          
          if (willTab) {
              const idx = tabFields.indexOf(activeField);
              if (idx !== -1) {
                  const nf = tabFields[(idx + 1) % tabFields.length];
                  setActiveField(nf);
                  setJustFocusedField(nf);
              }
          }
      }
      if (e.key === '.' && ['gunElev', 'tgtElev', 'windSpeed', 'windDir'].includes(activeField)) {
          e.preventDefault();
          updateVal(prev => {
              const base = justFocusedField === activeField ? '0' : prev;
              return base.includes('.') ? base : base + '.';
          });
          if (justFocusedField === activeField) setJustFocusedField(null);
      }
      if (e.key === 'Enter' || e.code === 'Space' || e.key === 'Tab') {
          e.preventDefault();
          const idx = tabFields.indexOf(activeField);
          if (activeField === 'linkCode') {
              setActiveField(null);
              setJustFocusedField(null);
          } else if (idx !== -1) {
              const dir = e.shiftKey ? -1 : 1;
              const nf = tabFields[(idx + dir + tabFields.length) % tabFields.length];
              setActiveField(nf);
              setJustFocusedField(nf);
          } else {
              setActiveField(null);
              setJustFocusedField(null);
          }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeField, gunX, gunY, gunElevStr, tgtX, tgtY, tgtElevStr, windSpeed, windDir, forcedChargeStr, justFocusedField, linkCode, spotterTargets]);

  const handleKeypadPress = (val: string) => {
      
      if (dpadTgtMode && /^[1-9]$/.test(val)) {
          setDpadTgtMode(false);
          const t = spotterTargets[parseInt(val)];
          if (t && t.x !== '' && t.y !== '') {
              setTgtX(t.x);
              setTgtY(t.y);
              if (t.alt !== '') setTgtElevStr(t.alt);
          }
          return;
      }
      if (!activeField) return;

      const markEdited = () => { lastEditedRef.current[activeField] = Date.now(); };

      const updateVal = (updater: (prev: string) => string) => {
        markEdited();
        if (activeField === 'gunX') setGunX(updater);
        if (activeField === 'gunY') setGunY(updater);
        if (activeField === 'tgtX') setTgtX(updater);
        if (activeField === 'tgtY') setTgtY(updater);
        if (activeField === 'gunElev') setGunElevStr(updater);
        if (activeField === 'tgtElev') setTgtElevStr(updater);
        if (activeField === 'windSpeed') setWindSpeed(updater);
        if (activeField === 'windDir') setWindDir(updater);
        if (activeField === 'charge') setForcedChargeStr(updater);
        if (activeField === 'linkCode') setLinkCode(updater);
        if (activeField && activeField.startsWith('spot')) {
            const i = parseInt(activeField.charAt(4));
            const field = activeField.substring(5).toLowerCase();
            setSpotterTargets(prev => ({
                ...prev,
                [i]: {
                    ...(prev[i]||{x:'',y:'',alt:''}),
                    [field]: updater((prev[i] as any)?.[field] || '')
                }
            }));
        }
      };

      const isSpot = activeField && activeField.startsWith('spot');
      const spotFields = [1,2,3,4,5,6,7,8,9].flatMap(i => [`spot${i}X`, `spot${i}Y`, `spot${i}Alt`]);
      const tabFields = isSpot ? spotFields : ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];

      if (val === 'CLR') {
          updateVal(() => '');
          if (justFocusedField === activeField) setJustFocusedField(null);
      } else if (val === 'DEL') {
          if (justFocusedField === activeField) {
              updateVal(() => '');
              setJustFocusedField(null);
          } else {
              updateVal(prev => prev.slice(0, -1));
          }
      } else if (val === 'NEXT') {
          const idx = tabFields.indexOf(activeField);
          if (activeField === 'linkCode') {
                  setActiveField(null);
                  setJustFocusedField(null);
          } else if (idx !== -1) {
              const nf = tabFields[(idx + 1) % tabFields.length];
              setActiveField(nf);
              setJustFocusedField(nf);
          } else {
              setActiveField(null);
              setJustFocusedField(null);
          }
      } else if (val === 'PREV') {
          const idx = tabFields.indexOf(activeField);
          if (activeField === 'linkCode') {
                  setActiveField(null);
                  setJustFocusedField(null);
          } else if (idx !== -1) {
              const nf = tabFields[(idx - 1 + tabFields.length) % tabFields.length];
              setActiveField(nf);
              setJustFocusedField(nf);
          } else {
              setActiveField(null);
              setJustFocusedField(null);
          }
      } else {
          const currVals: any = { gunX, gunY, gunElev: gunElevStr, tgtX, tgtY, tgtElev: tgtElevStr, windSpeed, windDir, charge: forcedChargeStr, linkCode };
          let prevStr = '';
          if (isSpot) {
              const i = parseInt(activeField.charAt(4));
              const field = activeField.substring(5).toLowerCase();
              prevStr = (spotterTargets[i] as any)?.[field] || '';
          } else {
              prevStr = currVals[activeField] || '';
          }
          prevStr = justFocusedField === activeField ? '' : prevStr;
          const nextVal = prevStr + val;
          let willTab = false;
          
          if (isSpot && nextVal.length === 4) willTab = true;
          if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev', 'linkCode'].includes(activeField) && nextVal.length === 4) willTab = true;
          if (activeField === 'windDir' && nextVal.length === 3) willTab = true;
          if (activeField === 'charge' && /^[1-5]$/.test(val)) willTab = true;

          updateVal(prev => {
              const base = justFocusedField === activeField ? '' : prev;
              const nv = base + val;
              if (isSpot) {
                  if (nv.length > 4) return prev;
                  return nv;
              }
              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev', 'linkCode'].includes(activeField) && nv.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nv) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nv) > 360) return '360';
              if (activeField === 'charge') {
                  if (val === '0') return '';
                  if (/^[1-5]$/.test(val)) return val;
                  return prev;
              }
              return nv;
          });
          
          if (justFocusedField === activeField) setJustFocusedField(null);
          
          if (willTab) {
              let idx = tabFields.indexOf(activeField);
              if (activeField === 'linkCode') {
                  setActiveField(null);
                  setJustFocusedField(null);
               } else if (idx !== -1) {
                  const nf = tabFields[(idx + 1) % tabFields.length];
                  setActiveField(nf);
                  setJustFocusedField(nf);
              }
          }
      }
  };

  const TerminalField = ({ id, label, val, hideLabel }: {id: string, label: string, val: string, hideLabel?: boolean}) => {
      const elRef = useRef<HTMLDivElement>(null);
      const isActive = activeField === id;
      
      useEffect(() => {
          if (isActive && elRef.current) {
              elRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
      }, [isActive]);
      
      const strVal = String(val === '' || val === undefined || val === null ? '-' : val);
      const chars = strVal.padStart(4, ' ').slice(-4);
      
      const slots = [];
      slots.push(
          <span key="arrow" style={{ 
             display: 'inline-block',
             width: '1ch',
             textAlign: 'center'
          }}>
             {isActive ? '>' : '\u00A0'}
          </span>
      );

      for (let i = 0; i < 4; i++) {
         let char = chars[i];
         let isHoverSlot = false;
         
         if (isActive) {
             if (justFocusedField === id) {
                 isHoverSlot = true;
             } else {
                 isHoverSlot = i === 3;
             }
         }
         
         slots.push(
            <span key={i} className={isHoverSlot ? "term-cursor-animate" : ""} style={{ 
               display: 'inline-block',
               width: '1ch',
               textAlign: 'center'
            }}>
               {char === ' ' || char === '' ? '\u00A0' : char}
            </span>
         );
      }

      return (
          <div 
              ref={elRef}
              style={{ display: 'flex', justifyContent: hideLabel ? 'center' : 'space-between', gap: '8px', cursor: 'pointer', flex: hideLabel ? 1 : undefined }}
              onClick={() => { setActiveField(id); setJustFocusedField(id); }}
          >
              {!hideLabel && <span style={{ fontSize: '14px', width: '70px', lineHeight: '14px' }}>{label}</span>}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', lineHeight: '14px', color: 'var(--term-bg)', backgroundColor: 'var(--term-fg)', fontWeight: 'bold', display: 'flex', justifyContent: 'flex-start' }}>
                      {slots}
                  </div>
              </div>
          </div>
      );
  };

  // PeerJS Connection Syncing UseEffect
  useEffect(() => {
     if (linkCode.length === 4) {
         if (linkCode === '0000') {
             connsRef.current.forEach(c => c.close());
             connsRef.current = [];
             setConnCount(0);
             if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
             setPeerStatus('OFFLINE');
             return;
         }

         if (peerStatus === 'CONNECTED' || peerStatus === 'HOSTING' || peerStatus === 'WAITING') return;

         setPeerStatus('WAITING');
         
         const setupConnectionListeners = (conn: any) => {
             const updateStatus = () => {
                 setPeerStatus('CONNECTED');
                 if (isHostRef.current && conn.open) {
                     conn.send({
                         type: 'SYNC',
                         ...latestStateRef.current
                     });
                     connsRef.current.forEach(c => {
                         if (c.open) c.send({ type: 'PEER_COUNT', count: connsRef.current.length });
                     });
                 }
             };
             if (conn.open) updateStatus();
             conn.on('open', updateStatus);
             conn.on('data', (data: any) => {
                 if (data.type === 'PEER_COUNT') {
                     if (!isHostRef.current) setConnCount(data.count);
                 } else if (data.type === 'SYNC') {
                     lastReceivedSyncRef.current = data;
                     const now = Date.now();
                     const m = lastEditedRef.current;
                     if (data.gunX !== undefined && now - (m['gunX'] || 0) > 1500) setGunX(data.gunX);
                     if (data.gunY !== undefined && now - (m['gunY'] || 0) > 1500) setGunY(data.gunY);
                     if (data.tgtX !== undefined && now - (m['tgtX'] || 0) > 1500) setTgtX(data.tgtX);
                     if (data.tgtY !== undefined && now - (m['tgtY'] || 0) > 1500) setTgtY(data.tgtY);
                     if (data.gunElevStr !== undefined && now - (m['gunElev'] || 0) > 1500) setGunElevStr(data.gunElevStr);
                     if (data.tgtElevStr !== undefined && now - (m['tgtElev'] || 0) > 1500) setTgtElevStr(data.tgtElevStr);
                     if (data.forcedChargeStr !== undefined && now - (m['charge'] || 0) > 1500) setForcedChargeStr(data.forcedChargeStr);
                     if (data.windSpeed !== undefined && now - (m['windSpeed'] || 0) > 1500) setWindSpeed(data.windSpeed);
                     if (data.windDir !== undefined && now - (m['windDir'] || 0) > 1500) setWindDir(data.windDir);
                     if (data.spotterTargets !== undefined && now - (m['spotterTargets'] || 0) > 1500) setSpotterTargets(data.spotterTargets);
                     
                     if (isHostRef.current) {
                         connsRef.current.forEach(c => {
                             if (c.open && c !== conn) c.send(data);
                         });
                     }
                 } else if (data.type === 'FIRE') {
                     setFireStarts(prev => [...prev, {
                         id: data.payload.id || Date.now(),
                         start: data.payload.start || Date.now(),
                         tof: data.payload.tof,
                         tx: data.payload.tx,
                         ty: data.payload.ty,
                         disp: data.payload.disp
                     }]);
                     setNow(Date.now());
                     if (isHostRef.current) {
                         connsRef.current.forEach(c => {
                             if (c.open && c !== conn) c.send(data);
                         });
                     }
                 } else if (data.type === 'CANCEL_FIRE') {
                     setFireStarts([]);
                     if (isHostRef.current) {
                         connsRef.current.forEach(c => {
                             if (c.open && c !== conn) c.send(data);
                         });
                     }
                 }
             });
             conn.on('close', () => {
                 connsRef.current = connsRef.current.filter(c => c !== conn);
                 setConnCount(connsRef.current.length);
                 if (isHostRef.current) {
                     connsRef.current.forEach(c => {
                         if (c.open) c.send({ type: 'PEER_COUNT', count: connsRef.current.length });
                     });
                 }
                 if (connsRef.current.length === 0) setPeerStatus(isHostRef.current ? 'HOSTING' : 'OFFLINE');
             });
             conn.on('error', () => {
                 connsRef.current = connsRef.current.filter(c => c !== conn);
                 setConnCount(connsRef.current.length);
                 if (isHostRef.current) {
                     connsRef.current.forEach(c => {
                         if (c.open) c.send({ type: 'PEER_COUNT', count: connsRef.current.length });
                     });
                 }
                 if (connsRef.current.length === 0) setPeerStatus(isHostRef.current ? 'HOSTING' : 'OFFLINE');
             });
         };

         // Attempt to connect as client first
         const clientPeerId = `m777-${linkCode}-B-${Math.floor(Math.random()*1000)}`;
         const peer = new Peer(clientPeerId);
         peerRef.current = peer;
         isHostRef.current = false;

         peer.on('open', () => {
             const hostId = `m777-${linkCode}-A`;
             const conn = peer.connect(hostId, { reliable: true });
             
             // Setup a timeout for connection
             const connTimeout = setTimeout(() => {
                 if (!conn.open) {
                     // We couldn't connect to host, we must BE the host
                     peer.destroy();
                     const hostPeer = new Peer(hostId);
                     peerRef.current = hostPeer;
                     isHostRef.current = true;
                     hostPeer.on('open', () => {
                         setPeerStatus('HOSTING');
                     });
                     hostPeer.on('connection', (incomingConn) => {
                         connsRef.current.push(incomingConn);
                         setConnCount(connsRef.current.length);
                         setupConnectionListeners(incomingConn);
                     });
                     hostPeer.on('error', () => {
                         setPeerStatus('OFFLINE');
                     });
                 }
             }, 3000);

             conn.on('open', () => {
                 clearTimeout(connTimeout);
                 connsRef.current = [conn];
                 setConnCount(1);
                 setupConnectionListeners(conn);
             });
             
             conn.on('error', () => {
                 // Handled by timeout above
             });
         });
         
         peer.on('error', () => {
             // If ID is taken, we'll try again
             setPeerStatus('OFFLINE');
         });

         return () => {
             connsRef.current.forEach(c => c.close());
             connsRef.current = [];
             setConnCount(0);
             if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
         };
     } else {
         connsRef.current.forEach(c => c.close());
         connsRef.current = [];
         setConnCount(0);
         if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
         setPeerStatus('OFFLINE');
     }
  }, [linkCode]);

  // Sync out changes
  useEffect(() => {
      if (connsRef.current.length > 0 && (peerStatus === 'CONNECTED' || peerStatus === 'HOSTING')) {
          const timeout = setTimeout(() => {
              const last = lastReceivedSyncRef.current;
              if (last &&
                  last.gunX === gunX &&
                  last.gunY === gunY &&
                  last.tgtX === tgtX &&
                  last.tgtY === tgtY &&
                  last.gunElevStr === gunElevStr &&
                  last.tgtElevStr === tgtElevStr &&
                  last.forcedChargeStr === forcedChargeStr &&
                  last.windSpeed === windSpeed &&
                  last.windDir === windDir &&
                  JSON.stringify(last.spotterTargets) === JSON.stringify(spotterTargets)
              ) {
                  lastReceivedSyncRef.current = null;
                  return; // Do not echo back the exact state we just received
              }

              connsRef.current.forEach(conn => {
                  if (conn.open) {
                      conn.send({
                          type: 'SYNC',
                          gunX, gunY, tgtX, tgtY, gunElevStr, tgtElevStr, forcedChargeStr, windSpeed, windDir, spotterTargets
                      });
                  }
              });
          }, 200);
          return () => clearTimeout(timeout);
      }
  }, [gunX, gunY, tgtX, tgtY, gunElevStr, tgtElevStr, forcedChargeStr, windSpeed, windDir, peerStatus, spotterTargets]);


  const [fireStarts, setFireStarts] = useState<{id: number, start: number, tof: number, tx: number, ty: number, disp: number}[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (fireStarts.length > 0 || fireDelayEnd !== null) {
      interval = setInterval(() => setNow(Date.now()), 100);
    }
    return () => clearInterval(interval);
  }, [fireStarts.length, fireDelayEnd]);

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
          
      }
  };

  const activeRange = gridData ? gridData.range.toString() : '';

  const calculation = useMemo(() => {
    try {
        if (!activeRange) return { valid: false, message: 'WAITING FOR DATA...' };

        const rawR = parseFloat(activeRange);
        
        if (isNaN(rawR)) return { valid: false, message: 'INVALID RANGE' };
        const r = rawR;
        
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

const gunElevAlt = parseFloat(gunElevStr);
    const tgtElevAlt = parseFloat(tgtElevStr);
    let deltaH = 0;
    if (!isNaN(gunElevAlt) && !isNaN(tgtElevAlt)) {
        deltaH = tgtElevAlt - gunElevAlt;
    }

    let wSpeed = parseFloat(windSpeed);
    if (isNaN(wSpeed)) wSpeed = 0;
    let wDir = parseFloat(windDir);
    if (isNaN(wDir)) wDir = 0;

    let targetAzRad = 0;
    if (gridData && gridData.azimuth !== undefined) {
        targetAzRad = (gridData.azimuth / 6400) * 2 * Math.PI;
    }

    const tDX = r * Math.sin(targetAzRad);
    const tDY = r * Math.cos(targetAzRad);

    const activeV0 = activeCharge.coef * BASE_VELOCITY;

    // Spin up LIVE 3D Physics Solver
    const sol = solveFiringSolution(activeV0, tDX, tDY, deltaH, wSpeed, wDir);

    const finalElev = sol.elev;
    const finalTof = sol.tof;
    const azFix = sol.azFix;

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
        tof: finalTof,
        azFix: Math.round(azFix)
    };
    } catch (err: any) {
        return { valid: false, message: `CRASH: ${err.message}` };
    }
  }, [activeRange, gunElevStr, tgtElevStr, forcedCharge, gridData, windSpeed, windDir]);

  useEffect(() => {
    setFireStarts(prev => prev.filter(fs => {
        const elapsed = (now - fs.start) / 1000;
        return fs.tof - elapsed >= -3;
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const finalAzimuth = (gridData && calculation.valid && calculation.azFix !== undefined) ? (gridData.azimuth + calculation.azFix + 6400) % 6400 : gridData?.azimuth;
  const azMilStr = finalAzimuth !== undefined ? finalAzimuth.toString().padStart(4, '0') : '----';
  const azDegStr = finalAzimuth !== undefined ? (finalAzimuth * (360 / 6400)).toFixed(1) : '--.-';

  const elMilStr = (calculation.valid && calculation.elev !== undefined) ? calculation.elev.toString().padStart(4, '0') : '----';
  const elDegStr = (calculation.valid && calculation.elev !== undefined) ? (calculation.elev * (360 / 6400)).toFixed(1) : '--.-';

  const tofStr = (calculation.valid && calculation.tof !== undefined) ? calculation.tof.toFixed(1) : '--.-';

  const chargeStr = (calculation.valid && calculation.charge !== undefined) ? calculation.charge : '-';

  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let mapFg = '#ffb000';
      if (theme === 'GREEN') mapFg = '#33ff33';
      else if (theme === 'RED') mapFg = '#cc0000';
      else if (theme === 'WHITE') mapFg = '#f4f4f4';
      
      const mapFg40 = mapFg + '40';
      const mapFg80 = mapFg + '80';

      const mapMeters = mapSize * 1000;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 100m Sub-grid (Faint)
      ctx.strokeStyle = mapFg40;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([]); 
      ctx.beginPath();
      const start100X = Math.floor(mapOriginX / 100) * 100;
      const start100Y = Math.floor(mapOriginY / 100) * 100;
      for (let x = start100X; x <= mapOriginX + mapMeters; x += 100) {
          if (x % 1000 === 0) continue;
          const px = Math.floor(((x - mapOriginX) / mapMeters) * canvas.width) + 0.5;
          ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
      }
      for (let y = start100Y; y <= mapOriginY + mapMeters; y += 100) {
          if (y % 1000 === 0) continue;
          const py = Math.floor(canvas.height - ((y - mapOriginY) / mapMeters) * canvas.height) + 0.5;
          ctx.moveTo(0, py); ctx.lineTo(canvas.width, py);
      }
      ctx.stroke();

      // 1km Major grid (Solid)
      ctx.strokeStyle = mapFg80;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([]);
      ctx.beginPath();
      const start1000X = Math.floor(mapOriginX / 1000) * 1000;
      const start1000Y = Math.floor(mapOriginY / 1000) * 1000;
      for (let x = start1000X; x <= mapOriginX + mapMeters; x += 1000) {
          const px = Math.floor(((x - mapOriginX) / mapMeters) * canvas.width) + 0.5;
          ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
      }
      for (let y = start1000Y; y <= mapOriginY + mapMeters; y += 1000) {
          const py = Math.floor(canvas.height - ((y - mapOriginY) / mapMeters) * canvas.height) + 0.5;
          ctx.moveTo(0, py); ctx.lineTo(canvas.width, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = mapFg;
      ctx.font = '10px monospace';
      for (let x = start1000X; x <= mapOriginX + mapMeters; x += 1000) {
          const px = ((x - mapOriginX) / mapMeters) * canvas.width;
          if (x >= 0) ctx.fillText((Math.floor(x/1000) % 100).toString().padStart(2,'0'), px + 2, canvas.height - 2);
      }
      for (let y = start1000Y; y <= mapOriginY + mapMeters; y += 1000) {
          const py = canvas.height - ((y - mapOriginY) / mapMeters) * canvas.height;
          if (y >= 0 && py < canvas.height - 10) ctx.fillText((Math.floor(y/1000) % 100).toString().padStart(2,'0'), 2, py - 2);
      }

      const drawPoint = (x: number | null, y: number | null, label: string, alt?: string) => {
          if (x === null || y === null) return null;
          const px = ((x - mapOriginX) / mapMeters) * canvas.width;
          const py = canvas.height - ((y - mapOriginY) / mapMeters) * canvas.height;
          
          ctx.strokeStyle = mapFg;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px - 5, py); ctx.lineTo(px + 5, py);
          ctx.moveTo(px, py - 5); ctx.lineTo(px, py + 5);
          ctx.stroke();
          ctx.fillStyle = mapFg;
          ctx.textAlign = 'left';
          ctx.font = '10px "TX02", monospace';
          ctx.fillText(label, px + 8, py - 8);

          const xStr = Math.round(x).toString().padStart(4, '0').slice(-4);
          const yStr = Math.round(y).toString().padStart(4, '0').slice(-4);
          const coordStr = `${xStr} ${yStr}`;
          
          const tWidth = ctx.measureText(coordStr).width;
          let textX = px + 8;
          if (textX + tWidth > canvas.width - 5) {
              textX = px - 8 - tWidth;
          }
          ctx.fillText(coordStr, textX, py + 12);
          
          if (alt) {
              ctx.fillText(`ALT ${alt}`, textX, py + 22);
          }
          
          return {px, py};
      };

      const g_x = parseGridPiece(gunX);
      const g_y = parseGridPiece(gunY);
      const t_x = parseGridPiece(tgtX);
      const t_y = parseGridPiece(tgtY);

      let gunPos = drawPoint(g_x, g_y, 'GUN', gunElevStr);

      if (gunPos) {
          let minR = CHARGES[0].min;
          let maxR = CHARGES[CHARGES.length - 1].max;
          
          if (forcedCharge !== null) {
              const fc = CHARGES.find(c => c.id === forcedCharge);
              if (fc) {
                  minR = fc.min;
                  maxR = fc.max;
              }
          }

          const minRPx = (minR / mapMeters) * canvas.width;
          const maxRPx = (maxR / mapMeters) * canvas.width;
          
          ctx.strokeStyle = mapFg;
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

          const wSpd = parseFloat(windSpeed);
          const wDir = parseFloat(windDir);
          if (!isNaN(wSpd) && !isNaN(wDir) && wSpd > 0) {
              const maxLen = 40;
              const len = Math.min(1, wSpd / 15) * maxLen;
              
              const angleRad = wDir * (Math.PI / 180);
              const dx = Math.sin(angleRad) * len;
              const dy = -Math.cos(angleRad) * len;
              
              const endX = gunPos.px + dx;
              const endY = gunPos.py + dy;

              ctx.beginPath();
              ctx.moveTo(gunPos.px, gunPos.py);
              ctx.lineTo(endX, endY);
              
              const headLen = 6;
              const headAngle = Math.atan2(dy, dx);
              ctx.lineTo(endX + Math.cos(headAngle - Math.PI / 6) * headLen, endY + Math.sin(headAngle - Math.PI / 6) * headLen);
              ctx.moveTo(endX, endY);
              ctx.lineTo(endX + Math.cos(headAngle + Math.PI / 6) * headLen, endY + Math.sin(headAngle + Math.PI / 6) * headLen);
              
              ctx.strokeStyle = mapFg;
              ctx.lineWidth = 1;
              ctx.stroke();
          }
      }
      
      // T1-T9 SPOTTER TAGS
      for (let i = 1; i <= 9; i++) {
          const st = spotterTargets[i];
          if (st && st.x !== '' && st.y !== '') {
              const sx = parseInt(st.x);
              const sy = parseInt(st.y);
              const px = Math.floor(((sx - mapOriginX) / mapMeters) * canvas.width) + 0.5;
              const py = Math.floor(canvas.height - ((sy - mapOriginY) / mapMeters) * canvas.height) + 0.5;
              
              if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
                  const isLocked = st.x.padStart(4, '0') === tgtX.padStart(4, '0') && st.y.padStart(4, '0') === tgtY.padStart(4, '0');
                  
                  if (!isLocked) {
                      ctx.lineWidth = 1.0;
                      ctx.strokeStyle = mapFg;
                      ctx.beginPath();
                      ctx.moveTo(px - 6, py - 6); ctx.lineTo(px + 6, py + 6);
                      ctx.moveTo(px - 6, py + 6); ctx.lineTo(px + 6, py - 6);
                      ctx.stroke();
                  }
                  
                  ctx.fillStyle = mapFg;
                  ctx.textAlign = 'right';
                  ctx.textBaseline = 'bottom';
                  ctx.font = '10px "TX02", monospace';
                  ctx.fillText(`T${i}`, px - 6, py - 6);
              }
          }
      }
      
      let tgtOrigPos = drawPoint(t_x, t_y, 'TGT', tgtElevStr);
      
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
          tgtAdjPos = drawPoint(final_tx, final_ty, 'ADJ', tgtElevStr);
          if (tgtOrigPos && tgtAdjPos) {
              ctx.strokeStyle = mapFg80;
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
          ctx.strokeStyle = mapFg;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(gunPos.px, gunPos.py);
          ctx.lineTo(activeTgtPos.px, activeTgtPos.py);
          ctx.stroke();
          ctx.setLineDash([]);

          if (calculation.valid && calculation.dispersion) {
              const rPx = (calculation.dispersion / mapMeters) * canvas.width;
              ctx.beginPath();
              ctx.setLineDash([2, 4]); 
              ctx.arc(activeTgtPos.px, activeTgtPos.py, Math.max(1, rPx), 0, 2 * Math.PI);
              ctx.strokeStyle = mapFg;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.setLineDash([]);
          }
          
          fireStarts.forEach((fs) => {
              const elapsed = (Date.now() - fs.start) / 1000;
              const progress = elapsed / fs.tof;
              const isHit = progress >= 1;
              
              const tOrigPx = ((fs.tx - mapOriginX) / mapMeters) * canvas.width;
              const tOrigPy = canvas.height - ((fs.ty - mapOriginY) / mapMeters) * canvas.height;
              
              if (isHit) {
                  const blinkOn = Math.floor(Date.now() / 150) % 2 === 0;
                  const rPx = (fs.disp / mapMeters) * canvas.width;
                  
                  ctx.beginPath();
                  ctx.setLineDash(blinkOn ? [] : [2, 4]); 
                  ctx.arc(tOrigPx, tOrigPy, Math.max(1, rPx), 0, 2 * Math.PI);
                  ctx.strokeStyle = mapFg;
                  ctx.lineWidth = blinkOn ? 3 : 1; 
                  ctx.stroke();
                  if (blinkOn) {
                      ctx.fillStyle = mapFg80;
                      ctx.fill();
                  }
                  ctx.setLineDash([]);
              } else if (progress >= 0 && progress <= 1) {
                  const currentPx = gunPos.px + (tOrigPx - gunPos.px) * progress;
                  const currentPy = gunPos.py + (tOrigPy - gunPos.py) * progress;
                  
                  const blinkOn = Math.floor(Date.now() / 150) % 2 === 0;
                  ctx.beginPath();
                  ctx.arc(currentPx, currentPy, 4, 0, 2 * Math.PI);
                  if (blinkOn) {
                      ctx.fillStyle = mapFg;
                      ctx.fill();
                  } else {
                      ctx.strokeStyle = mapFg;
                      ctx.lineWidth = 2;
                      ctx.stroke();
                  }
              }
          });
      }
  }, [activePage, mapSize, gunX, gunY, tgtX, tgtY, adjN, adjS, adjE, adjW, calculation, now, fireStarts, mapOriginX, mapOriginY, theme, spotterTargets]);

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
      let coordX = Math.round(((px / canvas.width) * mapMeters) + mapOriginX);
      let coordY = Math.round((((canvas.height - py) / canvas.height) * mapMeters) + mapOriginY);
      
      let snappedAlt = '';
      // Snap to nearest spotter target within 100m
      for (let i = 1; i <= 9; i++) {
          const st = spotterTargets[i];
          if (st && st.x !== '' && st.y !== '') {
              const sx = parseInt(st.x);
              const sy = parseInt(st.y);
              if (Math.hypot(coordX - sx, coordY - sy) <= 100) {
                  coordX = sx;
                  coordY = sy;
                  snappedAlt = st.alt || '';
                  break;
              }
          }
      }

      coordX = Math.max(0, coordX);
      coordY = Math.max(0, coordY);
      const xStr = coordX.toString().padStart(4, '0');
      const yStr = coordY.toString().padStart(4, '0');
      
      lastEditedRef.current['tgtX'] = Date.now();
      lastEditedRef.current['tgtY'] = Date.now();
      lastEditedRef.current['gunX'] = Date.now();
      lastEditedRef.current['gunY'] = Date.now();
      
      if (mapMode === 'gun') {
          setGunX(xStr);
          setGunY(yStr);
          if (snappedAlt) setGunElevStr(snappedAlt);
          setMapMode(null);
          
      } else if (mapMode === 'tgt') {
          setTgtX(xStr);
          setTgtY(yStr);
          if (snappedAlt) setTgtElevStr(snappedAlt);
          setMapMode(null);
          
      }
      setCursorPos(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      let coordX = Math.round(((px / canvas.width) * mapMeters) + mapOriginX);
      let coordY = Math.round((((canvas.height - py) / canvas.height) * mapMeters) + mapOriginY);
      
      let snapped = false;
      for (let i = 1; i <= 9; i++) {
          const st = spotterTargets[i];
          if (st && st.x !== '' && st.y !== '') {
              const sx = parseInt(st.x);
              const sy = parseInt(st.y);
              if (Math.hypot(coordX - sx, coordY - sy) <= 100) {
                  coordX = sx;
                  coordY = sy;
                  snapped = true;
                  break;
              }
          }
      }

      coordX = Math.max(0, coordX);
      coordY = Math.max(0, coordY);

      const xStr = coordX.toString().padStart(4, '0');
      const yStr = coordY.toString().padStart(4, '0');

      // If we snapped to a specific world coordinate, we need to re-derive the scaled client px/py so the crosshair jumps
      const dispPx = snapped ? (((coordX - mapOriginX) / mapMeters) * canvas.width) / scaleX : xPx;
      const dispPy = snapped ? (canvas.height - (((coordY - mapOriginY) / mapMeters) * canvas.height)) / scaleY : yPx;

      setCursorPos({
          clientPx: dispPx,
          clientPy: dispPy,
          coord: `${xStr} ${yStr}`
      });
  };

  const handleZoomFit = () => {
      if (zoomMode === 'FIT') {
          setZoomMode('OFF');
          setMapOriginX(0);
          setMapOriginY(0);
          return;
      }
      
      let gx = parseGridPiece(gunX);
      let gy = parseGridPiece(gunY);
      let tx = parseGridPiece(tgtX);
      let ty = parseGridPiece(tgtY);
      
      if (gx === null && tx === null) return;
      
      let minX = Math.min(gx !== null ? gx : tx!, tx !== null ? tx : gx!);
      let maxX = Math.max(gx !== null ? gx : tx!, tx !== null ? tx : gx!);
      let minY = Math.min(gy !== null ? gy : ty!, ty !== null ? ty : gy!);
      let maxY = Math.max(gy !== null ? gy : ty!, ty !== null ? ty : gy!);

      // Padding wiggle room ~500m around bounds
      minX = Math.max(0, minX - 500);
      minY = Math.max(0, minY - 500);
      maxX += 500;
      maxY += 500;

      const deltaX = maxX - minX;
      const deltaY = maxY - minY;
      const reqMeters = Math.max(deltaX, deltaY, 1000);
      
      const newMapSize = Math.ceil(reqMeters / 1000);
      setFitMapSize(newMapSize);
      setZoomMode('FIT');
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      setMapOriginX(Math.max(0, Math.round(centerX - (newMapSize * 1000) / 2)));
      setMapOriginY(Math.max(0, Math.round(centerY - (newMapSize * 1000) / 2)));
  };
  
  const handleCycleZoom = () => {
      const centerX = mapOriginX + (mapSize * 1000) / 2;
      const centerY = mapOriginY + (mapSize * 1000) / 2;

      let nextMode: 'OFF' | '2X' | '4X' | '8X' = 'OFF';
      
      if (zoomMode === 'OFF' || zoomMode === 'FIT') {
          nextMode = '2X';
      } else if (zoomMode === '2X') {
          nextMode = '4X';
      } else if (zoomMode === '4X') {
          nextMode = '8X';
      } else {
          nextMode = 'OFF';
      }

      setZoomMode(nextMode);
      
      if (nextMode === 'OFF') {
          setMapOriginX(0);
          setMapOriginY(0);
      } else {
          const nextSize = nextMode === '2X' ? baseMapSize / 2 : 
                           nextMode === '4X' ? baseMapSize / 4 : 
                           nextMode === '8X' ? baseMapSize / 8 : 
                           baseMapSize;
          setMapOriginX(Math.max(0, centerX - (nextSize * 1000) / 2));
          setMapOriginY(Math.max(0, Math.max(0, centerY - (nextSize * 1000) / 2))); // ensure > 0
      }
  };

  const handlePan = (dir: 'N' | 'S' | 'E' | 'W') => {
      if (zoomMode === 'OFF') return;
      const step = (mapSize * 1000) * 0.25; 
      if (dir === 'N') setMapOriginY(prev => Math.max(0, prev + step));
      if (dir === 'S') setMapOriginY(prev => Math.max(0, prev - step));
      if (dir === 'E') setMapOriginX(prev => Math.max(0, prev + step));
      if (dir === 'W') setMapOriginX(prev => Math.max(0, prev - step));
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
      
      
  };

  const handleGridAdjust = (type: 'gun' | 'tgt', dir: 'N' | 'S' | 'E' | 'W') => {
      let xStr = type === 'gun' ? gunX : tgtX;
      let yStr = type === 'gun' ? gunY : tgtY;
      
      let x = parseGridPiece(xStr) || 0;
      let y = parseGridPiece(yStr) || 0;

      if (dir === 'N') y += 10;
      if (dir === 'S') y -= 10;
      if (dir === 'E') x += 10;
      if (dir === 'W') x -= 10;
      
      x = Math.max(0, x);
      y = Math.max(0, y);

      const newX = x.toString().padStart(4, '0');
      const newY = y.toString().padStart(4, '0');

      if (type === 'gun') {
          setGunX(newX);
          setGunY(newY);
      } else {
          setTgtX(newX);
          setTgtY(newY);
      }
      
  };

  const handleResetAdjust = () => {
      setAdjN('');
      setAdjS('');
      setAdjE('');
      setAdjW('');
      
  };

  const handleCancelFire = () => {
      setFireStarts([]);
      setFireDelayEnd(null);
      if (connsRef.current.length > 0 && (peerStatus === 'CONNECTED' || peerStatus === 'HOSTING')) {
          connsRef.current.forEach(conn => {
              if (conn.open) {
                  conn.send({ type: 'CANCEL_FIRE' });
              }
          });
      }
  };

  const handleFire = () => {
    if (calculation.valid && calculation.tof) {
      let t_x = parseGridPiece(tgtX);
      let t_y = parseGridPiece(tgtY);
      const isAdjusted = (parseFloat(adjN||'0') !== 0 || parseFloat(adjS||'0') !== 0 || parseFloat(adjE||'0') !== 0 || parseFloat(adjW||'0') !== 0);
      if (isAdjusted && t_x !== null && t_y !== null) {
          t_x += parseFloat(adjE || '0') - parseFloat(adjW || '0');
          t_y += parseFloat(adjN || '0') - parseFloat(adjS || '0');
      }

      const newFire = {
          id: Date.now(),
          start: Date.now(),
          tof: calculation.tof,
          tx: t_x || 0,
          ty: t_y || 0,
          disp: calculation.dispersion || 0
      };

      setFireStarts(prev => [...prev, newFire]);
      setNow(Date.now());
      setFireDelayEnd(null);
      
      if (connsRef.current.length > 0 && (peerStatus === 'CONNECTED' || peerStatus === 'HOSTING')) {
          connsRef.current.forEach(conn => {
              if (conn.open) {
                  conn.send({
                      type: 'FIRE',
                      payload: {
                          id: newFire.id,
                          start: newFire.start,
                          tof: newFire.tof,
                          tx: newFire.tx,
                          ty: newFire.ty,
                          disp: newFire.disp
                      }
                  });
              }
          });
      }
    }
  };

  useEffect(() => {
      if (fireDelayEnd !== null) {
          const checkDelay = () => {
              if (Date.now() >= fireDelayEnd) {
                  setFireDelayEnd(null);
                  handleFire();
              }
          };
          const interval = setInterval(checkDelay, 100);
          return () => clearInterval(interval);
      }
  }, [fireDelayEnd, calculation.valid, tgtX, tgtY, adjN, adjS, adjE, adjW]);


  let timerRender = null;
  if (fireStarts.length > 0) {
      timerRender = (
          <div style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
              {fireStarts.map((fs) => {
                  const elapsed = (now - fs.start) / 1000;
                  const remaining = fs.tof - elapsed;
                  if (remaining > 0) {
                      return (
                          <div key={fs.id} style={{ padding: '5px', background: 'var(--term-bg)', border: '1px dashed var(--term-border)', color: 'var(--term-fg)', fontSize: '14px', textAlign: 'right' }}>
                              T - {remaining.toFixed(1)}
                          </div>
                      );
                  } else if (remaining > -3) {
                      const blinkOn = Math.floor(Date.now() / 250) % 2 === 0;
                      return (
                          <div key={fs.id} style={{ padding: '5px 10px', background: blinkOn ? 'var(--term-fg)' : 'var(--term-bg)', color: blinkOn ? 'var(--term-bg)' : 'var(--term-fg)', border: '1px solid var(--term-fg)', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
                              SPLASH
                          </div>
                      );
                  }
                  return null;
              })}
          </div>
      );
  }

  const adjNS = adjN ? `N ${adjN}` : (adjS ? `S ${adjS}` : '');
  const adjEW = adjE ? `E ${adjE}` : (adjW ? `W ${adjW}` : '');
  let adjStr = `${adjNS}  ${adjEW}`.trim();
  if (!adjStr) adjStr = '-- M';

  return (
    <div className="mfd-outer">
      <header className="terminal-header" style={{ borderBottom: '1px solid var(--term-border)', paddingBottom: '5px', marginBottom: '5px' }}>
        <h1 style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>M777 BALLISTIC COMPUTER</h1>
      </header>

      <div className="mfd-main">
        <div className="mfd-sidebar left">
            <button className={`osb-button ${activePage === 'MAP' ? 'active' : ''}`} onClick={() => setActivePage('MAP')}>FDC</button>
            <button className={`osb-button ${activePage === 'SPOTTER' ? 'active' : ''}`} onClick={() => setActivePage('SPOTTER')}>SPOT</button>
            <button className={`osb-button ${activePage === 'GUNNER' ? 'active' : ''}`} onClick={() => setActivePage('GUNNER')}>GUN</button>

            <div style={{ flex: 1 }} />

            <button className={`osb-button ${showMapSizeControls ? 'active' : ''}`} onClick={() => setShowMapSizeControls(!showMapSizeControls)}>MAP<br/>SIZE</button>
            
            {showMapSizeControls && (
                <>
                    <button className="osb-button" onClick={() => setBaseMapSize(prev => Math.min(99, prev + 1))}>+ 1 KM²</button>
                    <button className="osb-button" onClick={() => setBaseMapSize(prev => Math.max(1, prev - 1))}>- 1 KM²</button>
                </>
            )}
            
            <button 
                className={`osb-button ${activeField === 'linkCode' ? 'term-cursor-animate active' : ''}`} 
                onClick={() => { setActiveField('linkCode'); setJustFocusedField('linkCode'); }}
                style={{ position: 'relative' }}
            >
                LINK
                <br />
                {linkCode.padEnd(4, '—')}
            </button>
            <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '4px', marginBottom: '16px', letterSpacing: '1px', opacity: peerStatus === 'OFFLINE' ? 0.5 : 1, color: 'var(--term-fg)' }}>
                {peerStatus === 'WAITING' ? <span>LINKING<span className="loading-dots"></span></span> : peerStatus}
                {connCount > 0 && <div>NET: {connCount + 1}</div>}
            </div>

            <button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>
        </div>

        <div className="mfd-screen">
          {activePage === 'COORDS' && (
            <div className="input-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="input-group">
            <label>MAP SIZE (KM²):</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <input 
                    type="number" 
                    value={mapSize} 
                    onChange={(e) => setBaseMapSize(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '6px', width: '80px', outline: 'none', fontSize: '16px' }}
                />
            </div>
        </div>
        <div style={{ borderBottom: '1px dashed var(--term-border)', margin: '20px 0', opacity: 0.5 }} />
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
                        value={forcedChargeStr === '' ? 'AUTO' : forcedChargeStr}
                        onChange={(e) => {
                            setForcedChargeStr(e.target.value === 'AUTO' ? '' : e.target.value);
                            
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





      {activePage === 'GUNNER' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '20px', overflowY: 'auto' }}>
              <div style={{ borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px', fontSize: '14px', letterSpacing: '0.1em', textAlign: 'center' }}>
                  GUNNER DISPLAY
              </div>
              
              {!calculation.valid ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ fontSize: '24px', animation: 'blinker 1s linear infinite' }}>WAITING FOR DATA</div>
                      <div style={{ fontSize: '14px', opacity: 0.7 }}>{calculation.message || 'NO SOLUTION'}</div>
                  </div>
              ) : (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '40px' }}>
                      {/* Periscope Visual */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 250px', gridTemplateRows: '250px 120px', gap: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '48px', fontWeight: 'bold' }}>
                              <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '16px', opacity: 0.7, marginBottom: '8px' }}>ELEV (Y)</div>
                                  <div>{elMilStr}</div>
                              </div>
                          </div>
                          <div style={{ position: 'relative', width: '250px', height: '250px', border: '4px solid var(--term-fg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'var(--term-fg)', opacity: 0.4 }} />
                              <div style={{ position: 'absolute', width: '2px', height: '100%', background: 'var(--term-fg)', opacity: 0.4 }} />
                              <div style={{ width: '40px', height: '40px', border: '2px solid var(--term-fg)', borderRadius: '50%', opacity: 0.8 }} />
                          </div>
                          <div />
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: '48px', fontWeight: 'bold' }}>
                              <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '16px', opacity: 0.7, marginBottom: '8px' }}>DEFL (X)</div>
                                  <div>{azMilStr}</div>
                              </div>
                          </div>
                      </div>

                      {/* Loadout Visual */}
                      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end' }}>
                          {/* Shell */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                              <svg viewBox="0 0 64 184" width="78" height="224" stroke="currentColor" fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ overflow: 'visible' }}>
                                  {/* Shell Outline */}
                                  <path d="M 29 4 L 35 4 L 38 20 Q 49 42 52 92 L 52 152 L 52 157 L 47 182 L 17 182 L 12 157 L 12 152 L 12 92 Q 15 42 26 20 L 29 4 Z" />
                                  {/* Driving Band Lines */}
                                  <line x1="12" y1="152" x2="52" y2="152" />
                                  <line x1="12" y1="157" x2="52" y2="157" />
                                  {/* Fuze Base Line */}
                                  <line x1="26" y1="20" x2="38" y2="20" />
                                  {/* Fuze Detent */}
                                  <circle cx="32" cy="14" r="1.5" stroke="none" fill="currentColor" />
                                  {/* Weight Zone Squares */}
                                  <rect x="23" y="65" width="4" height="4" fill="currentColor" stroke="none" />
                                  <rect x="30" y="65" width="4" height="4" fill="currentColor" stroke="none" />
                                  <rect x="37" y="65" width="4" height="4" fill="currentColor" stroke="none" />
                                  {/* Lettering */}
                                  <text x="32" y="115" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" fontWeight="bold" letterSpacing="1">TNT</text>
                                  <text x="32" y="135" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="bold">155 MM</text>
                              </svg>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>M107<br/>HE</div>
                          </div>

                          {/* Charges */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
                                  {[1, 2, 3, 4, 5].map(c => {
                                      const activeChg = parseInt(String(chargeStr)) || 0;
                                      const isActive = activeChg >= c;
                                      return (
                                          <div key={c} style={{ width: '80px', height: '40px', border: '4px solid var(--term-fg)', background: isActive ? 'var(--term-fg)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--term-bg)' : 'var(--term-fg)', fontWeight: 'bold', fontSize: '24px' }}>
                                              {c}
                                          </div>
                                      );
                                  })}
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>CHG<br/>{chargeStr}</div>
                          </div>
                      </div>
                      
                      {/* TOF Bar */}
                      {fireStarts.length > 0 && (
                          <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                                  <span>TIME OF FLIGHT</span>
                                  <span>
                                      {Math.min(fireStarts[fireStarts.length - 1].tof, (now - fireStarts[fireStarts.length - 1].start) / 1000).toFixed(1)}s / {fireStarts[fireStarts.length - 1].tof.toFixed(1)}s
                                  </span>
                              </div>
                              <div style={{ width: '100%', height: '24px', border: '2px solid var(--term-fg)', position: 'relative' }}>
                                  <div style={{ 
                                      height: '100%', 
                                      background: 'var(--term-fg)', 
                                      width: `${Math.min(100, ((now - fireStarts[fireStarts.length - 1].start) / 1000) / fireStarts[fireStarts.length - 1].tof * 100)}%`,
                                      transition: 'width 0.1s linear'
                                  }} />
                                  {((now - fireStarts[fireStarts.length - 1].start) / 1000) >= fireStarts[fireStarts.length - 1].tof && (
                                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--term-bg)', fontWeight: 'bold', animation: 'blinker 0.2s linear infinite' }}>
                                          SPLASH
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      )}

      {activePage === 'SETTINGS' && (
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px', fontSize: '11px', letterSpacing: '0.1em' }}>
                  SYSTEM CONFIGURATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ color: 'var(--term-fg)', opacity: 0.7 }}>UI COLOR THEME:</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => setTheme('AMBER')} className={`osb-button ${theme === 'AMBER' ? 'active' : ''}`} style={{ flex: 1 }}>AMBER</button>
                          <button onClick={() => setTheme('GREEN')} className={`osb-button ${theme === 'GREEN' ? 'active' : ''}`} style={{ flex: 1 }}>GREEN</button>
                          <button onClick={() => setTheme('RED')} className={`osb-button ${theme === 'RED' ? 'active' : ''}`} style={{ flex: 1 }}>RED</button>
                          <button onClick={() => setTheme('WHITE')} className={`osb-button ${theme === 'WHITE' ? 'active' : ''}`} style={{ flex: 1 }}>WHITE</button>
                      </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ color: 'var(--term-fg)', opacity: 0.7 }}>TACTILE AUDIO:</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => setSoundEnabled(true)} className={`osb-button ${soundEnabled ? 'active' : ''}`} style={{ flex: 1 }}>ON</button>
                          <button onClick={() => setSoundEnabled(false)} className={`osb-button ${!soundEnabled ? 'active' : ''}`} style={{ flex: 1 }}>OFF</button>
                      </div>
                  </div>
              </div>
              <div style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '8px', opacity: 0.4, fontSize: '10px' }}>
                  M107 HE / M777A2 HOW / ARMA REFORGER MOD
              </div>
          </div>
      )}

      {(activePage === 'MAP' || activePage === 'SPOTTER') && (
          <div className={`map-page map-responsive-wrapper ${showMobileMap ? 'show-mobile-map' : ''}`}>
             <div className="map-canvas-container" style={{ position: 'relative' }}>
                 <canvas 
                     ref={canvasRef} 
                     width={800} 
                     height={800} 
                     onPointerDown={handleCanvasClick} 
                     onMouseMove={handleCanvasMouseMove}
                     onMouseLeave={() => setCursorPos(null)}
                     style={{ 
                         border: '1px solid var(--term-border)',
                         width: 'auto',
                         height: 'auto',
                         maxWidth: '100%',
                         maxHeight: '100%',
                         aspectRatio: '1 / 1',
                         display: 'block',
                         margin: '0',
                         cursor: mapMode ? 'none' : 'default',
                         position: 'relative',
                         zIndex: 1
                     }} 
                 />

                 {mapMode && cursorPos && (
                     <div style={{
                         position: 'absolute',
                         left: cursorPos.clientPx, 
                         top: cursorPos.clientPy, 
                         pointerEvents: 'none',
                         zIndex: 50,
                     }}>
                         <div style={{ position: 'absolute', left: '-20px', top: '0', width: '40px', height: '1px', background: 'var(--term-fg)' }} />
                         <div style={{ position: 'absolute', left: '0', top: '-20px', width: '1px', height: '40px', background: 'var(--term-fg)' }} />
                         <div style={{ position: 'absolute', left: '8px', top: '10px', whiteSpace: 'nowrap', color: 'var(--term-fg)', fontSize: '12px', textShadow: '0 0 2px black', fontWeight: 'bold' }}>
                             {cursorPos.coord}
                         </div>
                     </div>
                 )}
                 
                 <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', zIndex: 12 }}>
                     <div style={{ color: 'var(--term-fg)', fontSize: '10px', fontFamily: 'monospace' }}>{mapSize} KM²</div>
                 </div>
                 
                 {timerRender}
             </div>
                 <div className="dpads-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                     
                     {/* DPAD & KEYPAD ROW */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                         {/* DPAD */}
                         <div className="dpad-item">
                             <div style={{ fontSize: '12px', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' }}>{dpadMode === 'PAN' && zoomMode === 'OFF' ? 'N/A' : dpadMode}</div>
                             <div className="dpad-grid" style={{ gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(4, 40px)', gap: '4px' }}>
                                 <button className="dpad-btn" style={{fontSize: '12px', borderStyle: 'solid'}} onClick={() => { if (dpadMode === 'TGT') setDpadMode('GUN'); else if (dpadMode === 'GUN') setDpadMode('ADJUST'); else if (dpadMode === 'ADJUST') setDpadMode('PAN'); else setDpadMode('TGT'); }}>MOD</button>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'N'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'N'); else if (dpadMode === 'ADJUST') handleAdjust('N'); else if (dpadMode === 'PAN') handlePan('N'); }}>▲</RepeatButton>
                                 <button className={`dpad-btn ${dpadTgtMode ? 'active' : ''}`} style={{fontSize: '14px', borderStyle: dpadTgtMode ? 'solid' : 'dashed'}} onClick={() => setDpadTgtMode(!dpadTgtMode)}>TGT</button>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'W'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'W'); else if (dpadMode === 'ADJUST') handleAdjust('W'); else if (dpadMode === 'PAN') handlePan('W'); }}>◀</RepeatButton>
                                 {dpadMode === 'ADJUST' ? <button onClick={handleResetAdjust} className="dpad-btn dpad-btn-reset" style={{ marginTop: 0, fontSize: '18px' }}>⨯</button> : <div />}
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'E'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'E'); else if (dpadMode === 'ADJUST') handleAdjust('E'); else if (dpadMode === 'PAN') handlePan('E'); }}>▶</RepeatButton>
                                 <div />
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'S'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'S'); else if (dpadMode === 'ADJUST') handleAdjust('S'); else if (dpadMode === 'PAN') handlePan('S'); }}>▼</RepeatButton>
                                 <div />
                             </div>
                         </div>
                         
                         {/* KEYPAD */}
                         <div className="dpad-item" style={{ marginLeft: 'auto' }}>
                             <div style={{ fontSize: '12px', textAlign: 'center', marginBottom: '4px' }}>KEYPAD</div>
                             <div className="dpad-grid" style={{ gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(5, 40px)', gap: '4px' }}>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('7')}>7</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('8')}>8</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('9')}>9</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('4')}>4</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('5')}>5</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('6')}>6</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('1')}>1</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('2')}>2</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('3')}>3</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '12px', borderStyle: 'solid'}} onClick={() => handleKeypadPress('CLR')}>CLR</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => handleKeypadPress('0')}>0</RepeatButton>
                                 <button className="dpad-btn dpad-btn-reset" style={{fontSize: '12px', borderStyle: 'solid'}} onClick={() => handleKeypadPress('DEL')}>DEL</button>
                                 <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '4px' }}>
                                     <button className="dpad-btn" style={{ flex: 1, fontSize: '18px', borderStyle: 'solid', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleKeypadPress('PREV')}>▲</button>
                                     <button className="dpad-btn" style={{ flex: 1, fontSize: '18px', borderStyle: 'solid', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleKeypadPress('NEXT')}>▼</button>
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="sidebar-right-group">
                     {/* TERMINAL INPUTS */}
                         <div className={`term-inputs-wrapper ${activePage === 'SPOTTER' ? 'spotter-scroll-container' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '12px' }}>
                             {activePage === 'MAP' && (
                                 <>
                                     <TerminalField id="gunX" label="GUN X" val={gunX} />
                                     <TerminalField id="gunY" label="GUN Y" val={gunY} />
                                     <TerminalField id="gunElev" label="GUN ALT" val={gunElevStr} />
                                     <div style={{ height: '4px' }} />
                                     <TerminalField id="tgtX" label="TGT X" val={tgtX} />
                                     <TerminalField id="tgtY" label="TGT Y" val={tgtY} />
                                     <TerminalField id="tgtElev" label="TGT ALT" val={tgtElevStr} />
                                     <div style={{ height: '4px' }} />
                                     <TerminalField id="windSpeed" label="WND SPD" val={windSpeed} />
                                     <TerminalField id="windDir" label="WND DIR" val={windDir} />
                                     <div style={{ height: '4px' }} />
                                     <TerminalField id="charge" label="CHARGE" val={forcedChargeStr === '' ? 'AUTO' : forcedChargeStr} />
                                 </>
                             )}
                             {activePage === 'SPOTTER' && (
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                     <div style={{ width: '24px' }}></div>
                                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--term-fg)', fontWeight: 'bold' }}>
                                         <div>X</div>
                                         <div>Y</div>
                                         <div>EL</div>
                                     </div>
                                 </div>
                             )}
                             {activePage === 'SPOTTER' && [1,2,3,4,5,6,7,8,9].map(i => {
                                 const t = spotterTargets[i] || {x:'', y:'', alt:''};
                                 const isCurrentlyTargeted = t.x !== '' && t.y !== '' && tgtX === t.x && tgtY === t.y;
                                 return (
                                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: i < 9 ? '12px' : '0' }}>
                                         <div style={{ width: '24px', color: 'var(--term-fg)', fontSize: '11px', textAlign: 'left', fontWeight: 'bold' }}>
                                             <span style={{ display: 'inline-block', width: '10px' }}>{isCurrentlyTargeted ? '>' : '\u00A0'}</span>T{i}
                                         </div>
                                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', flex: 1 }}>
                                             <TerminalField id={`spot${i}X`} label="" val={t.x} hideLabel />
                                             <TerminalField id={`spot${i}Y`} label="" val={t.y} hideLabel />
                                             <TerminalField id={`spot${i}Alt`} label="" val={t.alt} hideLabel />
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>

                     {/* BDT */}
                         {activePage !== 'SPOTTER' && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '14px', lineHeight: '1.4', color: 'var(--term-fg)', flex: 1, justifyContent: 'flex-end' }}>
                                 <div style={{ minHeight: '22px' }}>
                                     {!calculation.valid && calculation.message !== 'WAITING FOR DATA...' && (
                                         <div style={{ color: 'var(--term-fg)', marginBottom: '8px', fontSize: '12px' }}>{calculation.message}</div>
                                     )}
                                 </div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>RNG</span><span>{gridData ? gridData.range : '----'} M</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>ADJ</span><span>{adjStr}</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--term-border)', marginTop: '4px', paddingTop: '4px' }}><span>CHG</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{chargeStr}</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>AZ</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{azDegStr}° / {azMilStr}</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>EL</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{elDegStr}° / {elMilStr}</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--term-border)', marginTop: '4px', paddingTop: '4px' }}><span>WND</span><span>{windSpeed && parseFloat(windSpeed) > 0 ? `${windSpeed}m/s @ ${windDir || '0'}` : '--'}</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>TOF</span><span>{tofStr}s</span></div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>DISP</span><span>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion}` : '--'} M</span></div>
                             </div>
                         )}
                     </div>
                 </div>
          </div>
       )}
        </div>

        <div className="mfd-sidebar right">
            <button className="osb-button mobile-map-btn" onClick={() => setShowMobileMap(p => !p)} style={{ borderStyle: 'solid' }}>
                MAP<br/>{showMobileMap ? 'HIDE' : 'SHOW'}
            </button>
            {activePage === 'MAP' ? (
                <>
                    {/* Top Group */}
                    <button
                        className="osb-button"
                        onClick={handleCycleZoom}
                        style={{ borderStyle: 'solid' }}
                    >
                        ZOOM: {zoomMode}
                    </button>
                    <button
                        className="osb-button"
                        onClick={handleZoomFit}
                    >
                        FIT ZOOM
                    </button>


                    <div style={{ flex: 1 }} />

                    {/* Center Group */}
                    <button
                        className={`osb-button ${mapMode === 'gun' ? 'active' : ''}`}
                        onClick={() => setMapMode('gun')}
                        style={{ borderStyle: mapMode === 'gun' ? 'solid' : 'dashed' }}
                    >
                        SET GUN
                    </button>
                    <button
                        className={`osb-button ${mapMode === 'tgt' ? 'active' : ''}`}
                        onClick={() => setMapMode('tgt')}
                        style={{ borderStyle: mapMode === 'tgt' ? 'solid' : 'dashed' }}
                    >
                        SET TGT
                    </button>
                    {(adjN || adjS || adjE || adjW) ? (
                        <button className="osb-button" onClick={handleCommitAdj}>
                            COMMIT<br/>ADJ
                        </button>
                    ) : null}

                    <div style={{ flex: 1 }} />

                    {/* Bottom Group */}
                    
                    <button className="osb-button" onClick={() => setIsDelayOn(p => !p)} style={{ borderStyle: 'solid', background: isDelayOn ? 'var(--term-fg)' : 'transparent', color: isDelayOn ? 'var(--term-bg)' : 'var(--term-fg)' }}>
                        DELAY<br/>{isDelayOn ? 'ON' : 'OFF'}
                    </button>
                    {calculation.valid && fireStarts.length > 0 && !fireDelayEnd && (
                        <button className="osb-button" style={{ borderStyle: 'dotted' }} onClick={() => {
                            if (isDelayOn) { setFireDelayEnd(Date.now() + 5000); setNow(Date.now()); } else handleFire();
                        }}>
                            + ROUND
                        </button>
                    )}
                    {fireDelayEnd ? (
                        <button 
                            className="osb-button" 
                            onClick={(e) => { e.stopPropagation(); setFireDelayEnd(null); }}
                            style={{ borderStyle: 'solid', animation: 'blinker 0.5s linear infinite', color: 'var(--term-bg)', background: 'var(--term-fg)' }}
                        >
                            FIRE<br/>{Math.ceil((fireDelayEnd - now) / 1000)}
                        </button>
                    ) : fireStarts.length > 0 ? (
                        <button 
                            className="osb-button btn-cancel-fire" 
                            onClick={(e) => { e.stopPropagation(); handleCancelFire(); }}
                            style={{ borderStyle: 'solid' }}
                        >
                            <span style={{ animation: 'blinker 1s linear infinite' }}>FIRE</span>
                        </button>
                    ) : (
                        <button 
                            className="osb-button" 
                            onClick={calculation.valid ? () => {
                                if (isDelayOn) { setFireDelayEnd(Date.now() + 5000); setNow(Date.now()); } else handleFire();
                            } : undefined} disabled={!calculation.valid}
                            style={{
                                borderStyle: 'solid',
                                cursor: calculation.valid ? 'pointer' : 'not-allowed',
                                opacity: calculation.valid ? 1 : 0.6,
                                background: calculation.valid 
                                    ? 'var(--term-bg)' 
                                    : 'linear-gradient(to top left, transparent 48%, var(--term-fg) 49%, var(--term-fg) 51%, transparent 52%)'
                            }}
                        >
                            FIRE
                        </button>
                    )}
                </>
            ) : (
                <>
                    {activePage === 'SPOTTER' && (
                        <>
                            <button
                                className="osb-button"
                                onClick={handleCycleZoom}
                                style={{ borderStyle: 'solid' }}
                            >
                                ZOOM: {zoomMode}
                            </button>
                            <button
                                className="osb-button"
                                onClick={handleZoomFit}
                            >
                                FIT ZOOM
                            </button>
                            <div style={{ flex: 1 }} />
                        </>
                    )}
                    {(adjN || adjS || adjE || adjW) && (
                        <button className="osb-button" onClick={handleCommitAdj}>
                            COMMIT<br/>ADJ
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button className="osb-button" onClick={() => setIsDelayOn(p => !p)} style={{ borderStyle: 'solid', background: isDelayOn ? 'var(--term-fg)' : 'transparent', color: isDelayOn ? 'var(--term-bg)' : 'var(--term-fg)' }}>
                        DELAY<br/>{isDelayOn ? 'ON' : 'OFF'}
                    </button>
                    {calculation.valid && fireStarts.length > 0 && !fireDelayEnd && (
                        <button className="osb-button" style={{ borderStyle: 'dotted' }} onClick={() => {
                            if (isDelayOn) { setFireDelayEnd(Date.now() + 5000); setNow(Date.now()); } else handleFire();
                        }}>
                            + ROUND
                        </button>
                    )}
                    {fireDelayEnd ? (
                        <button 
                            className="osb-button" 
                            onClick={(e) => { e.stopPropagation(); setFireDelayEnd(null); }}
                            style={{ borderStyle: 'solid', animation: 'blinker 0.5s linear infinite', color: 'var(--term-bg)', background: 'var(--term-fg)' }}
                        >
                            FIRE<br/>{Math.ceil((fireDelayEnd - now) / 1000)}
                        </button>
                    ) : fireStarts.length > 0 ? (
                        <button 
                            className="osb-button btn-cancel-fire" 
                            onClick={(e) => { e.stopPropagation(); handleCancelFire(); }}
                            style={{ borderStyle: 'solid' }}
                        >
                            <span style={{ animation: 'blinker 1s linear infinite' }}>FIRE</span>
                        </button>
                    ) : (
                        <button 
                            className="osb-button" 
                            onClick={calculation.valid ? () => {
                                if (isDelayOn) { setFireDelayEnd(Date.now() + 5000); setNow(Date.now()); } else handleFire();
                            } : undefined} disabled={!calculation.valid}
                            style={{
                                borderStyle: 'solid',
                                cursor: calculation.valid ? 'pointer' : 'not-allowed',
                                opacity: calculation.valid ? 1 : 0.5,
                                background: calculation.valid 
                                    ? 'var(--term-bg)' 
                                    : 'linear-gradient(to top left, transparent 48%, var(--term-fg) 49%, var(--term-fg) 51%, transparent 52%)'
                            }}
                        >
                            FIRE
                        </button>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;
