import re

with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = """const BASE_VELOCITY = 100;
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
        min: charge.min,
        max: charge.max,
        dispersion: charge.dispersion,
        data: data
    };
});"""

# Replace `// M107 HE Ballistic Data for Charges 1-5 ... const CHARGES = [...]`
pattern = re.compile(r"// M107 HE Ballistic Data for Charges 1-5\s*const CHARGES = \[\s*\{.*?\}\s*\];", re.DOTALL)
new_content, count = pattern.subn(new_logic, content)

if count > 0:
    with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Replaced {count} instances.")
else:
    print("Pattern not found! Make sure regex matches.")
