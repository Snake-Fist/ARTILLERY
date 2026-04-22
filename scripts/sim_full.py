import math

def simulate_3d(V0, elev_mils, az_mils, wind_speed, wind_dir_deg, friction=0.000226, g=9.80665):
    # Angles
    elev_rad = math.radians(elev_mils * 360 / 6400)
    az_rad = math.radians(az_mils * 360 / 6400)
    
    wind_rad = math.radians(wind_dir_deg)
    
    # Wind vector (meteorological: reading 090 means wind coming FROM East, blowing West)
    # North is +Y, East is +X
    # If wind from 090 (East), vector is (-w, 0)
    wx = -wind_speed * math.sin(wind_rad)
    wy = -wind_speed * math.cos(wind_rad)
    
    # Init shell velocity
    vx = V0 * math.cos(elev_rad) * math.sin(az_rad)
    vy = V0 * math.cos(elev_rad) * math.cos(az_rad)
    vz = V0 * math.sin(elev_rad)
    
    x, y, z = 0.0, 0.0, 0.0
    t = 0.0
    dt = 0.02
    
    while z >= 0 or t == 0:
        # relative velocity to air mass
        rel_vx = vx - wx
        rel_vy = vy - wy
        rel_vz = vz # wind usually has no vertical component
        
        rel_v = math.sqrt(rel_vx**2 + rel_vy**2 + rel_vz**2)
        
        ax = -friction * rel_v * rel_vx
        ay = -friction * rel_v * rel_vy
        az = -g - friction * rel_v * rel_vz
        
        vx += ax * dt
        vy += ay * dt
        vz += az * dt
        
        x += vx * dt
        y += vy * dt
        z += vz * dt
        t += dt
        
        if t > 120: break
        
    return x, y, t

# Gun at 0,0. Target at 2000, 4000.
# Target Azimuth:
dx = 2000
dy = 4000
true_range = math.sqrt(dx**2 + dy**2)
true_az_rad = math.atan2(dx, dy)
true_az_mils = true_az_rad * 6400 / (2*math.pi)

print(f"Target True Range: {true_range:.1f} m")
print(f"Target True Azimuth: {true_az_mils:.1f} mils")

# We want to find the elevation and az that HITS 2000, 4000 with wind.
# Let's binary search Elevation and Azimuth!
# (Or just test what the app's output gave and see where it lands!)
# App gave: Azimuth = 525 mils, Elev = 1012 mils.
app_az = 525
app_el = 1012

land_x, land_y, land_t = simulate_3d(428.0, app_el, app_az, 15.0, 90.0)
print(f"App's Firing Solution landed at: {land_x:.1f}, {land_y:.1f} (TOF {land_t:.1f}s)")
err_x = land_x - dx
err_y = land_y - dy
print(f"Error: {err_x:.1f}, {err_y:.1f}")

# Let's solve for the perfect firing solution
def solve(V0, target_x, target_y, w_spd, w_dir):
    # Newton's method or just simple decoupled search
    best_el = 1000
    best_az = true_az_mils
    
    # rough search
    for _ in range(20):
        # find elevation that gives correct range
        low_el = 750
        high_el = 1400
        for _ in range(15):
            mid_el = (low_el + high_el) / 2
            lx, ly, lt = simulate_3d(V0, mid_el, best_az, w_spd, w_dir)
            lr = math.sqrt(lx**2 + ly**2)
            if lr > true_range:
                low_el = mid_el
            else:
                high_el = mid_el
        best_el = (low_el + high_el) / 2
        
        # find azimuth that hits right
        low_az = best_az - 200
        high_az = best_az + 200
        for _ in range(15):
            mid_az = (low_az + high_az) / 2
            lx, ly, lt = simulate_3d(V0, best_el, mid_az, w_spd, w_dir)
            # which side of the line?
            # 2D cross product to find left/right
            # target vector: dx, dy
            # hit vector: lx, ly
            cross = dx * ly - dy * lx
            # if cross < 0, hit is to the right
            if cross < 0:
                # hit is too far right (az too high). Decrease az.
                high_az = mid_az
            else:
                low_az = mid_az
        best_az = (low_az + high_az) / 2
        
    return best_el, best_az

pel, paz = solve(428.0, dx, dy, 15.0, 90.0)
print(f"Perfect Hit Solution: EL {pel:.1f} mils, AZ {paz:.1f} mils")
lx, ly, lt = simulate_3d(428.0, pel, paz, 15.0, 90.0)
print(f"Perfect solution lands at: {lx:.1f}, {ly:.1f}")
