import re

with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert simulate3D and solveFiringSolution before `// Generate the high-resolution ballistics lookup table on load`
solver_code = """
function simulate3D(V0: number, elevMils: number, azMils: number, wSpd: number, wDir: number, targetZ: number) {
    const elevRad = (elevMils * 360 / 6400) * (Math.PI / 180);
    const azRad = (azMils * 360 / 6400) * (Math.PI / 180);
    const windRad = wDir * (Math.PI / 180);
    
    const wx = -wSpd * Math.sin(windRad);
    const wy = -wSpd * Math.cos(windRad);
    
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

// Generate the high-resolution"""

content = content.replace("// Generate the high-resolution", solver_code)


# 2. Replace the calc() logic
start_str = "    let baseTofInfo = 0;"
end_str = "    const finalTof = Math.round((tof + tofFix) * 10) / 10;"

start_idx = content.find(start_str)
end_idx = content.find(end_str) + len(end_str)

new_calc_logic = """
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
"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_calc_logic.strip() + content[end_idx:]
    with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patch fully applied!")
else:
    print("Could not find start/end bounds for patching calc()!")
