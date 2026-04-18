with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Fix line 395
    if "const r = rangeCorrection ? rawR * 0.96 : rawR;" in line:
        new_lines.append(line.replace("const r = rangeCorrection ? rawR * 0.96 : rawR;", "const r = rawR;"))
        continue
        
    # Fix line 491
    if "}, [activeRange, gunElevStr, tgtElevStr, forcedCharge, rangeCorrection]);" in line:
        new_lines.append(line.replace("rangeCorrection", ""))
        continue

    # Fix line 618
    if "if (rangeCorrection) {" in line:
        # We know we need to skip this line and the next two lines because they are:
        # if (rangeCorrection) {
        #     targetRange *= 0.96;
        # }
        continue
    if i > 0 and "if (rangeCorrection) {" in lines[i-1]:
        continue
    if i > 1 and "if (rangeCorrection) {" in lines[i-2]:
        continue
        
    # Also remove bdtPosition declaration if it's there
    if "const [bdtPosition, setBdtPosition] = useState" in line:
        continue
        
    new_lines.append(line)

content = "".join(new_lines)

# Now, we also need to manually remove the old showBDT block and old showCoordsInput block from map container since they might have failed.
# The map container starts around here:
# <div className="map-canvas-container" style={{ position: 'relative' }}>
map_start = content.find('<div className="map-canvas-container"')
dpad_start = content.find('{showDPad && (\n                 <div className="dpads-sidebar">')
if dpad_start == -1:
    dpad_start = content.find('{(showDPad || showCoordsInput || showBDT) && (')

if map_start != -1 and dpad_start != -1:
    map_block = content[map_start:dpad_start]
    
    # Let's remove showBDT from map_block
    bdt_str = "                 {showBDT && ("
    if bdt_str in map_block:
        bdt_idx = map_block.find(bdt_str)
        bdt_end = map_block.find("                  )}\n", bdt_idx) + len("                  )}\n")
        if bdt_end > bdt_idx:
            map_block = map_block[:bdt_idx] + map_block[bdt_end:]
            
    # Let's remove showCoordsInput from map_block
    coords_str = "                     {showCoordsInput && ("
    if coords_str in map_block:
        c_idx = map_block.find(coords_str)
        c_end = map_block.find("                       )}\n", c_idx) + len("                       )}\n")
        if c_end > c_idx:
            map_block = map_block[:c_idx] + map_block[c_end:]
            
    content = content[:map_start] + map_block + content[dpad_start:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix applied")
