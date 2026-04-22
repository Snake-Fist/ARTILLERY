import math

AIR_FRICTION = 0.000226
GRAVITY = 9.80665

def simulate3D(V0, elevMils, azMils, wSpd, wDir, coefWind=1.0):
    elevRad = (elevMils * 360 / 6400) * (math.pi / 180)
    azRad = (azMils * 360 / 6400) * (math.pi / 180)
    windRad = wDir * (math.pi / 180)
    
    # Wind vector scaled by coefWind
    wx = -wSpd * math.sin(windRad) * coefWind
    wy = -wSpd * math.cos(windRad) * coefWind
    
    vx = V0 * math.cos(elevRad) * math.sin(azRad)
    vy = V0 * math.cos(elevRad) * math.cos(azRad)
    vz = V0 * math.sin(elevRad)
    
    x, y, z, t = 0.0, 0.0, 0.0, 0.0
    dt = 0.02
    
    while z >= 0 or vz > 0:
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
        
        nextZ = z + vz * dt
        if nextZ < 0 and vz < 0:
            fraction = (0 - z) / (nextZ - z)
            x = x - vx * dt + vx * (dt * fraction)
            y = y - vy * dt + vy * (dt * fraction)
            break
            
        z = nextZ
        t += dt
        
        if t > 150: break
        
    return x, y, t

# The app gave the user: Az 550, El 984. 
# The user shot at 550 mils with 984 mils elevation.
# The shot landed 80m East, 0m North of the target (Target 4000, 6000)
# So it landed at roughly 4080, 6000. Wait, target was 2000, 4000 offset.
dx = 2000
dy = 4000
# Hit landed at:
hit_x = dx + 80
hit_y = dy - 3
print(f"User shot landed at {hit_x}, {hit_y}")

# We need to find what `coefWind` the game engine actually uses,
# by seeing what coefWind causes a shot at 550 az, 984 el to land at 2080, 3997.
lowC = 0.0
highC = 1.0
bestC = 1.0

for _ in range(40):
    midC = (lowC + highC) / 2
    x, y, t = simulate3D(428.0, 984, 550, 15.0, 90.0, midC)
    
    # We want x to match hit_x (2080).
    # Less wind (lower C) -> less push to the West -> lands MORE East (higher X).
    if x > hit_x:
        # landed too far East. Need MORE push to West. -> INCREASE C
        lowC = midC
    else:
        # landed too far West. Need LESS push to West. -> DECREASE C
        highC = midC

bestC = (lowC + highC) / 2
print(f"Effective Wind Coefficient: {bestC:.3f}")
lx, ly, lt = simulate3D(428.0, 984, 550, 15.0, 90.0, bestC)
print(f"Simulating user shot with coef={bestC:.3f} lands at: {lx:.1f}, {ly:.1f}")

# What if Arma's wind scales per altitude?
