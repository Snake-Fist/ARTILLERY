import math

def simulate(V0, angle_mils, airFriction, g=9.80665):
    angle_deg = angle_mils * 360 / 6400
    angle_rad = math.radians(angle_deg)
    
    vx = V0 * math.cos(angle_rad)
    vy = V0 * math.sin(angle_rad)
    x = 0.0
    y = 0.0
    t = 0.0
    dt = 0.01

    while y >= 0 or t == 0:
        v = math.sqrt(vx*vx + vy*vy)
        ax = -airFriction * v * vx
        ay = -g - airFriction * v * vy

        vx += ax * dt
        vy += ay * dt
        
        # Euler integration
        x += vx * dt
        y += vy * dt
        t += dt

        if t > 300: break

    return x, t

def find_friction(V0, elev_mils, target_range):
    low = 0.0
    high = 0.01
    
    last_x, last_t = 0, 0
    mid = 0
    for _ in range(60):
        mid = (low + high) / 2
        x, t = simulate(V0, elev_mils, mid)
        last_x, last_t = x, t
        if x > target_range:
            low = mid
        else:
            high = mid
            
    return mid, last_x, last_t

f1, x1, t1 = find_friction(428.0, 913, 5000.0)
print(f"Charge 5 (428 m/s, 913mils, target 5000):")
print(f"airFriction = {f1:.6f}, simX = {x1:.1f}, simTof = {t1:.2f} (target 44.0)")

f2, x2, t2 = find_friction(140.0, 1221, 1000.0)
print(f"Charge 1 (140 m/s, 1221mils, target 1000):")
print(f"airFriction = {f2:.6f}, simX = {x2:.1f}, simTof = {t2:.2f} (target 24.2)")

f3, x3, t3 = find_friction(279.0, 1070, 3000.0)
print(f"Charge 3 (279 m/s, 1070mils, target 3000):")
print(f"airFriction = {f3:.6f}, simX = {x3:.1f}, simTof = {t3:.2f} (target 37.7)")

# Test how consistent they are. If they aren't, the drag formula is slightly different or drag isn't pure constant.
