import math

AIR_FRICTION = 0.000226
GRAVITY = 9.80665

def simulate3D(V0, elevMils, azMils, wSpd, wDir, targetZ):
    elevRad = (elevMils * 360 / 6400) * (math.pi / 180)
    azRad = (azMils * 360 / 6400) * (math.pi / 180)
    windRad = wDir * (math.pi / 180)
    
    wx = -wSpd * math.sin(windRad)
    wy = -wSpd * math.cos(windRad)
    
    vx = V0 * math.cos(elevRad) * math.sin(azRad)
    vy = V0 * math.cos(elevRad) * math.cos(azRad)
    vz = V0 * math.sin(elevRad)
    
    x, y, z, t = 0.0, 0.0, 0.0, 0.0
    dt = 0.02
    
    while z >= targetZ or vz > 0:
        relVx = vx - wx
        relVy = vy - wy
        relVz = vz
        relV = math.sqrt(relVx*relVx + relVy*relVy + relVz*relVz)
        
        ax = -AIR_FRICTION * relV * relVx
        ay = -AIR_FRICTION * relV * relVy
        az = -GRAVITY - AIR_FRICTION * relV * relVz
        
        vx += ax * dt
        vy += ay * dt
        vz += az * dt
        
        x += vx * dt
        y += vy * dt
        
        # Prevent stepping drastically below targetZ
        next_z = z + vz * dt
        if next_z < targetZ and vz < 0:
            fraction = (targetZ - z) / (next_z - z)
            x = x - vx * dt + vx * (dt * fraction)
            y = y - vy * dt + vy * (dt * fraction)
            t = t + dt * fraction
            break
            
        z = next_z
        t += dt
        
        if t > 150: break
        
    return x, y, t

def solveFiringSolution(V0, targetDX, targetDY, targetZ, wSpd, wDir):
    trueRange = math.sqrt(targetDX*targetDX + targetDY*targetDY)
    trueAzRad = math.atan2(targetDX, targetDY)
    trueAzMils = trueAzRad * 6400 / (2 * math.pi)
    if trueAzMils < 0: trueAzMils += 6400

    bestEl = 1000
    bestAz = trueAzMils
    bestTof = 0
    
    for i in range(15):
        lowEl = 750
        highEl = 1400
        for j in range(12):
            midEl = (lowEl + highEl) / 2
            x, y, t = simulate3D(V0, midEl, bestAz, wSpd, wDir, targetZ)
            landRange = math.sqrt(x*x + y*y)
            if landRange > trueRange:
                lowEl = midEl
            else:
                highEl = midEl
        bestEl = (lowEl + highEl) / 2
        
        lowAz = bestAz - 400
        highAz = bestAz + 400
        for j in range(12):
            midAz = (lowAz + highAz) / 2
            x, y, t = simulate3D(V0, bestEl, midAz, wSpd, wDir, targetZ)
            cross = targetDX * y - targetDY * x
            if cross < 0:
                highAz = midAz
            else:
                lowAz = midAz
            bestTof = t
        bestAz = (lowAz + highAz) / 2

    fix = bestAz - trueAzMils
    if fix > 3200: fix -= 6400
    if fix < -3200: fix += 6400
    
    return round(bestEl), round(fix), round(bestTof, 1)

print("Test: 4472m, 26.56 deg (dx=2000, dy=4000), 15m/s @ 090")
# Using Charge 5 (428m/s)
el, azFix, tof = solveFiringSolution(428.0, 2000, 4000, 0, 15.0, 90.0)
targetAz = math.atan2(2000, 4000) * 6400 / (2*math.pi)
print(f"Computed Solution: El {el}, AzFix {azFix}, TOF {tof}")
print(f"Final Az: {round(targetAz + azFix)}")

# Test negative altitude delta: Target is 200m below us
el2, azFix2, tof2 = solveFiringSolution(428.0, 2000, 4000, -200, 15.0, 90.0)
print(f"Downhill Computed: El {el2}, AzFix {azFix2}, TOF {tof2}")
